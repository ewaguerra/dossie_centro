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

> **Contexto de produto (2026-07):** o **Arquivo Morto já não faz parte integrada**
> deste dossier/mapa. O jogador **não** obtém as três pistas só lendo posts num blog
> externo. A entrega passa a ser **no Centro** (cliques no mapa / sidebar / popups),
> **puzzles** e **escape room** — ver § *Gaps para escrever a fase inteira*.

---

## O que já existe

### UI

- Toggle `#centro-subterranean-toggle` (disabled quando bloqueado)
- Status `#subterranean-status` (mensagem de gate in-character)
- Legenda `#subterranean-legend` (5 geologia + 13 esferas X/13)
- Guia `#subterranean-guide` — passos 01–05 + meta 13/13 (ver copy em `AGENT.md` §5.5); **só visível a partir da fase ARG 7**
- Botões «Voar para o subsolo» (guia + sidebar)

### Runtime

- Custom layer MapLibre + **Three.js** (`centro-subterranean-cutaway`)
- **5 painéis geológicos** (`CUTAWAY_ITEMS`): rio, fundação, túnel, argila, basalto
- **13 esferas colectáveis** (`TREZE_ALMAS`, ids `subsolo-01`…`subsolo-13`) — **não** são as almas ARG `alma-01`…`alma-13`
- Progresso em `localStorage.centroSubterraneanUnlockedElements`
- **13/13 esferas → `setPhase(8)`** via `centro/missions/alma-07/index.js` + `mission-orchestrator.js`
- Tab **13 Almas** mostra meta «X/13 esferas do subsolo» na Fase 7
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

### Atenção: dois namespaces de ID

| | Alma ARG `alma-07` | Esfera `subsolo-07` no corte |
|---|---|---|
| **O quê** | Esta fase — «Rasgue o Asfalto» | Colectável 3D — «Túnel da Linha 3» |
| **Onde** | `phase-gates.json` → `souls[]` | `TREZE_ALMAS` em `subterranean-cutaway.js` |

- Esferas 3D usam **`subsolo-01`…`subsolo-13`** — namespace separado das almas ARG.
- **`subsolo-01` ≠ `alma-01`:** a 1.ª esfera do subsolo **não** é a Alma ARG da Fase 1 (Superfície).
- IDs legados `alma-NN` em `centroSubterraneanUnlockedElements` migram para `subsolo-NN` ao ler.

## Copy do guia in-game (`#subterranean-guide`)

| Passo | Título | Notas |
|---|---|---|
| 01 | Reunir clearance do subsolo | 3 pistas + Fase 7 (`REQUIRED_CLUES`) |
| 02 | Activar visão subterrânea | Tab Visualização, não menu ☰ |
| 03 | Voar para o subsolo | `#subterranean-fly-btn` / `#subterranean-fly-sidebar-btn` |
| 04 | Encontrar as 13 esferas vermelhas | meta 13/13 na legenda |
| 05 | Evidências geológicas *(opcional)* | 5 painéis; não bloqueia Fase 8 |
| 13 | 13/13 esferas — missão concluída | Avanço → Alma 08 (não fim do Protocolo) |

Modo mestre (`?master=1`, `CENTRO.dev.unlockAlma7()`) — **fora** do guia; só QA.

---

## Gaps para escrever a fase inteira

Checklist de **conteúdo e desenho em falta** — o runtime da Fase 7 está implementado;
falta a **trilha do jogador** desde a Fase 6 até concluir 13/13 esferas e avançar
para Alma 08. Usar esta secção como brief para copy, puzzles e escape room.

### 0. Premissa transmídia (decisão tomada)

| Antes (legado) | Agora (alvo) |
|---|---|
| Pistas via **Arquivo Morto** (`clue-word` → `protocolo13_caderno_clues`) | Pistas via **Centro + puzzles + escape room** |
| Fase 7 narrada noutro repo | Fase 7 **contada no mapa** (com extensões presenciais/digital híbridas) |
| Guia passo 01 = «confirme no caderno» | Passo 01 **a reescrever** quando existir entrega in-map |

**Contrato técnico que se mantém:** gravar IDs em `protocolo13_caderno_clues` (array JSON
no `localStorage`). Qualquer puzzle ou clique no mapa que «registe pista» deve chamar o
mesmo mecanismo que hoje lê `layer-unlocks.js` / `isUnlocked()` — não inventar chave nova.

---

### 1. Entrada na Fase 7 (`protocolo13_phase = 7`)

| Gap | Estado código | O que falta escrever / desenhar |
|---|---|---|
| **Gatilho narrativo** — o que faz o jogador *sair* da Fase 6 e *entrar* em Rasgue o Asfalto | Auto-só até Fase 6 (`clueCountAdvance`); Fase 7 manual / missão / dev | Cena, objectivo, personagem ou puzzle que **declara** Alma 07 activa |
| **Onde isso acontece** | — | Mapa (POI/popup)? Escape room? Cartão Alma 07 na tab 13 Almas? |
| **Copy do badge** | Existe: «Alma 07 · Rasgue o Asfalto» | Texto de transição / toast ao subir para Fase 7 |
| **`advancePhaseIfReady()`** | Se as 3 pistas existem e fase &lt; 7, sobe para 7 ao activar toggle | Decidir se isto fica ou se Fase 7 **só** vem de puzzle dedicado |

---

### 2. As três pistas de clearance (`REQUIRED_CLUES`)

Cada pista precisa de: **(a)** onde o jogador descobre, **(b)** o que clica/faz,
**(c)** copy in-character, **(d)** confirmação visual de «registado no caderno».

| ID | Gate técnico hoje | Feedback no mapa hoje | Gap narrativo / puzzle |
|---|---|---|---|
| **`agua-calada`** | Subsolo + desbloqueia camadas hidro em `layer-unlocks.json` | Rios, alagamentos, área inundável, etc. | **Onde** o jogador ganha a pista (POI? camada? puzzle água?) — texto da descoberta; ligação ao rio soterrado |
| **`peso-fundacao`** | Subsolo + desbloqueia `03_eixo_existente` / `03a_eixo_previsto` | Camadas de eixo urbano | **Onde** ganha a pista — fundação, peso, estrutura enterrada; puzzle ou clique em polígono/POI |
| **`aresta-fria`** | **Só** subsolo — *não* está em `layer-unlocks.json` | Nenhum feedback de camada | **Gap crítico:** entrega dedicada (escape room, popup, puzzle de «aresta»/superfície) — hoje o jogador não tem sinal no mapa de que já a tem |

**Entrega técnica em falta (produto):**

- [ ] Componente ou fluxo **«Registar pista»** no Centro (popup, botão em POI, fim de puzzle)
  que faça `merge` do ID em `protocolo13_caderno_clues` + dispare `centro:arg-state-changed`
- [ ] UI de **caderno resumido** no Centro (opcional) — lista de pistas da Fase 7, sem depender do Arquivo Morto
- [ ] Mensagens `#subterranean-status` por pista em falta (hoje genéricas) — copy por ID
- [ ] Guia passo **01** reescrito: «Complete os três registos…» com pistas **in-map**, não «volte ao Arquivo Morto»

**Escape room / puzzles:**

- [ ] Desenho de **3 puzzles** (ou 1 puzzle composto) mapeados 1:1 às pistas
- [ ] Enigma físico/digital → código ou acção final que injecta o `clueId` canónico
- [ ] Documentar solução e red herrings em `dossie_arg_contracts` (repo privado) quando existir

---

### 3. Missão no subsolo (após clearance)

| Gap | Existe no código | Falta escrever |
|---|---|---|
| **Activar visão** | Toggle + guia passo 02 | Tutorial curto se jogador chega sem guia |
| **13 esferas** (`subsolo-01`…`13`) | Posições 3D + títulos placeholder (`TREZE_ALMAS`) | Lore por esfera: o que é, por que importa, ordem sugerida (ou liberdade?) |
| **5 geologia** (`CUTAWAY_ITEMS`) | Clique + legenda | Texto de evidência por painel; ligação narrativa à superfície |
| **Conclusão 13/13** | `setPhase(8)` + toast Alma 08 | Cena de fecho Fase 7 — não «fim do Protocolo», sim **abertura** de Setores interditos |
| **Meta na tab 13 Almas** | «X/13 esferas do subsolo» | Frase de missão activa / bloqueada alinhada com puzzles de clearance |

---

### 4. Copy e UX já no jogo (revisar)

| Superfície | Ficheiro | Gap |
|---|---|---|
| Guia `#subterranean-guide` | `centro/index.html` | Passo 01 ainda fala em «caderno» abstracto — alinhar com §2 |
| Cartão Visualização | `centro/index.html` | «13 almas soterradas» → já corrigido para esferas; rever tom |
| `#subterranean-status` / lock toast | `subterranean-cutaway.js` | Mensagens in-character; **não** expor chaves `localStorage` ao jogador |
| Cartão Alma 07 (tab 13 Almas) | `sidebar-phases-panel.js` | Meta via `getProgressLabel()` — pode reflectir puzzles pendentes |

---

### 5. Integração escape room ↔ mapa

| Decisão | Opções | Notas |
|---|---|---|
| Como o puzzle entrega pista | QR → `?clues=` · código digitado no mapa · NFC · operador manual | `?clues=` já faz merge; validar se escape room usa URL ou API futura |
| Sincronização presencial | Jogador no escape room antes ou depois do mapa? | Ordem afecta copy do guia |
| Falha / repetição | Puzzle errado não grava pista | Só sucesso injecta ID canónico |
| Prova social | Toast «Pista registada: água calada» | Evitar spoilers de puzzles restantes |

---

### 6. Dependências noutros sistemas (fora deste repo)

| Sistema | Relação com Fase 7 | Acção |
|---|---|---|
| ~~Arquivo Morto~~ | **Não** entrega principal das 3 pistas | Remover referências narrativas «volte ao blog» em copy futura |
| `dossie_arg_contracts` | IDs canónicos das 8 pistas | Manter `agua-calada`, `aresta-fria`, `peso-fundacao` estáveis |
| Alma 06 (entrada) | O que prepara o subsolo? | Escrever gancho Fase 6 → 7 |
| Alma 08 (saída) | Setores interditos | Escrever o que o jogador *vê* ao completar 13/13 |

---

### 7. Critérios de «fase inteira escrita» (Definition of Done narrativa)

- [ ] Jogador **sem** `?master=1` consegue: chegar à Fase 7 → obter **3 pistas in-map/puzzle** → activar subsolo → 13/13 esferas → Alma 08
- [ ] Cada `REQUIRED_CLUE` tem **local de obtenção** documentado (coordenadas, POI, puzzle ou escape room)
- [ ] `aresta-fria` tem entrega **visível** (não só gate invisible)
- [ ] Guia e `#subterranean-status` reflectem o fluxo real
- [ ] Ficha `alma-06.md` / `alma-08.md` cruzam entradas e saídas com esta fase
- [ ] Smoke manual §14 (`docs/testing/smoke-centro.md`) actualizado com rota jogador real

---

## O que vamos trabalhar

### Código (mapa)

- [x] Lógica de missão em `centro/missions/alma-07/index.js` (`missions[]`, `isComplete`, avanço Fase 8)
- [x] Orchestrator `centro/missions/mission-orchestrator.js` + progresso na tab 13 Almas
- [ ] Migrar render 3D de `subterranean-cutaway.js` para dentro do módulo (opcional)
- [ ] API «Registar pista» no Centro (`protocolo13_caderno_clues` + evento ARG)
- [ ] `getGateMessage()` / guia passo 01 alinhados com entrega in-map (ver § Gaps)

### Narrativa / puzzles / escape room

- [ ] Gatilho Fase 6 → 7
- [ ] Entrega `agua-calada`, `peso-fundacao`, `aresta-fria` (mapa + puzzles)
- [ ] Lore das 13 esferas + 5 painéis geológicos
- [ ] Fecho narrativo → Alma 08
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| URL / acção | Efeito |
|---|---|
| `?master=1` | Bypass total — mais rápido para QA |
| `?phase=7&clues=agua-calada,aresta-fria,peso-fundacao` | Caminho sem master |
| Sidebar → Visualização → **Visão subterrânea** | Activa layer 3D |
| Sidebar → tab **13 Almas** → cartão **07** | Clique no cartão Rasgue o Asfalto | Abre `#subterranean-guide` |
| Guia → **VOAR PARA O SUBSOLO** | `flyTo` pitch 70° |
| Clicar esferas vermelhas | Progresso em `centroSubterraneanUnlockedElements` |

### localStorage relevante

| Chave | Conteúdo |
|---|---|
| `protocolo13_phase` | Fase ARG |
| `protocolo13_caderno_clues` | Pistas (incl. as 3 do subsolo) |
| `centroSubterraneanEnabled` | Toggle on/off |
| `centroSubterraneanUnlockedElements` | IDs clicados (`subsolo-NN` + geologia) |
| `centroMaster` | `"1"` após `?master=1` |

---

## Notas

- **Conclusão da missão:** 13 esferas colectadas (ids `subsolo-01`…`subsolo-13`) — evidências geológicas são passo separado, não bloqueiam avanço.
- **Pistas de clearance:** IDs canónicos mantidos; **entrega** migra do Arquivo Morto para Centro / puzzles / escape room (§ Gaps).
- Contratos de solução e red herrings podem viver em `dossie_arg_contracts` (repo privado).
