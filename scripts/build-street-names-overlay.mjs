/**
 * Enriquece 15_osm_ruas__line com nomes actuais/históricos → centro_ruas_nomes__line.geojson
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildCatalogIndex,
  buildLabelDev,
  buildLabelHistorico,
  getFeatureStreetName,
  matchCatalogEntry,
  namesDiffer,
  normalizeStreetName,
  pickPrimaryHistoric,
  splitAltNames,
} from "./lib/street-name-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "centro", "data");

const INPUT_RUAS = path.join(DATA, "geojson/heavy/15_osm_ruas__line.geojson");
const INPUT_CATALOG = path.join(DATA, "catalog/street-names-catalog.json");
const OUTPUT_DIR = path.join(DATA, "geojson/special/streets");
const OUTPUT_GEOJSON = path.join(OUTPUT_DIR, "centro_ruas_nomes__line.geojson");
const OUTPUT_REPORT = path.join(DATA, "reports/build/street_names_build_report.json");

function collectAltNames(props, catalogEntry) {
  var alts = [];
  if (props.alt_name) alts.push(...splitAltNames(props.alt_name));
  if (props["alt_name:pt"]) alts.push(...splitAltNames(props["alt_name:pt"]));
  if (catalogEntry && catalogEntry.match && catalogEntry.match.name) {
    for (var i = 0; i < catalogEntry.match.name.length; i++) {
      var n = catalogEntry.match.name[i];
      if (n && normalizeStreetName(n) !== normalizeStreetName(props.name)) {
        alts.push(n);
      }
    }
  }
  var seen = new Set();
  var out = [];
  for (var j = 0; j < alts.length; j++) {
    var key = normalizeStreetName(alts[j]);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(alts[j]);
    }
  }
  return out;
}

function enrichFeature(feature, catalogIndex) {
  var props = feature.properties || {};
  var osmName = props.name || props.nome || props.logradouro || "";
  if (!osmName && !getFeatureStreetName(props)) {
    return null;
  }

  var catalogEntry = matchCatalogEntry(props, catalogIndex);
  var nameAtual = osmName || (catalogEntry && catalogEntry.nome_atual) || "";
  var osmOld = props.old_name || props["old_name:pt"] || "";
  var historic = pickPrimaryHistoric(catalogEntry, osmOld);
  var nameHistorico = historic ? historic.nome : "";
  var era = historic && historic.era ? String(historic.era) : "";
  var hasRename = namesDiffer(nameAtual, nameHistorico) ? "1" : "0";
  var altNames = collectAltNames(props, catalogEntry);
  var priority = catalogEntry && catalogEntry.priority === "high" ? "high" : "normal";

  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      _osm_id: props._osm_id,
      _osm_type: props._osm_type,
      highway: props.highway || "",
      name_atual: nameAtual,
      name_historico: nameHistorico,
      name_era: era,
      name_alt: altNames.length ? JSON.stringify(altNames) : "",
      has_rename: hasRename,
      label_atual: nameAtual,
      label_historico: buildLabelHistorico(historic, era),
      label_dev: buildLabelDev(nameAtual, nameHistorico, era),
      catalog_id: catalogEntry ? catalogEntry.id : "",
      catalog_priority: priority,
      codinome_arg: catalogEntry && catalogEntry.codinome_arg ? catalogEntry.codinome_arg : "",
      min_phase_historico:
        catalogEntry && catalogEntry.min_phase_historico != null
          ? catalogEntry.min_phase_historico
          : "",
    },
  };
}

function main() {
  if (!fs.existsSync(INPUT_RUAS)) {
    console.error("Missing input:", INPUT_RUAS);
    process.exit(1);
  }

  var ruas = JSON.parse(fs.readFileSync(INPUT_RUAS, "utf8"));
  var catalog = JSON.parse(fs.readFileSync(INPUT_CATALOG, "utf8"));
  var catalogIndex = buildCatalogIndex(catalog);

  var features = [];
  var withRename = 0;
  var catalogMatched = 0;
  var matchedCatalogIds = new Set();

  for (var i = 0; i < (ruas.features || []).length; i++) {
    var enriched = enrichFeature(ruas.features[i], catalogIndex);
    if (!enriched) continue;
    features.push(enriched);
    if (enriched.properties.has_rename === "1") withRename++;
    if (enriched.properties.catalog_id) {
      catalogMatched++;
      matchedCatalogIds.add(enriched.properties.catalog_id);
    }
  }

  var unmatchedCatalog = (catalog.entries || [])
    .filter(function (e) {
      return !matchedCatalogIds.has(e.id);
    })
    .map(function (e) {
      return e.id;
    });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_REPORT), { recursive: true });

  var collection = {
    type: "FeatureCollection",
    name: "centro_ruas_nomes__line",
    features: features,
  };

  fs.writeFileSync(OUTPUT_GEOJSON, JSON.stringify(collection));
  fs.writeFileSync(
    OUTPUT_REPORT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        inputRuas: "geojson/heavy/15_osm_ruas__line.geojson",
        inputCatalog: "catalog/street-names-catalog.json",
        outputGeojson: "geojson/special/streets/centro_ruas_nomes__line.geojson",
        sourceFeatures: (ruas.features || []).length,
        outputFeatures: features.length,
        withRename: withRename,
        catalogMatchedSegments: catalogMatched,
        catalogEntries: (catalog.entries || []).length,
        unmatchedCatalogEntries: unmatchedCatalog,
      },
      null,
      2
    )
  );

  console.log(
    "street-names build:",
    features.length,
    "features,",
    withRename,
    "renames,",
    unmatchedCatalog.length,
    "unmatched catalog entries"
  );
}

main();
