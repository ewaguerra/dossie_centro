/**
 * Fases ARG — schema localStorage protocolo13_phase (roadmap 1/13).
 */
(function () {
  "use strict";

  var PHASE_STORAGE_KEY = "protocolo13_phase";
  var MAX_PHASE = 13;

  function getPhase() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(PHASE_STORAGE_KEY);
      var n = parseInt(raw, 10);
      if (!isFinite(n) || n < 1) return 1;
      if (n > MAX_PHASE) return MAX_PHASE;
      return n;
    } catch (_e) {
      return 1;
    }
  }

  function setPhase(n) {
    try {
      var v = Math.max(1, Math.min(MAX_PHASE, parseInt(n, 10) || 1));
      window.localStorage.setItem(PHASE_STORAGE_KEY, String(v));
      return v;
    } catch (_e) {
      return 1;
    }
  }

  function ensureDefaultPhase() {
    try {
      if (!window.localStorage.getItem(PHASE_STORAGE_KEY)) {
        window.localStorage.setItem(PHASE_STORAGE_KEY, "1");
      }
    } catch (_e) {
      // ignora
    }
  }

  ensureDefaultPhase();

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.protocoloPhase = {
    PHASE_STORAGE_KEY: PHASE_STORAGE_KEY,
    MAX_PHASE: MAX_PHASE,
    getPhase: getPhase,
    setPhase: setPhase,
    ensureDefaultPhase: ensureDefaultPhase,
  };
})();
