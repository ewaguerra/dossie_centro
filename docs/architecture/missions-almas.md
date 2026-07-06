# Missões por Alma — arquitectura

Cada **Alma** do Protocolo 13 tem um módulo próprio em `centro/missions/`. Dentro dele vive o **conteúdo narrativo e comportamento de missão** da fase correspondente. Os **gates técnicos** (camadas, temas POI, features transversais) continuam canónicos em `centro/data/catalog/phase-gates.json` e são consumidos por `protocolo-phase.js` — não duplicar essa lógica nos módulos de missão.

## Árvore

```
centro/missions/
  registry.js           → window.CENTRO.missionsRegistry
  alma-01/index.js      → Fase 1 — Superfície
  alma-02/index.js      → Fase 2 — Hidrografia soterrada
  …
  alma-13/index.js      → Fase 13 — Permanência
```

Regenerar stubs a partir de `phase-gates.json`:

```bash
node scripts/scaffold-mission-almas.mjs
```

## Separação de responsabilidades

| Camada | Onde | O quê |
|---|---|---|
| Gates técnicos | `phase-gates.json` | `layerMinPhase`, `themeMinPhase`, `featureMinPhase`, `clueCountAdvance` |
| Estado global de fase | `protocolo-phase.js` | `protocolo13_phase`, `getSoul()`, `centro:arg-state-changed` |
| Missão narrativa | `centro/missions/alma-NN/` | Passos, UI in-character, progresso local, `isComplete()` |
| Features transversais | `centro/features/*.js` | Subsolo, 3D, triângulo, pistas RSB — até migrarem para a alma |

**Regra:** um módulo de alma **não** altera `phase-gates.json` por iniciativa própria. Avanço de fase narrativo usa `setPhase()` de `protocolo-phase.js` quando a missão estiver concluída.

## Contrato de cada módulo

Cada `alma-NN/index.js` é um IIFE que regista:

```javascript
window.CENTRO.missions["alma-NN"] = { create: create, phase: N };
```

`create(ctx)` devolve:

| Campo | Uso |
|---|---|
| `id`, `phase`, `title`, `kicker` | Metadados (espelham `souls[]` em `phase-gates.json`) |
| `missions[]` | Lista de passos `{ id, title, complete }` — preencher na implementação |
| `isComplete()` | Missão narrativa da fase concluída |
| `onActivate()` | Fase tornou-se activa (`protocolo13_phase === N`) |
| `onResync()` | Reagir a `centro:arg-state-changed` |

Registry (`window.CENTRO.missionsRegistry`):

- `get("alma-07")` — módulo bruto
- `forPhase(7)` — atalho por número de fase
- `createSoul("alma-07", ctx)` — instância via `create()`

## Ordem de scripts (`centro/index.html`)

Depois de `protocolo-phase.js`, antes de `arg-resync.js`:

1. `alma-01/index.js` … `alma-13/index.js` (auto-registo)
2. `registry.js` (API central)

Ainda **não** há bootstrap automático no runtime — os stubs registam-se; o
`mission-orchestrator.js` activa a alma da fase corrente e re-sincroniza em
`centro:arg-state-changed` / `centro:subterranean-progress`.

## Caso especial — Fase 7

A missão **Rasgue o Asfalto** está implementada hoje em `centro/features/subterranean-cutaway.js` (Three.js, `TREZE_ALMAS`, gate composto de 3 pistas, guia `#subterranean-guide`). O módulo `alma-07/` é o **destino** da migração; até lá, mantém-se a feature transversal.

## Workflow para agentes

1. Escolher a alma/fase em `centro/missions/alma-NN/`.
2. Preencher `missions[]` e implementar hooks (`onActivate`, `onResync`, `isComplete`).
3. Reutilizar APIs existentes: `window.CENTRO.protocoloPhase`, popups DOM-safe, toast in-character.
4. Se a missão precisar de mapa/sidebar, preferir delegar a módulos em `centro/map/` ou `centro/ui/` — não inflar o stub.
5. Correr `npm run ci` e actualizar `AGENT.md` se mudar convenção transversal.
6. Actualizar a ficha em `docs/almas/alma-NN.md` quando entregar missão dessa fase.

Ver também: `AGENT.md` §5.5.1, `docs/architecture/map-init-flow.md`.
