/**
 * PingRep public API client.
 * Purpose: thin fetch wrapper for the public profile + vCard endpoints.
 * Layer: Infrastructure (network only, no formatting or process control).
 */

import { VERSION } from "./version.js";

const DEFAULT_BASE = "https://api.pingrep.com";
const USER_AGENT = `pingrep-cli/${VERSION}`;
const TIMEOUT_MS = 10_000;

export function apiBase(env = process.env) {
  return (env.PINGREP_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
}

/** Error carrying the HTTP status so the CLI can map 404 → friendly message. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { env } = {}) {
  const url = `${apiBase(env)}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err?.name === "TimeoutError" ? "timed out" : "failed";
    throw new ApiError(`Request to PingRep ${reason} (${url})`, 0);
  }
  if (!res.ok) {
    throw new ApiError(`PingRep API returned ${res.status}`, res.status);
  }
  return res;
}

/**
 * Fetch a public profile by username/slug.
 * GET /api/v1/profiles/p/{identifier} → PublicProfileResponse (camelCase
 * top-level fields; socialLinks entries are snake_case — no aliases upstream).
 */
export async function fetchProfile(username, opts = {}) {
  const res = await request(`/api/v1/profiles/p/${encodeURIComponent(username)}`, opts);
  return res.json();
}

/**
 * Fetch the vCard for a profile id.
 * GET /api/v1/contacts/{profile_id}/vcf → text/vcard (public, no auth).
 */
export async function fetchVcard(profileId, opts = {}) {
  const res = await request(`/api/v1/contacts/${encodeURIComponent(profileId)}/vcf`, opts);
  return res.text();
}
