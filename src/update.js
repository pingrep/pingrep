/**
 * Update support: startup update notice (cached, once per day, non-blocking)
 * and the `pingrep update` command (delegates to npm install -g).
 * Layer: Infrastructure (registry fetch, tmp cache, child process).
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PACKAGE_NAME, VERSION } from "./version.js";

const CACHE_FILE = join(tmpdir(), "pingrep-update-check.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day
const FETCH_TIMEOUT_MS = 3_000;
const DIST_TAGS_URL = `https://registry.npmjs.org/-/package/${PACKAGE_NAME}/dist-tags`;

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

/** True when `latest` is a strictly newer x.y.z than `current`. */
export function isNewer(current, latest) {
  if (!current || !latest) return false;
  const a = current.split(".").map(Number);
  const b = latest.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (y > x) return true;
    if (y < x) return false;
  }
  return false;
}

function readCache() {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}

/** Background refresh of the cached latest version. Errors are silent. */
async function refreshCache() {
  try {
    const res = await fetch(DIST_TAGS_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return;
    const tags = await res.json();
    if (!tags.latest) return;
    writeFileSync(
      CACHE_FILE,
      JSON.stringify({ checkedAt: Date.now(), latest: tags.latest }),
    );
  } catch {
    // Never let the update check break or slow a real command.
  }
}

/**
 * Print a dim one-line update notice when the cache knows a newer version,
 * then refresh the cache in the background at most once per day.
 * TTY-only so piped output stays clean.
 */
export function maybeNotifyUpdate({
  stream = process.stderr,
  env = process.env,
} = {}) {
  if (!stream.isTTY || env.PINGREP_NO_UPDATE_CHECK) return;
  const cache = readCache();
  if (cache && isNewer(VERSION, cache.latest)) {
    const notice = `Update available ${VERSION} → ${cache.latest} · run pingrep update`;
    const useColor = env.NO_COLOR === undefined && env.TERM !== "dumb";
    stream.write(useColor ? `${DIM}  ${notice}${RESET}\n` : `${notice}\n`);
  }
  if (!cache || Date.now() - cache.checkedAt > CHECK_INTERVAL_MS) {
    void refreshCache();
  }
}

/** `pingrep update` — install the latest published version globally. */
export function runUpdate() {
  console.log(`Updating ${PACKAGE_NAME} → npm install -g ${PACKAGE_NAME}@latest\n`);
  const installArgs = ["install", "-g", `${PACKAGE_NAME}@latest`];
  // Windows npm is npm.cmd; post CVE-2024-27980 Node refuses to spawn .cmd
  // directly, so go through cmd.exe explicitly. shell:false in both branches.
  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npm";
  const args = isWindows ? ["/c", "npm", ...installArgs] : installArgs;
  const res = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (res.error) {
    console.error(res.error.message);
    process.exitCode = 1;
    return;
  }
  process.exitCode = res.status ?? 0;
  if (process.exitCode === 0) {
    console.log("\nDone. Run pingrep --version to confirm.");
  }
}
