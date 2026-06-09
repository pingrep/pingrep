/**
 * Profile rendering for terminal output.
 * Purpose: format a PublicProfileResponse into readable terminal text.
 * Layer: Presentation (pure functions, no I/O — testable in isolation).
 */

import pc from "picocolors";

const FOOTER = "Create your own AI Rep → pingrep.com";
const WRAP_WIDTH = 76;

/** Wrap text at word boundaries to keep bios readable in narrow terminals. */
function wrap(text, width = WRAP_WIDTH) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Render a public profile. Top-level fields are camelCase
 * (PublicProfileResponse serialization aliases); socialLinks entries are
 * snake_case (no aliases upstream).
 */
export function renderProfile(profile) {
  const out = [];
  out.push(`  ${pc.bold(profile.name)}`);

  const roleLine = [profile.title, profile.company].filter(Boolean).join(" · ");
  if (roleLine) out.push(`  ${roleLine}`);
  if (profile.location) out.push(`  ${pc.dim(profile.location)}`);

  if (profile.bio) {
    out.push("");
    for (const line of wrap(profile.bio)) out.push(`  ${line}`);
  }

  const links = profile.socialLinks ?? [];
  if (links.length > 0) {
    out.push("", `  ${pc.bold("Links")}`);
    const pad = Math.max(...links.map((l) => l.platform.length));
    for (const link of links) {
      const url = link.full_url || link.url;
      out.push(`    ${link.platform.padEnd(pad)}  ${pc.cyan(url)}`);
    }
  }

  out.push("", `  ${pc.cyan(profileUrl(profile.slug))}`);
  out.push("", `  ${pc.dim(FOOTER)}`, "");
  return out.join("\n");
}

/** Public profile URL for a slug/username. */
export function profileUrl(slug) {
  return `https://app.pingrep.com/p/${slug}`;
}
