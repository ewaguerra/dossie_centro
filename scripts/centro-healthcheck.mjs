#!/usr/bin/env node
/**
 * Validação offline do catálogo Centro (sem browser).
 * Complementa tests/sanity.test.js — útil para diagnóstico rápido.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CENTRO = path.join(ROOT, "centro");

function readJson(relPath) {
  const abs = path.join(CENTRO, relPath);
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return null;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(CENTRO, relPath));
}

const results = [];
let pass = 0;
let fail = 0;

function ok(name) {
  results.push({ status: "OK", name });
  pass++;
}

function err(name, detail) {
  results.push({ status: "FAIL", name, detail });
  fail++;
}

const catalog = readJson("data/catalog/layers.json");
const groups = readJson("data/catalog/groups.json");

if (!catalog) err("layers.json", "missing or invalid");
else ok("layers.json parseable");

if (!Array.isArray(groups)) err("groups.json", "missing or invalid");
else ok("groups.json parseable");

const layers = catalog?.layers || [];
const groupIds = new Set((groups || []).map((g) => g.id));
const layerIds = new Set();

for (const ly of layers) {
  if (!ly.id) {
    err("layer", "entry without id");
    continue;
  }
  if (layerIds.has(ly.id)) {
    err("layer duplicate id", ly.id);
    continue;
  }
  layerIds.add(ly.id);

  if (!ly.file) {
    err(ly.id, "missing file field");
    continue;
  }
  if (fileExists(ly.file)) ok("geojson " + ly.id);
  else err(ly.id, "missing file " + ly.file);

  if (groupIds.has(ly.group)) ok("group ref " + ly.id);
  else err(ly.id, "unknown group " + ly.group);
}

for (const group of groups || []) {
  const listed = [...(group.layers || [])].sort();
  const inGroup = layers
    .filter((l) => l.group === group.id)
    .map((l) => l.id)
    .sort();
  if (JSON.stringify(listed) === JSON.stringify(inGroup)) {
    ok("groups sync " + group.id);
  } else {
    err("groups sync " + group.id, "layers[] diverges from layers.json");
  }
}

const ctxCatalog = readJson("data/catalog/context-layers.json");
if (ctxCatalog) {
  ok("context-layers.json present (not wired in runtime sidebar)");
  const ctxLayers = ctxCatalog.layers || [];
  for (const ly of ctxLayers) {
    if (!ly.file) continue;
    if (fileExists(ly.file)) ok("context geojson " + ly.id);
    // Entradas sem ficheiro no disco sao backlog — nao bloqueiam o healthcheck.
  }
}

for (const r of results) {
  const line = (r.status === "OK" ? "OK   " : "FAIL ") + r.name + (r.detail ? " — " + r.detail : "");
  process.stdout.write(line + "\n");
}

process.stdout.write("\n" + pass + "/" + (pass + fail) + " passed\n");
process.exit(fail === 0 ? 0 : 1);
