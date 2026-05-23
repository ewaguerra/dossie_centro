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

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.buildLayerDataUrl = buildLayerDataUrl;
  window.CENTRO.map.applyLayerZoomBounds = applyLayerZoomBounds;
})();
