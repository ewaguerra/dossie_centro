/**
 * alma-01 — Superfície (Fase 1)
 * Missões narrativas desta alma. Gates técnicos em phase-gates.json.
 */
(function () {
  "use strict";

  var ID = "alma-01";
  var PHASE = 1;

  function create(ctx) {
    ctx = ctx || {};
    return {
      id: ID,
      phase: PHASE,
      title: "Superfície",
      kicker: "Primeira Alma",
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
