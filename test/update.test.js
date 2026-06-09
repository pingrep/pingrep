/**
 * Unit tests for update-check version comparison (pure, no network).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { isNewer } from "../src/update.js";

test("detects newer patch, minor, and major versions", () => {
  assert.equal(isNewer("0.1.0", "0.1.1"), true);
  assert.equal(isNewer("0.1.1", "0.2.0"), true);
  assert.equal(isNewer("0.9.9", "1.0.0"), true);
});

test("ignores equal and older versions", () => {
  assert.equal(isNewer("0.1.1", "0.1.1"), false);
  assert.equal(isNewer("0.2.0", "0.1.9"), false);
  assert.equal(isNewer("1.0.0", "0.9.9"), false);
});

test("handles missing or short version strings safely", () => {
  assert.equal(isNewer("0.1.0", undefined), false);
  assert.equal(isNewer(undefined, "0.1.0"), false);
  assert.equal(isNewer("1.0", "1.0.1"), true);
  assert.equal(isNewer("1.0.1", "1.1"), true);
});
