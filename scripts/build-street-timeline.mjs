/**
 * Agrupa evidências POI por logradouro — um ponto por evento + fio cronológico.
 *
 *   node scripts/build-street-timeline.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildStreetSpatialIndex,
  extractStreetFromEvidence,
  loadCatalogIndexFromFile,
  nearestStreetName,
  resolveStreetKey,
} from "./lib/poi-address-utils.mjs";
import {
  classifyFeature,
  eraSortOrder,
  extractEvidenceYear,
  ERAS,
} from "./lib/poi-era-classifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "centro", "data");

const TYPOLOGY_LABELS = {
  igreja_religiosidade: "Património religioso",
  arquitetura_mirante: "Arquitetura / mirante",
  museu_memoria: "Museu / memória",
  teatro_espetaculo: "Teatro / espetáculo",
  educacao_institucional: "Educação",
  transporte_estacao: "Transporte",
  sesc_lazer: "Lazer / SESC",
  mercado_comercio: "Comércio / mercado",
  praca_espaco_publico: "Praça / espaço público",
  outro: "Ponto de interesse",
};

const SOURCES = [
  {
    themeId: "memoria-paulistana",
    file: path.join(DATA, "context/centro_memoria_paulistana__point.geojson"),
    titleField: "nm_titulo_placa",
    detailField: "dc_enunciado_placa",
    addressField: "nm_endereco_placa",
    idField: "cd_identificador",
  },
  {
    themeId: "acervo-tombado",
    file: path.join(DATA, "context/centro_acervo_tombado__point.geojson"),
    titleField: "nm_acervo",
    addressField: "nm_endereco",
    idField: "cd_identificador",
  },
  {
    themeId: "bem-arqueologico",
    file: path.join(DATA, "context/centro_bem_arqueologico__point.geojson"),
    titleField: "nm_imovel",
    addressField: "nm_endereco",
    detailField: "_narrativa_curta",
    idField: "cd_identificador",
  },
  {
    themeId: "monumentos",
    file: path.join(DATA, "context/centro_monumentos__point.geojson"),
    titleField: "nm_obra",
    detailField: "tx_data_implantacao",
    addressField: "dc_localizacao",
    idField: "cd_identificador",
  },
  {
    themeId: "poi-turistico",
    file: path.join(DATA, "geojson/special/pois/centro_pois_turisticos__point.geojson"),
    titleField: "name",
    detailField: "category",
    idField: "slug",
    spatialJoin: true,
  },
];

const INPUT_CATALOG = path.join(DATA, "catalog/street-names-catalog.json");
const INPUT_RUAS = path.join(DATA, "geojson/heavy/15_osm_ruas__line.geojson");
const OUTPUT_DIR = path.join(DATA, "geojson/special/timeline");
const OUTPUT_POINTS = path.join(OUTPUT_DIR, "centro_linha_tempo__point.geojson");
const OUTPUT_LINES = path.join(OUTPUT_DIR, "centro_linha_tempo__line.geojson");
const OUTPUT_INDEX = path.join(DATA, "catalog/street-timeline-index.json");
const OUTPUT_REPORT = path.join(DATA, "reports/build/street_timeline_build_report.json");

const MIN_EVIDENCES = 2;
const SPATIAL_MAX_M = 45;
const ERA_IDS = new Set(ERAS.map((e) => e.id));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getTitle(props, cfg) {
  return String(props[cfg.titleField] || "Evidência").trim();
}

function buildDetailText(themeId, props, cfg, year) {
  props = props || {};
  const raw = cfg.detailField ? String(props[cfg.detailField] || "").trim() : "";

  switch (themeId) {
    case "memoria-paulistana":
      return raw || String(props.nm_local_placa || "").trim();
    case "monumentos": {
      const parts = [];
      if (year != null) parts.push("Implantado em " + year);
      else if (raw) parts.push("Data: " + raw);
      const tip = props.dc_tipologia_monumento ? String(props.dc_tipologia_monumento).trim() : "";
      if (tip) parts.push(tip);
      const mat = props.dc_material_monumento ? String(props.dc_material_monumento).trim() : "";
      if (mat) parts.push(mat);
      return parts.join(" · ") || String(props.dc_localizacao || "").trim();
    }
    case "acervo-tombado": {
      const res =
        props.tx_resolucao_conpresp ||
        props.tx_resolucao_condephaat ||
        props.tx_resolucao_iphan ||
        "";
      if (res) return String(res).trim();
      return String(props.nm_endereco || "").trim();
    }
    case "bem-arqueologico":
      return raw || "Bem arqueológico tombado";
    case "poi-turistico":
      return TYPOLOGY_LABELS[raw] || TYPOLOGY_LABELS.outro;
    default:
      return raw;
  }
}

function collectEvidence(feature, cfg, catalogIndex, streetSegments) {
  const props = feature.properties || {};
  const coords = feature.geometry && feature.geometry.coordinates;
  if (!coords || coords.length < 2) return null;

  let street = extractStreetFromEvidence(cfg.themeId, props, catalogIndex);

  if (!street && cfg.spatialJoin && streetSegments) {
    const nearest = nearestStreetName(coords[0], coords[1], streetSegments, SPATIAL_MAX_M);
    if (nearest) {
      street = resolveStreetKey(nearest, catalogIndex);
    }
  }

  if (!street) return null;

  const eraId = classifyFeature(cfg.themeId, props);
  const year = extractEvidenceYear(cfg.themeId, props);
  const detail = buildDetailText(cfg.themeId, props, cfg, year);

  return {
    themeId: cfg.themeId,
    featureId: String(props[cfg.idField] || feature.id || getTitle(props, cfg)),
    title: getTitle(props, cfg),
    detail,
    address: cfg.addressField ? String(props[cfg.addressField] || "") : "",
    eraId,
    year,
    coords: [coords[0], coords[1]],
    streetKey: street.streetKey,
    streetDisplay: street.streetDisplay,
  };
}

function sortEvidences(list) {
  return list.slice().sort(function (a, b) {
    const ya = a.year != null ? a.year : 9999;
    const yb = b.year != null ? b.year : 9999;
    if (ya !== yb) return ya - yb;
    const ea = eraSortOrder(a.eraId);
    const eb = eraSortOrder(b.eraId);
    if (ea !== eb) return ea - eb;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

function uniqueThemes(list) {
  const set = new Set();
  for (let i = 0; i < list.length; i++) set.add(list[i].themeId);
  return set.size;
}

function uniqueEras(list) {
  const set = new Set();
  for (let i = 0; i < list.length; i++) {
    if (ERA_IDS.has(list[i].eraId)) set.add(list[i].eraId);
  }
  return Array.from(set);
}

function makeEventId(streetKey, index) {
  return streetKey + "--" + String(index + 1).padStart(3, "0");
}

function main() {
  const catalog = readJson(INPUT_CATALOG);
  const catalogIndex = loadCatalogIndexFromFile(catalog);

  let streetSegments = null;
  if (fs.existsSync(INPUT_RUAS)) {
    streetSegments = buildStreetSpatialIndex(readJson(INPUT_RUAS));
  }

  const byStreet = new Map();
  const report = {
    generatedAt: new Date().toISOString(),
    minEvidences: MIN_EVIDENCES,
    sources: {},
    unmatched: 0,
    streets: 0,
    timelinePoints: 0,
    timelineThreads: 0,
  };

  for (let s = 0; s < SOURCES.length; s++) {
    const cfg = SOURCES[s];
    if (!fs.existsSync(cfg.file)) {
      console.warn("[street-timeline] missing:", cfg.file);
      continue;
    }
    const geojson = readJson(cfg.file);
    let matched = 0;
    let total = 0;
    for (let i = 0; i < geojson.features.length; i++) {
      total++;
      const evidence = collectEvidence(geojson.features[i], cfg, catalogIndex, streetSegments);
      if (!evidence) continue;
      matched++;
      if (!byStreet.has(evidence.streetKey)) {
        byStreet.set(evidence.streetKey, {
          streetKey: evidence.streetKey,
          streetDisplay: evidence.streetDisplay,
          evidences: [],
        });
      }
      const bucket = byStreet.get(evidence.streetKey);
      if (evidence.streetDisplay && evidence.streetDisplay.length > bucket.streetDisplay.length) {
        bucket.streetDisplay = evidence.streetDisplay;
      }
      bucket.evidences.push(evidence);
    }
    report.sources[cfg.themeId] = { total, matched, file: path.relative(ROOT, cfg.file) };
    report.unmatched += total - matched;
  }

  const indexEntries = {};
  const pointFeatures = [];
  const lineFeatures = [];

  for (const bucket of byStreet.values()) {
    if (bucket.evidences.length < MIN_EVIDENCES) continue;

    const sorted = sortEvidences(bucket.evidences);
    const streetEras = uniqueEras(sorted);
    const yearMin = sorted.find((e) => e.year != null);
    const yearMax = sorted.slice().reverse().find((e) => e.year != null);

    const indexEvidences = sorted.map(function (e, idx) {
      return {
        eventId: makeEventId(bucket.streetKey, idx),
        themeId: e.themeId,
        featureId: e.featureId,
        title: e.title,
        detail: e.detail,
        address: e.address,
        eraId: e.eraId,
        year: e.year,
        coords: e.coords,
        sequence: idx + 1,
        sequenceTotal: sorted.length,
      };
    });

    indexEntries[bucket.streetKey] = {
      streetKey: bucket.streetKey,
      streetDisplay: bucket.streetDisplay,
      evidenceCount: sorted.length,
      themeCount: uniqueThemes(sorted),
      eras: streetEras,
      yearRange:
        yearMin && yearMax
          ? yearMin.year === yearMax.year
            ? String(yearMin.year)
            : yearMin.year + "–" + yearMax.year
          : "",
      evidences: indexEvidences,
    };

    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const eventId = makeEventId(bucket.streetKey, i);
      const nextId = i < sorted.length - 1 ? makeEventId(bucket.streetKey, i + 1) : "";

      pointFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: e.coords },
        properties: {
          event_id: eventId,
          street_key: bucket.streetKey,
          street_display: bucket.streetDisplay,
          nm_titulo: e.title,
          evidence_detail: e.detail,
          evidence_address: e.address,
          evidence_year: e.year != null ? e.year : "",
          source_theme_id: e.themeId,
          source_feature_id: e.featureId,
          sequence: i + 1,
          sequence_total: sorted.length,
          thread_next_id: nextId,
          poi_era: ERA_IDS.has(e.eraId) ? e.eraId : "sem-data",
          poi_era_list: streetEras.join("|"),
        },
      });

      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        const erasOnSegment = uniqueEras([e, next]);
        lineFeatures.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [e.coords, next.coords],
          },
          properties: {
            street_key: bucket.streetKey,
            street_display: bucket.streetDisplay,
            thread_from_id: eventId,
            thread_to_id: makeEventId(bucket.streetKey, i + 1),
            from_era: ERA_IDS.has(e.eraId) ? e.eraId : "sem-data",
            to_era: ERA_IDS.has(next.eraId) ? next.eraId : "sem-data",
            from_year: e.year != null ? e.year : "",
            to_year: next.year != null ? next.year : "",
            poi_era_list: erasOnSegment.join("|"),
          },
        });
      }
    }
  }

  report.streets = Object.keys(indexEntries).length;
  report.timelinePoints = pointFeatures.length;
  report.timelineThreads = lineFeatures.length;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_REPORT), { recursive: true });

  fs.writeFileSync(
    OUTPUT_POINTS,
    JSON.stringify({ type: "FeatureCollection", features: pointFeatures }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    OUTPUT_LINES,
    JSON.stringify({ type: "FeatureCollection", features: lineFeatures }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    OUTPUT_INDEX,
    JSON.stringify(
      {
        version: 2,
        generatedAt: report.generatedAt,
        minEvidences: MIN_EVIDENCES,
        eraOrder: ERAS.map((e) => e.id),
        streets: indexEntries,
      },
      null,
      2
    ),
    "utf8"
  );
  fs.writeFileSync(OUTPUT_REPORT, JSON.stringify(report, null, 2), "utf8");

  console.log(
    "[street-timeline] build:",
    pointFeatures.length,
    "marcos,",
    lineFeatures.length,
    "fios,",
    report.streets,
    "ruas,",
    report.unmatched,
    "sem logradouro"
  );
}

main();
