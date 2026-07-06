import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const gates = JSON.parse(
  fs.readFileSync(path.join(root, "centro/data/catalog/phase-gates.json"), "utf8")
);

for (const soul of gates.souls) {
  const dir = path.join(root, "centro/missions", soul.id);
  fs.mkdirSync(dir, { recursive: true });

  const extra =
    soul.phase === 7
      ? `
  /**
   * Implementação actual da missão Fase 7: centro/features/subterranean-cutaway.js
   * (TREZE_ALMAS, gate composto, guia #subterranean-guide).
   * Migrar progressivamente para este módulo.
   */`
      : "";

  const content = `/**
 * ${soul.id} — ${soul.title} (Fase ${soul.phase})
 * Missões narrativas desta alma. Gates técnicos em phase-gates.json.
 */
(function () {
  "use strict";
${extra}
  var ID = "${soul.id}";
  var PHASE = ${soul.phase};

  function create(ctx) {
    ctx = ctx || {};
    return {
      id: ID,
      phase: PHASE,
      title: ${JSON.stringify(soul.title)},
      kicker: ${JSON.stringify(soul.kicker)},
      /** Passos de missão (preencher na implementação). */
      missions: [],
      /** Conclusão narrativa (independente de layerMinPhase / featureMinPhase). */
      isComplete: function () {
        return false;
      },
      /** protocolo13_phase === PHASE */
      onActivate: function () {},
      /** centro:arg-state-changed enquanto fase activa */
      onResync: function () {},
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missions = window.CENTRO.missions || {};
  window.CENTRO.missions[ID] = { create: create, phase: PHASE };
})();
`;

  fs.writeFileSync(path.join(dir, "index.js"), content);
}

console.log("scaffolded", gates.souls.length, "alma modules");
