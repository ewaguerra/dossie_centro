#!/usr/bin/env node
/**
 * Gera `centro/assets/basemap/liberty.json` a partir do estilo OpenFreeMap liberty,
 * reescrevendo URLs absolutas para `/basemap/…` (proxy same-origin na Vercel).
 *
 *   node scripts/sync-basemap-style.mjs
 *   node scripts/sync-basemap-style.mjs --silent
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hardenBasemapStyle } from "./lib/harden-basemap-style.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UPSTREAM_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const UPSTREAM_PLANET = "https://tiles.openfreemap.org/planet";
const DEST_STYLE = join(ROOT, "centro", "assets", "basemap", "liberty.json");
const DEST_PLANET = join(ROOT, "centro", "assets", "basemap", "planet.json");
const SILENT = process.argv.includes("--silent");

function log(...args) {
  if (!SILENT) console.log("[sync-basemap-style]", ...args);
}

function rewriteOpenFreeMapUrls(text) {
  return text.replaceAll("https://tiles.openfreemap.org", "/basemap");
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "projeto-centro/0.1 (sync-basemap-style)" },
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar ${url}: ${res.status}`);
  }
  return res.text();
}

async function main() {
  log(`fetch ${UPSTREAM_STYLE}`);
  const styleRaw = await fetchText(UPSTREAM_STYLE);
  let styleRewritten = rewriteOpenFreeMapUrls(styleRaw);

  log(`fetch ${UPSTREAM_PLANET}`);
  const planetRaw = await fetchText(UPSTREAM_PLANET);
  const planetRewritten = rewriteOpenFreeMapUrls(planetRaw);

  if (!planetRewritten.includes('"/basemap/planet/')) {
    throw new Error("Reescrita planet falhou — /basemap/planet/ ausente");
  }

  // TileJSON local evita round-trip extra; tiles vectoriais continuam via /basemap/
  styleRewritten = styleRewritten.replace(
    '"url":"/basemap/planet"',
    '"url":"/centro/assets/basemap/planet.json"'
  );
  styleRewritten = styleRewritten.replace(
    '"url": "/basemap/planet"',
    '"url": "/centro/assets/basemap/planet.json"'
  );

  if (!styleRewritten.includes("/centro/assets/basemap/planet.json")) {
    throw new Error("liberty.json nao referencia planet.json local");
  }

  const styleObj = hardenBasemapStyle(JSON.parse(styleRewritten));
  const styleOut = JSON.stringify(styleObj);

  if (!styleOut.includes('"coalesce"')) {
    throw new Error("hardenBasemapStyle nao aplicou coalesce ao liberty.json");
  }

  await mkdir(dirname(DEST_STYLE), { recursive: true });
  await writeFile(DEST_STYLE, styleOut, "utf-8");
  await writeFile(DEST_PLANET, planetRewritten, "utf-8");
  log(`→ ${DEST_STYLE.replace(ROOT + "/", "")}`);
  log(`→ ${DEST_PLANET.replace(ROOT + "/", "")}`);
}

main().catch((err) => {
  console.error("[sync-basemap-style]", err.message || err);
  process.exit(SILENT ? 0 : 1);
});
