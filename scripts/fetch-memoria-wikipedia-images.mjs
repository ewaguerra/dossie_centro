#!/usr/bin/env node
/** @deprecated Use scripts/fetch-poi-wikipedia-images.mjs --theme=memoria-paulistana */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "fetch-poi-wikipedia-images.mjs");
const args = ["--theme=memoria-paulistana", ...process.argv.slice(2).filter((a) => !a.includes("memoria"))];
const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit" });
process.exit(result.status ?? 1);
