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
import { profileUrl, renderProfile } from "./render.js";

const program = new Command();

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
  .version("0.1.0");

program
  .command("view <username>", { isDefault: true })
  .description("Show a PingRep profile (default command: `pingrep <username>`)")
  .action(async (username) => {
    printBanner();
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
    printBanner();
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
    printBanner();
    const url = profileUrl(username);
    qrcode.generate(url, { small: true }, (code) => {
      console.log(code);
      console.log(`  ${pc.cyan(url)}\n`);
    });
  });

program.parseAsync(process.argv);
