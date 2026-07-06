/**
 * Extração e normalização de logradouros a partir de endereços POI heterogéneos.
 */
import { normalizeStreetName, buildCatalogIndex } from "./street-name-utils.mjs";

const SKIP_PATTERNS = [
  /^metr[oô]\s/i,
  /^terminal\s/i,
  /^estação\s/i,
  /^estacao\s/i,
  /^praça\s+de\s+atendimento/i,
];

const TYPE_PREFIXES = [
  { re: /^(?:r\.?\s*|rua\s+)(.+)$/i, label: "Rua" },
  { re: /^(?:av\.?\s*|avenida\s+)(.+)$/i, label: "Avenida" },
  { re: /^(?:al\.?\s*|alameda\s+)(.+)$/i, label: "Alameda" },
  { re: /^(?:tv\.?\s*|travessa\s+)(.+)$/i, label: "Travessa" },
  { re: /^(?:lg\.?\s*|largo\s+)(.+)$/i, label: "Largo" },
  { re: /^(?:pç\.?\s*|pc\.?\s*|praça\s+)(.+)$/i, label: "Praça" },
  { re: /^(?:vl\.?\s*|vila\s+)(.+)$/i, label: "Vila" },
  { re: /^(?:bc\.?\s*|beco\s+)(.+)$/i, label: "Beco" },
  { re: /^(?:passagem\s+)(.+)$/i, label: "Passagem" },
];

const MUNICIPAL_ABBREV = [
  { re: /^r\s+de\s+(.+)$/i, label: "Rua de" },
  { re: /^r\s+(.+)$/i, label: "Rua" },
  { re: /^av\s+dr\s+(.+)$/i, label: "Avenida Doutor" },
  { re: /^av\s+(.+)$/i, label: "Avenida" },
  { re: /^lg\s+(.+)$/i, label: "Largo" },
  { re: /^al\s+(.+)$/i, label: "Alameda" },
  { re: /^tv\s+(.+)$/i, label: "Travessa" },
  { re: /^pc\s+(.+)$/i, label: "Praça" },
  { re: /^pra[cç]a\s+(.+)$/i, label: "Praça" },
];

function titleCaseWords(value) {
  const small = new Set(["de", "da", "do", "das", "dos", "e", "a", "o"]);
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && small.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function stripHouseNumber(value) {
  return String(value || "")
    .replace(/\s*,\s*\d+.*$/, "")
    .replace(/\s+\d+\s*$/, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

function stripParenthetical(value) {
  return String(value || "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
}

function formatStreetLabel(prefix, body) {
  const clean = stripHouseNumber(stripParenthetical(body));
  if (!clean) return "";
  return prefix + " " + titleCaseWords(clean);
}

export function parseStreetFromAddress(raw) {
  if (!raw || typeof raw !== "string") return null;
  let text = raw.trim();
  if (!text) return null;

  for (const skip of SKIP_PATTERNS) {
    if (skip.test(text)) return null;
  }

  text = stripParenthetical(text);
  text = text.split(/\s*[-–—]\s*/)[0].trim();

  for (const item of TYPE_PREFIXES) {
    const match = text.match(item.re);
    if (match) {
      return formatStreetLabel(item.label, match[1]);
    }
  }

  const upper = text.toUpperCase();
  for (const item of MUNICIPAL_ABBREV) {
    const match = upper.match(item.re);
    if (match) {
      return formatStreetLabel(item.label, match[1]);
    }
  }

  if (/^(largo|praça|praça|beco|passagem|vila)\s+/i.test(text)) {
    return titleCaseWords(stripHouseNumber(text));
  }

  return null;
}

export function resolveStreetKey(displayName, catalogIndex) {
  const normalized = normalizeStreetName(displayName);
  if (!normalized) return null;

  for (let i = 0; i < catalogIndex.length; i++) {
    const item = catalogIndex[i];
    if (item.normalizedNames.indexOf(normalized) !== -1) {
      const entry = item.entry;
      return {
        streetKey: entry.id || normalized,
        streetDisplay: entry.nome_atual || displayName,
      };
    }
  }

  return {
    streetKey: normalized.replace(/\s+/g, "-"),
    streetDisplay: displayName,
  };
}

export function extractStreetFromEvidence(themeId, properties, catalogIndex) {
  properties = properties || {};
  let raw = "";

  switch (themeId) {
    case "memoria-paulistana":
      raw = properties.nm_endereco_placa || properties.nm_local_placa || "";
      break;
    case "acervo-tombado":
    case "bem-arqueologico":
      raw = properties.nm_endereco || "";
      break;
    case "monumentos":
      raw = properties.dc_localizacao || "";
      break;
    case "poi-turistico":
      raw = properties.addr_street || properties.name || "";
      break;
    default:
      raw = "";
  }

  const display = parseStreetFromAddress(raw);
  if (!display) return null;
  return resolveStreetKey(display, catalogIndex);
}

export function haversineMeters(lng1, lat1, lng2, lat2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistanceMeters(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return haversineMeters(px, py, x1, y1);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return haversineMeters(px, py, projX, projY);
}

export function buildStreetSpatialIndex(ruasGeojson) {
  const segments = [];
  const features = (ruasGeojson && ruasGeojson.features) || [];
  for (let i = 0; i < features.length; i++) {
    const feat = features[i];
    const props = feat.properties || {};
    const name = props.name || props.nome || props.logradouro || "";
    if (!name) continue;
    const geom = feat.geometry;
    if (!geom || geom.type !== "LineString" || !geom.coordinates) continue;
    const coords = geom.coordinates;
    for (let c = 0; c < coords.length - 1; c++) {
      segments.push({
        name,
        lng1: coords[c][0],
        lat1: coords[c][1],
        lng2: coords[c + 1][0],
        lat2: coords[c + 1][1],
      });
    }
  }
  return segments;
}

export function nearestStreetName(lng, lat, segments, maxDistanceMeters) {
  let best = null;
  let bestDist = maxDistanceMeters;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const dist = pointToSegmentDistanceMeters(lng, lat, seg.lng1, seg.lat1, seg.lng2, seg.lat2);
    if (dist < bestDist) {
      bestDist = dist;
      best = seg.name;
    }
  }
  return best;
}

export function loadCatalogIndexFromFile(catalogJson) {
  return buildCatalogIndex(catalogJson);
}
