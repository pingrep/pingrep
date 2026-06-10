/**
 * Unit tests for chat fingerprint persistence (tmp config dir, no network).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getFingerprint } from "../src/chat.js";

test("generates a cli- fingerprint and persists it across calls", () => {
  const dir = mkdtempSync(join(tmpdir(), "pingrep-test-"));
  const env = { PINGREP_CONFIG_DIR: dir };
  try {
    const first = getFingerprint(env);
    assert.match(first, /^cli-[0-9a-f-]{36}$/);
    assert.equal(getFingerprint(env), first, "expected a stable fingerprint");
    const saved = JSON.parse(readFileSync(join(dir, "config.json"), "utf8"));
    assert.equal(saved.fingerprint, first);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
