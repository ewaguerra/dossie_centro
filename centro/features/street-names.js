/**
 * Nomes de ruas — modo dev/ARG, resolução de labels e gates de fase.
 */
(function () {
  "use strict";

  var DEV_SHOW_ALL = true;
  var STORAGE_KEY = "centroStreetNameMode";
  var DEV_STORAGE_KEY = "centroStreetNamesDev";
  var DEBUG_STORAGE_KEY = "centroDebug";

  var MODES = Object.freeze({
    atual: "atual",
    historico: "historico",
    all: "all",
  });

  var resolvedQueryMode = null;

  function readQueryMode() {
    if (resolvedQueryMode !== null) return resolvedQueryMode;
    resolvedQueryMode = "";
    try {
      var params = new URLSearchParams(window.location.search);
      var raw = (params.get("streetnames") || "").toLowerCase();
      if (raw === "all" || raw === "atual" || raw === "historico") {
        resolvedQueryMode = raw;
      }
    } catch (_e) {
      resolvedQueryMode = "";
    }
    return resolvedQueryMode;
  }

  function isMasterMode() {
    var mm = window.CENTRO && window.CENTRO.masterMode;
    return !!(mm && typeof mm.isActive === "function" && mm.isActive());
  }

  function isDebugActive() {
    try {
      if (readQueryMode()) return true;
      if (window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1") return true;
      var params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "1") return true;
    } catch (_e) {
      // ignora
    }
    return false;
  }

  function isDevBypassActive() {
    if (DEV_SHOW_ALL) return true;
    if (isMasterMode()) return true;
    if (isDebugActive()) return true;
    try {
      if (window.localStorage.getItem(DEV_STORAGE_KEY) === "1") return true;
    } catch (_e2) {
      // ignora
    }
    return false;
  }

  function getMode() {
    var query = readQueryMode();
    if (query) return query;
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === MODES.atual || stored === MODES.historico || stored === MODES.all) {
        return stored;
      }
    } catch (_e) {
      // ignora
    }
    return isDevBypassActive() ? MODES.all : MODES.atual;
  }

  function setMode(mode) {
    var next = mode === MODES.historico || mode === MODES.atual ? mode : MODES.all;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_e) {
      // ignora
    }
    dispatchChanged();
    return next;
  }

  function setDevEnabled(enabled) {
    try {
      window.localStorage.setItem(DEV_STORAGE_KEY, enabled ? "1" : "0");
    } catch (_e) {
      // ignora
    }
    dispatchChanged();
  }

  function isDevEnabled() {
    return isDevBypassActive();
  }

  function dispatchChanged() {
    try {
      document.dispatchEvent(new CustomEvent("centro:street-names-changed"));
    } catch (_e) {
      // ignora
    }
  }

  function isFeatureUnlocked(featureId, minPhaseFallback) {
    if (isDevBypassActive()) return true;
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.isFeaturePhaseUnlocked === "function") {
      return ph.isFeaturePhaseUnlocked(featureId);
    }
    if (ph && typeof ph.isPhaseAtLeast === "function") {
      return ph.isPhaseAtLeast(minPhaseFallback);
    }
    return false;
  }

  function shouldShowAtualLabels() {
    var mode = getMode();
    if (mode === MODES.historico) return false;
    if (isDevBypassActive()) return true;
    return isFeatureUnlocked("street-names-atual", 9);
  }

  function shouldShowHistoricoLabels() {
    var mode = getMode();
    if (mode === MODES.atual) return false;
    if (isDevBypassActive()) return true;
    return isFeatureUnlocked("street-names-historico", 11);
  }

  function syncPhaseGate(mapInstance) {
    var overlay = window.CENTRO && window.CENTRO.streetLabelsOverlay;
    if (overlay && typeof overlay.syncVisibility === "function") {
      overlay.syncVisibility(mapInstance);
    }
  }

  function syncDevCardVisibility() {
    var card = document.getElementById("centro-street-names-dev-card");
    if (!card) return;
    card.hidden = !isDevBypassActive() && !isDebugActive() && !isMasterMode();
  }

  function setupDevUi(getMap) {
    syncDevCardVisibility();
    var toggle = document.getElementById("centro-street-names-dev-toggle");
    var modeSelect = document.getElementById("centro-street-names-mode");
    if (toggle) {
      toggle.checked = isDevEnabled();
      toggle.addEventListener("change", function () {
        setDevEnabled(toggle.checked);
        syncVisibilityForMap(getMap);
      });
    }
    if (modeSelect) {
      modeSelect.value = getMode();
      modeSelect.addEventListener("change", function () {
        setMode(modeSelect.value);
        syncVisibilityForMap(getMap);
      });
    }
    document.addEventListener("centro:arg-state-changed", syncDevCardVisibility);
  }

  function syncVisibilityForMap(getMap) {
    var mapInstance = typeof getMap === "function" ? getMap() : null;
    syncPhaseGate(mapInstance);
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.streetNames = {
    DEV_SHOW_ALL: DEV_SHOW_ALL,
    STORAGE_KEY: STORAGE_KEY,
    DEV_STORAGE_KEY: DEV_STORAGE_KEY,
    MODES: MODES,
    getMode: getMode,
    setMode: setMode,
    setDevEnabled: setDevEnabled,
    isDevEnabled: isDevEnabled,
    isDevBypassActive: isDevBypassActive,
    shouldShowAtualLabels: shouldShowAtualLabels,
    shouldShowHistoricoLabels: shouldShowHistoricoLabels,
    syncPhaseGate: syncPhaseGate,
    setupDevUi: setupDevUi,
    syncDevCardVisibility: syncDevCardVisibility,
  };
})();
