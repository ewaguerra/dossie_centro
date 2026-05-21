/**
 * Centro page local healthcheck — runs in Node without a browser.
 * Validates that all catalog entries and referenced files are consistent.
 */
(function (exports) {
  "use strict";

  const DATA_DIR = "./pages/centro/data";

  function centroHealthcheck(fs, path, baseDir) {
    const results = [];
    let pass = 0;
    let fail = 0;

    // baseDir: absolute path to pages/centro/ (e.g. "pages/centro")
    const base = baseDir || path.join(path.dirname ? path.dirname(__filename) : ".", "pages/centro");

    function ok(name) { results.push({ status: "OK", name }); pass++; }
    function err(name, detail) { results.push({ status: "FAIL", name, detail }); fail++; }

    function fileExists(rel) {
      return fs.existsSync(path.join(base, rel));
    }

    function loadJson(rel) {
      const p = path.join(base, rel);
      if (!fs.existsSync(p)) return null;
      try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
    }

    // ── 1. Catalog files
    const catalogFiles = [
      "data/catalog/layers.json",
      "data/catalog/groups.json",
      "data/catalog/context-layers.json",
      "data/catalog/context-groups.json",
    ];
    for (const f of catalogFiles) {
      if (fileExists(f)) ok("catalog exists: " + f);
      else err("catalog missing: " + f);
    }

    // ── 2. Thematic layers
    const layersCatalog = loadJson("data/catalog/layers.json");
    const thematicLayers = layersCatalog ? (layersCatalog.layers || []) : [];

    if (thematicLayers.length > 0) ok("thematic layers: " + thematicLayers.length + " found");
    else err("thematic layers: 0 found — catalog empty");

    for (const l of thematicLayers) {
      const geojsonPath = "data/processed/" + l.id + ".geojson";
      if (fileExists(geojsonPath)) {
        const gj = loadJson(geojsonPath);
        const count = gj && gj.features ? gj.features.length : 0;
        if (count > 0) ok("thematic layer " + l.id + ": " + count + " features");
        else err("thematic layer " + l.id + ": 0 features");
      } else {
        err("thematic GeoJSON missing: " + geojsonPath);
      }
    }

    // ── 3. Context layers
    const ctxCatalog = loadJson("data/catalog/context-layers.json");
    const ctxLayers = ctxCatalog ? (ctxCatalog.layers || []) : [];

    if (ctxLayers.length >= 1) ok("context layers: " + ctxLayers.length + " found");
    else err("context layers: 0 found — catalog empty or missing");

    const hasDuplicateIds = thematicLayers.some(tl => ctxLayers.some(cl => cl.id === tl.id));
    if (!hasDuplicateIds) ok("no duplicate IDs between thematic and context");
    else err("duplicate ID found between thematic and context layers");

    let ruasFound = false;
    let enderecosFound = false;

    for (const l of ctxLayers) {
      // file path in catalog is "data/context/..." relative to pages/centro/
      const geojsonPath = l.file;
      if (fileExists(geojsonPath)) {
        const gj = loadJson(geojsonPath);
        const count = gj && gj.features ? gj.features.length : 0;
        if (count > 0) ok("context layer " + l.id + ": " + count + " features");
        else err("context layer " + l.id + ": 0 features");
      } else {
        err("context GeoJSON missing: " + geojsonPath);
      }

      // Streets layer: specifically the OSM streets dataset should start visible.
      // Do NOT treat every line layer (e.g. rivers/hydro) as "ruas".
      if (l.id === "15_osm_ruas__line" || l.id.includes("osm_ruas")) {
        ruasFound = true;
        if (l.visible === true) ok("ruas: visible=true (active by default)");
        else err("ruas: visible=false — will NOT auto-activate on page load");
      }

      if (l.id.includes("endereco") || (l.geometry === "point" && l.id.includes("osm"))) {
        enderecosFound = true;
        if (l.visible === true) ok("enderecos: visible=true (active by default)");
        else err("enderecos: visible=false — should start active");
        if ((l.minzoom || 0) >= 15) ok("enderecos: minzoom=" + l.minzoom + " (high zoom only)");
        else err("enderecos: minzoom=" + l.minzoom + " — should be >= 15");
      }
    }

    if (ruasFound) ok("ruas layer found in context catalog");
    else err("ruas layer NOT found in context catalog");

    if (enderecosFound) ok("enderecos layer found in context catalog");
    else err("enderecos layer NOT found in context catalog (optional but expected)");

    // ── 4. Prohibited path check
    // These would only matter at runtime but we can scan the catalog JSON
    const rawCatalogs = [
      loadJson("data/catalog/layers.json"),
      loadJson("data/catalog/context-layers.json"),
    ].filter(Boolean).map(c => JSON.stringify(c));

    const prohibited = [
      "../../data/processed",
      "data/osm/raw",
      "data/geosampa/raw",
      "global.json",
      "unclassified.json",
      "zona_norte", "zona_sul", "zona_leste", "zona_oeste",
    ];

    for (const pat of prohibited) {
      const found = rawCatalogs.some(c => c.includes(pat));
      if (!found) ok("no prohibited ref '" + pat + "' in catalogs");
      else err("prohibited ref found: " + pat);
    }

    return {
      pass,
      fail,
      total: pass + fail,
      results,
      ok: fail === 0,
    };
  }

  if (typeof module !== "undefined") {
    module.exports = centroHealthcheck;
    // Allow direct CLI run: node pages/centro/centro-healthcheck.js
    if (require.main === module) {
      const nodePath = require("path");
      const nodeFs = require("fs");
      const dir = nodePath.join(nodePath.dirname(__filename));
      const result = centroHealthcheck(nodeFs, nodePath, dir);
      for (const r of result.results) {
        process.stdout.write((r.status === "OK" ? "OK   " : "FAIL ") + r.name + (r.detail ? " — " + r.detail : "") + "\n");
      }
      process.stdout.write("\n" + result.pass + "/" + result.total + " passed\n");
      process.exit(result.ok ? 0 : 1);
    }
  } else {
    exports.centroHealthcheck = centroHealthcheck;
  }
})(typeof exports !== "undefined" ? exports : {});
