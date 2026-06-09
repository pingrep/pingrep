/**
 * PingRep CLI banner.
 * Purpose: render the brand smslant logo with a truecolor gradient on load.
 * Layer: Presentation (stdout only, no network or state).
 */

const LOGO = [
  "   ___  _           ___",
  "  / _ \\(_)__  ___ _/ _ \\___ ___",
  " / ___/ / _ \\/ _ `/ , _/ -_) _ \\",
  "/_/  /_/_//_/\\_, /_/|_|\\__/ .__/",
  "            /___/        /_/",
];

const TAGLINE = "Your AI Representative · pingrep.com";

// Brand gradient endpoints: sky (#0ea5e9) → deep blue (#2563eb).
const FROM = [14, 165, 233];
const TO = [37, 99, 235];

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

/** Truecolor escape for one point along the brand gradient (t in [0,1]). */
function brandColor(t) {
  const r = lerp(FROM[0], TO[0], t);
  const g = lerp(FROM[1], TO[1], t);
  const b = lerp(FROM[2], TO[2], t);
  return `\x1b[38;2;${r};${g};${b}m`;
}

/** Diagonal per-character gradient across the logo block. */
function paintLogo() {
  const rows = LOGO.length;
  const cols = Math.max(...LOGO.map((r) => r.length));
  return LOGO.map((row, y) => {
    let line = "";
    for (let x = 0; x < row.length; x += 1) {
      const c = row[x];
      if (c === " ") {
        line += c;
      } else {
        const t = (x / (cols - 1) + y / (rows - 1)) / 2;
        line += brandColor(t) + c;
      }
    }
    return line + RESET;
  }).join("\n");
}

function supportsColor(stream, env) {
  if (env.NO_COLOR !== undefined) return false;
  if (env.TERM === "dumb") return false;
  return Boolean(stream.isTTY);
}

/**
 * Print the banner on interactive TTYs only, so piped output
 * (e.g. `pingrep someone | grep ...`) stays clean data.
 */
export function printBanner({ stream = process.stdout, env = process.env } = {}) {
  if (!stream.isTTY) return;
  if (supportsColor(stream, env)) {
    stream.write(`\n${paintLogo()}\n${DIM}  ${TAGLINE}${RESET}\n\n`);
  } else {
    stream.write(`\nPingRep — ${TAGLINE}\n\n`);
  }
}
