/**
 * Manifest unificado de imagens Wikipedia para cards POI (todos os temas).
 */
(function () {
  "use strict";

  var MANIFEST_URL = "/centro/data/catalog/poi-wikipedia-images.json";

  var LOOKUP_ID_BY_THEME = {
    "memoria-paulistana": "cd_identificador",
    "acervo-tombado": "cd_identificador",
    "bem-arqueologico": "cd_identificador",
    monumentos: "cd_identificador",
    "poi-turistico": "officialIndex",
    "linha-tempo": "event_id",
    demo: "markerId",
  };

  var cache = null;
  var loadPromise = null;

  function load() {
    if (cache) return Promise.resolve(cache);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(MANIFEST_URL)
      .then(function (res) {
        return res.ok ? res.json() : {};
      })
      .then(function (data) {
        cache = data && typeof data === "object" ? data : {};
        return cache;
      })
      .catch(function () {
        cache = {};
        return cache;
      });
    return loadPromise;
  }

  function getLookupId(themeId, properties) {
    if (!properties) return "";
    var prop = LOOKUP_ID_BY_THEME[themeId];
    if (!prop) return "";
    var value = properties[prop];
    if (value == null || value === "") return "";
    return String(value);
  }

  function lookup(themeId, id) {
    if (!cache || !themeId || id == null || id === "") return null;
    var bucket = cache[themeId];
    if (!bucket || typeof bucket !== "object") return null;
    return bucket[String(id)] || null;
  }

  function lookupWithFallback(themeId, properties) {
    var id = getLookupId(themeId, properties);
    var entry = id ? lookup(themeId, id) : null;
    if (entry) return entry;
    if (themeId === "linha-tempo" && properties) {
      var srcTheme = properties.source_theme_id || "";
      var srcId = properties.source_feature_id;
      if (srcTheme && srcId != null && srcId !== "") {
        return lookup(srcTheme, srcId);
      }
    }
    return null;
  }

  function applyWikiFields(meta, themeId, properties) {
    meta = meta || {};
    var entry = lookupWithFallback(themeId, properties);
    if (!entry) return meta;
    meta.imageUrl = entry.imageUrl || "";
    meta.wikiUrl = entry.wikiUrl || "";
    meta.wikiTitle = entry.wikiTitle || "";
    meta.imageCredit = entry.attribution || "";
    return meta;
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.poiWikipediaImages = {
    load: load,
    lookup: lookup,
    lookupWithFallback: lookupWithFallback,
    getLookupId: getLookupId,
    applyWikiFields: applyWikiFields,
  };
})();
