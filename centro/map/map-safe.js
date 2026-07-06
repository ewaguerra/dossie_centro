/**
 * Helpers idempotentes MapLibre — source, layer, image, eventos.
 */
(function () {
  "use strict";

  function ensureSource(mapInstance, id, sourceConfig) {
    if (!mapInstance.getSource(id)) {
      mapInstance.addSource(id, sourceConfig);
    }
  }

  function ensureLayer(mapInstance, layerConfig, beforeId) {
    if (!layerConfig || !layerConfig.id) {
      console.warn("[CENTRO] ensureLayer: id ausente — layer ignorado", layerConfig);
      return;
    }
    if (layerConfig.type !== "background" && !layerConfig.source) {
      console.warn("[CENTRO] ensureLayer: source ausente para layer", layerConfig.id, "— ignorado");
      return;
    }
    if (!mapInstance.getLayer(layerConfig.id)) {
      if (beforeId && mapInstance.getLayer(beforeId)) {
        mapInstance.addLayer(layerConfig, beforeId);
      } else {
        mapInstance.addLayer(layerConfig);
      }
    }
  }

  function bindLayerEventOnce(mapInstance, eventName, layerId, handler) {
    mapInstance.__centroPoiHandlers = mapInstance.__centroPoiHandlers || {};
    var handlerKey = eventName + ":" + layerId;
    if (mapInstance.__centroPoiHandlers[handlerKey]) return;
    mapInstance.on(eventName, layerId, handler);
    mapInstance.__centroPoiHandlers[handlerKey] = handler;
  }

  function isSvgUrl(url) {
    return /\.svg(\?.*)?$/i.test(url);
  }

  function loadHtmlImage(url) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () {
        reject(new Error("Falha ao carregar imagem: " + url));
      };
      image.src = url;
    });
  }

  async function ensureImage(mapInstance, imageId, imagePath) {
    if (mapInstance.hasImage(imageId)) return;
    var imageData;
    if (!isSvgUrl(imagePath) && typeof mapInstance.loadImage === "function") {
      var response = await mapInstance.loadImage(imagePath);
      imageData = response && response.data ? response.data : response;
    } else {
      imageData = await loadHtmlImage(imagePath);
    }
    if (!mapInstance.hasImage(imageId)) {
      mapInstance.addImage(imageId, imageData);
    }
  }

  function tintForensicDiscSvg(svgText, strokeColor) {
    return String(svgText || "").replace(/stroke="#57534e"/g, 'stroke="' + strokeColor + '"');
  }

  function svgTextToImage(svgText) {
    return new Promise(function (resolve, reject) {
      var blob = new Blob([svgText], { type: "image/svg+xml" });
      var url = URL.createObjectURL(blob);
      var image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Falha ao rasterizar SVG tintado"));
      };
      image.src = url;
    });
  }

  async function ensureEraThemedIcons(mapInstance, iconPath, baseImageId, eras) {
    if (!mapInstance || !iconPath || !baseImageId || !eras || !eras.length) return;
    var response = await fetch(iconPath);
    if (!response.ok) {
      throw new Error("Falha ao carregar SVG para epocas: " + iconPath + " -> " + response.status);
    }
    var svgText = await response.text();
    for (var i = 0; i < eras.length; i++) {
      var era = eras[i];
      if (!era || !era.id || !era.color) continue;
      var imageId = baseImageId + "--" + era.id;
      if (mapInstance.hasImage(imageId)) continue;
      var tintedSvg = tintForensicDiscSvg(svgText, era.color);
      var imageData = await svgTextToImage(tintedSvg);
      if (!mapInstance.hasImage(imageId)) {
        mapInstance.addImage(imageId, imageData);
      }
    }
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.ensureSource = ensureSource;
  window.CENTRO.map.ensureLayer = ensureLayer;
  window.CENTRO.map.ensureImage = ensureImage;
  window.CENTRO.map.ensureEraThemedIcons = ensureEraThemedIcons;
  window.CENTRO.map.bindLayerEventOnce = bindLayerEventOnce;
})();
