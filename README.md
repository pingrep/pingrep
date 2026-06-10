<p align="center">
  <img src="https://pingrep.com/og/og-pingrep.png" width="120" alt="PingRep logo" />
</p>

# PingRep — Your AI Representative

**PingRep is the AI Representative platform — one scan shares every platform, and your AI Rep keeps the connection alive.**

[pingrep.com](https://pingrep.com) · [How it works](https://pingrep.com/how-it-works) · [Blog](https://pingrep.com/blog) · [FAQ](https://pingrep.com/faq) · [Press](https://pingrep.com/press)

## What is PingRep?

PingRep lets professionals create a **Personal AI Representative** — an AI trained on your professional identity that answers questions, captures leads, and represents you 24/7.

- **One scan, every platform.** Someone scans your QR code and sees every platform you're on — they pick where they already connect. No app download required.
- **An AI Rep that answers for you.** Visitors ask your AI Representative about your work, background, and availability — it responds in your voice, any time.
- **The connection stays alive.** After you meet, your Rep keeps the relationship moving with follow-ups and context.

## Quick links

| | |
|---|---|
| Product | [pingrep.com](https://pingrep.com) |
| Create your AI Rep | [app.pingrep.com](https://app.pingrep.com) |
| What is a Personal AI Representative? | [pingrep.com/blog/what-is-a-personal-ai-representative](https://pingrep.com/blog/what-is-a-personal-ai-representative) |
| The AI Representative Manifesto | [pingrep.com/ai-representative-manifesto](https://pingrep.com/ai-representative-manifesto) |
| Pricing | [pingrep.com/pricing](https://pingrep.com/pricing) |

## Developers

This repo is home to the official **`pingrep` CLI** — view public PingRep profiles, download vCards, and render QR codes from your terminal.

### Install

```bash
npx pingrep <username>        # no install
npm install -g pingrep        # or install globally
```

Requires Node.js 18+.

### Usage

```bash
pingrep chat <username>       # chat with a profile's AI Representative
pingrep <username>            # view a profile
pingrep vcard <username>      # save the profile's vCard (-o file.vcf to choose a name)
pingrep qr <username>         # render the profile QR code in your terminal
pingrep update                # update to the latest version
pingrep --help
```

`chat` streams answers live from the profile owner's AI Rep — the same Rep that
answers on their PingRep page. No API key needed; the Rep runs on PingRep's side.

Set `PINGREP_API_BASE` to point the CLI at a different API host (defaults to
`https://api.pingrep.com`). Set `PINGREP_NO_UPDATE_CHECK=1` to disable the
daily update notice.

### Development

```bash
npm install
npm test                      # unit + live API contract tests
node src/cli.js <username>
```

Also coming to this organization: the **PingRep SDK** — integrate AI Representatives into your own products. Watch this repo for releases.

## Official channels

- LinkedIn: [linkedin.com/company/pingrep](https://www.linkedin.com/company/pingrep/)
- X: [x.com/getpingrep](https://x.com/getpingrep)
- YouTube: [youtube.com/@getpingrep](https://www.youtube.com/@getpingrep)
- Instagram: [instagram.com/getpingrep](https://www.instagram.com/getpingrep)

---

> Looking for the Pinboard bookmarks search CLI also named "pingrep"? That's an unrelated project: [zoni/pingrep](https://github.com/zoni/pingrep).

© 2026 Keynodex FZ-LLC. PingRep™ is a product of Keynodex FZ-LLC, Dubai, UAE.
