/**
 * Unit tests for the SSE parser (fixture streams, no network).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEventBlock, parseSSEStream } from "../src/sse.js";

test("parses event name and JSON data", () => {
  const parsed = parseEventBlock('event: text\ndata: {"content": "hi"}');
  assert.deepEqual(parsed, { event: "text", data: { content: "hi" } });
});

test("defaults to message event and keeps non-JSON data raw", () => {
  const parsed = parseEventBlock("data: plain words");
  assert.deepEqual(parsed, { event: "message", data: "plain words" });
});

test("returns null for blocks without data (keep-alives)", () => {
  assert.equal(parseEventBlock(": ping"), null);
  assert.equal(parseEventBlock("event: noop"), null);
});

async function* chunks(...parts) {
  for (const p of parts) yield Buffer.from(p, "utf8");
}

test("yields events across chunk boundaries that split mid-event", async () => {
  const stream = parseSSEStream(
    chunks(
      'event: connected\ndata: {"session_id": "s1"}\n\nevent: te',
      'xt\ndata: {"content": "Hel',
      'lo"}\n\nevent: done\ndata: {}\n\n',
    ),
  );
  const events = [];
  for await (const e of stream) events.push(e);
  assert.deepEqual(events, [
    { event: "connected", data: { session_id: "s1" } },
    { event: "text", data: { content: "Hello" } },
    { event: "done", data: {} },
  ]);
});

test("flushes a trailing event with no final blank line", async () => {
  const events = [];
  for await (const e of parseSSEStream(chunks('event: text\ndata: {"content": "tail"}'))) {
    events.push(e);
  }
  assert.deepEqual(events, [{ event: "text", data: { content: "tail" } }]);
});
