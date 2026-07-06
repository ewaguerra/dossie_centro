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
    "linha-tempo": "icon-linha-tempo.svg",
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

    function getClassifier() {
      return window.CENTRO && window.CENTRO.poiEraClassifier;
    }

    function themeUsesEraIconImages(themeId) {
      var classifier = getClassifier();
      return !!(
        themeId &&
        classifier &&
        typeof classifier.themeUsesEraHalo === "function" &&
        classifier.themeUsesEraHalo(themeId)
      );
    }

    function getMapIconHaloPaint(themeId) {
      var iconsRegistry = window.MAPA_SP_ICONS;
      var paper = (iconsRegistry && iconsRegistry.settings && iconsRegistry.settings.paper) || "#fdfbf7";
      if (themeUsesEraIconImages(themeId)) {
        return {
          "icon-halo-color": paper,
          "icon-halo-width": 1.5,
          "icon-halo-blur": 0.25,
        };
      }
      var classifier = getClassifier();
      if (classifier && typeof classifier.buildSubFilterPaint === "function" && themeId) {
        return classifier.buildSubFilterPaint(themeId);
      }
      return {
        "icon-halo-color": paper,
        "icon-halo-width": 2,
        "icon-halo-blur": 0.5,
      };
    }

    function getMapLabelPaint(themeId) {
      var classifier = window.CENTRO && window.CENTRO.poiEraClassifier;
      var base = {
        "text-color": "#1a1a1a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2.5,
        "text-halo-blur": 0.35,
      };
      if (classifier && typeof classifier.buildSubFilterLabelPaint === "function" && themeId) {
        var eraPaint = classifier.buildSubFilterLabelPaint(themeId);
        if (eraPaint) return Object.assign(base, eraPaint);
      }
      return base;
    }

    function enrichSourceData(themeId, sourceData) {
      var classifier = window.CENTRO && window.CENTRO.poiEraClassifier;
      if (!classifier || typeof classifier.enrichGeojson !== "function") return sourceData;
      if (typeof sourceData === "string") return sourceData;
      return classifier.enrichGeojson(themeId, sourceData);
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
      var themeId = cfg.themeId;

      var addSymbol = getMapHelper("addSymbolPopupLayer");
      if (typeof addSymbol !== "function") {
        console.warn("[CENTRO] symbol-popup-layer.js ausente — addPOILayer abortado");
        return;
      }

      var labelConfig = null;
      if (titleProp) {
        if (!styleSupportsTextLabels(mapInstance)) {
          console.warn(
            "[CENTRO] Estilo sem glyphs — labels POI podem falhar:",
            labelLayerId
          );
        }
        labelConfig = {
          layerId: labelLayerId,
          enabled: true,
          filter: ["all", ["has", titleProp], ["!=", ["to-string", ["get", titleProp]], ""]],
          layout: {
            "text-field": ["to-string", ["get", titleProp]],
            "text-font": POI_TEXT_FONT,
            "text-size": 12,
            "text-offset": [0, 2.4],
            "text-anchor": "top",
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "text-optional": true,
            "text-max-width": 14,
            "text-padding": 4,
            "text-letter-spacing": 0.02,
            visibility: "none",
          },
          paint: getMapLabelPaint(themeId),
          minzoom: 15,
        };
        if (themeId === "linha-tempo") {
          labelConfig.layout["text-field"] = [
            "case",
            [
              "all",
              ["has", "evidence_year"],
              ["!=", ["to-string", ["get", "evidence_year"]], ""],
            ],
            ["concat", ["to-string", ["get", "evidence_year"]], " · ", ["get", "nm_titulo"]],
            ["get", "nm_titulo"],
          ];
          labelConfig.layout["text-size"] = 11;
          labelConfig.minzoom = 16;
        }
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

      sourceData = enrichSourceData(themeId, sourceData);

      var useEraIconImages = themeUsesEraIconImages(themeId);
      var classifier = getClassifier();
      if (useEraIconImages) {
        var ensureEraIcons = getMapHelper("ensureEraThemedIcons");
        if (typeof ensureEraIcons === "function" && classifier && typeof classifier.getEras === "function") {
          await ensureEraIcons(mapInstance, iconPath, imageId, classifier.getEras());
        }
      }

      var iconImageLayout =
        useEraIconImages &&
        classifier &&
        typeof classifier.buildEraIconImageMatch === "function"
          ? classifier.buildEraIconImageMatch(imageId)
          : imageId;

      var popupConfig =
        themeId === "linha-tempo"
          ? {
              factoryKey: "createTimelinePopupNode",
              buildArgs: function (properties) {
                var seq = properties.sequence || 0;
                var seqTotal = properties.sequence_total || 0;
                var threadHint = "";
                if (seq > 0 && seq < seqTotal) {
                  threadHint = "Fio cronológico continua no próximo marco desta rua.";
                } else if (seqTotal > 1 && seq === seqTotal) {
                  threadHint = "Último marco cronológico deste logradouro.";
                }
                var timelineMeta = {
                  title: properties.nm_titulo || "Evidência",
                  streetDisplay: properties.street_display || "",
                  address: properties.evidence_address || "",
                  detail: properties.evidence_detail || "",
                  year: properties.evidence_year || null,
                  sourceThemeId: properties.source_theme_id || "",
                  sequence: seq,
                  sequenceTotal: seqTotal,
                  threadHint: threadHint,
                  themeId: "linha-tempo",
                  eraId: properties.poi_era || "",
                };
                var wikiImages =
                  window.CENTRO && window.CENTRO.poiWikipediaImages;
                if (wikiImages && typeof wikiImages.applyWikiFields === "function") {
                  wikiImages.applyWikiFields(timelineMeta, "linha-tempo", properties);
                }
                return [timelineMeta];
              },
              popupOptions: { maxWidth: "420px", offset: 24 },
            }
          : {
              factoryKey: "createPoiPopupNode",
              buildArgs: function (properties) {
                var name = titleProp ? properties[titleProp] || "POI" : "POI";
                var secondary = descProp
                  ? properties[descProp] || ""
                  : addrProp
                    ? properties[addrProp] || ""
                    : "";
                var address = addrProp ? properties[addrProp] || "" : "";
                if (descProp && properties[descProp]) {
                  address = addrProp ? properties[addrProp] || "" : "";
                }
                var meta = {
                  title: name,
                  secondary: secondary,
                  address: address,
                  themeId: themeId,
                  eraId: properties.poi_era || properties.poi_typology || "",
                };
                var wikiImages =
                  window.CENTRO && window.CENTRO.poiWikipediaImages;
                if (wikiImages && typeof wikiImages.applyWikiFields === "function") {
                  wikiImages.applyWikiFields(meta, themeId, properties);
                }
                return [meta];
              },
              popupOptions: { maxWidth: "340px", offset: 20 },
            };

      return addSymbol(mapInstance, {
        sourceId: sourceId,
        iconLayerId: iconLayerId,
        source: { type: "geojson", data: sourceData },
        imageId: imageId,
        iconPath: iconPath,
        skipBaseImage: useEraIconImages,
        iconLayout: {
          "icon-image": iconImageLayout,
          "icon-size": 0.82,
          "icon-allow-overlap": false,
          "icon-ignore-placement": false,
          "icon-padding": 2,
          "icon-anchor": "center",
        },
        iconPaint: getMapIconHaloPaint(themeId),
        label: labelConfig,
        popup: popupConfig,
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

    async function addTimelineThreadLayer(mapInstance, poiRegistry) {
      var threadFile = poiRegistry && poiRegistry.LINHA_TEMPO_THREAD_LAYER_FILE;
      var layers = poiRegistry && poiRegistry.LINHA_TEMPO_LAYERS;
      if (!threadFile || !layers) return;

      var fetchLayer = getMapHelper("fetchLayerGeojson");
      var ensureSource = getMapHelper("ensureSource");
      var ensureLayer = getMapHelper("ensureLayer");
      if (typeof fetchLayer !== "function" || typeof ensureSource !== "function") {
        console.warn("[CENTRO] addTimelineThreadLayer: helpers ausentes");
        return;
      }
      if (typeof ensureLayer !== "function") {
        console.warn("[CENTRO] addTimelineThreadLayer: ensureLayer ausente");
        return;
      }

      var lineData = await fetchLayer(threadFile);
      ensureSource(mapInstance, layers.threadSourceId, { type: "geojson", data: lineData });
      ensureLayer(mapInstance, {
        id: layers.threadLayerId,
        type: "line",
        source: layers.threadSourceId,
        layout: { visibility: "none", "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#7c3aed",
          "line-width": 2.5,
          "line-opacity": 0.72,
          "line-dasharray": [1.2, 1.1],
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
          popupOptions: { offset: 25, maxWidth: "340px" },
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
          titleProp: "nm_imovel",
          addrProp: "nm_endereco",
        },
        {
          id: "monumentos",
          layerFile: "data/context/centro_monumentos__point.geojson",
          sourceId:
            (poi.MONUMENTOS_LAYERS && poi.MONUMENTOS_LAYERS.sourceId) || "monumentos-source",
          iconLayerId:
            (poi.MONUMENTOS_LAYERS && poi.MONUMENTOS_LAYERS.iconLayerId) || "monumentos-icon",
          titleProp: "nm_obra",
          addrProp: "dc_localizacao",
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
        {
          id: "linha-tempo",
          layerFile: poi.LINHA_TEMPO_LAYER_FILE,
          sourceId:
            (poi.LINHA_TEMPO_LAYERS && poi.LINHA_TEMPO_LAYERS.sourceId) ||
            "linha-tempo-source",
          iconLayerId:
            (poi.LINHA_TEMPO_LAYERS && poi.LINHA_TEMPO_LAYERS.iconLayerId) ||
            "linha-tempo-icon",
          titleProp: "nm_titulo",
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
      var wikiImages = window.CENTRO && window.CENTRO.poiWikipediaImages;
      if (wikiImages && typeof wikiImages.load === "function") {
        try {
          await wikiImages.load();
        } catch (e) {
          console.warn("[CENTRO] poi-wikipedia-images.json indisponível", e.message);
        }
      }
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
          themeId: poiCfg.id,
        };
        if (poiCfg.id === "poi-turistico") {
          poiLayerArgs.layerFile = poiCfg.layerFile;
        } else {
          poiLayerArgs.layerFile = poiCfg.layerFile;
        }
        try {
          if (poiCfg.id === "linha-tempo") {
            await addTimelineThreadLayer(mapInstance, poi);
          }
          await addPOILayer(mapInstance, poiLayerArgs);
        } catch (e) {
          console.warn("[CENTRO] Erro POI layer", poiCfg.iconLayerId, e.message);
          if (typeof window.centroToast === "function") {
            window.centroToast("Erro ao carregar camada POI: " + poiCfg.iconLayerId, "warn");
          }
        }
      }
      console.log("[CENTRO] " + poiConfigs.length + " POI layers adicionados (fluxo único)");

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

      var demoMarkers = window.CENTRO && window.CENTRO.demoMarkers;
      if (demoMarkers && typeof demoMarkers.bootDemoMarkers === "function") {
        try {
          await demoMarkers.bootDemoMarkers(mapInstance);
        } catch (e) {
          console.warn("[CENTRO] Erro demo markers:", e.message);
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
