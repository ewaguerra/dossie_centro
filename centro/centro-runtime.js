/**
 * Runtime principal da página Centro.
 * Extraído de scripts inline para manter HTML válido e facilitar manutenção.
 *
 * MapLibre GL JS 5.
 */
(function () {
  "use strict";

  var U = (window.CENTRO && window.CENTRO.utils) || {};
  var CENTRO_CENTER = U.CENTRO_CENTER || [-46.6361, -23.5505];
  var CENTRO_MAX_BOUNDS = U.CENTRO_MAX_BOUNDS || [[-46.67, -23.59], [-46.58, -23.52]];
  var MIN_ZOOM = U.MIN_ZOOM || 13;
  var MAX_ZOOM = U.MAX_ZOOM || 17;

  // Basemap: liberty local + proxy /basemap/ (dev e Vercel); prepareBasemapStyle
  // inline TileJSON, absolutiza URLs proxied e endurece filtros MapLibre 5.
  // Override: ?basemap=online | ?basemap=local
  var basemapApi = window.CENTRO && window.CENTRO.map;
  var BASEMAP_STYLE =
    basemapApi && typeof basemapApi.resolveBasemapStyle === "function"
      ? basemapApi.resolveBasemapStyle()
      : "https://tiles.openfreemap.org/styles/liberty";
  var BASEMAP_GROUND_COLOR =
    (basemapApi && basemapApi.BASEMAP_GROUND_COLOR) || "#f8f4f0";

  // Fonte para labels POI: precisa existir no fontstack do basemap. Noto
  // Sans Regular é o default da OpenFreeMap. Implementação em poi-bootstrap.js.
  // Localização PT-BR para controles MapLibre — implementação em map-init.js.
  var map = null;
  var activeLayers = new Set();
  var poiInteractionLayerIds = [];

  // Catálogo (layers.json + groups.json) é carregado uma única vez e indexado.
  var catalogIndex = null;

  // Maquete 3D — fill-extrusion nativa do estilo OpenFreeMap liberty.
  var BUILDINGS_3D_LAYER_ID = "building-3d";
  var CADERNO_STORAGE_KEY = "protocolo13_caderno_clues";

  // Regras de desbloqueio sidebar ← Caderno do Arquivista (layer-unlocks.json).
  var layerUnlockRules = null;

  // Promise resolvida quando o mapa dispara 'load' — permite encadear
  // ativações de camadas sem polling do DOM.
  var mapReadyResolve = null;
  var mapReadyPromise = new Promise(function (resolve) {
    mapReadyResolve = resolve;
  });

  function ensureCentroChromeApi() {
    if (!centroChromeApi && window.CENTRO && window.CENTRO.centroChrome) {
      centroChromeApi = window.CENTRO.centroChrome.create({
        flyToLocation: flyToLocation,
        whenMapReady: function (cb) {
          return mapReadyPromise.then(cb);
        },
        subterraneanFlyToView: subterraneanFlyToView,
      });
    }
    return centroChromeApi;
  }

  function getCentroMapHelper(name) {
    return window.CENTRO && window.CENTRO.map && window.CENTRO.map[name];
  }

  function getSidebarLayerStateHelper(name) {
    return window.CENTRO && window.CENTRO.sidebarLayerState && window.CENTRO.sidebarLayerState[name];
  }

  function ensureSource(mapInstance, id, sourceConfig) {
    var fn = getCentroMapHelper("ensureSource");
    if (typeof fn === "function") return fn(mapInstance, id, sourceConfig);
    console.warn("[CENTRO] map-safe.js ausente — ensureSource indisponível");
  }

  function ensureLayer(mapInstance, layerConfig, beforeId) {
    var fn = getCentroMapHelper("ensureLayer");
    if (typeof fn === "function") return fn(mapInstance, layerConfig, beforeId);
    console.warn("[CENTRO] map-safe.js ausente — ensureLayer indisponível");
  }

  function bindLayerEventOnce(mapInstance, eventName, layerId, handler) {
    var fn = getCentroMapHelper("bindLayerEventOnce");
    if (typeof fn === "function") return fn(mapInstance, eventName, layerId, handler);
    console.warn("[CENTRO] map-safe.js ausente — bindLayerEventOnce indisponível");
  }

  async function ensureImage(mapInstance, imageId, imagePath) {
    var fn = getCentroMapHelper("ensureImage");
    if (typeof fn === "function") return fn(mapInstance, imageId, imagePath);
    console.warn("[CENTRO] map-safe.js ausente — ensureImage indisponível");
  }

  // Camadas temáticas da sidebar ficam abaixo dos símbolos POI/pistas.
  function getCatalogInsertBeforeId() {
    if (!map) return undefined;
    for (var i = 0; i < poiInteractionLayerIds.length; i++) {
      var layerId = poiInteractionLayerIds[i];
      if (map.getLayer(layerId)) return layerId;
    }
    return undefined;
  }

  function getCollectedClueIds() {
    var lu = window.CENTRO && window.CENTRO.layerUnlocks;
    if (lu && typeof lu.getCollectedClueIds === "function") {
      return lu.getCollectedClueIds();
    }
    return new Set();
  }

  function isLayerUnlocked(layerId) {
    var lu = window.CENTRO && window.CENTRO.layerUnlocks;
    if (lu && typeof lu.isLayerUnlocked === "function") {
      return lu.isLayerUnlocked(layerId, layerUnlockRules);
    }
    return true;
  }

  function isLayerPhaseUnlocked(layerId) {
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.isLayerPhaseUnlocked === "function") {
      return ph.isLayerPhaseUnlocked(layerId);
    }
    return true;
  }

  function isLayerAccessible(layerId) {
    return isLayerUnlocked(layerId) && isLayerPhaseUnlocked(layerId);
  }

  function getMinPhaseLabel(layerId) {
    var format = getSidebarLayerStateHelper("getMinPhaseLabel");
    var minPhase = null;
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.getMinPhaseForLayer === "function") {
      minPhase = ph.getMinPhaseForLayer(layerId);
    }
    if (typeof format === "function") return format(minPhase);
    return minPhase != null ? String(minPhase) : "?";
  }

  function resolveSidebarLockState(layerId) {
    var compute = getSidebarLayerStateHelper("getLayerLockState");
    var minPhase = null;
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.getMinPhaseForLayer === "function") {
      minPhase = ph.getMinPhaseForLayer(layerId);
    }
    var opts = {
      isClueUnlocked: isLayerUnlocked(layerId),
      isPhaseUnlocked: isLayerPhaseUnlocked(layerId),
      minPhase: minPhase,
      phaseSoulLabel:
        ph && typeof ph.formatPhaseLockLabel === "function" && minPhase != null
          ? ph.formatPhaseLockLabel(minPhase)
          : "",
    };
    if (typeof compute === "function") return compute(opts);
    var clueLocked = !opts.isClueUnlocked;
    var phaseLocked = !clueLocked && !opts.isPhaseUnlocked;
    return {
      clueLocked: clueLocked,
      phaseLocked: phaseLocked,
      locked: clueLocked || phaseLocked,
      minPhaseLabel: getMinPhaseLabel(layerId),
    };
  }

  function getMapIconHaloPaint() {
    var iconsRegistry = window.MAPA_SP_ICONS;
    var paper = (iconsRegistry && iconsRegistry.settings && iconsRegistry.settings.paper) || "#fdfbf7";
    return {
      "icon-halo-color": paper,
      "icon-halo-width": 2,
      "icon-halo-blur": 0.5,
    };
  }

  var buildings3dApi = null;
  var poiFilterApi = null;
  var subterraneanApi = null;
  var investigationRayApi = null;
  var poiBootstrapApi = null;
  var trianguloOverlayApi = null;
  var sidebarOrchestratorApi = null;
  var argResyncApi = null;
  var missionsOrchestratorInstalled = false;
  var centroChromeApi = null;
  var mapInitApi = null;

  function ensurePoiBootstrapApi() {
    if (!poiBootstrapApi && window.CENTRO && window.CENTRO.poiBootstrap) {
      poiBootstrapApi = window.CENTRO.poiBootstrap.create({
        getMapHelper: getCentroMapHelper,
        buildLayerDataUrl: buildLayerDataUrl,
        poiInteractionLayerIds: poiInteractionLayerIds,
      });
    }
    return poiBootstrapApi;
  }

  function ensureBuildings3dApi() {
    if (!buildings3dApi && window.CENTRO && window.CENTRO.buildings3D) {
      buildings3dApi = window.CENTRO.buildings3D.create({
        getMap: function () {
          return map;
        },
        mapReadyPromise: mapReadyPromise,
      });
    }
    return buildings3dApi;
  }

  function ensurePoiFilterApi() {
    if (!poiFilterApi && window.CENTRO && window.CENTRO.poiThemeFilter) {
      poiFilterApi = window.CENTRO.poiThemeFilter.create({
        getMap: function () {
          return map;
        },
        mapReadyPromise: mapReadyPromise,
      });
    }
    return poiFilterApi;
  }

  function ensureSubterraneanApi() {
    if (!subterraneanApi && window.CENTRO && window.CENTRO.subterraneanCutaway) {
      subterraneanApi = window.CENTRO.subterraneanCutaway.create({
        getMap: function () {
          return map;
        },
        mapReadyPromise: mapReadyPromise,
      });
    }
    return subterraneanApi;
  }

  function applyAllPoiThemeFilters() {
    var phaseApi = window.CENTRO && window.CENTRO.protocoloPhase;
    var run = function () {
      var api = ensurePoiFilterApi();
      if (api) api.applyAll();
    };
    if (phaseApi && typeof phaseApi.loadPhaseGates === "function") {
      phaseApi.loadPhaseGates().then(run);
      return;
    }
    run();
  }

  function syncSidebarCheckboxesToBasemapOnly() {
    var panel = document.getElementById("panel");
    if (!panel) return;
    panel.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = false;
    });
    panel.querySelectorAll(".poi-legend__item--theme").forEach(function (row) {
      row.classList.add("poi-legend__item--off");
    });
    panel.querySelectorAll(".poi-legend__sub-item").forEach(function (row) {
      row.classList.add("poi-legend__sub-item--off");
    });
    var legend = document.getElementById("buildings-legend");
    if (legend) legend.hidden = true;
  }

  function hideAllOverlayLayersSync(mapRef) {
    if (!mapRef) return;
    var icons = window.MAPA_SP_ICONS;
    if (icons && typeof icons.getThemeFilters === "function") {
      var themes = icons.getThemeFilters();
      for (var ti = 0; ti < themes.length; ti++) {
        var layerIds = themes[ti].layerIds || [];
        for (var li = 0; li < layerIds.length; li++) {
          var layerId = layerIds[li];
          if (mapRef.getLayer(layerId)) {
            mapRef.setLayoutProperty(layerId, "visibility", "none");
          }
        }
      }
    }
    var pistasApi = window.CENTRO && window.CENTRO.pistas;
    if (pistasApi && pistasApi.POI_LAYERS) {
      var pistaLayers = pistasApi.POI_LAYERS;
      var pistaKeys = Object.keys(pistaLayers);
      for (var pi = 0; pi < pistaKeys.length; pi++) {
        var pistaLayerId = pistaLayers[pistaKeys[pi]];
        if (mapRef.getLayer(pistaLayerId)) {
          mapRef.setLayoutProperty(pistaLayerId, "visibility", "none");
        }
      }
    }
    if (mapRef.getLayer("building-3d")) {
      mapRef.setLayoutProperty("building-3d", "visibility", "none");
    }
    if (activeLayers && activeLayers.size) {
      activeLayers.forEach(function (layerId) {
        removeLayerFromMap(layerId);
      });
    }
  }

  function applyBasemapOnlyView(mapInstance) {
    var mapRef = mapInstance || map;
    syncSidebarCheckboxesToBasemapOnly();
    hideAllOverlayLayersSync(mapRef);

    var pistasApi = window.CENTRO && window.CENTRO.pistas;
    if (pistasApi && typeof pistasApi.setPistasRsbVisibility === "function" && mapRef) {
      pistasApi.setPistasRsbVisibility(mapRef, false);
    }

    setBuildings3DEnabled(false, { persist: false, silent: true });
    var b3d = ensureBuildings3dApi();
    if (b3d && typeof b3d.syncToggleUI === "function") b3d.syncToggleUI(false);

    setSubterraneanEnabled(false, { persist: false, silent: true, noFly: true });
    var sub = ensureSubterraneanApi();
    if (sub && typeof sub.syncToggleUI === "function") sub.syncToggleUI(false);

    var tri = ensureTrianguloOverlayApi();
    if (tri && typeof tri.remove === "function" && mapRef) tri.remove(mapRef);

    var poiApi = ensurePoiFilterApi();
    if (poiApi && typeof poiApi.applyAll === "function") poiApi.applyAll();
  }

  function isFreshBootPending() {
    var gate = window.CENTRO && window.CENTRO.accessGate;
    if (gate && typeof gate.isFreshBootPending === "function") {
      return gate.isFreshBootPending();
    }
    return false;
  }

  function clearFreshBootPending() {
    var gate = window.CENTRO && window.CENTRO.accessGate;
    if (gate && typeof gate.clearFreshBootPending === "function") {
      gate.clearFreshBootPending();
    }
  }

  function restoreSavedMapPreferences(mapInstance) {
    var mapRef = mapInstance || map;
    applyAllPoiThemeFilters();

    var pistasApi = window.CENTRO && window.CENTRO.pistas;
    if (pistasApi && typeof pistasApi.restoreFromStorage === "function") {
      pistasApi.restoreFromStorage(mapRef);
    }

    initBuildings3DState();
    initSubterraneanState();
    syncTrianguloHistoricoOverlay();
  }

  function runMapBootPolicy(mapInstance) {
    if (isFreshBootPending()) {
      applyBasemapOnlyView(mapInstance);
      clearFreshBootPending();
      return;
    }
    restoreSavedMapPreferences(mapInstance);
  }

  function setupPoiThemeFilter() {
    var api = ensurePoiFilterApi();
    if (api) api.setup();
  }

  function setBuildings3DEnabled(enabled, options) {
    var api = ensureBuildings3dApi();
    return api ? api.setEnabled(enabled, options) : false;
  }

  function setSubterraneanEnabled(enabled, options) {
    var api = ensureSubterraneanApi();
    return api ? api.setEnabled(enabled, options) : false;
  }

  function subterraneanFlyToView() {
    var api = ensureSubterraneanApi();
    if (api && typeof api.flyToView === "function") api.flyToView();
  }

  function ensureTrianguloOverlayApi() {
    if (!trianguloOverlayApi && window.CENTRO && window.CENTRO.trianguloOverlay) {
      trianguloOverlayApi = window.CENTRO.trianguloOverlay.create({
        ensureSource: ensureSource,
        ensureLayer: ensureLayer,
        getCatalogInsertBeforeId: getCatalogInsertBeforeId,
      });
    }
    return trianguloOverlayApi;
  }

  function syncTrianguloHistoricoOverlay() {
    var api = ensureTrianguloOverlayApi();
    if (api && typeof api.sync === "function") return api.sync(map);
  }

  function initBuildings3DState() {
    var api = ensureBuildings3dApi();
    if (api) api.initState();
  }

  function initSubterraneanState() {
    var api = ensureSubterraneanApi();
    if (api) {
      api.initState();
      return;
    }
    document.addEventListener("centro:subterranean-ready", function onReady() {
      document.removeEventListener("centro:subterranean-ready", onReady);
      var readyApi = ensureSubterraneanApi();
      if (readyApi) readyApi.initState();
    });
  }

  function setupBuildings3DToggle() {
    var api = ensureBuildings3dApi();
    if (api) api.setupToggle();
  }

  function setupSubterraneanToggle() {
    var api = ensureSubterraneanApi();
    if (api) {
      api.setupToggle();
      return;
    }
    document.addEventListener("centro:subterranean-ready", function onReady() {
      document.removeEventListener("centro:subterranean-ready", onReady);
      var readyApi = ensureSubterraneanApi();
      if (readyApi) readyApi.setupToggle();
    });
  }

  function setupStreetNamesDev() {
    var overlay = window.CENTRO && window.CENTRO.streetLabelsOverlay;
    if (overlay && typeof overlay.installListeners === "function") {
      overlay.installListeners(function () {
        return map;
      });
    }
    var sn = window.CENTRO && window.CENTRO.streetNames;
    if (sn && typeof sn.setupDevUi === "function") {
      sn.setupDevUi(function () {
        return map;
      });
    }
  }

  function ensureInvestigationRayApi() {
    if (
      !investigationRayApi &&
      window.CENTRO &&
      window.CENTRO.ui &&
      window.CENTRO.ui.investigationRay
    ) {
      investigationRayApi = window.CENTRO.ui.investigationRay.create(function () {
        return map;
      });
    }
    return investigationRayApi;
  }

  function setupInvestigationRay() {
    var api = ensureInvestigationRayApi();
    if (!api || typeof api.install !== "function") return;
    api.install();
    mapReadyPromise.then(function () {
      if (typeof api.attachToMapContainer === "function") api.attachToMapContainer();
    });
  }

  function ensureMapInitApi(basemapStyleOverride) {
    var style = basemapStyleOverride != null ? basemapStyleOverride : BASEMAP_STYLE;
    if (!mapInitApi && window.CENTRO && window.CENTRO.mapInit) {
      mapInitApi = window.CENTRO.mapInit.create({
        center: CENTRO_CENTER,
        maxBounds: CENTRO_MAX_BOUNDS,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        basemapStyle: style,
        groundColor: BASEMAP_GROUND_COLOR,
        onMapCreated: function (mapInstance) {
          map = mapInstance;
        },
        getPoiInteractionLayerIds: function () {
          return poiInteractionLayerIds;
        },
        getActiveLayers: function () {
          return activeLayers;
        },
        syncTriangulo: function (mapInstance) {
          var api = ensureTrianguloOverlayApi();
          if (api && typeof api.sync === "function") return api.sync(mapInstance);
        },
        bootPoiLayers: function (mapInstance, hooks) {
          var poiBoot = ensurePoiBootstrapApi();
          if (poiBoot) {
            return poiBoot.bootMapLayers(mapInstance, hooks).then(function () {
              applyAllPoiThemeFilters();
            });
          }
          console.warn("[CENTRO] poi-bootstrap.js ausente — POI/pistas ignorados");
          applyAllPoiThemeFilters();
          return Promise.resolve();
        },
        onPistasLoaded: function (mapInstance) {
          var pistasApi = window.CENTRO && window.CENTRO.pistas;
          if (pistasApi && typeof pistasApi.setupPistasRsbToggle === "function") {
            pistasApi.setupPistasRsbToggle(function () {
              return mapInstance;
            });
          }
        },
        onPistasError: function () {
          /* POI boot continua; política de arranque no runMapBootPolicy */
        },
        applyAllPoiThemeFilters: applyAllPoiThemeFilters,
        wireSidebarMobileButtons: function () {
          var chrome = ensureCentroChromeApi();
          if (chrome && typeof chrome.wireSidebarMobileButtons === "function") {
            chrome.wireSidebarMobileButtons();
          }
        },
        initBuildings3DState: initBuildings3DState,
        initSubterraneanState: initSubterraneanState,
        applyBasemapOnlyView: applyBasemapOnlyView,
        runMapBootPolicy: runMapBootPolicy,
        syncTriangulo: syncTrianguloHistoricoOverlay,
        mapReadyResolve: mapReadyResolve,
      });
    }
    return mapInitApi;
  }

  function initMap() {
    var prepare =
      basemapApi && typeof basemapApi.prepareBasemapStyle === "function"
        ? basemapApi.prepareBasemapStyle()
        : Promise.resolve(BASEMAP_STYLE);
    prepare.then(function (resolvedStyle) {
      mapInitApi = null;
      var api = ensureMapInitApi(resolvedStyle);
      if (api && typeof api.init === "function") api.init();
    });
  }

  function flyToLocation(lng, lat, zoom, pitch) {
    if (!map) return;
    map.flyTo({
      center: [lng, lat],
      zoom: zoom || 15,
      pitch: pitch || 0,
      duration: 2000,
    });
  }

  window.centroNavigate = flyToLocation;

  window.CENTRO_POIS = {
    triangulo: { center: [-46.635, -23.545], zoom: 16, pitch: 40, label: "Triângulo Histórico" },
    se: { center: [-46.6335, -23.5505], zoom: 17, pitch: 60, label: "Praça da Sé" },
    anhangabau: { center: [-46.6345, -23.5485], zoom: 16, pitch: 30, label: "Vale do Anhangabaú" },
    ruaSaobento: { center: [-46.6355, -23.5452], zoom: 16, pitch: 20, label: "Rua São Bento" },
    mosteiro: { center: [-46.6345, -23.544], zoom: 17, pitch: 45, label: "Mosteiro São Bento" },
    overview: { center: [-46.6365, -23.547], zoom: 14.5, pitch: 0, label: "Visão Geral" },
  };

  window.centroGoTo = function (id) {
    var poi = window.CENTRO_POIS && window.CENTRO_POIS[id];
    if (!poi || !map) return;
    map.flyTo({
      center: poi.center,
      zoom: poi.zoom,
      pitch: poi.pitch || 0,
      duration: 2000,
    });
  };

  function ensureSidebarOrchestratorApi() {
    if (!sidebarOrchestratorApi && window.CENTRO && window.CENTRO.sidebarOrchestrator) {
      sidebarOrchestratorApi = window.CENTRO.sidebarOrchestrator.create({
        onCatalogLoaded: function (data) {
          layerUnlockRules = data.layerUnlockRules;
          catalogIndex = data.catalogIndex;
        },
        hasCatalog: function () {
          return !!catalogIndex;
        },
        getLayerConfig: function (layerId) {
          return catalogIndex ? catalogIndex.get(layerId) : null;
        },
        resolveSidebarLockState: resolveSidebarLockState,
        getMinPhaseLabel: getMinPhaseLabel,
        isLayerAccessible: isLayerAccessible,
        getLockToastMessage: getLockToastMessage,
        whenMapReady: function (cb) {
          return mapReadyPromise.then(cb);
        },
        syncPoiPhaseGate: function () {
          var api = ensurePoiFilterApi();
          if (api && typeof api.syncPhaseGate === "function") api.syncPhaseGate();
        },
        addLayerToMap: addLayerToMap,
        removeLayerFromMap: removeLayerFromMap,
        flyToLocation: flyToLocation,
        getMap: function () {
          return map;
        },
      });
    }
    return sidebarOrchestratorApi;
  }

  function loadSidebarData() {
    var api = ensureSidebarOrchestratorApi();
    if (api && typeof api.load === "function") api.load();
  }

  function buildLayerDataUrl(cfg) {
    var fn = getCentroMapHelper("buildLayerDataUrl");
    if (typeof fn === "function") return fn(cfg);
    console.warn("[CENTRO] layer-data-url.js ausente — buildLayerDataUrl indisponível");
    return "/centro/data/processed/";
  }

  function applyLayerZoomBounds(layerConfig, cfg) {
    var fn = getCentroMapHelper("applyLayerZoomBounds");
    if (typeof fn === "function") return fn(layerConfig, cfg);
    if (cfg.minzoom != null) layerConfig.minzoom = cfg.minzoom;
    if (cfg.maxzoom != null) layerConfig.maxzoom = cfg.maxzoom;
    return layerConfig;
  }

  function buildCatalogLayerDeps() {
    var iconsRegistry = window.MAPA_SP_ICONS;
    return {
      map: map,
      activeLayers: activeLayers,
      ensureSource: ensureSource,
      ensureLayer: ensureLayer,
      ensureImage: ensureImage,
      buildLayerDataUrl: buildLayerDataUrl,
      applyLayerZoomBounds: applyLayerZoomBounds,
      getInsertBeforeId: getCatalogInsertBeforeId,
      getMapIconHaloPaint: getMapIconHaloPaint,
      resolveLayerIcon:
        iconsRegistry && typeof iconsRegistry.resolveLayerIcon === "function"
          ? iconsRegistry.resolveLayerIcon.bind(iconsRegistry)
          : null,
      toast: function (msg, level) {
        if (typeof window.centroToast === "function") window.centroToast(msg, level);
      },
      warn: console.warn.bind(console),
    };
  }

  async function addLayerToMap(cfg) {
    var fn = getCentroMapHelper("addCatalogLayerToMap");
    if (typeof fn !== "function") {
      console.warn("[CENTRO] catalog-layer-controller.js ausente — addLayerToMap indisponível");
      return;
    }
    return fn(cfg, buildCatalogLayerDeps());
  }

  function removeLayerFromMap(id) {
    var fn = getCentroMapHelper("removeCatalogLayerFromMap");
    if (typeof fn !== "function") {
      console.warn("[CENTRO] catalog-layer-controller.js ausente — removeLayerFromMap indisponível");
      return;
    }
    return fn(id, buildCatalogLayerDeps());
  }

  function getLockToastMessage(layerId) {
    var lockMsgFn = getSidebarLayerStateHelper("getLockMessage");
    var state = resolveSidebarLockState(layerId);
    if (typeof lockMsgFn === "function") return lockMsgFn(state, "toast");
    return !isLayerUnlocked(layerId)
      ? "Camada bloqueada. Registre a pista no Caderno do Arquivista (Arquivo Morto)."
      : "Camada bloqueada. Avance uma fase no Protocolo (mínima: " + getMinPhaseLabel(layerId) + ").";
  }


  function setupCentroUiFromModules() {
    var ui = window.CENTRO && window.CENTRO.ui;
    if (ui && typeof ui.setupToast === "function") {
      ui.setupToast();
    }
    if (ui && typeof ui.setupLazyImageObserver === "function") {
      ui.setupLazyImageObserver();
    }
    if (ui && typeof ui.enhanceSidebarVizCards === "function") {
      ui.enhanceSidebarVizCards();
    }
  }

  function ensureArgResyncApi() {
    if (!argResyncApi && window.CENTRO && window.CENTRO.argResync) {
      argResyncApi = window.CENTRO.argResync.create({
        loadSidebar: loadSidebarData,
        ensurePoiFilterApi: ensurePoiFilterApi,
        ensureBuildings3dApi: ensureBuildings3dApi,
        ensureSubterraneanApi: ensureSubterraneanApi,
        syncTriangulo: syncTrianguloHistoricoOverlay,
        getMap: function () {
          return map;
        },
        mapReadyPromise: mapReadyPromise,
      });
    }
    return argResyncApi;
  }

  function setupArgStateListener() {
    var api = ensureArgResyncApi();
    if (api && typeof api.install === "function") api.install();
  }

  function setupMissionsOrchestrator() {
    if (missionsOrchestratorInstalled) return;
    var orch = window.CENTRO && window.CENTRO.missionsOrchestrator;
    if (orch && typeof orch.install === "function") {
      orch.install();
      missionsOrchestratorInstalled = true;
    }
  }

  function bootstrap() {
    function startCentro() {
      setupCentroUiFromModules();
      setupMissionsOrchestrator();
      setupArgStateListener();

      var master = window.CENTRO && window.CENTRO.masterMode;
      if (master && typeof master.install === "function") {
        master.install({ mapReadyPromise: mapReadyPromise });
      }

      var chrome = ensureCentroChromeApi();
      if (chrome && typeof chrome.install === "function") chrome.install();
      setupBuildings3DToggle();
      setupSubterraneanToggle();
      setupStreetNamesDev();
      setupInvestigationRay();
      setupPoiThemeFilter();
      loadSidebarData();
      initMap();
    }

    var gate = window.CENTRO && window.CENTRO.accessGate;
    if (gate && typeof gate.install === "function") {
      gate.install(startCentro);
      return;
    }
    startCentro();
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.applyBasemapOnlyView = applyBasemapOnlyView;
  window.CENTRO.runMapBootPolicy = runMapBootPolicy;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
