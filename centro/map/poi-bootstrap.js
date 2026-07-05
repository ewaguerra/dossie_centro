/**
 * Boot POI património + pistas RSB no map load (R1 — extraído de centro-runtime.js).
 */
(function () {
  "use strict";

  var POI_TEXT_FONT = ["Noto Sans Regular"];

  var POI_FALLBACK_ICON_BY_ID = {
    "memoria-paulistana": "icon-memoria.svg",
    "acervo-tombado": "icon-acervo.svg",
    "bem-arqueologico": "icon-arqueologia.svg",
    monumentos: "icon-monumentos.svg",
    "poi-turistico": "icon-turismo.svg",
  };

  var PISTAS_JSON_PATH = "/centro/assets/pistas/rua-sao-bento-pistas.json";

  function create(ctx) {
    ctx = ctx || {};
    var getMapHelper =
      typeof ctx.getMapHelper === "function"
        ? ctx.getMapHelper
        : function (name) {
            return window.CENTRO && window.CENTRO.map && window.CENTRO.map[name];
          };
    var buildLayerDataUrl = ctx.buildLayerDataUrl;
    var interactionLayerIds = ctx.poiInteractionLayerIds || [];

    function resolvePatrimonioIconPath(poiId) {
      if (typeof ctx.resolvePatrimonioIconPath === "function") {
        return ctx.resolvePatrimonioIconPath(poiId);
      }
      var iconsRegistry = window.MAPA_SP_ICONS;
      if (iconsRegistry && typeof iconsRegistry.resolvePatrimonio === "function") {
        var resolved = iconsRegistry.resolvePatrimonio(poiId);
        if (resolved) return resolved;
      }
      var stem = POI_FALLBACK_ICON_BY_ID[poiId] || "icon-memoria.svg";
      return "/centro/assets/icons/" + stem;
    }

    function styleSupportsTextLabels(mapInstance) {
      var style = mapInstance.getStyle && mapInstance.getStyle();
      return !!(style && style.glyphs);
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

    function pistaItemFromProperties(properties) {
      if (!properties) return null;
      return {
        title: properties.title || "Pista",
        description: properties.description || "",
        image: properties.image || "",
        sourceUrl: properties.sourceUrl || "",
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

      var addSymbol = getMapHelper("addSymbolPopupLayer");
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
        var fetchLayer = getMapHelper("fetchLayerGeojson");
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
        interactionLayerIds: interactionLayerIds,
        onGuardFail: function () {
          console.warn(
            "[CENTRO] addPOILayer: sourceId ou iconLayerId ausente (cache stale?) — sourceId=" +
              sourceId +
              " iconLayerId=" +
              iconLayerId +
              " dataPath=" +
              dataPath
          );
        },
      });
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

      var addSymbol = getMapHelper("addSymbolPopupLayer");
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
        interactionLayerIds: interactionLayerIds,
        returnFeatureCount: true,
      });
    }

    function buildPoiConfigs(poi) {
      return [
        {
          id: "memoria-paulistana",
          layerFile: "data/context/centro_memoria_paulistana__point.geojson",
          sourceId:
            (poi.MEMORIA_PAULISTANA_LAYERS && poi.MEMORIA_PAULISTANA_LAYERS.sourceId) ||
            "memoria-paulistana-source",
          iconLayerId:
            (poi.MEMORIA_PAULISTANA_LAYERS && poi.MEMORIA_PAULISTANA_LAYERS.iconLayerId) ||
            "memoria-paulistana-icon",
          titleProp: "nm_titulo_placa",
          descProp: "dc_enunciado_placa",
          addrProp: "nm_endereco_placa",
        },
        {
          id: "acervo-tombado",
          layerFile: "data/context/centro_acervo_tombado__point.geojson",
          sourceId:
            (poi.ACERVO_TOMBADO_LAYERS && poi.ACERVO_TOMBADO_LAYERS.sourceId) ||
            "acervo-tombado-source",
          iconLayerId:
            (poi.ACERVO_TOMBADO_LAYERS && poi.ACERVO_TOMBADO_LAYERS.iconLayerId) ||
            "acervo-tombado-icon",
          titleProp: "nm_acervo",
        },
        {
          id: "bem-arqueologico",
          layerFile: "data/context/centro_bem_arqueologico__point.geojson",
          sourceId:
            (poi.BEM_ARQUEOLOGICO_LAYERS && poi.BEM_ARQUEOLOGICO_LAYERS.sourceId) ||
            "bem-arqueologico-source",
          iconLayerId:
            (poi.BEM_ARQUEOLOGICO_LAYERS && poi.BEM_ARQUEOLOGICO_LAYERS.iconLayerId) ||
            "bem-arqueologico-icon",
        },
        {
          id: "monumentos",
          layerFile: "data/context/centro_monumentos__point.geojson",
          sourceId:
            (poi.MONUMENTOS_LAYERS && poi.MONUMENTOS_LAYERS.sourceId) || "monumentos-source",
          iconLayerId:
            (poi.MONUMENTOS_LAYERS && poi.MONUMENTOS_LAYERS.iconLayerId) || "monumentos-icon",
          titleProp: "nm_obra",
        },
        {
          id: "poi-turistico",
          layerFile: poi.POI_TURISTICO_LAYER_FILE,
          sourceId:
            (poi.POI_TURISTICO_LAYERS && poi.POI_TURISTICO_LAYERS.sourceId) ||
            "poi-turistico-source",
          iconLayerId:
            (poi.POI_TURISTICO_LAYERS && poi.POI_TURISTICO_LAYERS.iconLayerId) ||
            "poi-turistico-icon",
          titleProp: "name",
          descProp: "category",
        },
      ];
    }

    async function bootMapLayers(mapInstance, hooks) {
      hooks = hooks || {};
      var poi = window.CENTRO && window.CENTRO.poiIcons;
      if (!poi) {
        console.warn("[CENTRO] CENTRO.poiIcons nao disponivel — POI layers ignorados");
        return;
      }

      if (typeof buildLayerDataUrl !== "function") {
        console.warn("[CENTRO] buildLayerDataUrl ausente — POI layers ignorados");
        return;
      }

      var poiConfigs = buildPoiConfigs(poi);
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
          await addPOILayer(mapInstance, poiLayerArgs);
        } catch (e) {
          console.warn("[CENTRO] Erro POI layer", poiCfg.iconLayerId, e.message);
          if (typeof window.centroToast === "function") {
            window.centroToast("Erro ao carregar camada POI: " + poiCfg.iconLayerId, "warn");
          }
        }
      }
      console.log("[CENTRO] 5 POI layers adicionados (fluxo único)");

      try {
        var response = await fetch(PISTAS_JSON_PATH);
        var items = await response.json();
        var count = await addPistasLayer(mapInstance, items);
        console.log("[CENTRO] " + count + " pistas adicionadas (symbol layer)");
        if (typeof hooks.onPistasLoaded === "function") {
          hooks.onPistasLoaded(mapInstance, count);
        }
      } catch (e) {
        console.warn("[CENTRO] Erro ao carregar pistas:", e);
        if (typeof hooks.onPistasError === "function") {
          hooks.onPistasError(e);
        }
      }
    }

    return {
      addPOILayer: addPOILayer,
      addPistasLayer: addPistasLayer,
      bootMapLayers: bootMapLayers,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.poiBootstrap = { create: create };
})();
