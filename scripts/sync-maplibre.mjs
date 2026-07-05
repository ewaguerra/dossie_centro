#!/usr/bin/env node
/**
 * Copia o bundle MapLibre GL JS de `node_modules/maplibre-gl/dist/` para
 * `vendor/maplibre/`, mantendo o runtime offline alinhado com a versão
 * declarada em `package.json`.
 *
 * Roda automaticamente como `postinstall`. Para forçar:
 *
 *   node scripts/sync-maplibre.mjs           # verbose
 *   node scripts/sync-maplibre.mjs --silent  # silencioso (usado no postinstall)
 *
 * O script é idempotente e tolerante a falhas: se node_modules ainda
 * não tiver maplibre-gl (ex.: sem `npm install`), apenas avisa e sai
 * com código 0 quando rodando em modo `--silent`.
 */
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "node_modules", "maplibre-gl", "dist");
const DEST_DIR = join(ROOT, "vendor", "maplibre");
const PKG_PATH = join(ROOT, "node_modules", "maplibre-gl", "package.json");

const SILENT = process.argv.includes("--silent");

const FILES = [
  { src: "maplibre-gl.js", dest: "maplibre-gl.js" },
  { src: "maplibre-gl.css", dest: "maplibre-gl.css" },
];

function log(...args) {
  if (!SILENT) console.log("[sync-maplibre]", ...args);
}

function warn(...args) {
  console.warn("[sync-maplibre]", ...args);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(PKG_PATH))) {
    if (SILENT) return;
    warn(
      "node_modules/maplibre-gl ausente. Rode `npm install` antes deste script."
    );
    process.exit(SILENT ? 0 : 1);
  }

  const pkg = JSON.parse(await readFile(PKG_PATH, "utf-8"));
  log(`maplibre-gl@${pkg.version} → vendor/maplibre/`);

  await mkdir(DEST_DIR, { recursive: true });

  for (const { src, dest } of FILES) {
    const srcPath = join(SRC_DIR, src);
    if (!(await exists(srcPath))) {
      warn(`fonte ausente: ${srcPath}`);
      continue;
    }
    const buf = await readFile(srcPath);
    await writeFile(join(DEST_DIR, dest), buf);
    log(`✓ ${dest} (${buf.byteLength} bytes)`);
  }

  log("ok");
}

main().catch((err) => {
  if (SILENT) return;
  warn(err.message || err);
  process.exit(1);
});
