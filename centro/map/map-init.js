/**
 * Inicialização MapLibre e sequência map.on("load") (R6 — extraído de centro-runtime.js).
 */
(function () {
  "use strict";

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

  function isDebugInspectorEnabled() {
    try {
      if (/[?&]debug=1\b/.test(window.location.search)) return true;
      if (window.localStorage && window.localStorage.getItem("centroDebug") === "1") return true;
    } catch (_e) {
      // localStorage indisponível em alguns contextos — ignora.
    }
    return false;
  }

  function create(ctx) {
    ctx = ctx || {};

    function clampViewToCentroBounds(mapInstance) {
      if (!mapInstance || typeof maplibregl === "undefined") return;
      var maxBounds = ctx.maxBounds;
      var center = ctx.center;
      var minZoom = ctx.minZoom != null ? ctx.minZoom : 13;
      var maxZoom = ctx.maxZoom != null ? ctx.maxZoom : 17;
      if (!maxBounds || !center) return;
      var bounds = maplibregl.LngLatBounds.convert(maxBounds);
      var mapCenter = mapInstance.getCenter();
      var zoom = mapInstance.getZoom();
      var outOfBounds = !bounds.contains(mapCenter);
      var clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
      if (outOfBounds || clampedZoom !== zoom) {
        mapInstance.jumpTo({
          center: outOfBounds ? center : mapCenter,
          zoom: outOfBounds ? 14 : clampedZoom,
        });
      }
    }

    function ensureMapGroundReadable(mapInstance) {
      var groundColor = ctx.groundColor || "#f8f4f0";
      if (!mapInstance || !mapInstance.getLayer) return;
      try {
        if (mapInstance.getLayer("background")) {
          mapInstance.setPaintProperty("background", "background-color", groundColor);
        }
      } catch (_e) {
        // Estilo ainda carregando ou layer ausente — ignora.
      }
      if (typeof mapInstance.setLight === "function") {
        mapInstance.setLight({
          anchor: "viewport",
          color: "#ffffff",
          intensity: 0.45,
          position: [1.15, 210, 30],
        });
      }
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

    function init() {
      if (typeof maplibregl === "undefined") {
        console.warn("[CENTRO] maplibre-gl.js ausente — mapa não inicializado");
        return null;
      }

      var mapInstance = new maplibregl.Map({
        container: "map",
        style: ctx.basemapStyle,
        center: ctx.center,
        zoom: 14,
        hash: true,
        maxBounds: ctx.maxBounds,
        minZoom: ctx.minZoom,
        maxZoom: ctx.maxZoom,
        locale: MAPLIBRE_LOCALE_PT_BR,
        attributionControl: { compact: true },
      });
      mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");
      mapInstance.addControl(new maplibregl.ScaleControl(), "bottom-left");

      if (typeof ctx.onMapCreated === "function") {
        ctx.onMapCreated(mapInstance);
      }

      mapInstance.on("error", function (e) {
        var err = e && e.error;
        if (err && (err.status === 404 || err.status === 0)) return;
        console.warn("[CENTRO] MapLibre error:", err || e);
      });

      mapInstance.on("styleimagemissing", function (e) {
        if (!mapInstance.hasImage(e.id)) {
          mapInstance.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      });

      var debugInspector = isDebugInspectorEnabled();

      mapInstance.on("load", async function () {
        clampViewToCentroBounds(mapInstance);
        ensureMapGroundReadable(mapInstance);
        console.log("[CENTRO] Mapa carregado com layout original");

        if (typeof ctx.syncTriangulo === "function") {
          await ctx.syncTriangulo(mapInstance);
        }

        var poiHooks = {
          onPistasLoaded:
            typeof ctx.onPistasLoaded === "function"
              ? function () {
                  ctx.onPistasLoaded(mapInstance);
                }
              : undefined,
          onPistasError:
            typeof ctx.onPistasError === "function"
              ? function () {
                  ctx.onPistasError(mapInstance);
                }
              : undefined,
        };

        if (typeof ctx.bootPoiLayers === "function") {
          await ctx.bootPoiLayers(mapInstance, poiHooks);
        } else if (typeof ctx.applyAllPoiThemeFilters === "function") {
          ctx.applyAllPoiThemeFilters();
        }

        if (debugInspector) {
          mapInstance.on("click", function (e) {
            var poiLayerIds =
              typeof ctx.getPoiInteractionLayerIds === "function"
                ? ctx.getPoiInteractionLayerIds()
                : [];
            var activeLayers =
              typeof ctx.getActiveLayers === "function" ? ctx.getActiveLayers() : null;
            var diagnosticLayers = poiLayerIds.concat(
              activeLayers
                ? Array.from(activeLayers).map(function (id) {
                    return mapInstance.getLayer(id + "-fill") ? id + "-fill" : id;
                  })
                : []
            );
            var queryOpts = diagnosticLayers.length ? { layers: diagnosticLayers } : undefined;
            var features = mapInstance.queryRenderedFeatures(e.point, queryOpts);
            if (!features || features.length === 0) return;
            showInspector(features[0]);
          });
          console.log("[CENTRO] Debug inspector ativo (?debug=1)");
        }

        if (typeof ctx.wireSidebarMobileButtons === "function") {
          ctx.wireSidebarMobileButtons();
        }

        if (typeof ctx.mapReadyResolve === "function") {
          ctx.mapReadyResolve();
        }

        if (typeof ctx.initBuildings3DState === "function") ctx.initBuildings3DState();
        if (typeof ctx.initSubterraneanState === "function") ctx.initSubterraneanState();
      });

      return mapInstance;
    }

    return {
      init: init,
      clampViewToCentroBounds: clampViewToCentroBounds,
      showInspector: showInspector,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.mapInit = { create: create };
})();
