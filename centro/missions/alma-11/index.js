/**
 * alma-11 — Triângulo fechado (Fase 11)
 * Missões narrativas desta alma. Gates técnicos em phase-gates.json.
 */
(function () {
  "use strict";

  var ID = "alma-11";
  var PHASE = 11;

  function create(ctx) {
    ctx = ctx || {};
    return {
      id: ID,
      phase: PHASE,
      title: "Triângulo fechado",
      kicker: "Décima Primeira Alma",
      missions: [
        {
          id: "triangulo-fundador",
          title: "Fechar o triângulo — nomes fundadores visíveis",
          complete: false,
        },
      ],
      isComplete: function () {
        return false;
      },
      onActivate: function () {
        if (ctx.flyToPreset && typeof ctx.flyToPreset === "function") {
          ctx.flyToPreset("triangulo");
        }
      },
      onResync: function () {},
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missions = window.CENTRO.missions || {};
  window.CENTRO.missions[ID] = { create: create, phase: PHASE };
})();
