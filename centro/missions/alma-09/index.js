/**
 * alma-09 — Malha urbana (Fase 9)
 * Missões narrativas desta alma. Gates técnicos em phase-gates.json.
 */
(function () {
  "use strict";

  var ID = "alma-09";
  var PHASE = 9;

  function create(ctx) {
    ctx = ctx || {};
    return {
      id: ID,
      phase: PHASE,
      title: "Malha urbana",
      kicker: "Nona Alma",
      missions: [
        {
          id: "malha-osm",
          title: "Activar Malha de Circulação (Vias) e ler nomes actuais",
          complete: false,
        },
      ],
      isComplete: function () {
        return false;
      },
      onActivate: function () {
        if (ctx.flyToPreset && typeof ctx.flyToPreset === "function") {
          ctx.flyToPreset("geral");
        }
      },
      onResync: function () {},
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missions = window.CENTRO.missions || {};
  window.CENTRO.missions[ID] = { create: create, phase: PHASE };
})();
