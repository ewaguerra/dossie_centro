import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const gates = JSON.parse(
  fs.readFileSync(path.join(root, "centro/data/catalog/phase-gates.json"), "utf8")
);
const outDir = path.join(root, "docs/almas");
fs.mkdirSync(outDir, { recursive: true });

function gatesAtPhase(phase) {
  const layers = Object.entries(gates.layerMinPhase || {})
    .filter(([, p]) => p === phase)
    .map(([id]) => id);
  const themes = Object.entries(gates.themeMinPhase || {})
    .filter(([, p]) => p === phase)
    .map(([id]) => id);
  const features = Object.entries(gates.featureMinPhase || {})
    .filter(([, p]) => p === phase)
    .map(([id]) => id);
  const advance = (gates.clueCountAdvance || []).find((e) => e.phase === phase);
  return { layers, themes, features, advance };
}

const STATUS = {
  1: { impl: "Gates técnicos", backlog: "Missão narrativa da Superfície." },
  2: {
    impl: "Gates técnicos; feature `pistas-rsb`; tema POI `pistas`.",
    backlog: "Missão hidrografia soterrada (narrativa + passos).",
  },
  3: {
    impl: "Camadas monumentos/tombados; temas `monumentos`, `poi-turistico`.",
    backlog: "Missão património rígido.",
  },
  4: {
    impl: "Camadas acervo/memória/arqueologia; temas POI correspondentes.",
    backlog: "Missão acervo e memória.",
  },
  5: {
    impl: "Camadas geotécnicas (carta, risco alagamento).",
    backlog: "Missão geotecnia.",
  },
  6: {
    impl: "Camada `centro_arquivo_superficial__point`; avanço auto até aqui via `clueCountAdvance`.",
    backlog: "Missão arquivo superficial; transição narrativa para Fase 7.",
  },
  7: {
    impl: "**Parcial** — `subterranean-cutaway.js` (Three.js, guia, 13 esferas + 5 geologia). Módulo `centro/missions/alma-07/` stub.",
    backlog: "Migrar lógica para `alma-07/`; 13/13 → avanço Fase 8; `isComplete()` real.",
  },
  8: {
    impl: "Camada `02a_subsetores_arco_tamanduatei__polygon`.",
    backlog: "Missão setores interditos.",
  },
  9: {
    impl: "OSM ruas/endereços; feature `buildings-3d`.",
    backlog: "Missão malha urbana.",
  },
  10: {
    impl: "Camadas ZEIS 1/2/3.",
    backlog: "Missão risco sistémico.",
  },
  11: {
    impl: "Feature `triangulo-historico` (overlay).",
    backlog: "Missão triângulo fechado.",
  },
  12: { impl: "Gates técnicos mínimos nesta fase.", backlog: "Missão Comissão." },
  13: { impl: "Fase final do protocolo.", backlog: "Missão Permanência / encerramento ARG." },
};

function bulletList(items) {
  if (!items.length) return "- _(nenhum nesta fase)_\n";
  return items.map((i) => `- \`${i}\``).join("\n") + "\n";
}

const indexRows = [];

for (const soul of gates.souls) {
  const p = soul.phase;
  const g = gatesAtPhase(p);
  const st = STATUS[p];
  const advanceLine = g.advance
    ? `Avanço automático por pistas: **≥ ${g.advance.minClues} pistas** no caderno → Fase ${p}.`
    : p >= 7
      ? "Avanço **não** automático por contagem de pistas (narrativa / missão / query dev)."
      : "";

  const body = `# ${soul.id} — ${soul.title}

| Campo | Valor |
|---|---|
| **Fase** | ${p} / ${gates.maxPhase} |
| **ID** | \`${soul.id}\` |
| **Kicker** | ${soul.kicker} |
| **Módulo código** | [\`centro/missions/${soul.id}/\`](../../centro/missions/${soul.id}/) |

Registo canónico de gates: [\`phase-gates.json\`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [\`missions-almas.md\`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

${advanceLine ? advanceLine + "\n\n" : ""}### Camadas (\`layerMinPhase\`)

${bulletList(g.layers)}

### Temas POI (\`themeMinPhase\`)

${bulletList(g.themes)}

### Features (\`featureMinPhase\`)

${bulletList(g.features)}

---

## O que já existe

${st.impl}

---

## O que vamos trabalhar

- [ ] Definir passos de missão em \`centro/missions/${soul.id}/index.js\` (\`missions[]\`)
- [ ] Implementar \`onActivate\` / \`onResync\` / \`isComplete()\`
- [ ] ${st.backlog}
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| \`?phase=${p}\` | Força fase ARG (dev) |
| \`?clues=id1,id2\` | Injecta pistas no caderno — ver [\`layer-unlocks.json\`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a \`dossie_arg_contracts\`, etc.)_
`;

  const filename = `${soul.id}.md`;
  fs.writeFileSync(path.join(outDir, filename), body);
  indexRows.push(
    `| [${soul.id}](./${filename}) | ${p} | ${soul.title} | ${soul.kicker} |`
  );
}

const readme = `# 13 Almas — fichas de missão

Um ficheiro **por alma** para registar o que já está implementado e o backlog narrativo/técnico de cada fase do Protocolo 13.

| Ficha | Fase | Título | Kicker |
|---|---|---|---|
${indexRows.join("\n")}

## Convenção

Cada \`alma-NN.md\` segue a mesma estrutura:

1. **Gates técnicos** — o que \`phase-gates.json\` libera nesta fase
2. **O que já existe** — código e comportamento actual no Centro
3. **O que vamos trabalhar** — checklist editável
4. **Como testar** — atalhos dev e UI

Código de missão: \`centro/missions/alma-NN/index.js\`. Ver [\`AGENT.md\`](../AGENT.md) §5.5.1.

## Estado geral (2026-07)

| Área | Situação |
|---|---|
| Fases 1–6 | Gates + avanço automático por pistas (\`clueCountAdvance\`) |
| Fase 7 | Missão subsolo **parcial** — ver [alma-07.md](./alma-07.md) |
| Fases 8–13 | Gates técnicos; missões narrativas por implementar |
`;

fs.writeFileSync(path.join(outDir, "README.md"), readme);
console.log("scaffolded", gates.souls.length, "alma docs in docs/almas/");
