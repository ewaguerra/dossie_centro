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

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.BASEMAP_GROUND_COLOR = BASEMAP_GROUND_COLOR;
  window.CENTRO.map.STYLE_ONLINE = STYLE_ONLINE;
  window.CENTRO.map.STYLE_LOCAL = STYLE_LOCAL;
  window.CENTRO.map.resolveBasemapStyle = resolveBasemapStyle;
})();
