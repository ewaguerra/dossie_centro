/**
 * Classificação de época/tipologia — espelho do build para scripts Node.
 */

export const ERAS = [
  { id: "colonial-imperio", label: "Colonial / Império", shortLabel: "Colonial", color: "#92400e" },
  { id: "republica-velha", label: "República Velha", shortLabel: "Rep. Velha", color: "#b45309" },
  { id: "modernismo", label: "Modernismo / Vargas", shortLabel: "Modernismo", color: "#ca8a04" },
  { id: "populista", label: "Populista / JK", shortLabel: "Populista", color: "#65a30d" },
  { id: "ditadura", label: "Ditadura militar", shortLabel: "Ditadura", color: "#475569" },
  { id: "democracia", label: "Redemocratização", shortLabel: "Democracia", color: "#0369a1" },
  { id: "sem-data", label: "Data indeterminada", shortLabel: "Indeterm.", color: "#78716c" },
];

const THEME_RULES = {
  monumentos: { strategy: "year", field: "tx_data_implantacao" },
  "memoria-paulistana": { strategy: "yearFromText", field: "dc_enunciado_placa" },
  "acervo-tombado": {
    strategy: "manual",
    field: "cd_identificador",
    overrides: {
      "5007": "republica-velha",
      "5016": "colonial-imperio",
      "5009": "colonial-imperio",
      "5022": "sem-data",
      "5011": "modernismo",
      "5025": "democracia",
      "5021": "modernismo",
      "5024": "colonial-imperio",
      "5002": "ditadura",
      "5006": "modernismo",
      "5014": "republica-velha",
      "5018": "republica-velha",
      "5010": "modernismo",
      "5020": "republica-velha",
      "5013": "republica-velha",
      "5019": "colonial-imperio",
    },
  },
  "bem-arqueologico": { strategy: "fixed", eraId: "colonial-imperio" },
  "poi-turistico": { strategy: "typology", field: "category" },
    "linha-tempo": { strategy: "field", field: "poi_era" },
};

export function extractYear(str) {
  if (str == null || str === "") return null;
  const match = String(str).match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

export function classifyYear(year) {
  if (year == null || isNaN(year)) return "sem-data";
  if (year < 1889) return "colonial-imperio";
  if (year < 1930) return "republica-velha";
  if (year < 1946) return "modernismo";
  if (year < 1964) return "populista";
  if (year < 1985) return "ditadura";
  return "democracia";
}

export function classifyFeature(themeId, properties) {
  properties = properties || {};
  const rule = THEME_RULES[themeId];
  if (!rule) return "sem-data";

  switch (rule.strategy) {
    case "year":
      return classifyYear(extractYear(properties[rule.field]));
    case "yearFromText": {
      const text = properties[rule.field] || "";
      const matches = String(text).match(/\b(1[5-9]\d{2}|20\d{2})\b/g);
      if (!matches || !matches.length) return "sem-data";
      return classifyYear(parseInt(matches[0], 10));
    }
    case "manual": {
      const key = String(properties[rule.field] != null ? properties[rule.field] : "");
      if (rule.overrides && rule.overrides[key]) return rule.overrides[key];
      return "sem-data";
    }
    case "fixed":
      return rule.eraId || "sem-data";
    case "field":
      return String(properties[rule.field] || "sem-data");
    case "typology":
      return String(properties[rule.field] || "outro");
    default:
      return "sem-data";
  }
}

export function extractEvidenceYear(themeId, properties) {
  properties = properties || {};
  const rule = THEME_RULES[themeId];
  if (!rule) return null;

  switch (rule.strategy) {
    case "year":
      return extractYear(properties[rule.field]);
    case "yearFromText": {
      const text = properties[rule.field] || "";
      const matches = String(text).match(/\b(1[5-9]\d{2}|20\d{2})\b/g);
      if (!matches || !matches.length) return null;
      const years = matches.map((y) => parseInt(y, 10)).sort((a, b) => a - b);
      return years[0];
    }
    case "manual":
    case "fixed":
    case "typology":
      return null;
    default:
      return null;
  }
}

export function eraSortOrder(eraId) {
  const order = ERAS.map((e) => e.id);
  const idx = order.indexOf(eraId);
  return idx === -1 ? order.length : idx;
}
