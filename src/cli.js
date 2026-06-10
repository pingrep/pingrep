#!/usr/bin/env node
/**
 * PingRep CLI entry point.
 * Purpose: command routing (view / vcard / qr) and process exit handling.
 * Layer: Presentation (wires api.js + render.js + banner.js together).
 */

import { writeFile } from "node:fs/promises";
import { Command } from "commander";
import pc from "picocolors";
import qrcode from "qrcode-terminal";
import { ApiError, fetchProfile, fetchVcard } from "./api.js";
import { printBanner } from "./banner.js";
import { runChat } from "./chat.js";
import { profileUrl, renderProfile } from "./render.js";
import { maybeNotifyUpdate, runUpdate } from "./update.js";
import { VERSION } from "./version.js";

const program = new Command();

/** Banner + (cached) update notice, shown before every profile command. */
function preamble() {
  printBanner();
  maybeNotifyUpdate();
}

function fail(err, username) {
  if (err instanceof ApiError && err.status === 404) {
    console.error(
      `No PingRep profile found for '${username}'. ` +
        "Check the username or create yours at pingrep.com",
    );
  } else {
    console.error(err.message);
  }
  process.exitCode = 1;
}

program
  .name("pingrep")
  .description("View PingRep profiles, download vCards, and render QR codes.")
  .version(VERSION);

program
  .command("view <username>", { isDefault: true })
  .description("Show a PingRep profile (default command: `pingrep <username>`)")
  .action(async (username) => {
    preamble();
    try {
      const profile = await fetchProfile(username);
      console.log(renderProfile(profile));
    } catch (err) {
      fail(err, username);
    }
  });

program
  .command("vcard <username>")
  .description("Download a profile's vCard (.vcf)")
  .option("-o, --out <file>", "output file (default: <username>.vcf)")
  .action(async (username, opts) => {
    preamble();
    try {
      const profile = await fetchProfile(username);
      const vcf = await fetchVcard(profile.id);
      const out = opts.out || `${username}.vcf`;
      await writeFile(out, vcf, "utf8");
      console.log(`Saved ${pc.bold(out)} for ${profile.name}`);
    } catch (err) {
      fail(err, username);
    }
  });

program
  .command("qr <username>")
  .description("Render a profile QR code in the terminal")
  .action((username) => {
    preamble();
    const url = profileUrl(username);
    qrcode.generate(url, { small: true }, (code) => {
      console.log(code);
      console.log(`  ${pc.cyan(url)}\n`);
    });
  });

program
  .command("chat <username>")
  .description("Chat with a profile's AI Representative")
  .action(async (username) => {
    preamble();
    try {
      await runChat(username);
    } catch (err) {
      fail(err, username);
    }
  });

program
  .command("update")
  .description("Update pingrep to the latest published version")
  .action(() => {
    printBanner();
    runUpdate();
  });

program.parseAsync(process.argv);
