/**
 * Symbol layers para nomes de ruas (actual + histórico) sobre 15_osm_ruas__line.
 */
(function () {
  "use strict";

  var SOURCE_ID = "centro-street-names-src";
  var LAYER_ATUAL = "centro-street-label-atual";
  var LAYER_HISTORICO = "centro-street-label-historico";
  var LAYER_FILE = "data/geojson/special/streets/centro_ruas_nomes__line.geojson";
  var TEXT_FONT = ["Noto Sans Regular"];
  var OSM_RUAS_LAYER_ID = "15_osm_ruas__line";

  var BASMAP_NAME_LAYERS = [
    "highway-name-path",
    "highway-name-minor",
    "highway-name-major",
  ];

  var active = false;
  var loadPromise = null;

  function getMapFn(name) {
    return window.CENTRO && window.CENTRO.map && window.CENTRO.map[name];
  }

  function getStreetNamesApi() {
    return window.CENTRO && window.CENTRO.streetNames;
  }

  function getLabelPaint() {
    return {
      "text-color": "#1a1a1a",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
      "text-halo-blur": 0.5,
    };
  }

  function getHistoricoPaint() {
    return {
      "text-color": "#7c2d12",
      "text-halo-color": "#fef3c7",
      "text-halo-width": 1.5,
      "text-halo-blur": 0.5,
    };
  }

  function majorHighwayFilter() {
    return [
      "any",
      ["in", ["get", "highway"], ["literal", ["primary", "primary_link", "secondary", "secondary_link", "tertiary", "tertiary_link", "trunk", "trunk_link", "motorway", "motorway_link"]]],
      ["==", ["get", "catalog_priority"], "high"],
    ];
  }

  function buildAtualFilter() {
    return ["all", ["has", "label_atual"], ["!=", ["get", "label_atual"], ""]];
  }

  function buildHistoricoFilter() {
    return [
      "all",
      ["==", ["get", "has_rename"], "1"],
      ["has", "label_historico"],
      ["!=", ["get", "label_historico"], ""],
    ];
  }

  function setLayerVisibility(mapInstance, layerId, visible) {
    if (!mapInstance || !mapInstance.getLayer(layerId)) return;
    mapInstance.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }

  function syncBasemapNameLayers(mapInstance, hide) {
    if (!mapInstance) return;
    for (var i = 0; i < BASMAP_NAME_LAYERS.length; i++) {
      var id = BASMAP_NAME_LAYERS[i];
      if (mapInstance.getLayer(id)) {
        mapInstance.setLayoutProperty(id, "visibility", hide ? "none" : "visible");
      }
    }
  }

  function syncVisibility(mapInstance) {
    if (!mapInstance) return;
    var sn = getStreetNamesApi();
    var showAtual = sn && typeof sn.shouldShowAtualLabels === "function" ? sn.shouldShowAtualLabels() : true;
    var showHist =
      sn && typeof sn.shouldShowHistoricoLabels === "function" ? sn.shouldShowHistoricoLabels() : true;
    var enabled = active && mapInstance.getSource(SOURCE_ID);
    setLayerVisibility(mapInstance, LAYER_ATUAL, enabled && showAtual);
    setLayerVisibility(mapInstance, LAYER_HISTORICO, enabled && showHist);
    syncBasemapNameLayers(mapInstance, enabled && showAtual);
  }

  async function ensureLoaded(mapInstance, deps) {
    if (!mapInstance) return false;
    var ensureSource = deps.ensureSource || getMapFn("ensureSource");
    var ensureLayer = deps.ensureLayer || getMapFn("ensureLayer");
    var fetchLayer = getMapFn("fetchLayerGeojson");
    var getInsertBeforeId =
      typeof deps.getInsertBeforeId === "function" ? deps.getInsertBeforeId : function () {
        return undefined;
      };

    if (typeof ensureSource !== "function" || typeof ensureLayer !== "function") {
      return false;
    }
    if (typeof fetchLayer !== "function") {
      console.warn("[CENTRO] fetchLayerGeojson ausente — street labels ignorados");
      return false;
    }

    if (!loadPromise) {
      loadPromise = fetchLayer(LAYER_FILE).then(function (data) {
        return data;
      });
    }

    try {
      var geojson = await loadPromise;
      ensureSource(mapInstance, SOURCE_ID, { type: "geojson", data: geojson });

      if (!mapInstance.getLayer(LAYER_ATUAL)) {
        ensureLayer(
          mapInstance,
          {
            id: LAYER_ATUAL,
            type: "symbol",
            source: SOURCE_ID,
            minzoom: 15,
            filter: buildAtualFilter(),
            layout: {
              "symbol-placement": "line",
              "text-field": ["get", "label_atual"],
              "text-font": TEXT_FONT,
              "text-size": 11,
              "text-optional": true,
              "text-max-angle": 30,
              "text-padding": 2,
              visibility: "none",
            },
            paint: getLabelPaint(),
          },
          getInsertBeforeId()
        );
      }

      if (!mapInstance.getLayer(LAYER_HISTORICO)) {
        ensureLayer(
          mapInstance,
          {
            id: LAYER_HISTORICO,
            type: "symbol",
            source: SOURCE_ID,
            minzoom: 16,
            filter: buildHistoricoFilter(),
            layout: {
              "symbol-placement": "line",
              "text-field": ["get", "label_historico"],
              "text-font": TEXT_FONT,
              "text-size": 10,
              "text-offset": [0, -0.8],
              "text-optional": true,
              "text-max-angle": 30,
              "text-padding": 2,
              visibility: "none",
            },
            paint: getHistoricoPaint(),
          },
          getInsertBeforeId()
        );
      }

      if (mapInstance.getLayer(LAYER_ATUAL)) {
        mapInstance.setFilter(LAYER_ATUAL, [
          "all",
          ["has", "label_atual"],
          ["!=", ["get", "label_atual"], ""],
          [
            "any",
            [">=", ["zoom"], 17],
            majorHighwayFilter(),
          ],
        ]);
      }

      return true;
    } catch (err) {
      console.warn("[CENTRO] Street labels indisponíveis:", err);
      loadPromise = null;
      return false;
    }
  }

  async function sync(mapInstance, options) {
    options = options || {};
    var deps = options.deps || {};
    var enabled = options.enabled !== false;

    if (!enabled) {
      remove(mapInstance);
      return;
    }

    var ok = await ensureLoaded(mapInstance, deps);
    active = ok;
    syncVisibility(mapInstance);
  }

  function remove(mapInstance) {
    active = false;
    if (!mapInstance) return;
    syncBasemapNameLayers(mapInstance, false);
    if (mapInstance.getLayer(LAYER_HISTORICO)) mapInstance.removeLayer(LAYER_HISTORICO);
    if (mapInstance.getLayer(LAYER_ATUAL)) mapInstance.removeLayer(LAYER_ATUAL);
    if (mapInstance.getSource(SOURCE_ID)) mapInstance.removeSource(SOURCE_ID);
    loadPromise = null;
  }

  function isActive() {
    return active;
  }

  function isBoundToOsmRuasLayer(layerId) {
    return layerId === OSM_RUAS_LAYER_ID;
  }

  function installListeners(getMap) {
    document.addEventListener("centro:street-names-changed", function () {
      var mapInstance = typeof getMap === "function" ? getMap() : null;
      syncVisibility(mapInstance);
    });
    document.addEventListener("centro:arg-state-changed", function () {
      var mapInstance = typeof getMap === "function" ? getMap() : null;
      syncVisibility(mapInstance);
    });
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.streetLabelsOverlay = {
    SOURCE_ID: SOURCE_ID,
    LAYER_ATUAL: LAYER_ATUAL,
    LAYER_HISTORICO: LAYER_HISTORICO,
    OSM_RUAS_LAYER_ID: OSM_RUAS_LAYER_ID,
    sync: sync,
    remove: remove,
    syncVisibility: syncVisibility,
    isActive: isActive,
    isBoundToOsmRuasLayer: isBoundToOsmRuasLayer,
    installListeners: installListeners,
  };
})();
