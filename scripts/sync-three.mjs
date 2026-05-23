#!/usr/bin/env node
/**
 * Copia o build ESM do Three.js para `vendor/three/`.
 *
 * O runtime do projeto não usa bundler nem CDN. Este script mantém o arquivo
 * servido ao browser alinhado com a versão declarada em `package.json`.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "node_modules", "three", "build");
const DEST_DIR = join(ROOT, "vendor", "three");
const PKG_PATH = join(ROOT, "node_modules", "three", "package.json");
const SILENT = process.argv.includes("--silent");

const FILES = [
  { src: "three.core.min.js", dest: "three.core.min.js" },
  { src: "three.module.min.js", dest: "three.module.min.js" },
];

function log(...args) {
  if (!SILENT) console.log("[sync-three]", ...args);
}

function warn(...args) {
  console.warn("[sync-three]", ...args);
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
    warn("node_modules/three ausente. Rode `npm install` antes deste script.");
    process.exit(1);
  }

  const pkg = JSON.parse(await readFile(PKG_PATH, "utf-8"));
  log(`three@${pkg.version} -> vendor/three/`);

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
