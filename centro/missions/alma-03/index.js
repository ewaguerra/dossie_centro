/**
 * alma-03 — Património rígido (Fase 3)
 * Missões narrativas desta alma. Gates técnicos em phase-gates.json.
 */
(function () {
  "use strict";

  var ID = "alma-03";
  var PHASE = 3;

  function create(ctx) {
    ctx = ctx || {};
    return {
      id: ID,
      phase: PHASE,
      title: "Património rígido",
      kicker: "Terceira Alma",
      missions: [],
      isComplete: function () {
        return false;
      },
      onActivate: function () {},
      onResync: function () {},
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missions = window.CENTRO.missions || {};
  window.CENTRO.missions[ID] = { create: create, phase: PHASE };
})();
