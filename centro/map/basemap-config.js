/**
 * Resolução do estilo basemap — produção (Vercel) usa JSON local + proxy same-origin.
 * Dev local (localhost) usa OpenFreeMap directo por defeito.
 */
(function () {
  "use strict";

  var BASEMAP_GROUND_COLOR = "#f8f4f0";
  var STYLE_ONLINE = "https://tiles.openfreemap.org/styles/liberty";
  var STYLE_LOCAL = "/centro/assets/basemap/liberty.json";

  function isLocalDevHost() {
    var host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  }

  function resolveBasemapStyle() {
    try {
      var params = new URLSearchParams(window.location.search);
      var mode = (params.get("basemap") || "").toLowerCase();
      if (mode === "online") return STYLE_ONLINE;
      if (mode === "local" || mode === "proxied") return STYLE_LOCAL;
    } catch (_e) {
      // URLSearchParams indisponível — segue heurística de host.
    }
    return isLocalDevHost() ? STYLE_ONLINE : STYLE_LOCAL;
  }

  function absolutizeBasemapUrl(path) {
    if (!path || typeof path !== "string") return path;
    if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) return path;
    if (path.charAt(0) === "/") return window.location.origin + path;
    return path;
  }

  function absolutizeStyleResourceUrls(style) {
    if (style.sprite) style.sprite = absolutizeBasemapUrl(style.sprite);
    if (style.glyphs) style.glyphs = absolutizeBasemapUrl(style.glyphs);
    var sources = style.sources;
    if (!sources) return style;
    Object.keys(sources).forEach(function (sourceId) {
      var src = sources[sourceId];
      if (!src) return;
      if (src.url) src.url = absolutizeBasemapUrl(src.url);
      if (Array.isArray(src.tiles)) {
        src.tiles = src.tiles.map(absolutizeBasemapUrl);
      }
    });
    return style;
  }

  function inlineTileJsonSources(style) {
    var sources = style.sources;
    if (!sources) return Promise.resolve(style);
    var jobs = Object.keys(sources).map(function (sourceId) {
      var src = sources[sourceId];
      if (!src || !src.url || Array.isArray(src.tiles)) return Promise.resolve();
      var tileJsonUrl = src.url;
      return fetch(tileJsonUrl)
        .then(function (res) {
          if (!res.ok) throw new Error("TileJSON " + tileJsonUrl + " -> " + res.status);
          return res.json();
        })
        .then(function (tileJson) {
          delete src.url;
          Object.keys(tileJson).forEach(function (key) {
            if (key === "tiles" && Array.isArray(tileJson.tiles)) {
              src.tiles = tileJson.tiles.map(absolutizeBasemapUrl);
              return;
            }
            if (!(key in src)) src[key] = tileJson[key];
          });
        });
    });
    return Promise.all(jobs).then(function () {
      return style;
    });
  }

  /**
   * MapLibre GL JS 5 exige URLs absolutas para Request() — paths /basemap/ falham na Vercel.
   * Retorna URL (online) ou objeto StyleSpecification (local, URLs absolutizadas + TileJSON inline).
   */
  function prepareBasemapStyle() {
    var styleRef = resolveBasemapStyle();
    if (styleRef === STYLE_ONLINE || styleRef.indexOf("http") === 0) {
      return Promise.resolve(styleRef);
    }
    return fetch(absolutizeBasemapUrl(styleRef))
      .then(function (res) {
        if (!res.ok) throw new Error("Style " + styleRef + " -> " + res.status);
        return res.json();
      })
      .then(function (style) {
        return inlineTileJsonSources(style).then(function (resolved) {
          return absolutizeStyleResourceUrls(resolved);
        });
      })
      .catch(function (err) {
        console.warn("[CENTRO] Falha ao preparar basemap local — fallback online:", err);
        return STYLE_ONLINE;
      });
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.BASEMAP_GROUND_COLOR = BASEMAP_GROUND_COLOR;
  window.CENTRO.map.STYLE_ONLINE = STYLE_ONLINE;
  window.CENTRO.map.STYLE_LOCAL = STYLE_LOCAL;
  window.CENTRO.map.resolveBasemapStyle = resolveBasemapStyle;
  window.CENTRO.map.prepareBasemapStyle = prepareBasemapStyle;
  window.CENTRO.map.absolutizeBasemapUrl = absolutizeBasemapUrl;
})();
