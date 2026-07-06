/**
 * alma-12 — Comissão (Fase 12)
 * Missões narrativas desta alma. Gates técnicos em phase-gates.json.
 */
(function () {
  "use strict";

  var ID = "alma-12";
  var PHASE = 12;

  function create(ctx) {
    ctx = ctx || {};
    return {
      id: ID,
      phase: PHASE,
      title: "Comissão",
      kicker: "Décima Segunda Alma",
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
