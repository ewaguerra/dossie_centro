#!/usr/bin/env node
/**
 * Gera ícones do mapa a partir de lucide-static (devDependency).
 *
 * O browser NUNCA carrega Lucide — só os SVGs gerados em centro/assets/icons/.
 * Mesmo padrão de sync-maplibre.mjs: npm só em build/postinstall.
 *
 *   node scripts/sync-lucide-icons.mjs
 *   node scripts/sync-lucide-icons.mjs --silent
 *
 * Fonte de verdade das cores/nomes: centro/data/icon-manifest.json
 * Registry runtime: vendor/app/config/map-icons.js (deve manter paridade)
 */
import { readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = join(ROOT, "centro", "data", "icon-manifest.json");
const LUCIDE_ICONS_DIR = join(ROOT, "node_modules", "lucide-static", "icons");
const OUT_DIR = join(ROOT, "centro", "assets", "icons");
const SILENT = process.argv.includes("--silent");

function log(...args) {
  if (!SILENT) console.log("[sync-lucide-icons]", ...args);
}

function warn(...args) {
  console.warn("[sync-lucide-icons]", ...args);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function extractSvgInner(svgText) {
  var match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!match) throw new Error("SVG invalido (sem tag svg)");
  return match[1].trim();
}

function normalizeLucideInner(inner, color, strokeWidth) {
  return inner
    .replace(/stroke="currentColor"/gi, 'stroke="' + color + '"')
    .replace(/fill="currentColor"/gi, 'fill="' + color + '"')
    .replace(/stroke-width="[^"]*"/gi, 'stroke-width="' + strokeWidth + '"');
}

function buildMapIconSvg(inner, color, template) {
  var size = template.size || 32;
  var r = template.discRadius || 14;
  var cx = size / 2;
  var offset = template.glyphOffset || 4;
  var discFill = template.discFill || "#fdfbf7";
  var strokeWidth = template.strokeWidth || 2;
  var lines = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true" data-template="' + (template.id || "disc-forensic") + '">',
  ];

  if (template.shadow !== false) {
    lines.push('  <circle cx="' + (cx + 0.5) + '" cy="' + (cx + 0.75) + '" r="' + r + '" fill="#1a1a1a" opacity="0.1"/>');
  }

  lines.push('  <circle class="map-icon-disc" cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="' + discFill + '" stroke="' + color + '" stroke-width="1.5"/>');
  lines.push('  <g fill="none" stroke="' + color + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" transform="translate(' + offset + " " + offset + ')">');
  lines.push(
    inner
      .replace(/^<g[^>]*>/i, "")
      .replace(/<\/g>\s*$/i, "")
      .replace(/^\s+|\s+$/g, "")
  );
  lines.push("  </g>");
  lines.push("</svg>");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  if (!(await exists(MANIFEST_PATH))) {
    warn("manifest ausente:", MANIFEST_PATH);
    process.exit(SILENT ? 0 : 1);
  }

  if (!(await exists(LUCIDE_ICONS_DIR))) {
    if (SILENT) return;
    warn("lucide-static nao instalado. Rode: npm install");
    process.exit(1);
  }

  var manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));
  var icons = manifest.icons || [];
  var template = manifest.template || {};
  var ok = 0;
  var missing = [];

  log(icons.length + " icones no manifest → centro/assets/icons/");

  for (var i = 0; i < icons.length; i++) {
    var entry = icons[i];
    var lucideName = entry.lucide;
    var outName = entry.out;
    var color = entry.color;
    if (!lucideName || !outName || !color) {
      warn("entrada invalida no manifest:", JSON.stringify(entry));
      continue;
    }

    var srcPath = join(LUCIDE_ICONS_DIR, lucideName + ".svg");
    if (!(await exists(srcPath))) {
      missing.push(lucideName);
      continue;
    }

    var srcSvg = await readFile(srcPath, "utf-8");
    var inner = normalizeLucideInner(extractSvgInner(srcSvg), color, template.strokeWidth || 2);
    var outSvg = buildMapIconSvg(inner, color, template);
    var outPath = join(OUT_DIR, outName + ".svg");
    await writeFile(outPath, outSvg, "utf-8");
    log("✓ " + outName + ".svg ← lucide-static/icons/" + lucideName + ".svg");
    ok++;
  }

  if (missing.length) {
    warn("icones Lucide nao encontrados:", missing.join(", "));
    process.exit(SILENT ? 0 : 1);
  }

  log("ok — " + ok + " SVGs gerados (0 bytes de JS Lucide no browser)");
}

main().catch(function (err) {
  if (SILENT) return;
  warn(err.message || err);
  process.exit(1);
});
