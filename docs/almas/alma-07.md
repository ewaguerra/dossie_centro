# alma-07 — Rasgue o Asfalto

| Campo | Valor |
|---|---|
| **Fase** | 7 / 13 |
| **ID** | `alma-07` |
| **Kicker** | Sétima Alma |
| **Módulo código** | [`centro/missions/alma-07/`](../../centro/missions/alma-07/) (stub) |
| **Implementação actual** | [`subterranean-cutaway.js`](../../centro/features/subterranean-cutaway.js) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço **não** automático por contagem de pistas (narrativa / missão / query dev).

### Feature (`featureMinPhase`)

- `subterranean` — toggle **Visão subterrânea** na sidebar (tab Visualização)

### Gate composto (além da fase)

A feature só fica utilizável quando **ambos** se cumprem (excepto modo mestre):

1. `protocolo13_phase >= 7`
2. Pistas no caderno (`protocolo13_caderno_clues`):
   - `agua-calada`
   - `aresta-fria` *(só exigida para subsolo — não está em `layer-unlocks.json`)*
   - `peso-fundacao`

Implementação: `REQUIRED_CLUES` + `isUnlocked()` em `subterranean-cutaway.js`.

---

## O que já existe

### UI

- Toggle `#centro-subterranean-toggle` (disabled quando bloqueado)
- Status `#subterranean-status` (mensagem de gate in-character)
- Legenda `#subterranean-legend` (5 geologia + 13 almas X/13)
- Guia `#subterranean-guide` — passos 01–05 + meta 13/13; abre só por botão explícito
- Botões «Voar para o subsolo» (guia + sidebar)

### Runtime

- Custom layer MapLibre + **Three.js** (`centro-subterranean-cutaway`)
- **5 painéis geológicos** (`CUTAWAY_ITEMS`): rio, fundação, túnel, argila, basalto
- **13 esferas colectáveis** (`TREZE_ALMAS`) — ver nota abaixo sobre IDs
- Progresso em `localStorage.centroSubterraneanUnlockedElements`
- **13/13 esferas → `setPhase(8)`** via `centro/missions/alma-07/index.js` + `mission-orchestrator.js`
- Tab **13 Almas** mostra meta «X/13 almas do subsolo» na Fase 7
- `?master=1` — bootstrap dev (fase 7 + 3 pistas + flag mestre)

### Ficheiros principais

| Ficheiro | Papel |
|---|---|
| `centro/missions/alma-07/index.js` | Missão: passos, `isComplete()`, avanço Fase 8 |
| `centro/missions/mission-orchestrator.js` | Activar alma da fase + resync progresso |
| `centro/features/subterranean-cutaway.js` | Gates, 3D, cliques, toggle |
| `centro/ui/centro-chrome.js` | Guia, fly buttons |
| `centro/styles/subterranean-cutaway.css` | Guia + estado `subterranean-active` |
| `centro/centro-runtime.js` | `ensureSubterraneanApi()`, init pós `centro:subterranean-ready` |

### Atenção: dois significados de «alma»

| | Alma ARG `alma-07` | Esfera `alma-07` no corte |
|---|---|---|
| **O quê** | Esta fase — «Rasgue o Asfalto» | Colectável 3D — «Sétima Alma — Túnel da Linha 3» |
| **Onde** | `phase-gates.json` → `souls[]` | `TREZE_ALMAS` no subsolo |

Os IDs `alma-01`…`alma-13` no subsolo **não** mapeiam 1:1 às fases ARG.

---

## O que vamos trabalhar

- [x] Lógica de missão em `centro/missions/alma-07/index.js` (`missions[]`, `isComplete`, avanço Fase 8)
- [x] Orchestrator `centro/missions/mission-orchestrator.js` + progresso na tab 13 Almas
- [ ] Migrar render 3D de `subterranean-cutaway.js` para dentro do módulo (opcional)
- [ ] Actualizar esta ficha quando houver nova entrega

---

## Como testar

| URL / acção | Efeito |
|---|---|
| `?master=1` | Bypass total — mais rápido para QA |
| `?phase=7&clues=agua-calada,aresta-fria,peso-fundacao` | Caminho sem master |
| Sidebar → Visualização → **Visão subterrânea** | Activa layer 3D |
| Guia → **VOAR PARA O SUBSOLO** | `flyTo` pitch 70° |
| Clicar esferas vermelhas | Progresso em `centroSubterraneanUnlockedElements` |

### localStorage relevante

| Chave | Conteúdo |
|---|---|
| `protocolo13_phase` | Fase ARG |
| `protocolo13_caderno_clues` | Pistas (incl. as 3 do subsolo) |
| `centroSubterraneanEnabled` | Toggle on/off |
| `centroSubterraneanUnlockedElements` | IDs clicados (esferas + geologia) |
| `centroMaster` | `"1"` após `?master=1` |

---

## Notas

- **Conclusão da missão:** 13 esferas colectadas (`TREZE_ALMAS` ids) — evidências geológicas são passo separado, não bloqueiam avanço.
- Contratos narrativos completos podem viver em `dossie_arg_contracts` (repo privado).
