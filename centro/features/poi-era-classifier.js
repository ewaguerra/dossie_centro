/**
 * Classificação de época/tipologia para evidências POI.
 * Catálogos: centro/data/catalog/poi-eras.json, poi-era-classification.json
 */
(function () {
  "use strict";

  var ERAS = [
    { id: "colonial-imperio", label: "Colonial / Império", shortLabel: "Colonial", color: "#92400e" },
    { id: "republica-velha", label: "República Velha", shortLabel: "Rep. Velha", color: "#b45309" },
    { id: "modernismo", label: "Modernismo / Vargas", shortLabel: "Modernismo", color: "#ca8a04" },
    { id: "populista", label: "Populista / JK", shortLabel: "Populista", color: "#65a30d" },
    { id: "ditadura", label: "Ditadura militar", shortLabel: "Ditadura", color: "#475569" },
    { id: "democracia", label: "Redemocratização", shortLabel: "Democracia", color: "#0369a1" },
    { id: "sem-data", label: "Data indeterminada", shortLabel: "Indeterm.", color: "#78716c" },
  ];

  var ERA_BY_ID = {};
  for (var ei = 0; ei < ERAS.length; ei++) {
    ERA_BY_ID[ERAS[ei].id] = ERAS[ei];
  }

  var THEME_RULES = {
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
    "poi-turistico": {
      strategy: "typology",
      field: "category",
      typologies: {
        igreja_religiosidade: { label: "Religioso", color: "#f5e6cc" },
        arquitetura_mirante: { label: "Arquitetura / mirante", color: "#ffd6a5" },
        museu_memoria: { label: "Museu / memória", color: "#c8e6c9" },
        teatro_espetaculo: { label: "Teatro / espetáculo", color: "#c8e6c9" },
        educacao_institucional: { label: "Educação", color: "#bbdefb" },
        transporte_estacao: { label: "Transporte", color: "#e1bee7" },
        sesc_lazer: { label: "Lazer / SESC", color: "#b2ebf2" },
        mercado_comercio: { label: "Comércio / mercado", color: "#fff9c4" },
        praca_espaco_publico: { label: "Praça / espaço público", color: "#b2ebf2" },
        outro: { label: "Outros", color: "#f5f5f5" },
      },
    },
  };

  function extractYear(str) {
    if (str == null || str === "") return null;
    var match = String(str).match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    return match ? parseInt(match[1], 10) : null;
  }

  function classifyYear(year) {
    if (year == null || isNaN(year)) return "sem-data";
    if (year < 1889) return "colonial-imperio";
    if (year < 1930) return "republica-velha";
    if (year < 1946) return "modernismo";
    if (year < 1964) return "populista";
    if (year < 1985) return "ditadura";
    return "democracia";
  }

  function classifyFeature(themeId, properties) {
    properties = properties || {};
    var rule = THEME_RULES[themeId];
    if (!rule) return "sem-data";

    switch (rule.strategy) {
      case "year":
        return classifyYear(extractYear(properties[rule.field]));
      case "yearFromText": {
        var text = properties[rule.field] || "";
        var matches = String(text).match(/\b(1[5-9]\d{2}|20\d{2})\b/g);
        if (!matches || !matches.length) return "sem-data";
        return classifyYear(parseInt(matches[0], 10));
      }
      case "manual": {
        var key = String(properties[rule.field] != null ? properties[rule.field] : "");
        if (rule.overrides && rule.overrides[key]) return rule.overrides[key];
        return "sem-data";
      }
      case "fixed":
        return rule.eraId || "sem-data";
      case "typology": {
        var cat = properties[rule.field] || "outro";
        return String(cat);
      }
      default: {
        var _exhaustive = rule.strategy;
        console.warn("[CENTRO] poi-era-classifier: estrategia desconhecida", _exhaustive);
        return "sem-data";
      }
    }
  }

  function enrichGeojson(themeId, geojson) {
    if (!geojson || !geojson.features) return geojson;
    var rule = THEME_RULES[themeId];
    var subKey = rule && rule.strategy === "typology" ? "poi_typology" : "poi_era";
    for (var i = 0; i < geojson.features.length; i++) {
      var feat = geojson.features[i];
      if (!feat.properties) feat.properties = {};
      var subId = classifyFeature(themeId, feat.properties);
      feat.properties[subKey] = subId;
      feat.properties.poi_sub_id = subId;
    }
    return geojson;
  }

  function getEras() {
    return ERAS.slice();
  }

  function getEraById(eraId) {
    return ERA_BY_ID[eraId] || null;
  }

  function getThemeRule(themeId) {
    return THEME_RULES[themeId] || null;
  }

  function getSubFiltersForTheme(themeId) {
    var rule = THEME_RULES[themeId];
    if (!rule) return [];

    if (rule.strategy === "typology" && rule.typologies) {
      return Object.keys(rule.typologies).map(function (id) {
        var entry = rule.typologies[id];
        return {
          id: id,
          label: entry.label,
          color: entry.color,
          kind: "typology",
        };
      });
    }

    return ERAS.map(function (era) {
      return {
        id: era.id,
        label: era.label,
        shortLabel: era.shortLabel,
        color: era.color,
        kind: "era",
      };
    });
  }

  function buildEraHaloPaint(propertyKey) {
    propertyKey = propertyKey || "poi_era";
    var expression = ["match", ["get", propertyKey]];
    for (var i = 0; i < ERAS.length; i++) {
      expression.push(ERAS[i].id, ERAS[i].color);
    }
    expression.push("#78716c");
    return {
      "icon-halo-color": expression,
      "icon-halo-width": 3,
      "icon-halo-blur": 0.35,
    };
  }

  function buildTypologyHaloPaint(themeId, propertyKey) {
    propertyKey = propertyKey || "poi_typology";
    var rule = THEME_RULES[themeId];
    if (!rule || !rule.typologies) return buildEraHaloPaint(propertyKey);
    var expression = ["match", ["get", propertyKey]];
    var keys = Object.keys(rule.typologies);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      expression.push(id, rule.typologies[id].color);
    }
    expression.push("#f5f5f5");
    return {
      "icon-halo-color": expression,
      "icon-halo-width": 3,
      "icon-halo-blur": 0.35,
    };
  }

  function buildSubFilterPaint(themeId) {
    var rule = THEME_RULES[themeId];
    if (rule && rule.strategy === "typology") {
      return buildTypologyHaloPaint(themeId, "poi_typology");
    }
    return buildEraHaloPaint("poi_era");
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.poiEraClassifier = {
    getEras: getEras,
    getEraById: getEraById,
    getThemeRule: getThemeRule,
    getSubFiltersForTheme: getSubFiltersForTheme,
    classifyFeature: classifyFeature,
    enrichGeojson: enrichGeojson,
    buildSubFilterPaint: buildSubFilterPaint,
    classifyYear: classifyYear,
    extractYear: extractYear,
  };
})();
