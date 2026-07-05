/**
 * Hub de resync ARG — fase/caderno → consumidores de gates (R4 — extraído de centro-runtime.js).
 */
(function () {
  "use strict";

  var CADERNO_STORAGE_KEY = "protocolo13_caderno_clues";
  var PHASE_STORAGE_KEY = "protocolo13_phase";

  function create(ctx) {
    ctx = ctx || {};

    function resync() {
      if (typeof ctx.loadSidebar === "function") ctx.loadSidebar();

      var poiApi =
        typeof ctx.ensurePoiFilterApi === "function" ? ctx.ensurePoiFilterApi() : null;
      if (poiApi && typeof poiApi.syncPhaseGate === "function") poiApi.syncPhaseGate();
      else if (poiApi && typeof poiApi.applyAll === "function") poiApi.applyAll();

      var b3d =
        typeof ctx.ensureBuildings3dApi === "function" ? ctx.ensureBuildings3dApi() : null;
      if (b3d && typeof b3d.syncPhaseGate === "function") b3d.syncPhaseGate();

      var pistasApi = window.CENTRO && window.CENTRO.pistas;
      if (pistasApi && typeof pistasApi.syncPhaseGate === "function") pistasApi.syncPhaseGate();

      var subApi =
        typeof ctx.ensureSubterraneanApi === "function" ? ctx.ensureSubterraneanApi() : null;
      if (subApi && typeof subApi.syncPhaseGate === "function") subApi.syncPhaseGate();

      if (typeof ctx.syncTriangulo === "function") ctx.syncTriangulo();
    }

    function install() {
      document.addEventListener("centro:arg-state-changed", resync);
      window.addEventListener("storage", function (e) {
        if (!e.key) return;
        if (e.key === CADERNO_STORAGE_KEY || e.key === PHASE_STORAGE_KEY) {
          resync();
        }
      });
    }

    return {
      install: install,
      resync: resync,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.argResync = { create: create };
})();
