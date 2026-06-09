/**
 * Single source of truth for the CLI version (read from package.json).
 * Layer: Infrastructure (filesystem read only).
 */

import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

export const VERSION = pkg.version;
export const PACKAGE_NAME = pkg.name;
