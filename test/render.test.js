/**
 * Unit tests for profile rendering (fixture-based, no network).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { profileUrl, renderProfile } from "../src/render.js";

const FIXTURE = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Ada Lovelace",
  slug: "ada",
  shortUrl: null,
  title: "Founder",
  company: "Analytical Engines",
  bio: "I build engines that think. ".repeat(10).trim(),
  location: "London",
  photoUrl: null,
  socialLinks: [
    {
      id: "1",
      platform: "linkedin",
      username: "ada",
      url: "linkedin.com/in/ada",
      full_url: "https://linkedin.com/in/ada",
      display_order: 0,
    },
  ],
};

test("renders name, role line, and location", () => {
  const out = renderProfile(FIXTURE);
  assert.match(out, /Ada Lovelace/);
  assert.match(out, /Founder · Analytical Engines/);
  assert.match(out, /London/);
});

test("renders social links using full_url", () => {
  const out = renderProfile(FIXTURE);
  assert.match(out, /linkedin/);
  assert.match(out, /https:\/\/linkedin\.com\/in\/ada/);
});

test("includes profile URL and create-your-own footer", () => {
  const out = renderProfile(FIXTURE);
  assert.match(out, /https:\/\/app\.pingrep\.com\/p\/ada/);
  assert.match(out, /Create your own AI Rep/);
});

test("wraps long bios instead of one giant line", () => {
  const out = renderProfile(FIXTURE);
  const bioLines = out.split("\n").filter((l) => l.includes("engines that think"));
  assert.ok(bioLines.length > 1, "expected the bio to wrap onto multiple lines");
  for (const line of bioLines) assert.ok(line.length <= 80);
});

test("omits empty sections gracefully", () => {
  const out = renderProfile({ ...FIXTURE, bio: null, socialLinks: [], title: null, company: null, location: null });
  assert.match(out, /Ada Lovelace/);
  assert.doesNotMatch(out, /Links/);
});

test("profileUrl builds the public app URL", () => {
  assert.equal(profileUrl("ada"), "https://app.pingrep.com/p/ada");
});
