/**
 * Modo mestre / revisão — desbloqueia tudo para inspecionar o mapa.
 * Activar: ?master=1 na URL (persiste centroMaster=1).
 */
(function () {
  "use strict";

  var MASTER_STORAGE_KEY = "centroMaster";
  var CADERNO_STORAGE_KEY = "protocolo13_caderno_clues";

  var EXTRA_CLUES = ["agua-calada", "peso-fundacao", "guardiao-tampa", "aresta-fria"];

  function isActive() {
    try {
      if (/[?&]master=1\b/.test(window.location.search)) return true;
      return window.localStorage && window.localStorage.getItem(MASTER_STORAGE_KEY) === "1";
    } catch (_e) {
      return false;
    }
  }

  function persistMasterFlag() {
    try {
      if (/[?&]master=1\b/.test(window.location.search) && window.localStorage) {
        window.localStorage.setItem(MASTER_STORAGE_KEY, "1");
      }
    } catch (_e) {
      // ignora
    }
  }

  function mergeClueIds(extraIds) {
    var set = new Set();
    var lu = window.CENTRO && window.CENTRO.layerUnlocks;
    if (lu && typeof lu.getCollectedClueIds === "function") {
      lu.getCollectedClueIds().forEach(function (id) {
        set.add(id);
      });
    }
    for (var i = 0; i < extraIds.length; i++) set.add(extraIds[i]);
    try {
      if (window.localStorage) {
        window.localStorage.setItem(CADERNO_STORAGE_KEY, JSON.stringify(Array.from(set)));
      }
    } catch (_e) {
      // ignora
    }
  }

  function injectAllClues() {
    mergeClueIds(EXTRA_CLUES);
  }

  function bootstrapReviewUnlocks() {
    if (!isActive()) return;
    persistMasterFlag();
    injectAllClues();
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.setPhase === "function") {
      ph.setPhase(ph.MAX_PHASE || 13);
    }
    try {
      document.dispatchEvent(new CustomEvent("centro:arg-state-changed"));
    } catch (_e) {
      // ignora
    }
    if (typeof window.centroToast === "function") {
      window.centroToast("Modo revisão: todas as camadas e evidências desbloqueadas.", "info");
    }
  }

  function activateAllSidebarLayers(panel, whenMapReady) {
    if (!isActive() || !panel || typeof whenMapReady !== "function") return;
    whenMapReady(function () {
      var checkboxes = panel.querySelectorAll('input[type="checkbox"][data-layer-id]');
      for (var i = 0; i < checkboxes.length; i++) {
        var cb = checkboxes[i];
        cb.disabled = false;
        cb.closest(".layer-row") &&
          cb.closest(".layer-row").classList.remove(
            "layer-row--locked",
            "layer-row--clue-locked",
            "layer-row--phase-locked"
          );
        if (!cb.checked) cb.checked = true;
      }
      for (var j = 0; j < checkboxes.length; j++) {
        if (checkboxes[j].checked) {
          checkboxes[j].dispatchEvent(new Event("change"));
        }
      }
    });
  }

  function enablePistasRsb() {
    if (!isActive()) return;
    var toggle = document.getElementById("centro-pistas-rsb-toggle");
    var pistas = window.CENTRO && window.CENTRO.pistas;
    if (!toggle || !pistas) return;
    toggle.disabled = false;
    toggle.checked = true;
    try {
      if (window.localStorage) window.localStorage.setItem("centroPistasRsbVisible", "1");
    } catch (_e) {
      // ignora
    }
    if (typeof pistas.syncPhaseGate === "function") pistas.syncPhaseGate();
  }

  function enableBuildings3d(ctx) {
    if (!isActive() || !ctx) return;
    var api =
      typeof ctx.ensureBuildings3dApi === "function" ? ctx.ensureBuildings3dApi() : null;
    if (!api || typeof api.setEnabled !== "function") return;
    if (typeof ctx.mapReadyPromise !== "undefined" && ctx.mapReadyPromise) {
      ctx.mapReadyPromise.then(function () {
        api.setEnabled(true, { persist: true, silent: true });
        if (typeof api.syncToggleUI === "function") api.syncToggleUI(true);
      });
    }
  }

  function enableSubterranean(ctx) {
    if (!isActive() || !ctx) return;
    var api =
      typeof ctx.ensureSubterraneanApi === "function" ? ctx.ensureSubterraneanApi() : null;
    if (!api || typeof api.setEnabled !== "function") return;
    var run = function () {
      api.setEnabled(true, { persist: true, silent: true, noFly: true });
    };
    if (ctx.mapReadyPromise && typeof ctx.mapReadyPromise.then === "function") {
      ctx.mapReadyPromise.then(run);
    } else {
      run();
    }
  }

  function openPoiLegend() {
    if (!isActive()) return;
    var details = document.getElementById("poi-legend-details");
    if (details) details.open = true;
  }

  function syncReviewConsumers(ctx) {
    if (!isActive()) return;
    // Modo mestre desbloqueia fases/pistas (bootstrapReviewUnlocks), mas não liga
    // camadas no mapa — o operador marca manualmente na sidebar.
  }

  function install(ctx) {
    ctx = ctx || {};
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    var boot = function () {
      bootstrapReviewUnlocks();
    };
    if (ph && typeof ph.loadPhaseGates === "function") {
      ph.loadPhaseGates().then(boot);
    } else if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.masterMode = {
    MASTER_STORAGE_KEY: MASTER_STORAGE_KEY,
    isActive: isActive,
    bootstrapReviewUnlocks: bootstrapReviewUnlocks,
    activateAllSidebarLayers: activateAllSidebarLayers,
    syncReviewConsumers: syncReviewConsumers,
    install: install,
  };
})();
