/**
 * Live API contract tests against the public PingRep API.
 * The happy-path test needs a complete public profile and is gated behind
 * PINGREP_TEST_SLUG (no stable public fixture profile exists yet).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, apiBase, fetchProfile } from "../src/api.js";

test("health endpoint returns 200", async () => {
  const res = await fetch(`${apiBase()}/health`, {
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(res.status, 200);
});

test("unknown profile rejects with ApiError 404", async () => {
  await assert.rejects(
    fetchProfile("nobody-here-pingrep-cli-test"),
    (err) => err instanceof ApiError && err.status === 404,
  );
});

test(
  "known profile returns the public schema",
  { skip: !process.env.PINGREP_TEST_SLUG && "set PINGREP_TEST_SLUG to enable" },
  async () => {
    const profile = await fetchProfile(process.env.PINGREP_TEST_SLUG);
    assert.ok(profile.id);
    assert.ok(profile.name);
    assert.ok(profile.slug);
    assert.ok(Array.isArray(profile.socialLinks));
  },
);
