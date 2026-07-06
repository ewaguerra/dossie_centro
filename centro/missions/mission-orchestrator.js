/**
 * Orquestrador de missões — activa a alma da fase corrente e re-sincroniza progresso.
 */
(function () {
  "use strict";

  var activeInstance = null;
  var activePhase = null;

  function getPhase() {
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.getPhase === "function") return ph.getPhase();
    return 1;
  }

  function almaIdForPhase(phase) {
    return "alma-" + String(phase).padStart(2, "0");
  }

  function getRegistry() {
    return window.CENTRO && window.CENTRO.missionsRegistry;
  }

  function getLoader() {
    return window.CENTRO && window.CENTRO.missionLoader;
  }

  function ensureMissionsForPhase(phase) {
    var reg = getRegistry();
    var ids = [almaIdForPhase(phase)];
    if (phase >= 7 && ids.indexOf("alma-07") === -1) {
      ids.push("alma-07");
    }
    if (reg && typeof reg.ensureLoaded === "function") {
      return Promise.all(
        ids.map(function (id) {
          return reg.ensureLoaded(id);
        })
      );
    }
    var loader = getLoader();
    if (loader && typeof loader.preloadMissions === "function") {
      return loader.preloadMissions(ids);
    }
    return Promise.resolve();
  }

  function refreshPhasesPanel() {
    var panel = document.getElementById("phases-panel");
    if (!panel || !panel.firstElementChild) return;
    var fn = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.renderPhasesPanel;
    var phaseApi = window.CENTRO && window.CENTRO.protocoloPhase;
    if (typeof fn !== "function") return;
    fn({
      panel: panel,
      getPhase:
        phaseApi && typeof phaseApi.getPhase === "function"
          ? phaseApi.getPhase.bind(phaseApi)
          : null,
      getSoul:
        phaseApi && typeof phaseApi.getSoul === "function"
          ? phaseApi.getSoul.bind(phaseApi)
          : null,
      maxPhase: phaseApi && phaseApi.MAX_PHASE ? phaseApi.MAX_PHASE : 13,
      getPhaseMeta: getPhaseMeta,
    });
  }

  function getPhaseMeta(phaseNum) {
    if (Number(phaseNum) !== 7) return "";
    if (activeInstance && activeInstance.id === "alma-07" && typeof activeInstance.getProgressLabel === "function") {
      return activeInstance.getProgressLabel();
    }
    var reg = getRegistry();
    if (!reg || typeof reg.createSoul !== "function") return "";
    var probe = reg.createSoul("alma-07", {});
    if (probe && typeof probe.getProgressLabel === "function") return probe.getProgressLabel();
    return "";
  }

  function activateForPhase(phase) {
    var reg = getRegistry();
    if (!reg || typeof reg.createSoul !== "function") return;
    activeInstance = reg.createSoul(almaIdForPhase(phase), {});
    activePhase = phase;
    if (activeInstance && typeof activeInstance.onActivate === "function") {
      activeInstance.onActivate();
    }
  }

  function syncMission() {
    var phase = getPhase();
    ensureMissionsForPhase(phase)
      .then(function () {
        if (activePhase !== phase) {
          activateForPhase(phase);
        } else if (activeInstance && typeof activeInstance.onResync === "function") {
          activeInstance.onResync();
        } else {
          activateForPhase(phase);
        }
        refreshPhasesPanel();
      })
      .catch(function (err) {
        console.warn("[CENTRO] Falha ao carregar missão da fase", phase, err);
        refreshPhasesPanel();
      });
  }

  function install() {
    document.addEventListener("centro:arg-state-changed", syncMission);
    document.addEventListener("centro:subterranean-progress", syncMission);
    window.addEventListener("storage", function (e) {
      if (!e.key) return;
      if (
        e.key === "centroSubterraneanUnlockedElements" ||
        e.key === "centroSubterraneanEnabled"
      ) {
        syncMission();
      }
    });

    var phaseApi = window.CENTRO && window.CENTRO.protocoloPhase;
    if (phaseApi && typeof phaseApi.loadPhaseGates === "function") {
      phaseApi.loadPhaseGates().then(syncMission);
    } else {
      syncMission();
    }

    document.addEventListener("centro:subterranean-ready", function onReady() {
      document.removeEventListener("centro:subterranean-ready", onReady);
      syncMission();
    });
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missionsOrchestrator = {
    install: install,
    syncMission: syncMission,
    getActive: function () {
      return activeInstance;
    },
    getPhaseMeta: getPhaseMeta,
  };
})();
