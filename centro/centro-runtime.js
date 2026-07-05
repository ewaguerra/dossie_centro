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
  // Sans Regular é o default da OpenFreeMap.
  var POI_TEXT_FONT = ["Noto Sans Regular"];

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
  var catalogPromise = null;
  var catalogIndex = null;

  // Maquete 3D — fill-extrusion nativa do estilo OpenFreeMap liberty.
  var BUILDINGS_3D_LAYER_ID = "building-3d";
  var CADERNO_STORAGE_KEY = "protocolo13_caderno_clues";

  // Fallback por categoria quando MAPA_SP_ICONS não carregou (404 / ordem de script).
  var POI_FALLBACK_ICON_BY_ID = {
    "memoria-paulistana": "icon-memoria.svg",
    "acervo-tombado": "icon-acervo.svg",
    "bem-arqueologico": "icon-arqueologia.svg",
    monumentos: "icon-monumentos.svg",
    "poi-turistico": "icon-turismo.svg",
  };

  // Regras de desbloqueio sidebar ← Caderno do Arquivista (layer-unlocks.json).
  var layerUnlockRules = null;

  // Promise resolvida quando o mapa dispara 'load' — permite encadear
  // ativações de camadas sem polling do DOM.
  var mapReadyResolve = null;
  var mapReadyPromise = new Promise(function (resolve) {
    mapReadyResolve = resolve;
  });

  function setupHamburgerMenu() {
    var btn = document.getElementById("hamburger-btn");
    var dd = document.getElementById("hamburger-dropdown");
    if (!btn || !dd) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      dd.style.display = dd.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", function () {
      dd.style.display = "none";
    });
    dd.addEventListener("click", function (e) {
      e.stopPropagation();
    });
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

  // Camadas temáticas da sidebar ficam abaixo dos símbolos POI/pistas.
  function getCatalogInsertBeforeId() {
    if (!map) return undefined;
    for (var i = 0; i < poiInteractionLayerIds.length; i++) {
      var layerId = poiInteractionLayerIds[i];
      if (map.getLayer(layerId)) return layerId;
    }
    return undefined;
  }

  function resolvePatrimonioIconPath(poiId) {
    var iconsRegistry = window.MAPA_SP_ICONS;
    if (iconsRegistry && typeof iconsRegistry.resolvePatrimonio === "function") {
      var resolved = iconsRegistry.resolvePatrimonio(poiId);
      if (resolved) return resolved;
    }
    var stem = POI_FALLBACK_ICON_BY_ID[poiId] || "icon-memoria.svg";
    return "/centro/assets/icons/" + stem;
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

  function styleSupportsTextLabels(mapInstance) {
    var style = mapInstance.getStyle && mapInstance.getStyle();
    return !!(style && style.glyphs);
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

  function getMapIconHaloPaint() {
    var iconsRegistry = window.MAPA_SP_ICONS;
    var paper = (iconsRegistry && iconsRegistry.settings && iconsRegistry.settings.paper) || "#fdfbf7";
    return {
      "icon-halo-color": paper,
      "icon-halo-width": 2,
      "icon-halo-blur": 0.5,
    };
  }

  async function addPOILayer(mapInstance, cfg) {
    var sourceId = cfg.sourceId;
    var iconLayerId = cfg.iconLayerId;
    var labelLayerId = cfg.labelLayerId;
    var imageId = cfg.imageId;
    var dataPath = cfg.dataPath;
    var titleProp = cfg.titleProp;
    var descProp = cfg.descProp;
    var addrProp = cfg.addrProp;
    var iconPath = cfg.iconPath;
    var layerFile = cfg.layerFile;

    var addSymbol = getCentroMapHelper("addSymbolPopupLayer");
    if (typeof addSymbol !== "function") {
      console.warn("[CENTRO] symbol-popup-layer.js ausente — addPOILayer abortado");
      return;
    }

    var labelConfig = null;
    if (titleProp && styleSupportsTextLabels(mapInstance)) {
      labelConfig = {
        layerId: labelLayerId,
        enabled: true,
        layout: {
          "text-field": ["get", titleProp],
          "text-font": POI_TEXT_FONT,
          "text-size": 10,
          "text-offset": [0, 2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#1a1a1a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
          "text-halo-blur": 0.5,
        },
      };
    }

    var sourceData = dataPath;
    if (layerFile) {
      var fetchLayer = getCentroMapHelper("fetchLayerGeojson");
      if (typeof fetchLayer !== "function") {
        throw new Error(
          "[CENTRO] fetchLayerGeojson ausente — não é possível carregar " + layerFile
        );
      }
      sourceData = await fetchLayer(layerFile);
    }

    return addSymbol(mapInstance, {
      sourceId: sourceId,
      iconLayerId: iconLayerId,
      source: { type: "geojson", data: sourceData },
      imageId: imageId,
      iconPath: iconPath,
      iconLayout: {
        "icon-image": imageId,
        "icon-size": 0.82,
        "icon-allow-overlap": true,
        "icon-anchor": "center",
      },
      iconPaint: getMapIconHaloPaint(),
      label: labelConfig,
      popup: {
        factoryKey: "createPoiPopupNode",
        buildArgs: function (properties) {
          var name = titleProp ? properties[titleProp] || "POI" : "POI";
          var secondary = descProp
            ? properties[descProp] || ""
            : addrProp
              ? properties[addrProp] || ""
              : "";
          return [name, secondary];
        },
        popupOptions: {},
      },
      interactionLayerIds: poiInteractionLayerIds,
      onGuardFail: function () {
        console.warn("[CENTRO] addPOILayer: sourceId ou iconLayerId ausente (cache stale?) — sourceId=" + sourceId + " iconLayerId=" + iconLayerId + " dataPath=" + dataPath);
      },
    });
  }

  function pistaItemFromProperties(properties) {
    if (!properties) return null;
    return {
      title: properties.title || "Pista",
      description: properties.description || "",
      image: properties.image || "",
      sourceUrl: properties.sourceUrl || "",
    };
  }

  async function addPistasLayer(mapInstance, items) {
    var pistasCfg = window.CENTRO && window.CENTRO.pistas && window.CENTRO.pistas.CONFIG;
    var iconsRegistry = window.MAPA_SP_ICONS;
    var sourceId = (pistasCfg && pistasCfg.sourceId) || "rsb-pistas-source";
    var iconLayerId = (pistasCfg && pistasCfg.iconLayerId) || "rsb-pistas-icon";
    var iconPath =
      iconsRegistry && typeof iconsRegistry.resolvePistasIcon === "function"
        ? iconsRegistry.resolvePistasIcon()
        : "/centro/assets/icons/icon-pista.svg";
    var imageId = "rsb-pista-icon";
    var features = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item.lngLat || !Array.isArray(item.lngLat) || item.lngLat.length < 2) continue;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: item.lngLat },
        properties: {
          id: item.id || "",
          title: item.title || "",
          description: item.description || "",
          image: item.image || "",
          sourceUrl: item.sourceUrl || "",
        },
      });
    }

    var addSymbol = getCentroMapHelper("addSymbolPopupLayer");
    if (typeof addSymbol !== "function") {
      console.warn("[CENTRO] symbol-popup-layer.js ausente — addPistasLayer abortado");
      return 0;
    }

    return addSymbol(mapInstance, {
      sourceId: sourceId,
      iconLayerId: iconLayerId,
      source: {
        type: "geojson",
        data: { type: "FeatureCollection", features: features },
      },
      imageId: imageId,
      iconPath: iconPath,
      iconLayout: {
        "icon-image": imageId,
        "icon-size": 0.82,
        "icon-allow-overlap": true,
        "icon-anchor": "center",
      },
      iconPaint: getMapIconHaloPaint(),
      label: null,
      popup: {
        factoryKey: "createPistaPopupNode",
        buildArgs: function (properties) {
          return [pistaItemFromProperties(properties)];
        },
        guard: function (properties) {
          return pistaItemFromProperties(properties) !== null;
        },
        popupOptions: { offset: 25, maxWidth: "300px" },
      },
      interactionLayerIds: poiInteractionLayerIds,
      returnFeatureCount: true,
    });
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

  async function addTrianguloHistoricoOverlay() {
    if (!map) return;
    var th = window.CENTRO && window.CENTRO.trianguloHistorico;
    if (!th || typeof th.buildTrianguloHistoricoGeojson !== "function") return;
    var cfg = th.CONFIG;
    if (!cfg || map.getSource(cfg.sourceId)) return;

    try {
      var feature = await th.buildTrianguloHistoricoGeojson();
      var feat =
        feature && feature.type === "Feature"
          ? feature
          : {
              type: "Feature",
              properties: (feature && feature.properties) || { name: cfg.label },
              geometry: feature && feature.geometry,
            };
      ensureSource(map, cfg.sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [feat] },
      });
      ensureLayer(
        map,
        {
          id: cfg.fillLayerId,
          type: "fill",
          source: cfg.sourceId,
          paint: {
            "fill-color": cfg.fillColor,
            "fill-opacity": cfg.fillOpacity,
          },
        },
        getCatalogInsertBeforeId()
      );
      ensureLayer(
        map,
        {
          id: cfg.outlineLayerId,
          type: "line",
          source: cfg.sourceId,
          paint: {
            "line-color": cfg.outlineColor,
            "line-width": cfg.outlineWidth,
          },
        },
        getCatalogInsertBeforeId()
      );
    } catch (e) {
      console.warn("[CENTRO] Triângulo histórico indisponível:", e);
    }
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

      await addTrianguloHistoricoOverlay();

      var poi = window.CENTRO && window.CENTRO.poiIcons;
      if (poi) {
        // IDs explícitos para não depender da estrutura cacheada do poi-icons.js.
        // Fallback para os valores definidos em poi-icons.js se o objeto estiver disponível.
        var poiConfigs = [
          {
            id: "memoria-paulistana",
            layerFile: "data/context/centro_memoria_paulistana__point.geojson",
            sourceId:    (poi.MEMORIA_PAULISTANA_LAYERS && poi.MEMORIA_PAULISTANA_LAYERS.sourceId)    || "memoria-paulistana-source",
            iconLayerId: (poi.MEMORIA_PAULISTANA_LAYERS && poi.MEMORIA_PAULISTANA_LAYERS.iconLayerId) || "memoria-paulistana-icon",
            titleProp: "nm_titulo_placa", descProp: "dc_enunciado_placa", addrProp: "nm_endereco_placa",
          },
          {
            id: "acervo-tombado",
            layerFile: "data/context/centro_acervo_tombado__point.geojson",
            sourceId:    (poi.ACERVO_TOMBADO_LAYERS && poi.ACERVO_TOMBADO_LAYERS.sourceId)    || "acervo-tombado-source",
            iconLayerId: (poi.ACERVO_TOMBADO_LAYERS && poi.ACERVO_TOMBADO_LAYERS.iconLayerId) || "acervo-tombado-icon",
            titleProp: "nm_acervo",
          },
          {
            id: "bem-arqueologico",
            layerFile: "data/context/centro_bem_arqueologico__point.geojson",
            sourceId:    (poi.BEM_ARQUEOLOGICO_LAYERS && poi.BEM_ARQUEOLOGICO_LAYERS.sourceId)    || "bem-arqueologico-source",
            iconLayerId: (poi.BEM_ARQUEOLOGICO_LAYERS && poi.BEM_ARQUEOLOGICO_LAYERS.iconLayerId) || "bem-arqueologico-icon",
          },
          {
            id: "monumentos",
            layerFile: "data/context/centro_monumentos__point.geojson",
            sourceId:    (poi.MONUMENTOS_LAYERS && poi.MONUMENTOS_LAYERS.sourceId)    || "monumentos-source",
            iconLayerId: (poi.MONUMENTOS_LAYERS && poi.MONUMENTOS_LAYERS.iconLayerId) || "monumentos-icon",
            titleProp: "nm_obra",
          },
          {
            id: "poi-turistico",
            layerFile: poi.POI_TURISTICO_LAYER_FILE,
            sourceId:    (poi.POI_TURISTICO_LAYERS && poi.POI_TURISTICO_LAYERS.sourceId)    || "poi-turistico-source",
            iconLayerId: (poi.POI_TURISTICO_LAYERS && poi.POI_TURISTICO_LAYERS.iconLayerId) || "poi-turistico-icon",
            titleProp: "name", descProp: "category",
          },
        ];
        for (var poiIndex = 0; poiIndex < poiConfigs.length; poiIndex++) {
          var poiCfg = poiConfigs[poiIndex];
          var iconPath = resolvePatrimonioIconPath(poiCfg.id);
          var poiLayerArgs = {
            sourceId: poiCfg.sourceId,
            iconLayerId: poiCfg.iconLayerId,
            labelLayerId: poiCfg.id + "-label",
            imageId: poiCfg.id + "-pin",
            iconPath: iconPath,
            titleProp: poiCfg.titleProp,
            descProp: poiCfg.descProp,
            addrProp: poiCfg.addrProp,
          };
          if (poiCfg.id === "poi-turistico") {
            poiLayerArgs.layerFile = poiCfg.layerFile;
          } else {
            poiLayerArgs.dataPath = buildLayerDataUrl({ file: poiCfg.layerFile });
          }
          try {
            await addPOILayer(map, poiLayerArgs);
          } catch (e) {
            console.warn("[CENTRO] Erro POI layer", poiCfg.iconLayerId, e.message);
            if (typeof window.centroToast === "function") {
              window.centroToast("Erro ao carregar camada POI: " + poiCfg.iconLayerId, "warn");
            }
          }
        }
        console.log("[CENTRO] 5 POI layers adicionados (fluxo único)");
      } else {
        console.warn("[CENTRO] CENTRO.poiIcons nao disponivel — POI layers ignorados");
      }

      fetch("/centro/assets/pistas/rua-sao-bento-pistas.json")
        .then(function (r) {
          return r.json();
        })
        .then(async function (items) {
          try {
            var count = await addPistasLayer(map, items);
            console.log("[CENTRO] " + count + " pistas adicionadas (symbol layer)");
          } catch (e) {
            console.warn("[CENTRO] Erro ao carregar pistas:", e);
          }
          applyAllPoiThemeFilters();
        })
        .catch(function (e) {
          console.warn("[CENTRO] Erro ao carregar pistas:", e);
          applyAllPoiThemeFilters();
        });

      // Inspector é uma ferramenta de DEBUG. Em produção fica desabilitado;
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

      var closeBtn = document.getElementById("sidebar-close-btn");
      var openBtn = document.getElementById("sidebar-open-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          setSidebarCollapsed(true);
        });
      }
      if (openBtn) {
        openBtn.addEventListener("click", function () {
          setSidebarCollapsed(false);
        });
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

  // Carrega o catálogo (layers.json + groups.json) uma única vez e
  // indexa por id. Toda interação subsequente da sidebar usa o cache.
  function loadCatalog() {
    if (!catalogPromise) {
      var loader = window.CENTRO && window.CENTRO.catalogLoad;
      if (!loader || typeof loader.loadCatalog !== "function") {
        catalogPromise = Promise.reject(new Error("CENTRO.catalogLoad indisponível"));
        return catalogPromise;
      }
      catalogPromise = loader.loadCatalog().then(function (data) {
        layerUnlockRules = data.layerUnlockRules;
        catalogIndex = data.catalogIndex;
        return {
          layers: data.layers,
          groups: data.groups,
        };
      });
    }
    return catalogPromise;
  }

  // Constrói o DOM da sidebar a partir do catálogo. Usa createElement +
  // textContent para evitar interpolação de strings em innerHTML.
  function renderSidebarPanel(panel, groupsList, layersList) {
    var fn = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.renderSidebarPanel;
    if (typeof fn !== "function") {
      console.warn("[CENTRO] sidebar-panel.js ausente — renderSidebarPanel indisponível");
      return;
    }
    var rowClassFn = getSidebarLayerStateHelper("getLayerRowClass");
    var lockMsgFn = getSidebarLayerStateHelper("getLockMessage");
    fn({
      panel: panel,
      groups: groupsList,
      layers: layersList,
      resolveSidebarLockState: resolveSidebarLockState,
      getLayerRowClass: typeof rowClassFn === "function" ? rowClassFn : null,
      getLockMessage: typeof lockMsgFn === "function" ? lockMsgFn : null,
      getMinPhaseLabel: getMinPhaseLabel,
    });
  }

  function loadSidebarData() {
    var statusEl = document.getElementById("sidebar-status");
    var panel = document.getElementById("layers-panel");
    if (!panel) return;

    var phaseApi = window.CENTRO && window.CENTRO.protocoloPhase;
    var gatesPromise =
      phaseApi && typeof phaseApi.loadPhaseGates === "function"
        ? phaseApi.loadPhaseGates()
        : Promise.resolve();

    Promise.all([loadCatalog(), gatesPromise])
      .then(function (results) {
        var data = results[0];
        if (phaseApi && typeof phaseApi.maybeAdvancePhaseFromClues === "function") {
          phaseApi.maybeAdvancePhaseFromClues();
        }
        if (statusEl) statusEl.style.display = "none";
        renderSidebarPanel(panel, data.groups, data.layers);
        wireLayerCheckboxes(panel);
        if (phaseApi && typeof phaseApi.updatePhaseBadge === "function") {
          phaseApi.updatePhaseBadge();
        }
        var phaseNum = phaseApi && typeof phaseApi.getPhase === "function" ? phaseApi.getPhase() : 1;
        console.log(
          "[CENTRO] Sidebar carregada:",
          data.groups.length,
          "grupos,",
          data.layers.length,
          "camadas (fase ARG",
          phaseNum,
          "/",
          phaseApi && phaseApi.MAX_PHASE ? phaseApi.MAX_PHASE : 13,
          ")"
        );
      })
      .catch(function (e) {
        console.error("[CENTRO] Erro ao carregar sidebar:", e);
        if (statusEl) statusEl.textContent = "Erro ao carregar dados: " + e.message;
        if (typeof window.centroToast === "function") {
          window.centroToast("Erro ao carregar camadas: " + e.message, "error");
        }
      });
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

  // Conecta os checkboxes ao mapa. Substitui o polling com setInterval
  // anterior: agora é chamado uma única vez logo após o render da sidebar,
  // e cada mudança consulta o catálogo já indexado em memória.
  function wireLayerCheckboxes(panel) {
    var fn = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.wireLayerCheckboxes;
    if (typeof fn !== "function") {
      console.warn("[CENTRO] sidebar-events.js ausente — wireLayerCheckboxes indisponível");
      return;
    }
    fn(panel, {
      hasCatalog: function () {
        return !!catalogIndex;
      },
      getLayerConfig: function (layerId) {
        return catalogIndex ? catalogIndex.get(layerId) : null;
      },
      isLayerAccessible: isLayerAccessible,
      getLockToastMessage: getLockToastMessage,
      whenMapReady: function (cb) {
        return mapReadyPromise.then(cb);
      },
      addLayerToMap: addLayerToMap,
      removeLayerFromMap: removeLayerFromMap,
      toast: function (msg, level) {
        if (typeof window.centroToast === "function") {
          window.centroToast(msg, level);
        }
      },
    });
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

  function setSidebarCollapsed(collapsed) {
    var sb = document.getElementById("panel");
    var btn = document.getElementById("sidebar-toggle");
    var openBtn = document.getElementById("sidebar-open-btn");
    if (!sb) return;
    sb.classList.remove("collapsed");
    if (collapsed) {
      sb.classList.add("sidebar--collapsed");
    } else {
      sb.classList.remove("sidebar--collapsed");
    }
    if (openBtn) openBtn.hidden = !collapsed;
    if (btn) {
      btn.classList.toggle("open", collapsed);
      btn.innerHTML = collapsed
        ? "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>"
        : "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"15 18 9 12 15 6\"/></svg>";
    }
  }

  function toggleSidebar() {
    var sb = document.getElementById("panel");
    if (!sb) return;
    setSidebarCollapsed(!sb.classList.contains("sidebar--collapsed"));
  }

  function activateSidebarTab(targetTabId) {
    var tabs = document.querySelectorAll(".sidebar-tab[role='tab']");
    tabs.forEach(function (tab) {
      var active = tab.id === targetTabId;
      tab.setAttribute("aria-selected", active ? "true" : "false");
      var panelId = tab.getAttribute("aria-controls");
      var panel = panelId ? document.getElementById(panelId) : null;
      if (panel) panel.hidden = !active;
    });
  }

  function setupSidebarTabs() {
    var tabs = Array.prototype.slice.call(
      document.querySelectorAll(".sidebar-tab[role='tab']")
    );
    if (!tabs.length) return;

    function focusTabAt(index) {
      var tab = tabs[index];
      if (!tab) return;
      tab.focus();
      activateSidebarTab(tab.id);
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activateSidebarTab(tab.id);
      });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateSidebarTab(tab.id);
          return;
        }
        var next = index;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          next = (index + 1) % tabs.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          next = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === "Home") {
          e.preventDefault();
          next = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          next = tabs.length - 1;
        } else {
          return;
        }
        focusTabAt(next);
      });
    });
    var defaultTab = document.getElementById("sidebar-tab-camadas");
    if (defaultTab) activateSidebarTab(defaultTab.id);
  }

  function setupSidebarToggle() {
    var btn = document.getElementById("sidebar-toggle");
    if (btn) {
      btn.addEventListener("click", toggleSidebar);
    }
  }

  function setupNarrativeNav() {
    document.querySelectorAll("#narrative-nav .nav-btn[data-nav-lng]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        flyToLocation(
          parseFloat(btn.dataset.navLng),
          parseFloat(btn.dataset.navLat),
          parseFloat(btn.dataset.navZoom),
          parseFloat(btn.dataset.navPitch)
        );
      });
    });
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function (e) {
      if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey) {
        toggleSidebar();
      }
    });
  }

  function setupSubterraneanFlyButtons() {
    var FLY_BTN_IDS = ["subterranean-fly-btn", "subterranean-fly-sidebar-btn"];
    FLY_BTN_IDS.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        mapReadyPromise.then(function () { subterraneanFlyToView(); });
      });
    });

    function syncFlyBtn() {
      var sidebarBtn = document.getElementById("subterranean-fly-sidebar-btn");
      if (!sidebarBtn) return;
      var cb = document.getElementById("centro-subterranean-toggle");
      sidebarBtn.hidden = !(cb && cb.checked);
    }

    function attachFlySync() {
      var cb = document.getElementById("centro-subterranean-toggle");
      if (!cb || cb.dataset.centroFlySync) return;
      cb.dataset.centroFlySync = "1";
      cb.addEventListener("change", syncFlyBtn);
    }

    syncFlyBtn();
    var cutaway = window.CENTRO && window.CENTRO.subterraneanCutaway;
    if (cutaway && cutaway.ready) {
      attachFlySync();
    } else {
      document.addEventListener("centro:subterranean-ready", function onReady() {
        document.removeEventListener("centro:subterranean-ready", onReady);
        attachFlySync();
        syncFlyBtn();
      });
    }
  }

  function setupSubterraneanGuide() {
    var GUIDE_KEY = "centroSubterraneanGuideDismissed";
    var guide    = document.getElementById("subterranean-guide");
    var closeBtn = document.getElementById("subterranean-guide-close");
    var masterLink = document.getElementById("subterranean-master-link");
    if (masterLink) {
      var params = new URLSearchParams(window.location.search);
      params.set("master", "1");
      masterLink.href = "?" + params.toString();
    }
    if (!guide || !closeBtn) return;
    try {
      if (window.localStorage && window.localStorage.getItem(GUIDE_KEY) === "1") {
        guide.hidden = true;
        return;
      }
    } catch (_e) { /* ignora */ }
    guide.hidden = false;
    closeBtn.addEventListener("click", function () {
      guide.hidden = true;
      try { if (window.localStorage) window.localStorage.setItem(GUIDE_KEY, "1"); } catch (_e) { /* ignora */ }
    });
  }

  function setupArgStateListener() {
    document.addEventListener("centro:arg-state-changed", function () {
      loadSidebarData();
    });
    window.addEventListener("storage", function (e) {
      if (!e.key) return;
      if (e.key === "protocolo13_caderno_clues" || e.key === "protocolo13_phase") {
        loadSidebarData();
      }
    });
  }

  function bootstrap() {
    setupHamburgerMenu();
    setupSidebarTabs();
    setupSidebarToggle();
    setupBuildings3DToggle();
    setupSubterraneanToggle();
    setupSubterraneanFlyButtons();
    setupPoiThemeFilter();
    setupNarrativeNav();
    setupCentroUiFromModules();
    setupKeyboardShortcuts();
    setupSubterraneanGuide();
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
