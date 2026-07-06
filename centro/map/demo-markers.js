/**
 * Marcadores do capítulo demo no mapa (pistas ARG Demonão / Titília).
 */
(function () {
  "use strict";

  var MARKERS_URL = "/centro/data/demo/demonao-titilia-markers.geojson";
  var SOURCE_ID = "demo-demonao-source";
  var ICON_LAYER_ID = "demo-demonao-icon";
  var DEFAULT_IMAGE_ID = "demo-pin--default";
  var VISIBILITY_KEY = "centroDemoMarkersVisible";

  var bootPromise = null;
  var markersData = null;
  var mapRef = null;

  function getDemoChapter() {
    return window.CENTRO && window.CENTRO.demoChapter;
  }

  async function ensureChapterLoaded() {
    var demo = getDemoChapter();
    if (!demo || typeof demo.loadChapter !== "function") return;
    await demo.loadChapter();
  }

  function getIconsRegistry() {
    return window.MAPA_SP_ICONS;
  }

  function getDemoMarkerIds() {
    var demo = getIconsRegistry() && getIconsRegistry().demo;
    if (!demo || !demo.markers) return [];
    return Object.keys(demo.markers);
  }

  async function ensureDemoImages(mapInstance) {
    var ensureImage = window.CENTRO && window.CENTRO.map && window.CENTRO.map.ensureImage;
    var icons = getIconsRegistry();
    if (typeof ensureImage !== "function" || !icons) return;

    var demo = icons.demo;
    if (demo && demo.file) {
      await ensureImage(mapInstance, DEFAULT_IMAGE_ID, icons.getIconPath(demo.file));
    }

    var markerIds = getDemoMarkerIds();
    for (var i = 0; i < markerIds.length; i++) {
      var markerId = markerIds[i];
      var imageId =
        typeof icons.getDemoMarkerImageId === "function"
          ? icons.getDemoMarkerImageId(markerId)
          : "demo-pin--" + markerId;
      var iconPath =
        typeof icons.resolveDemoMarkerIcon === "function"
          ? icons.resolveDemoMarkerIcon(markerId)
          : icons.getIconPath("icon-demo");
      await ensureImage(mapInstance, imageId, iconPath);
    }
  }

  function buildIconImageLayout() {
    var icons = getIconsRegistry();
    if (icons && typeof icons.buildDemoIconImageMatch === "function") {
      return icons.buildDemoIconImageMatch();
    }
    return DEFAULT_IMAGE_ID;
  }

  function isVisiblePref() {
    try {
      return window.localStorage && window.localStorage.getItem(VISIBILITY_KEY) !== "0";
    } catch (_e) {
      return true;
    }
  }

  function setVisiblePref(visible) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(VISIBILITY_KEY, visible ? "1" : "0");
      }
    } catch (_e) {
      /* ignora */
    }
  }

  function filterVisibleFeatures(geojson) {
    var demo = getDemoChapter();
    if (!demo || typeof demo.isMarkerVisible !== "function") return geojson;
    var features = (geojson.features || []).filter(function (feat) {
      var markerId = feat.properties && feat.properties.markerId;
      return demo.isMarkerVisible(markerId);
    });
    return {
      type: "FeatureCollection",
      features: features,
    };
  }

  function getDemoIconHaloPaint() {
    var icons = getIconsRegistry();
    var paper = (icons && icons.settings && icons.settings.paper) || "#fdfbf7";
    return {
      "icon-halo-color": paper,
      "icon-halo-width": 2,
      "icon-halo-blur": 0.35,
    };
  }

  async function bootDemoMarkers(mapInstance) {
    if (!mapInstance) return;
    if (bootPromise) return bootPromise;

    bootPromise = (async function () {
      var addSymbol = window.CENTRO && window.CENTRO.map && window.CENTRO.map.addSymbolPopupLayer;
      if (typeof addSymbol !== "function") {
        console.warn("[CENTRO] demo-markers: addSymbolPopupLayer ausente");
        return;
      }

      mapRef = mapInstance;
      await ensureChapterLoaded();

      var response = await fetch(MARKERS_URL);
      if (!response.ok) throw new Error("demo markers geojson");
      markersData = await response.json();

      await ensureDemoImages(mapInstance);

      var wikiImages = window.CENTRO && window.CENTRO.poiWikipediaImages;
      if (wikiImages && typeof wikiImages.load === "function") {
        try {
          await wikiImages.load();
        } catch (_e) {
          /* manifest opcional */
        }
      }

      await addSymbol(mapInstance, {
        sourceId: SOURCE_ID,
        iconLayerId: ICON_LAYER_ID,
        source: { type: "geojson", data: filterVisibleFeatures(markersData) },
        imageId: DEFAULT_IMAGE_ID,
        iconPath:
          getIconsRegistry() && typeof getIconsRegistry().getIconPath === "function"
            ? getIconsRegistry().getIconPath("icon-demo")
            : "/centro/assets/icons/icon-demo.svg",
        skipBaseImage: true,
        iconLayout: {
          "icon-image": buildIconImageLayout(),
          "icon-size": 0.92,
          "icon-allow-overlap": false,
          "icon-anchor": "bottom",
          "icon-padding": 2,
        },
        iconPaint: getDemoIconHaloPaint(),
        popup: {
          factoryKey: "createPoiPopupNode",
          buildArgs: function (properties) {
            var meta = {
              title: properties.title || "Pista Demo",
              secondary: properties.description || "",
              themeId: "demo",
            };
            if (wikiImages && typeof wikiImages.applyWikiFields === "function") {
              wikiImages.applyWikiFields(meta, "demo", properties);
            }
            return [meta];
          },
          popupOptions: { maxWidth: "340px", offset: 22, className: "evidence-popup demo-popup" },
        },
        interactionLayerIds: [ICON_LAYER_ID],
      });

      syncVisibility(mapInstance);
      document.addEventListener("centro:demo-progress-changed", function () {
        refreshSourceData(mapRef || mapInstance);
      });
      document.addEventListener("centro:demo-markers-reveal-changed", function () {
        refreshSourceData(mapRef || mapInstance);
      });
    })().catch(function (e) {
      bootPromise = null;
      console.warn("[CENTRO] demo-markers:", e.message);
    });

    return bootPromise;
  }

  async function refreshSourceData(mapInstance) {
    if (!mapInstance || !markersData) return;
    await ensureChapterLoaded();
    var filtered = filterVisibleFeatures(markersData);
    var source = mapInstance.getSource(SOURCE_ID);
    if (source && typeof source.setData === "function") {
      source.setData(filtered);
    } else {
      var ensureSource = window.CENTRO && window.CENTRO.map && window.CENTRO.map.ensureSource;
      if (typeof ensureSource !== "function") return;
      ensureSource(mapInstance, SOURCE_ID, {
        type: "geojson",
        data: filtered,
      });
    }
    syncVisibility(mapInstance);
  }

  function syncVisibility(mapInstance) {
    if (!mapInstance || !mapInstance.getLayer(ICON_LAYER_ID)) return;
    var show = isVisiblePref();
    mapInstance.setLayoutProperty(ICON_LAYER_ID, "visibility", show ? "visible" : "none");
  }

  function setMarkersVisible(mapInstance, visible) {
    setVisiblePref(visible);
    syncVisibility(mapInstance);
  }

  function getMapRef() {
    return mapRef;
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.demoMarkers = {
    bootDemoMarkers: bootDemoMarkers,
    refreshSourceData: refreshSourceData,
    setMarkersVisible: setMarkersVisible,
    isVisiblePref: isVisiblePref,
    getMapRef: getMapRef,
    SOURCE_ID: SOURCE_ID,
    ICON_LAYER_ID: ICON_LAYER_ID,
  };
})();
