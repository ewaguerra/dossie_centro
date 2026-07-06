/**
 * alma-13 — Permanência (Fase 13)
 * Missões narrativas desta alma. Gates técnicos em phase-gates.json.
 */
(function () {
  "use strict";

  var ID = "alma-13";
  var PHASE = 13;

  function create(ctx) {
    ctx = ctx || {};
    return {
      id: ID,
      phase: PHASE,
      title: "Permanência",
      kicker: "Décima Terceira Alma",
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
