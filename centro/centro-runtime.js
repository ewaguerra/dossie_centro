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

  // OpenFreeMap (https://openfreemap.org) — vector tiles + glyphs + sprite
  // gratuitos, sem chave de API. liberty = basemap claro + layer building-3d
  // (maquete estrutural). Alternativas: bright | positron | dark-matter.
  var BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
  var BASEMAP_GROUND_COLOR = "#f8f4f0";

  // Fonte para labels POI: precisa existir no fontstack do basemap. Noto
  // Sans Regular é o default da OpenFreeMap. Implementação em poi-bootstrap.js.
  // Localização PT-BR para tooltips de controles MapLibre.
  var MAPLIBRE_LOCALE_PT_BR = {
    "AttributionControl.ToggleAttribution": "Alternar atribuição",
    "AttributionControl.MapFeedback": "Comentários sobre o mapa",
    "FullscreenControl.Enter": "Entrar em tela cheia",
    "FullscreenControl.Exit": "Sair da tela cheia",
    "GeolocateControl.FindMyLocation": "Mostrar minha localização",
    "GeolocateControl.LocationNotAvailable": "Localização indisponível",
    "LogoControl.Title": "Logotipo MapLibre",
    "Map.Title": "Mapa",
    "NavigationControl.ResetBearing": "Recentralizar bússola",
    "NavigationControl.ZoomIn": "Aproximar zoom",
    "NavigationControl.ZoomOut": "Afastar zoom",
    "ScaleControl.Feet": "pés",
    "ScaleControl.Meters": "m",
    "ScaleControl.Kilometers": "km",
    "ScaleControl.Miles": "mi",
    "ScaleControl.NauticalMiles": "nm",
    "TerrainControl.Enable": "Ativar terreno",
    "TerrainControl.Disable": "Desativar terreno",
    "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para ampliar o mapa",
    "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para ampliar o mapa",
    "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
  };

  // Habilita o debug-inspector apenas quando o usuário pediu explicitamente
  // (?debug=1 ou localStorage.centroDebug=1). Mantém produção limpa.
  var DEBUG_INSPECTOR = (function () {
    try {
      if (/[?&]debug=1\b/.test(window.location.search)) return true;
      if (window.localStorage && window.localStorage.getItem("centroDebug") === "1") return true;
    } catch (_e) {
      // localStorage indisponível em alguns contextos — ignora.
    }
    return false;
  })();

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

  // Hash routing pode ignorar center/zoom do constructor; revalida contra maxBounds.
  function clampViewToCentroBounds(mapInstance) {
    if (!mapInstance || typeof maplibregl === "undefined") return;
    var bounds = maplibregl.LngLatBounds.convert(CENTRO_MAX_BOUNDS);
    var center = mapInstance.getCenter();
    var zoom = mapInstance.getZoom();
    var outOfBounds = !bounds.contains(center);
    var clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    if (outOfBounds || clampedZoom !== zoom) {
      mapInstance.jumpTo({
        center: outOfBounds ? CENTRO_CENTER : center,
        zoom: outOfBounds ? 14 : clampedZoom,
      });
    }
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

  function showInspector(feature) {
    var panel = document.getElementById("inspector");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "inspector";
      panel.className = "card card--inspector card--static debug-inspector";
      document.body.appendChild(panel);
    }
    var props = feature.properties || {};
    panel.innerHTML = "";
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "debug-inspector__close btn btn--bare btn--icon-sm";
    closeBtn.setAttribute("aria-label", "Fechar inspector de debug");
    closeBtn.textContent = "\u00d7";
    closeBtn.addEventListener("click", function () {
      panel.remove();
    });
    var body = document.createElement("pre");
    body.className = "debug-inspector__body";
    body.textContent = JSON.stringify(props, null, 2);
    panel.appendChild(closeBtn);
    panel.appendChild(body);
  }

  var buildings3dApi = null;
  var poiFilterApi = null;
  var subterraneanApi = null;
  var poiBootstrapApi = null;
  var trianguloOverlayApi = null;
  var sidebarOrchestratorApi = null;
  var argResyncApi = null;
  var centroChromeApi = null;

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
    var api = ensurePoiFilterApi();
    if (api) api.applyAll();
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

  function ensureMapGroundReadable() {
    if (!map || !map.getLayer) return;
    try {
      if (map.getLayer("background")) {
        map.setPaintProperty("background", "background-color", BASEMAP_GROUND_COLOR);
      }
    } catch (_e) {
      // Estilo ainda carregando ou layer ausente — ignora.
    }
    if (typeof map.setLight === "function") {
      map.setLight({
        anchor: "viewport",
        color: "#ffffff",
        intensity: 0.45,
        position: [1.15, 210, 30],
      });
    }
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

  function initMap() {
    map = new maplibregl.Map({
      container: "map",
      style: BASEMAP_STYLE,
      center: CENTRO_CENTER,
      zoom: 14,
      hash: true,
      maxBounds: CENTRO_MAX_BOUNDS,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      locale: MAPLIBRE_LOCALE_PT_BR,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl(), "bottom-left");

    map.on("error", function (e) {
      var err = e && e.error;
      if (err && (err.status === 404 || err.status === 0)) return;
      console.warn("[CENTRO] MapLibre error:", err || e);
    });

    // Ícones do sprite do OpenFreeMap (recycling, office, bicycle_parking …)
    // que não estão carregados no contexto do projecto. Substitui por pixel
    // transparente para silenciar o flood de avisos no console.
    map.on("styleimagemissing", function (e) {
      if (!map.hasImage(e.id)) {
        map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });

    map.on("load", async function () {
      clampViewToCentroBounds(map);
      ensureMapGroundReadable();
      console.log("[CENTRO] Mapa carregado com layout original");

      await syncTrianguloHistoricoOverlay();

      var poiBoot = ensurePoiBootstrapApi();
      if (poiBoot) {
        await poiBoot.bootMapLayers(map, {
          onPistasLoaded: function () {
            var pistasApi = window.CENTRO && window.CENTRO.pistas;
            if (pistasApi && typeof pistasApi.setupPistasRsbToggle === "function") {
              pistasApi.setupPistasRsbToggle(function () {
                return map;
              });
            }
            applyAllPoiThemeFilters();
          },
          onPistasError: function () {
            applyAllPoiThemeFilters();
          },
        });
      } else {
        console.warn("[CENTRO] poi-bootstrap.js ausente — POI/pistas ignorados");
        applyAllPoiThemeFilters();
      }

      // Inspector é uma ferramenta de DEBUG.
      // para ativar use ?debug=1 ou localStorage.centroDebug=1.
      // Escopa a query às layers conhecidas (POIs + catálogo ativo) para
      // não varrer o style todo a cada clique.
      if (DEBUG_INSPECTOR) {
        map.on("click", function (e) {
          var diagnosticLayers = poiInteractionLayerIds.concat(
            Array.from(activeLayers).map(function (id) {
              return map.getLayer(id + "-fill") ? id + "-fill" : id;
            })
          );
          var queryOpts = diagnosticLayers.length ? { layers: diagnosticLayers } : undefined;
          var features = map.queryRenderedFeatures(e.point, queryOpts);
          if (!features || features.length === 0) return;
          showInspector(features[0]);
        });
        console.log("[CENTRO] Debug inspector ativo (?debug=1)");
      }

      var chrome = ensureCentroChromeApi();
      if (chrome && typeof chrome.wireSidebarMobileButtons === "function") {
        chrome.wireSidebarMobileButtons();
      }

      if (mapReadyResolve) mapReadyResolve();

      initBuildings3DState();
      initSubterraneanState();
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
        addLayerToMap: addLayerToMap,
        removeLayerFromMap: removeLayerFromMap,
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
      ? "Camada bloqueada. Registre pistas no Caderno do Arquivista (Arquivo Morto)."
      : "Camada bloqueada. Avance de fase no ARG (fase mínima " + getMinPhaseLabel(layerId) + ").";
  }


  function setupCentroUiFromModules() {
    var ui = window.CENTRO && window.CENTRO.ui;
    if (ui && typeof ui.setupToast === "function") {
      ui.setupToast();
    }
    if (ui && typeof ui.setupLazyImageObserver === "function") {
      ui.setupLazyImageObserver();
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
      });
    }
    return argResyncApi;
  }

  function setupArgStateListener() {
    var api = ensureArgResyncApi();
    if (api && typeof api.install === "function") api.install();
  }

  function bootstrap() {
    var chrome = ensureCentroChromeApi();
    if (chrome && typeof chrome.install === "function") chrome.install();
    setupBuildings3DToggle();
    setupSubterraneanToggle();
    setupPoiThemeFilter();
    setupCentroUiFromModules();
    setupArgStateListener();
    loadSidebarData();
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
