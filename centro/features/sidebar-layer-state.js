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
      phaseSoulLabel: opts.phaseSoulLabel || "",
    };
  }

  function getLayerRowClass(state) {
    var rowClass = "layer-row";
    if (state.locked) rowClass += " layer-row--locked";
    if (state.clueLocked) rowClass += " layer-row--clue-locked";
    if (state.phaseLocked) rowClass += " layer-row--phase-locked";
    return rowClass;
  }

  function getLockMessage(state, kind) {
    if (kind === "sidebar-hint") {
      return state.clueLocked
        ? " (bloqueada — pista pendente no Caderno)"
        : " (bloqueada — " + (state.phaseSoulLabel || "Fase " + state.minPhaseLabel) + ")";
    }
    if (kind === "sidebar-meta") {
      return state.clueLocked
        ? "Pista pendente no Caderno"
        : state.phaseSoulLabel || "Liberação na Fase " + state.minPhaseLabel;
    }
    if (kind === "toast") {
      return state.clueLocked
        ? "Camada bloqueada. Registre a pista no Caderno do Arquivista (Arquivo Morto)."
        : "Camada bloqueada. " +
            (state.phaseSoulLabel || "Avance até a Fase " + state.minPhaseLabel + ".");
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
