/**
 * Pipeline mecânico: symbol layer + popup + hover + interactionIds.
 * Semântica de domínio fica nos wrappers (addPOILayer / addPistasLayer).
 */
(function () {
  "use strict";

  function getMapFn(name) {
    return window.CENTRO && window.CENTRO.map && window.CENTRO.map[name];
  }

  function getPopupNode(factoryKey, args) {
    var fn = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui[factoryKey];
    if (typeof fn === "function") return fn.apply(null, args);
    console.warn("[CENTRO] map-popups.js ausente — " + factoryKey + " indisponível");
    return document.createElement("div");
  }

  async function addSymbolPopupLayer(mapInstance, config) {
    var ensureSource = getMapFn("ensureSource");
    var ensureLayer = getMapFn("ensureLayer");
    var ensureImage = getMapFn("ensureImage");
    var bindLayerEventOnce = getMapFn("bindLayerEventOnce");

    if (
      typeof ensureSource !== "function" ||
      typeof ensureLayer !== "function" ||
      typeof ensureImage !== "function" ||
      typeof bindLayerEventOnce !== "function"
    ) {
      console.warn("[CENTRO] symbol-popup-layer: map-safe.js incompleto — abortando");
      return config && config.returnFeatureCount ? 0 : undefined;
    }

    if (!config || !config.sourceId || !config.iconLayerId) {
      if (config && typeof config.onGuardFail === "function") {
        config.onGuardFail();
      }
      return config && config.returnFeatureCount ? 0 : undefined;
    }

    ensureSource(mapInstance, config.sourceId, config.source);
    if (!config.skipBaseImage) {
      await ensureImage(mapInstance, config.imageId, config.iconPath);
    }

    ensureLayer(mapInstance, {
      id: config.iconLayerId,
      type: "symbol",
      source: config.sourceId,
      layout: Object.assign({}, config.iconLayout, { visibility: "none" }),
      paint: config.iconPaint,
    });

    if (config.label && config.label.enabled) {
      var labelLayer = {
        id: config.label.layerId,
        type: "symbol",
        source: config.sourceId,
        layout: config.label.layout,
        paint: config.label.paint,
      };
      if (config.label.filter) labelLayer.filter = config.label.filter;
      if (config.label.minzoom != null) labelLayer.minzoom = config.label.minzoom;
      labelLayer.layout = Object.assign({}, config.label.layout, { visibility: "none" });
      ensureLayer(mapInstance, labelLayer);
    }

    var popupCfg = config.popup || {};
    bindLayerEventOnce(mapInstance, "click", config.iconLayerId, function (e) {
      var properties = (e.features && e.features[0] && e.features[0].properties) || {};
      if (popupCfg.guard && !popupCfg.guard(properties)) return;
      var ui = window.CENTRO && window.CENTRO.ui;
      if (ui && typeof ui.collapseSidebarForMap === "function") {
        ui.collapseSidebarForMap();
      }
      var args = popupCfg.buildArgs(properties, e);
      var popupNode = getPopupNode(popupCfg.factoryKey, args);
      var popup = new maplibregl.Popup(
        Object.assign(
          {
            closeButton: true,
            closeOnClick: false,
            className: "evidence-popup",
            maxWidth: "340px",
            offset: 20,
          },
          popupCfg.popupOptions || {}
        )
      );
      popup.setLngLat(e.lngLat).setDOMContent(popupNode).addTo(mapInstance);
      var syncTheme =
        window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.syncMapPopupTheme;
      if (typeof syncTheme === "function") {
        syncTheme(popup, popupNode);
      }
    });

    bindLayerEventOnce(mapInstance, "mouseenter", config.iconLayerId, function () {
      mapInstance.getCanvas().style.cursor = "pointer";
    });
    bindLayerEventOnce(mapInstance, "mouseleave", config.iconLayerId, function () {
      mapInstance.getCanvas().style.cursor = "";
    });

    var interactionIds = config.interactionLayerIds;
    if (interactionIds && interactionIds.indexOf(config.iconLayerId) === -1) {
      interactionIds.push(config.iconLayerId);
    }

    if (config.returnFeatureCount) {
      var data = config.source && config.source.data;
      if (data && data.features) return data.features.length;
      return 0;
    }
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.addSymbolPopupLayer = addSymbolPopupLayer;
})();
