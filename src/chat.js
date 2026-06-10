/**
 * Interactive chat with a profile's AI Representative (`pingrep chat`).
 * Layer: Presentation (REPL + streaming render) over the public /ask API.
 * The model/brain lives server-side — this is a thin SSE client.
 */

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import readline from "node:readline/promises";
import pc from "picocolors";
import { ApiError, apiBase, fetchProfile } from "./api.js";
import { profileUrl } from "./render.js";
import { parseSSEStream } from "./sse.js";
import { VERSION } from "./version.js";

const STREAM_TIMEOUT_MS = 120_000;
const HISTORY_MAX_MESSAGES = 20; // server accepts max 10 turns

function configDir(env = process.env) {
  return env.PINGREP_CONFIG_DIR || join(homedir(), ".config", "pingrep");
}

/** Stable anonymous visitor id so server-side rate limiting works honestly. */
export function getFingerprint(env = process.env) {
  const file = join(configDir(env), "config.json");
  try {
    const cfg = JSON.parse(readFileSync(file, "utf8"));
    if (cfg.fingerprint) return cfg.fingerprint;
  } catch {
    // first run or unreadable config — fall through and create one
  }
  const fingerprint = `cli-${randomUUID()}`;
  try {
    mkdirSync(configDir(env), { recursive: true });
    writeFileSync(file, JSON.stringify({ fingerprint }, null, 2));
  } catch {
    // stateless fallback: still works, just a fresh fingerprint per run
  }
  return fingerprint;
}

/** POST one question; returns the SSE response body stream. */
async function askStream(payload, env = process.env) {
  const res = await fetch(`${apiBase(env)}/api/v1/public/ai/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `pingrep-cli/${VERSION}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(STREAM_TIMEOUT_MS),
  });
  if (!res.ok) {
    let detail = `Chat request failed (HTTP ${res.status})`;
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new ApiError(detail, res.status);
  }
  return res.body;
}

/** Stream one answer to stdout; returns {sessionId, answer}. */
async function streamAnswer(body, sessionId) {
  let answer = "";
  let remaining = null;
  for await (const { event, data } of parseSSEStream(body)) {
    if (event === "connected" && data.session_id) {
      sessionId = data.session_id;
    } else if (event === "text" && data.content) {
      answer += data.content;
      process.stdout.write(data.content);
    } else if (event === "meta" && typeof data.remaining_questions === "number") {
      remaining = data.remaining_questions;
    } else if (event === "error") {
      process.stdout.write(pc.red(data.message || "The Rep hit an error."));
      break;
    }
  }
  if (remaining !== null && remaining <= 2) {
    process.stdout.write(pc.dim(`\n  (${remaining} questions left — save the card to keep chatting)`));
  }
  return { sessionId, answer };
}

/** Interactive REPL with a profile's AI Rep. Throws ApiError for cli.js fail(). */
export async function runChat(username) {
  const profile = await fetchProfile(username);
  const fingerprint = getFingerprint();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("SIGINT", () => rl.close());

  console.log(`Chatting with ${pc.bold(profile.name)}'s AI Rep ${pc.dim("· /exit to quit")}\n`);

  let sessionId = null;
  const history = [];
  // Async iteration (not rl.question) so lines typed or piped while an
  // answer is still streaming are buffered instead of silently dropped.
  rl.setPrompt(pc.cyan("you › "));
  rl.prompt();
  for await (const line of rl) {
    const question = line.trim();
    if (!question) {
      rl.prompt();
      continue;
    }
    if (question === "/exit" || question === "/quit") break;

    process.stdout.write(`\n${pc.blue("●")} `);
    try {
      const body = await askStream({
        profile_id: profile.id,
        question,
        mode: "public",
        visitor_fingerprint: fingerprint,
        session_id: sessionId,
        conversation_history: history.length ? history : undefined,
      });
      const result = await streamAnswer(body, sessionId);
      sessionId = result.sessionId;
      if (result.answer) {
        history.push({ role: "user", content: question }, { role: "assistant", content: result.answer });
        while (history.length > HISTORY_MAX_MESSAGES) history.shift();
      }
    } catch (err) {
      // 429 carries the server's own conversion line ("Save the card…").
      process.stdout.write(pc.yellow(err.message));
      if (err instanceof ApiError && err.status === 429) {
        process.stdout.write(pc.dim(`\n  ${profileUrl(profile.slug)}`));
      }
    }
    process.stdout.write("\n\n");
    rl.prompt();
  }

  rl.close();
  console.log(pc.dim("\nCreate your own AI Rep → pingrep.com\n"));
}
