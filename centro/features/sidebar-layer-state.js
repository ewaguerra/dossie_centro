/**
 * Estado puro de lock da sidebar — sem DOM, ARG runtime ou MapLibre.
 */
(function () {
  "use strict";

  function getMinPhaseLabel(minPhase) {
    if (minPhase == null || minPhase === "") return "?";
    return String(minPhase);
  }

  function getLayerLockState(opts) {
    var isClueUnlocked = !!opts.isClueUnlocked;
    var isPhaseUnlocked = opts.isPhaseUnlocked !== false;
    var clueLocked = !isClueUnlocked;
    var phaseLocked = !clueLocked && !isPhaseUnlocked;
    return {
      clueLocked: clueLocked,
      phaseLocked: phaseLocked,
      locked: clueLocked || phaseLocked,
      minPhaseLabel: getMinPhaseLabel(opts.minPhase),
    };
  }

  function getLayerRowClass(state) {
    var rowClass = "layer-row";
    if (state.locked) rowClass += " layer-row--locked";
    if (state.phaseLocked) rowClass += " layer-row--phase-locked";
    return rowClass;
  }

  function getLockMessage(state, kind) {
    if (kind === "sidebar-hint") {
      return state.clueLocked
        ? " (bloqueada — registre pistas no Caderno)"
        : " (bloqueada — avance de fase no ARG)";
    }
    if (kind === "sidebar-meta") {
      return state.phaseLocked ? "fase " + state.minPhaseLabel : "bloqueada";
    }
    if (kind === "toast") {
      return state.clueLocked
        ? "Camada bloqueada. Registre pistas no Caderno do Arquivista (Arquivo Morto)."
        : "Camada bloqueada. Avance de fase no ARG (fase mínima " + state.minPhaseLabel + ").";
    }
    return "";
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.sidebarLayerState = {
    getMinPhaseLabel: getMinPhaseLabel,
    getLayerLockState: getLayerLockState,
    getLayerRowClass: getLayerRowClass,
    getLockMessage: getLockMessage,
  };
})();
