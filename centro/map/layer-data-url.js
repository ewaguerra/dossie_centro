/**
 * Resolução de URL GeoJSON e zoom bounds — puro, sem MapLibre.
 */
(function () {
  "use strict";

  function buildLayerDataUrl(cfg) {
    var filePath = (cfg && cfg.file) || "";
    if (filePath.indexOf("data/context/") === 0) {
      return "/centro/" + filePath;
    }
    if (filePath.indexOf("data/processed/") === 0) {
      return "/centro/" + filePath;
    }
    if (filePath.indexOf("data/geojson/heavy/") === 0) {
      return "/centro/" + filePath;
    }
    if (filePath.indexOf("data/geojson/special/") === 0) {
      return "/centro/" + filePath;
    }
    return "/centro/data/processed/" + filePath.replace(/^.*processed\//, "");
  }

  function applyLayerZoomBounds(layerConfig, cfg) {
    if (cfg.minzoom != null) layerConfig.minzoom = cfg.minzoom;
    if (cfg.maxzoom != null) layerConfig.maxzoom = cfg.maxzoom;
    return layerConfig;
  }

  /** @type {Record<string, Promise<object>>} */
  var layerGeojsonCache = Object.create(null);

  async function fetchLayerGeojson(filePath) {
    var key = filePath || "";
    if (!key) {
      throw new Error("fetchLayerGeojson: filePath obrigatório");
    }
    if (layerGeojsonCache[key]) {
      return layerGeojsonCache[key];
    }

    var url = buildLayerDataUrl({ file: key });
    var promise = fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error(
          "Falha ao carregar " + key + ": " + response.status + " " + url
        );
      }
      return response.json();
    });
    layerGeojsonCache[key] = promise;
    promise.catch(function () {
      delete layerGeojsonCache[key];
    });
    return promise;
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.buildLayerDataUrl = buildLayerDataUrl;
  window.CENTRO.map.applyLayerZoomBounds = applyLayerZoomBounds;
  window.CENTRO.map.fetchLayerGeojson = fetchLayerGeojson;
})();
