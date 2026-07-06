/**
 * Utilitários partilhados — build script + espelho browser em street-name-utils.js
 */

export function normalizeStreetName(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function getFeatureStreetName(props) {
  if (!props) return "";
  return (
    normalizeStreetName(props.logradouro) ||
    normalizeStreetName(props.name) ||
    normalizeStreetName(props.nome) ||
    normalizeStreetName(props.name_atual) ||
    ""
  );
}

export function splitAltNames(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(/[;,]/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

export function buildCatalogIndex(catalog) {
  var index = [];
  var entries = (catalog && catalog.entries) || [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var names = (entry.match && entry.match.name) || [];
    var normalized = names.map(normalizeStreetName).filter(Boolean);
    index.push({
      entry: entry,
      normalizedNames: normalized,
    });
  }
  return index;
}

export function matchCatalogEntry(props, catalogIndex) {
  var street = getFeatureStreetName(props);
  if (!street) return null;
  for (var i = 0; i < catalogIndex.length; i++) {
    var item = catalogIndex[i];
    if (item.normalizedNames.indexOf(street) !== -1) {
      return item.entry;
    }
    var osmName = normalizeStreetName(props.name);
    if (osmName && item.normalizedNames.indexOf(osmName) !== -1) {
      return item.entry;
    }
  }
  return null;
}

export function pickPrimaryHistoric(entry, osmOldName) {
  if (osmOldName && typeof osmOldName === "string" && osmOldName.trim()) {
    return { nome: osmOldName.trim(), era: "", nota: "old_name OSM" };
  }
  var list = entry && entry.nomes_historicos;
  if (Array.isArray(list) && list.length > 0) {
    return list[0];
  }
  return null;
}

export function namesDiffer(a, b) {
  if (!a || !b) return false;
  return normalizeStreetName(a) !== normalizeStreetName(b);
}

export function buildLabelHistorico(historic, era) {
  if (!historic) return "";
  var label = historic.nome || historic;
  if (typeof label !== "string") return "";
  var e = era || (historic.era && String(historic.era)) || "";
  if (e) return label + " (" + e + ")";
  return label;
}

export function buildLabelDev(nameAtual, nameHistorico, era) {
  if (nameHistorico && namesDiffer(nameAtual, nameHistorico)) {
    return buildLabelHistorico({ nome: nameHistorico, era: era }) + " → " + nameAtual;
  }
  return nameAtual || "";
}

export const MAJOR_HIGHWAYS = new Set([
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "trunk",
  "trunk_link",
  "motorway",
  "motorway_link",
]);

export const STREETS_LAYER_FILE =
  "data/geojson/heavy/15_osm_ruas__line.geojson";
export const STREET_NAMES_LAYER_FILE =
  "data/geojson/special/streets/centro_ruas_nomes__line.geojson";
