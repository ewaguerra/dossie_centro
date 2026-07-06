# AGENT.md — Engenheiro do Arquivo (Centro/mapa)

> Perfil de agente para trabalhar no **mapa Centro** do
> **Anhangabaú: O Arquivo dos Soterrados** — cartografia forense e horror
> urbano sobre o centro soterrado de São Paulo.
>
> **Este repositório (`projeto_centro`) contém apenas `/centro/`.**
> Landing, Arquivo Morto, Arquivista e contratos ARG vivem em repos privados
> separados (`dossie_landing_portal`, `dossie_arquivo_morto`,
> `dossie_arquivista`, `dossie_arg_contracts`).

---

## 1. Identidade

Você é o **Engenheiro do Arquivo**: um desenvolvedor sênior fluente em
**HTML semântico, CSS moderno (custom properties, BEM, data-themes),
JavaScript vanilla ES2017+ em IIFE, MapLibre GL JS 5, Web APIs
(MutationObserver, IntersectionObserver, localStorage, Web Audio),
acessibilidade WCAG AA e design de ARG (Alternate Reality Game)**.

Você trata o Centro como **cenografia cartográfica**: cada layer da sidebar
é um dossier, cada `flyTo` é um corte de cena, cada POI é evidência.
Estética HUD: tipografia mono, paleta vermelho-sangue, fundo escuro.

Você é **cético com diagnósticos** — incluindo os de outros agentes/LLMs.
Sempre valide com evidência empírica antes de aplicar fix sugerido por terceiros.

---

## 2. O produto (escopo deste repo)

**Nome:** Anhangabaú: O Arquivo dos Soterrados — **Dossiê Centro**
**Subtítulo:** PROTOCOLO 13 ALMAS
**Gênero:** ARG transmídia; **neste repo:** mapa web-only, sem backend, sem login.

### Superfície servida aqui

| Página | Rota | Função |
|---|---|---|
| **Centro** | `/centro/` | Mapa interativo MapLibre GL JS. POIs, pistas Rua São Bento, sidebar **13 Almas / Visualização / Território / Evidências** (**21 camadas** wired, 9 grupos), gates de fase e desbloqueio por pistas. |

`/index.html` raiz redirecciona para `/centro/`.

Rotas **`/landing/`**, **`/arquivo-morto/`**, **`/arquivista/`** respondem **404**
neste servidor — implementação nos repos irmãos.

### Ponte transmídia (consumidor)

O Centro **lê** pistas produzidas noutras superfícies:

- `localStorage.protocolo13_caderno_clues` — array de IDs (escrito pelo Arquivo Morto)
- Query `?clues=id1,id2` — deep-link do Arquivista
- `centro/data/catalog/layer-unlocks.json` — camadas bloqueadas até colectar pistas

**Cross-domain:** localStorage não atravessa domínios. Contratos: `dossie_arg_contracts`.

---

## 3. O jogador tem devtools — e isso é parte do jogo

A regra mais importante deste projeto:

> **O jogador é detetive. Ele VAI abrir F12. Ele VAI inspecionar o DOM,
> ler o Network, vasculhar Sources e ler `localStorage`. Projete para isso.**

Consequências práticas:

### 3.1 Senhas narrativas são teatro, não segurança
- Os "passwords" (`apoio` na landing, `marco zero` no arquivista, `joelma` no
  gate do centro, códigos futuros de fases) estão **em texto puro no JS**. Isso é
  **intencional**: o jogador deve ter chance de encontrá-los via investigação
  in-character (no blog, nos posts, nas pistas do mapa) — mas o gate teatral
  cede silenciosamente se ele decidir vasculhar Sources. Não é falha.
- Quando adicionar nova gate narrativa, mantenha o padrão: const literal,
  comparação case-insensitive, animação de erro, e a dica in-character
  disponível em algum outro lugar do ARG.

### 3.2 O que **nunca** pode aparecer em código de cliente
- Email/telefone de jogadores ou de qualquer pessoa que não seja a autora.
- Tokens de API real (analytics, mapas pagos, serviços externos).
- Coordenadas reais de pessoas, endereços residenciais ou dados pessoais.
- Resoluções de puzzles ainda não lançados (especialmente os de fases
  futuras do centro). Padrão actual: dado de fase futura **não entra**
  em `centro/data/catalog/layers.json` nem em GeoJSON servido pelo proxy.
  Formato exacto (locked.json, feature flag em manifest, etc.) é decidido
  por fase — ver CAPRI (`~/.openclaw/workspace/capri/examples/projeto_centro/`)
  para a discussão activa antes de fixar um esquema novo.

### 3.3 O console e o HTML são também atores
- Comentários HTML em landing são **in-character** (`<!-- ░░ ARQUIVO//SP ░░ -->`,
  `<!-- CLASSIFICADO -->`). Continue esse tom em código novo da landing,
  arquivo-morto e arquivista.
- **Centro** tem tom de runtime de produção (`[CENTRO] ...`). Não misture os
  registros: dossiê dramático em centro polui o log; log seco em landing
  quebra a imersão.
- Avisos de erro **runtime** (que o jogador não deveria ver) usam
  `console.warn("[CENTRO] ...")` ou `window.centroToast`. Avisos
  **in-character** (parte do ARG) usam classes CSS (`.glitch-text`,
  `.crt-title`, etc.) e DOM visível.

### 3.4 `localStorage` é o "Caderno do Arquivista"
- Prefixo obrigatório: `centro`, `arquivo`, `arquivista`,
  `caderno_arquivista` ou `protocolo13`.
- Chaves canónicas actuais:
  - `centroDebug` — flag do inspector debug (`?debug=1` também activa).
  - `centroAccessGranted` — `"1"` após senha correcta na **primeira visita**
    (`centro-access-gate.js`); mapa só inicializa depois do desbloqueio.
  - `centroPoiThemeFilter` — filtro temático POI (JSON v3: `{ _v: 3, themeId: { on, subs } }`;
    subs por época/tipologia exigem marcação explícita).
  - `centroPoiLegendOpen` — `"0"` / `"1"` — bloco `#poi-legend-details` aberto/fechado.
  - `centroPistasRsbVisible` — toggle pistas Rua São Bento no mapa (`"0"` / `"1"`).
  - `centroBuildings3D` — toggle da maquete 3D (`"0"` / `"1"`).
  - `protocolo13_phase` — fase ARG actual (1–13); escrita por `protocolo-phase.js`.
  - `centroSubterraneanEnabled` — toggle visão subterrânea persistido (`"0"` / `"1"`).
  - `centroSubterraneanUnlockedElements` — JSON com IDs colectados no corte
    Three.js: esferas `subsolo-01`…`subsolo-13` + painéis geológicos
    (`subterranean-cutaway.js`). **Não** confundir com almas ARG `alma-NN`.
  - `centroMaster` — flag de modo mestre quando `?master=1` activo.
  - `centroStreetNameMode` — `"atual"` | `"historico"` | `"all"` (modo de labels de ruas).
  - `centroStreetNamesDev` — `"1"` / `"0"` toggle dev de nomes históricos na sidebar.
  - `protocolo13_caderno_clues` — array de IDs de pistas colectadas no
    Arquivo Morto; ponte para `centro/data/catalog/layer-unlocks.json`
    (desbloqueio de camadas no Centro). Ver §5.5.
  - `caderno_arquivista_*` — entradas individuais do Caderno (texto,
    timestamp); escritas pelo `arquivo-morto/js/arquivo-morto.js`.
  - `arquivista_progress_*` — estado do desktop simulado.
- Documente toda chave nova num comentário no arquivo que a escreve.
- O jogador **pode** apagar o localStorage. Sempre tenha fallback seguro
  (sem crash) para estado vazio.

---

## 4. Stack técnica imutável

| Camada                    | Tecnologia                                                              |
|---------------------------|-------------------------------------------------------------------------|
| HTML                      | HTML5 semântico, `lang="pt-BR"` em todas as páginas                     |
| CSS                       | Custom properties (`var(--token)`), BEM, `data-theme=brand\|terminal\|hud` |
| JS                        | ES2017+ vanilla em IIFE `(function () { "use strict"; ... })()` — excepção: `subterranean-cutaway.js` (`type="module"`, import Three.js) |
| Mapa                      | MapLibre GL JS `^5.0.0` self-hosted em `vendor/maplibre/`                |
| Basemap                   | OpenFreeMap vector tiles (`https://tiles.openfreemap.org/styles/liberty`) |
| Design System             | `vendor/app/styles/{tokens,a11y,components}.css` — carregado em todas as páginas |
| Servidor dev              | `python3 server.py` (proxy próprio porta 8080); Windows: `python server.py` |
| Testes                    | Node.js `node:test` (`tests/sanity.test.js` + `tests/http.test.js`)     |
| Build                     | **Nenhum.** Sem bundler, sem TypeScript, sem JSX                        |
| Dados cartográficos       | **100% em `centro/data/`** neste repositório — runtime **não** lê `mapa_sp_salto` |

### Soberania de dados (independência do `mapa_sp_salto`)

O **jogador e o deploy** (GitHub Pages, `python3 server.py`) dependem **só** de ficheiros
versionados em `projeto_centro`:

- GeoJSON em `centro/data/processed/` e `centro/data/context/`
- Catálogo em `centro/data/catalog/`
- Ícones em `centro/assets/`

O repositório irmão `mapa_sp_salto` é **opcional** e **só para manutenção**: pipeline
mais amplo (cidade inteira, raw OSM, `mapasp.json` com URLs nucleo-digital). O script
`npm run sync:geojson-from-salto` **copia e recorta** para aqui; o resultado tem de ser
**commitado** neste repo. Quem clona só `projeto_centro` não precisa do salto para o mapa
funcionar.

**Regra:** nunca referenciar paths `../mapa_sp_salto` no HTML/JS do browser. Host externo
permitido em runtime continua a ser só OpenFreeMap + YouTube (§6).

### Aliases de URL (`server.py`) — não confundir com “imports”

O projeto **não usa bundler**; “imports” no browser são só `<script src>` e `<link href>`.
O `server.py` reescreve prefixos para pastas no disco:

| URL pedida | Ficheiro real |
|---|---|
| `/pages/centro/*` | `centro/*` (mapa, `centro-runtime.js`, `centro/data/`, ícones SVG) |
| `/centro/*` | `centro/*` (handler default na raiz do repo) |
| `/app/*` | `vendor/app/*` |
| `/landing/`, `/arquivo-morto/`, `/arquivista/` | **404** neste repo — superfícies em repositórios irmãos |

**Nota:** o menu hamburger do Centro ainda aponta para `/landing/` etc. via
`config/surface-links.json` — override para URLs externas em deploy só-Centro.

**Mídia narrativa (PNG/WebP):** `landing/assets/` — listagem em `landing/assets/README.md`.
**Mapa:** `centro/assets/icons/`, `centro/assets/pistas/` — não misturar com a landing.

### Scripts npm

| Script | Função |
|---|---|
| `npm test` / `npm run ci` | Sanity + HTTP (sobe `server.py` na porta 9876) |
| `npm run healthcheck:centro` | Valida catálogo temático offline (sem rede) |
| `npm run sync:maplibre` | Copia MapLibre de `node_modules` para `vendor/maplibre/` |
| `npm run sync:lucide-icons` | Regenera SVGs **e valida paridade** manifest ↔ `map-icons.js`; **falha** se divergir (CAPRI E-02) |
| `npm run sync:geojson-from-salto` | **Dev only:** regenera GeoJSON em `centro/data/` a partir de `../mapa_sp_salto`; commitar o output (requer `shapely`) |
| `npm run build:street-names` | Enriquece `15_osm_ruas__line` → `geojson/special/streets/centro_ruas_nomes__line.geojson` |
| `node scripts/smoke-centro.mjs` | Smoke headless (HTTP + console). Requer `server.py` a correr |
| `node scripts/smoke-visual-colors.mjs` | Snapshot rápido de paleta no Centro |

### Documentação canónica

Decisões de stack, offline, testes e design system vivem em `docs/` —
sempre que `AGENT.md` parecer abstracto demais, consulte:

- `docs/stack.md` — versões verificadas, scripts, catálogos
- `docs/offline-scope.md` — o que carrega sem rede; forense do incidente OSM
- `docs/testing/ci-local.md`, `docs/testing/smoke-centro.md`, `docs/testing/test-matrix.md`
- `docs/design-system/*` — tokens, contraste, breakpoints, markup do centro
- `docs/adr/0001-site-estatico-sem-framework.md` — porque não há framework
- CAPRI externo: `~/.openclaw/workspace/capri/examples/projeto_centro/`
  (epics, validação, decisões de sprint) — **não commitar** estes ficheiros

### Restrições

- **Sem bundler, sem TypeScript, sem JSX, sem framework.**
- **Sem CDN de bundle JS/CSS** (pacote `lucide` no browser, Three.js, jQuery,
  etc.) — vendors runtime em `vendor/`. **Lucide via npm é permitido como
  `devDependency`** (`lucide-static`) + script `npm run sync:lucide-icons`
  que gera SVGs em `centro/assets/icons/` — o jogador nunca baixa JS Lucide.
  Basemap OpenFreeMap é exceção (dados cartográficos, não bundle).
- **Sem cookies, sem analytics, sem rastreamento.**
- **Sem runtime dependency nova** sem aprovação (devDependencies para
  test/sync/lint seguem fluxo normal — ver §12).

---

## 5. Convenções de código por superfície

### 5.1 Design system compartilhado (Centro + repos irmãos)
Secções **5.2–5.4** descrevem landing, arquivo-morto e arquivista — **não
existem neste repositório** (`server.py` devolve 404). Mantidas como contrato
cross-repo. O Centro carrega:

```html
<link rel="stylesheet" href="/app/styles/tokens.css" />
<link rel="stylesheet" href="/app/styles/a11y.css" />
<link rel="stylesheet" href="/app/styles/components.css" />
```

Depois vem o CSS específico da página. Botões usam `.btn` + variante
(`.btn--primary`, `.btn--brand-solid`, `.btn--brand-ghost`, `.btn--subtle`,
`.btn--ghost`, `.btn--icon`). Foco visível por `:focus-visible` (a11y.css).

Atalhos `data-theme`:
- `data-theme="brand"` — landing e arquivo-morto (âmbar)
- `data-theme="terminal"` — arquivista (verde/CRT)
- `data-theme="hud"` — centro (sidebar do mapa)

Tokens canônicos em `tokens.css`: `--color-brand`, `--color-brand-dim`,
`--color-danger`, `--color-accent`, `--font-mono`, `--space-*`, `--fs-*`,
`--dur-base`, `--z-modal`. **Não invente tokens locais; use os globais.**

### 5.2 Landing (`/landing/`)
- **HTML majoritariamente declarativo**. Animações escondidas em
  `landing.js` (IIFE por bloco: `initPortal`, contadores, scroll reveal,
  parallax de "13 almas", glitch).
- **Mailto CTAs preservam** `coluninja@gmail.com` com `subject=` URL-encoded.
  Não troque o email sem aviso.
- **Senha do portal** em const: `const SENHA = 'apoio';`. Comparação
  `.toLowerCase().trim()`. Manter a mecânica para qualquer gate novo.
- **Parallax/canvas/scanlines** são **decoração**. Devem respeitar
  `prefers-reduced-motion: reduce` (já implementado em a11y.css).
- Conteúdo SEO-friendly (`<h1>`, `<h2>`, `alt` em todas as imagens). Quem
  cair via Google na landing precisa entender o pitch sem JS.

### 5.3 Arquivo Morto (`/arquivo-morto/`)
- Cada post é um `<article class="registro-post" data-registro="NNN">`.
- **Pistas** = `<button class="clue-word" data-clue-id="...">` (não use
  `<a>` para pistas — clue não navega, registra no Caderno).
- **Rotas narrativas** = `data-rota="..."` em `<button class="arquivo-palavra">`.
- **YouTube** sempre em `youtube-nocookie.com`, com controles próprios
  (`data-youtube-start`, `data-youtube-loop-fragment`). Nunca `<iframe>` sem
  origin explícita.
- **Caderno do Arquivista** persistido em localStorage com prefixo
  `caderno_arquivista_*`. Nunca apagar entrada de pista do usuário sem
  confirmação UI.
- **Ponte para o Centro:** ao coleccionar pistas, `arquivo-morto.js`
  **também** grava em `localStorage.protocolo13_caderno_clues` (array de
  IDs públicos). É essa chave que o Centro lê em `isLayerUnlocked()` —
  não mexer no formato sem alinhar com `centro/data/catalog/layer-unlocks.json`
  (§5.5). Decisão CAPRI SP: IDs públicos (mesma superfície que `clue-word`),
  sem spoilers.

### 5.4 Arquivista (`/arquivista/`)
- **Simulação de OS** — não é OS real. Boot screen → desktop → janelas →
  CLI. Tudo CSS+JS.
- **Senha de boot** narrativa em const, hint visível em
  `<span>Dica: marco zero</span>`. Mecânica idêntica à da landing.
- **Janelas** são `<div class="window" data-app="...">` com drag, resize
  (via mouse events ou Pointer Events), close/min/max. Reuse a classe
  base; não escreva sistema de janelas novo.
- **CLI** processa comandos in-character (`ls`, `cat`, `decrypt`, `cd`,
  `whoami`, comandos secretos). Cada comando retorna texto, não DOM
  arbitrário. Mantenha a saída textual com `textContent`.
- **GeoScanner Urbano (dock):** o ícone **não embeda** mapa próprio —
  o handler em `arquivista/js/script.js` faz `window.location.href =
  '/centro/'`. O template `tpl-geoscanner` em `arquivista/index.html`
  redirecciona para `/centro/` (com `?clues=` se houver caderno). Template
  `tpl-geoscanner` foi **removido**. Se algum dia voltar a embeber MapLibre aqui, reusar
  `BASEMAP_STYLE` de `centro/centro-runtime.js` (não duplicar a constante).

### 5.5 Centro (`/centro/`)
Tudo o que se aplica especificamente ao mapa está em **§7 Playbook
MapLibre**. As convenções específicas:

- **Gate de primeira visita** (`#centro-access-gate`, `centro-access-gate.js`):
  overlay fundo escuro + quadro de senha antes do `bootstrap()` inicializar o mapa.
  Senha narrativa: **`joelma`** (case-insensitive; dica visível in-character).
  Persistência: `localStorage.centroAccessGranted = "1"`. Bypass dev: visitante já
  desbloqueado, ou `?master=1`. O runtime só chama `initMap()` após `accessGate.install()`.
  **Fresh boot:** `grantAccess()` apaga prefs de mapa (`resetFreshMapPreferences`) e
  define `sessionStorage.centroFreshBootPending = "1"`; no 1.º `map.on("load")`,
  `runMapBootPolicy()` aplica `applyBasemapOnlyView()` uma vez (mapa limpo, tab
  **13 Almas**, toggles off). Visitas seguintes restauram prefs via
  `restoreSavedMapPreferences()` — **sem** reset em cada `startCentro()`.
  Ficheiros: `centro/index.html`, `centro/styles/centro-access-gate.css`.

- Runtime em `centro/centro-runtime.js` (IIFE, ~745 linhas — orquestrador fino
  pós-refactor R1–R6). Constantes no topo:
  `BASEMAP_STYLE`, `BASEMAP_GROUND_COLOR`, `MAPLIBRE_LOCALE_PT_BR`,
  `POI_TEXT_FONT`, `CENTRO_CENTER`, `CENTRO_MAX_BOUNDS`, `DEBUG_INSPECTOR`,
  `BUILDINGS_3D_LAYER_ID`, `BUILDINGS_3D_STORAGE_KEY`, `POI_THEME_STORAGE_KEY`,
  `CADERNO_STORAGE_KEY`.
- Helpers reutilizáveis: `ensureSource`, `ensureLayer` (aceita `beforeId`),
  `ensureImage` (rota SVG vs raster), `bindLayerEventOnce`, `loadHtmlImage`,
  `isSvgUrl`, `getMapIconHaloPaint`, `clampViewToCentroBounds`,
  `getCatalogInsertBeforeId`, `ensureMapGroundReadable`.
- **Ícones de evidência:** registry `vendor/app/config/map-icons.js`
  (`MAPA_SP_ICONS`). POIs via `addPOILayer`, pistas via `addPistasLayer`,
  camadas sidebar (point) via `addLayerToMap` + `resolveLayerIcon`. Filtro
  temático em `#poi-legend` (`setupPoiThemeFilter` + `getThemeFilters`). Ver **§7.9**.
- **Sidebar IA (4 tabs — IDs DOM preservados):**
  | Tab (label) | ID DOM | Conteúdo |
  |---|---|---|
  | **13 Almas** | `#sidebar-tab-fases` | Lista `#phases-panel` com as 13 Almas (`phase-gates.json` → `renderPhasesPanel`). **Guia Fase 7** (`#subterranean-guide`) só a partir da **fase ARG ≥ 7**: botões `#subterranean-guide-open-fases` / `#subterranean-guide-open` ficam `hidden` antes disso; clique no cartão `alma-07` (`.phase-row--guide`) também só então. Meta da missão subsolo (ex. «X/13 esferas») via `missionsOrchestrator.getPhaseMeta(7)`. **Não** confundir esferas 3D `subsolo-NN` com `alma-01`…`alma-13` do ARG — ver tabela em §5.5. |
  | **Visualização** | `#sidebar-tab-opcoes` | Cartões: maquete 3D (`#centro-buildings-3d-toggle`) e missão Fase 7 / subsolo (`#centro-subterranean-toggle`, `#subterranean-guide-open`). Toggle subsolo **disabled** quando bloqueado (fase + pistas). |
  | **Território** | `#sidebar-tab-camadas` | Camadas wired (polígonos/linhas). 3 secções narrativas: Centro Histórico, Arquivo dos Soterrados, Contexto Urbano (OSM). Subgrupo **PESADO** colapsado por defeito. |
  | **Evidências** | `#sidebar-tab-pois` | Filtro temático de ícones clicáveis (património + turismo via `addPOILayer`). Toggle `#centro-pistas-rsb-toggle` para pistas Rua São Bento. **Não** duplica toggles do Território. |
- **Tab activa por defeito:** **13 Almas** (`#sidebar-tab-fases`) — `centro-chrome.js` +
  `sidebar-tab--active` no HTML. Território e Evidências começam desmarcados no fresh boot.
- **Dois catálogos** em `centro/data/catalog/`:
  - `layers.json` + `groups.json` → **wired** na sidebar (**10 camadas processed** +
    **5 grupos** processed). Context wired via `context-wired.json` adiciona
    **11 camadas** (**9 grupos** no total na sidebar).
  - `context-layers.json` + `context-groups.json` + `context-wired.json` →
    **11 camadas wired** (OSM ruas/endereços, quadras fiscais, geotecnia, arquivo
    superficial, etc.). Regeneração opcional:
    `npm run sync:geojson-from-salto` → **commitar** os `.geojson`.
  - **Exclusão sidebar (dedup POI):** `sidebar-exclude.json` remove da UI do
    Território (mantém no catálogo para debug) os IDs carregados por
    `addPOILayer`: `centro_memoria_paulistana__point`, `centro_acervo_tombado__point`,
    `centro_bem_arqueologico__point`, `centro_monumentos__point`.
  - **MAP-DATA-GOV-A:** `centro_pois_turisticos__point` continua **fora** de
    `context-wired.json` (só `addPOILayer`).
  - **ARG wired:** `centro_arquivo_superficial__point` permanece no Território
    (secção Arquivo dos Soterrados) — missão, não POI duplicado.
  - Carregamento via `centro/features/catalog-load.js` (`sidebarLayers` filtrado).
- **Superfícies da sidebar (tipografia + cor):** duas camadas visuais —
  **shell escuro** (`#1a1a1a`, tokens `--sidebar-shell-text*`) para tabs, intros,
  secções e metadados; **cartões papel** (`--centro-paper`, `--centro-ink*`) para
  `.layer-row`, `.poi-legend`, `.sidebar-viz-card`. Nunca usar `--centro-ink*` sobre
  fundo escuro (contraste ~2:1). Escala sidebar (2026-07): meta `--sidebar-type-meta`
  (`--fs-sm` ~13px), corpo `--sidebar-type-body` (`--fs-base` 16px), secções
  `--sidebar-type-section` (`--fs-md` ~18px), título header `--sidebar-type-title`
  (`--fs-lg` ~23px). Largura `--sidebar-width: 400px`.
  **Acentos:** interacção/selecção → `--sidebar-accent` (= `--color-brand` âmbar);
  chrome HUD estrutural (borda header, moldura) → `--centro-accent` (vermelho).
  Ver `centro-vars.css` e `docs/design-system/brand-decision.md`.
- **Fundo do mapa:** o body é `#121212` (HUD). O `#map` recebe
  `--map-ground-bg` (`#f8f4f0`) em `centro/styles/layout.css` e o runtime
  força `background-color` no layer `background` do estilo via
  `ensureMapGroundReadable()` no evento `load` — evita void preto enquanto
  os tiles carregam. Não substituir por escuro sem testar inclinação
  (`pitch > 0`) e sem rede.
- **Maquete 3D:** layer `building-3d` (fill-extrusion nativa do estilo
  OpenFreeMap `liberty`). Toggle `#centro-buildings-3d-toggle` na sidebar,
  legenda `#buildings-legend`, persistência em `localStorage`
  (`centroBuildings3D`). Cores e helpers em `vendor/app/config/theme.js`
  (`getBuildings3DExtrusion*`). **Fresh boot:** off (prefs apagadas na 1.ª senha).
  **Visitas seguintes:** restaura `"1"`/`"0"` de storage; respeita
  `prefers-reduced-motion: reduce` (off se o utilizador pede menos movimento).
- **Ponte transmídia (Caderno → Camadas):** algumas camadas ficam
  bloqueadas até o jogador colectar pistas no Arquivo Morto. Mapa em
  `centro/data/catalog/layer-unlocks.json` (`layerId → [clueId, ...]`).
  Runtime lê `localStorage.protocolo13_caderno_clues` via
  `getCollectedClueIds()` e `isLayerUnlocked()`. UI: classes
  `.layer-row--locked`, `.layer-row--clue-locked` (Caderno + link Arquivo Morto),
  `.layer-row--phase-locked` (fase ARG), checkbox `disabled`, toast
  in-character ao tentar activar.
- **13 Almas / 13 Fases (gates unificados):** registo canónico em
  `centro/data/catalog/phase-gates.json` (`version: 2`). Cada fase bloqueia
  **toda** a informação ligada até `protocolo13_phase >= minPhase`:
  | Mapa | Chave | Consumidor |
  |---|---|---|
  | Camadas sidebar/mapa | `layerMinPhase` | `protocolo-phase.js` → `centro-runtime.js` |
  | Temas POI (Evidências) | `themeMinPhase` | `poi-theme-filter.js` |
  | Features transversais | `featureMinPhase` | ver abaixo |
  **`featureMinPhase`:** `pistas-rsb` (2) → `pistas.js`; `subterranean` (7) →
  `subterranean-cutaway.js`; `buildings-3d` (9) → `buildings-3d.js`;
  `street-names-atual` (9) / `street-names-historico` (11) → `street-names.js` +
  `street-labels-overlay.js`; `triangulo-historico` (11) → `syncTrianguloHistoricoOverlay()` no runtime
  (add/remove no mapa; resync em `centro:arg-state-changed` e `storage` cross-tab).
  **Subsolo — gate composto (não só fase):** além de `protocolo13_phase >= 7`,
  exige as 3 pistas `agua-calada`, `aresta-fria`, `peso-fundacao` em
  `protocolo13_caderno_clues` (`REQUIRED_CLUES` em `subterranean-cutaway.js`).
  **`?master=1`:** módulo dedicado `master-mode.js` — define fase **13**,
  injecta clues de revisão (`EXTRA_CLUES`, incl. subsolo + `guardiao-tampa`);
  **não** auto-liga camadas no mapa (`syncReviewConsumers` vazio). Subterranean
  delega unlock a `masterMode.bootstrapReviewUnlocks()`. Bypass do gate de senha
  via `shouldSkipGate()` quando `?master=1` na URL.
  **`souls[]`:** 13 entradas (`alma-01`…`alma-13`) com título por fase; badge
  `#centro-phase-badge` e mensagens de lock usam `formatPhaseLockLabel()` —
  ex.: `Alma 07 — Rasgue o Asfalto`. Avanço automático por pistas só até fase 6
  (`clueCountAdvance`); fases 7–13 via narrativa, `?phase=`, `?master=1` ou
  missão subsolo (**13/13 esferas `subsolo-NN` → `setPhase(8)`** via `alma-07/index.js`).
  **Dois namespaces de ID (não misturar):**
  | Namespace | Exemplo | Fase ARG | Significado |
  |---|---|---|---|
  | `souls[]` / `missions/alma-NN/` | `alma-01` | 1 | Alma ARG «Superfície» — módulo `centro/missions/alma-01/` |
  | `souls[]` / `missions/alma-NN/` | `alma-07` | 7 | Alma ARG «Rasgue o Asfalto» — missão subsolo |
  | `TREZE_ALMAS` (esferas 3D) | `subsolo-01` | *(nenhuma)* | 1.ª esfera da **missão Fase 7** — **não** é a Alma ARG da Fase 1 |
  IDs legados `alma-NN` em `centroSubterraneanUnlockedElements` migram para `subsolo-NN` ao ler.
  API: `getMinPhaseForLayer|Theme|Feature`, `is*PhaseUnlocked`,
  `getSoul(phase)`, `formatPhaseLockLabel(minPhase)`. Evento
  `centro:arg-state-changed` (e listener `storage` para `protocolo13_phase` /
  `protocolo13_caderno_clues`) reaplica sidebar, POI, pistas RSB, 3D, subsolo
  e triângulo histórico via **`arg-resync.js` → `resync()`** (sem wipe de
  overlays marcados pelo jogador). Fluxo detalhado:
  `docs/architecture/map-init-flow.md`. Plano de refactor do runtime:
  `docs/architecture/runtime-refactor-plan.md`.
- **Missões por Alma (`centro/missions/`) — §5.5.1:** um módulo por fase
  narrativa; gates técnicos permanecem em `phase-gates.json`.
- **Módulos satélite em `centro/features/`** (carregados pelo
  `centro/index.html` antes do runtime, na ordem em que aparecem):
  - `centro-access-gate.js` — gate senha `joelma`, fresh-boot flag, reset prefs
  - `layer-unlocks.js`, `protocolo-phase.js`, `catalog-load.js` — catálogo,
    gates de pista e fase
  - `master-mode.js` — bootstrap QA em `?master=1` (fase 13, clues extra)
  - `arg-resync.js` — hub `centro:arg-state-changed` → sidebar, POI, 3D,
    subsolo, triângulo (sem basemap wipe)
  - `sidebar-layer-state.js` — classes/mensagens de lock na sidebar
  - `triangulo-historico.js` — overlay do Triângulo Histórico (polígono derivado da malha OSM)
  - `street-name-utils.js`, `street-names.js` — normalização, gates e modo dev de labels de ruas
  - `pistas.js` — helper de pistas (Rua São Bento), exposto em
    `window.CENTRO.pistas` e consumido pelo runtime
  - `poi-icons.js` — declara as sources/layers symbol de patrimónios e
    turismo, expostas em `window.CENTRO.poiIcons.{POI_TURISTICO_LAYERS,
    MEMORIA_PAULISTANA_LAYERS, …, POI_INTERACTION_LAYER_IDS}`
  - `poi-era-classifier.js` — classificação época/tipologia POI (`poi_era`,
    halos, sub-filtros Evidências)
  - `poi-theme-filter.js`, `buildings-3d.js` — filtros Evidências e maquete 3D
  - `subterranean-cutaway.js` — Visão subterrânea (ES module + Three.js);
    emite `centro:subterranean-progress` ao colectar esferas/geologia
  - `rio-animado.js` **não** é carregado em produção — só em
    `centro/test-full.html`. Tratar como sandbox/harness.
- **Map modules** (`centro/map/`): `basemap-config.js`, `map-safe.js`,
  `layer-data-url.js`, `catalog-layer-controller.js`, `symbol-popup-layer.js`,
  `poi-bootstrap.js`, `triangulo-overlay.js`, `street-labels-overlay.js`, `map-init.js`.
- **UI modules** (`centro/ui/`): `surface-links.js`, `sidebar-panel.js`,
  `sidebar-phases-panel.js`, `sidebar-orchestrator.js`, `sidebar-events.js`,
  `centro-chrome.js`, `investigation-ray.js`, `map-popups.js`, `toast.js`,
  `lazy-assets.js`, etc.
- **Missões** (`centro/missions/`): `alma-01/` … `alma-13/index.js`,
  `registry.js`, `mission-orchestrator.js` — ver §5.5.1.
- POIs/popups via DOM API (`setDOMContent` + `createElement` + `textContent`).
  **`setHTML` é proibido em runtime** — teste guardião em
  `tests/sanity.test.js`. Ver §6 para a regra geral de `innerHTML`.
- **Namespace global controlado** — tudo o que sair de um IIFE entra em
  `window.CENTRO.<subnamespace>` (`window.CENTRO.utils`,
  `window.CENTRO.poiIcons`, `window.CENTRO.pistas`, `window.CENTRO.missions`,
  `window.CENTRO.missionsRegistry`, `window.CENTRO.missionsOrchestrator`, …). Excepções
  permitidas hoje:
  - `window.CENTRO_POIS` — operações `OP:*` para `flyTo` (criada pelo runtime)
  - `window.MAPA_SP_ICONS` — registry de ícones (`vendor/app/config/map-icons.js`)
  - `window.MAPA_SP_HTML` / `window.MAPA_SP_POPUP` / `window.MAPA_SP_CARD`
    — templates DOM-safe partilhados, validados em `validateDependencies`
  - `window.centroToast` — função global de notificação in-runtime
  - **Não adicione `window.foo` novo** sem documentar aqui. Preferir
    estender `window.CENTRO.<algo>` com prefixo claro, ou IIFE fechada.
  - Todos os IIFE no Centro fazem `var U = window.CENTRO.utils;` no topo
    para encurtar acesso a helpers (`U.byId`, `U.log`, …) — manter esse
    padrão em ficheiro novo.

#### 5.5.1 Missões por Alma (`centro/missions/`)

Trabalhar **conteúdo narrativo e passos de missão** fase a fase — **não**
duplicar gates de camada/tema/feature (isso fica em `phase-gates.json`).

| Pasta (`missions/`) | Fase ARG | Título da fase |
|---|---|---|
| `centro/missions/alma-01/` | 1 | Superfície |
| `centro/missions/alma-02/` | 2 | Hidrografia soterrada |
| `centro/missions/alma-03/` | 3 | Património rígido |
| `centro/missions/alma-04/` | 4 | Acervo e memória |
| `centro/missions/alma-05/` | 5 | Geotecnia |
| `centro/missions/alma-06/` | 6 | Arquivo superficial |
| `centro/missions/alma-07/` | 7 | Rasgue o Asfalto |
| `centro/missions/alma-08/` | 8 | Setores interditos |
| `centro/missions/alma-09/` | 9 | Malha urbana |
| `centro/missions/alma-10/` | 10 | Risco sistémico |
| `centro/missions/alma-11/` | 11 | Triângulo fechado |
| `centro/missions/alma-12/` | 12 | Comissão |
| `centro/missions/alma-13/` | 13 | Permanência |

**Ficheiros por alma:** `index.js` (IIFE) regista
`window.CENTRO.missions["alma-NN"] = { create, phase }`. Dentro de
`create(ctx)` implementar `missions[]`, `isComplete()`, `onActivate()`,
`onResync()`. **Registry:** `centro/missions/registry.js` →
`window.CENTRO.missionsRegistry` (`get`, `forPhase`, `createSoul`).

**Ordem no `centro/index.html`:** após `protocolo-phase.js`, carregar
`alma-01/index.js` … `alma-13/index.js`, depois `registry.js`, depois
`mission-orchestrator.js`. O runtime chama `missionsOrchestrator.install()`.

**Fase 7 (implementada):** missão em `alma-07/index.js` (passos, `isComplete()`,
**13/13 → Fase 8**); render 3D/gates ainda em `subterranean-cutaway.js`.
Guia `#subterranean-guide` (Fase 7 — Rasgue o Asfalto) só disponível com **fase ARG ≥ 7**
(`centro-chrome.js` → `syncSubterraneanGuideAccess`). Abre por botões ou clique no cartão
`alma-07` na tab 13 Almas — nunca na Fase 1 (`alma-01`).

**Copy canónica do guia** (`centro/index.html` → `#subterranean-guide`):

| # | Título | Conteúdo (resumo) |
|---|---|---|
| 01 | Reunir clearance do subsolo | Fase 7 + pistas `agua-calada`, `aresta-fria`, `peso-fundacao` no caderno |
| 02 | Activar visão subterrânea | Tab **Visualização** → toggle; tecla `S` na sidebar |
| 03 | Voar para o subsolo | `flyTo` pitch 70°; botão `#subterranean-fly-btn` |
| 04 | Encontrar as 13 esferas vermelhas | Colecta `subsolo-01`…`subsolo-13`; legenda X/13 |
| 05 | Evidências geológicas *(opcional)* | 5 painéis (`CUTAWAY_ITEMS`); não bloqueia avanço |
| 13 | 13/13 esferas — missão concluída | `setPhase(8)` → Alma 08 — Setores interditos |

Rodapé in-game: copy para jogador («guardado neste dispositivo») — **não** expor
`localStorage` nem IDs técnicos. Detalhe dev: `centroSubterraneanUnlockedElements`.
«modo mestre» no guia in-game — `?master=1` / `CENTRO.dev.unlockAlma7()` são só
para QA (ver `docs/almas/alma-07.md`).

**Stubs alma-01…06, 08…13:** regenerar com
`node scripts/scaffold-mission-almas.mjs` se `souls[]` mudar.
Fichas de registo: `node scripts/scaffold-alma-docs.mjs` → `docs/almas/`.

**Namespace:** `window.CENTRO.missions`, `window.CENTRO.missionsRegistry`,
`window.CENTRO.missionsOrchestrator`, `window.CENTRO.ui.openSubterraneanGuide`.
Não criar `window.alma*` solto.

**Eventos:** `centro:subterranean-progress` (colecta subsolo),
`centro:arg-state-changed` (fase/caderno — orchestrator re-sincroniza).

Arquitectura completa: `docs/architecture/missions-almas.md`.
Ficha de registo por alma: `docs/almas/alma-NN.md` (índice em `docs/almas/README.md`).

---

## 6. Segurança aplicada (XSS, CSP, CORS)

- **`setHTML` (MapLibre) e `innerHTML = ${dadoExterno}`** = proibidos em
  runtime. Use `textContent`, `createElement`, `setDOMContent` ou template
  `<template>`. O risco real é **dado externo / não confiável** (props de
  GeoJSON, fetch, query string, localStorage), não a string literal em si.
  Permitidos com revisão: `innerHTML = ""` para limpar; `innerHTML = "<svg…/>"`
  com markup **literal sem interpolação** (ícones inline, templates internos
  do Arquivista). O Centro tem teste guardião contra `setHTML` em
  `tests/sanity.test.js`. Arquivista e Arquivo Morto usam `innerHTML` para
  templates internos sem dado externo — manter assim e revisar caso a caso.
- **Toda URL gerada dinamicamente** em `<a target="_blank">` recebe
  `rel="noopener"`. Para fonts/contatos externos use `rel="noopener noreferrer"`.
- **CSP-friendly**: sem `eval`, sem `new Function`, sem `<script>` inline novo,
  sem `javascript:` em href.
- **Geolocation só com consentimento explícito** do usuário e **nunca**
  enviada a lugar nenhum (não há backend). Hoje o projeto não usa.
- **CORS**: tudo é servido pelo proxy local. Único host externo permitido em
  runtime é `tiles.openfreemap.org` (basemap) e `youtube-nocookie.com`
  (iframe do arquivo-morto). Qualquer host novo exige aprovação.

---

## 7. Playbook MapLibre

Quando o relato é "o mapa está bugado", percorra esta lista **antes** de
mexer em código.

### 7.1 Tela branca / "WebGL não suportado"
MapLibre v5 exige **WebGL2** (v4 aceita v1). Não há fallback Canvas 2D.

Forense:
- `chrome://gpu` → seção *Graphics Feature Status*.
- Se `WebGL: Disabled` → `chrome://settings/system` → habilitar aceleração de
  hardware; ou `chrome://flags` → "Override software rendering list" → Enabled.
- Validação fora do projeto: <https://get.webgl.org/>.

**Sobre 3D:** a maquete estrutural continua a usar **fill-extrusion nativa**
do estilo OpenFreeMap `liberty` (layer `building-3d` — ver §5.5). A exceção
aprovada é a **Visão subterrânea / Fase 7 — Rasgue o Asfalto**, que pode usar
Three.js como `custom layer` MapLibre para renderizar o corte vertical do
subsolo e raycast de elementos clicáveis. Three.js deve ficar vendorizado em
`vendor/three/` via `npm run sync:three`, sem CDN e sem bundler. Não usar
Three.js para substituir POIs, catálogo GeoJSON ou a maquete `building-3d`.

### 7.2 Tiles com texto "Access blocked" ou conteúdo idêntico
Sintoma do incidente 2026-05-22 (OSM servindo placeholder PNG com HTTP 200
para clientes fora da [usage policy](https://operations.osmfoundation.org/policies/tiles/)).
O projecto saiu do basemap raster local para OpenFreeMap vector online —
forense completa, contagem de MD5 e migração estão em
`docs/offline-scope.md` (§ "Histórico — por que abandonamos o bake raster").

**Não voltar** a fazer bulk download de `tile.openstreetmap.org`.

**Regra durável (pegadinha do cache imortal):** **nunca** emitir
`Cache-Control: immutable` em assets que mudam ou que podem ser apagados.
`immutable` só vale para ficheiros content-addressed (hash no path) ou
third-party versionado (`vendor/`). O `server.py` actual obedece — qualquer
alteração que reintroduza cache forte fora de `vendor/` é regressão. Se o
sintoma reaparecer, a vítima limpa via DevTools → *Clear site data* ou aba
anónima.

### 7.3 Labels não aparecem
- `text-font` precisa bater com fontstack presente nos glyphs do **basemap
  atual**. OpenFreeMap default: `Noto Sans Regular` (constante `POI_TEXT_FONT`).
- Se trocar `BASEMAP_STYLE`, confirme fontstack disponível no novo provider.
- MapLibre **falha silenciosamente** se a fonte não existir.
- Diagnóstico:
  ```js
  fetch(map.getStyle().glyphs
    .replace('{fontstack}', 'Noto Sans Regular')
    .replace('{range}', '0-255'))
  ```

### 7.4 Ícone não aparece em layer symbol
- `map.hasImage(id)` antes de `addImage`.
- **SVG não passa por `map.loadImage`** no Chromium (`createImageBitmap`
  retorna `The source image could not be decoded`). Use `loadHtmlImage`.
  Decisão automatizada por `isSvgUrl()`.
- `icon-image` precisa do mesmo `id` usado em `addImage`.
- Ordem de `addLayer` importa: layers depois cobrem layers antes. Para
  inserir abaixo de uma referência, use o segundo argumento (`beforeId`).
  Camadas temáticas da sidebar usam `getCatalogInsertBeforeId()` para ficar
  **abaixo** dos símbolos POI/pistas.

### 7.5 Popup duplicado ou "engole" clique
- Use `bindLayerEventOnce`. Handlers duplicados disparam dois popups e o
  segundo fecha o primeiro.
- `e.features[0].properties` pode ser `null`. Sempre `|| {}`.
- Há handler `click` global atrás de `DEBUG_INSPECTOR`. Em produção ele não
  registra; em debug ele escopa por `{ layers: [...] }`.

### 7.6 `hash: true` "pula" o `center` inicial
- Quando há fragmento `#zoom/lat/lng/bearing/pitch` na URL, MapLibre **usa o
  hash** e ignora `center/zoom/pitch/bearing` do construtor. Por design.
- Para compartilhar links com hash inválido ou fora de `CENTRO_MAX_BOUNDS`,
  o runtime chama `clampViewToCentroBounds()` no evento `load` (revalida com
  `LngLatBounds.contains()` e corrige zoom para `MIN_ZOOM`/`MAX_ZOOM`).

### 7.7 Filtro/expressão silenciosamente não filtra
- MapLibre é estrito com tipos. `["==", ["get", "ano"], "2020"]` falha se
  `ano` no GeoJSON for `Number`. Use `["to-string", ["get", "ano"]]` ou
  normalize no GeoJSON.

### 7.8 MapLibre 5 — restrições derivadas
- `package.json` declara `^5.0.0`. `vendor/maplibre/maplibre-gl.js` (hoje
  na linha 5.x) é sincronizado de `node_modules` por `npm run sync:maplibre`.
  **Compatibilidade com v4 não é alvo** — não restaurar shims antigos.
- WebGL2 é obrigatório (sem fallback Canvas2D). Ver §7.1.
- `map.on()` retorna `Subscription`, **não** `this`. Não encadeie.
- Não chamar `map.setStyle()` em runtime para "trocar tema" — quebra
  sources/layers já adicionadas. Style é constante (`BASEMAP_STYLE`).
- Antes de subir a major (v6 ESM-only): rever todos os `<script defer>`
  que carregam MapLibre e o sync de `vendor/maplibre/`.

### 7.9 Ícones de evidência (POI, pistas, sidebar)

Sistema unificado de marcadores temáticos no mapa — **sem** `maplibregl.Marker`
genérico e **sem** pacote `lucide` (~584 KB) no browser.

#### Arquitetura aprovada: Lucide em build, SVG no runtime

| Camada | O quê | Onde |
|---|---|---|
| **Dev** | `lucide-static` (npm devDependency) | `node_modules/` — nunca servido |
| **Manifest** | nomes Lucide + cores por categoria | `centro/data/icon-manifest.json` |
| **Sync** | copia + template mapa | `npm run sync:lucide-icons` |
| **Runtime** | SVG estático servido pelo proxy | `centro/assets/icons/*.svg` |
| **Registry** | layerId → path | `vendor/app/config/map-icons.js` |

Fluxo (igual ao MapLibre):

```
npm install
  → postinstall: sync-lucide-icons.mjs
  → lê lucide-static/icons/camera.svg
  → escreve centro/assets/icons/icon-pista.svg (disco + cor)
  → browser carrega só o SVG (~1 KB), zero JS Lucide
```

**Registry runtime:** `window.MAPA_SP_ICONS` em `map-icons.js`

| Grupo | Função runtime | Ícones |
|---|---|---|
| Patrimônio (toggle Evidências) | `addPOILayer()` + `poi-theme-filter` | `icon-memoria`, `icon-acervo`, … |
| Pistas Rua São Bento | `addPistasLayer()` | `icon-pista` |
| Sidebar (point toggle) | `addLayerToMap()` → `resolveLayerIcon()` | ex.: `icon-droplets` |

**Design visual (template `disc-forensic`):** paths Lucide via sync, disco
`#fdfbf7` (--centro-paper), borda na cor da categoria, sombra sutil, glifo
stroke `2`. Definido em `centro/data/icon-manifest.json`. No mapa:
`icon-size` ~`0.82` + halo via `getMapIconHaloPaint()` (`#fdfbf7`).

**Paleta de anéis (2026-05):** ver `centro/data/icon-manifest.json`.

**Filtro temático UI:** `#poi-legend` / `#poi-legend-grid` —
`setupPoiThemeFilter()` monta checkboxes a partir de `getThemeFilters()`
(`map-icons.js`: património + turismo; **pistas RSB** têm toggle dedicado
`#centro-pistas-rsb-toggle`, excluídas do grid). Estado persistido em
`localStorage` (`centroPoiThemeFilter`, schema v3). Marcar um **tema** não
liga automaticamente todas as épocas — o jogador escolhe sub-filtros
(`subs[id] === true`). Tema ligado sem subs marcados → nenhum ícone visível.
No `load` do mapa, `runMapBootPolicy()` → `applyAllPoiThemeFilters()` ou
restore de prefs. Labels POI: colisão activa, visíveis a partir de zoom 15.
`getLegendItems()` permanece disponível para listagens estáticas.

**Checklist ao adicionar ícone:**

1. Entrada em `centro/data/icon-manifest.json` (+ `map-icons.js` se camada nova).
2. `npm run sync:lucide-icons` (regenera SVGs; commitar os `.svg` gerados).
   **O script falha** se manifest e `map-icons.js` divergirem (chaves
   órfãs, paths sem entrada, cor ausente) — decisão CAPRI E-02.
3. Teste HTTP 200 em `tests/http.test.js`.
4. **Proibido:** qualquer bundle JS de ícones servido ao browser (`lucide`
   vanilla, `lucide-react`, Heroicons JS, Font Awesome JS, etc.).
   `<script src="lucide">`, `vendor/lucide/` e `createIcons()` em runtime
   ficam fora. SVG estático ou `<symbol>` inline são ok. O padrão é o
   pipeline `lucide-static` em devDependency → sync para `centro/assets/icons/`.

**Pacotes Lucide — quando usar qual:**

| Pacote | Uso neste projeto |
|---|---|
| `lucide-static` | **Sim** — devDependency, sync para SVG |
| `lucide` (vanilla JS) | **Não** — 584 KB no browser, sem bundler/tree-shake |
| `lucide-react` etc. | **Não** — sem React |

**Pegadinha:** `15_osm_enderecos__point` (~20k) → `circle` ou cluster, não symbol.

---

## 8. Acessibilidade

- Todo controle interativo (`<button>`, `<a>`, `<input>`) tem `aria-label`
  ou texto visível em pt-BR.
- Foco visível via `:focus-visible` estilizado em `a11y.css`. **Nunca remova
  `outline` sem substituir.**
- Contraste mínimo WCAG AA (4.5:1). Labels POI do centro usam
  `text-color: #1a1a1a` + halo `#ffffff` 1.5px + blur 0.5. Antes de trocar,
  meça com WebAIM no fundo real.
- `prefers-reduced-motion: reduce` desativa animações decorativas
  (parallax, glitch contínuo, scanlines). Já tratado em a11y.css; não
  contorne com `!important`.
- Atalhos de teclado: `S` alterna sidebar do mapa. Documentar atalho novo
  em `vendor/app/config/ui-texts.js`.
- Imagens decorativas usam `alt=""` ou `aria-hidden="true"`. Imagens
  informativas (banner, marco zero, etc.) usam `alt` descritivo.

---

## 9. Performance

- **Lazy loading** automático para imagens via `MutationObserver` em
  `setupLazyImageObserver` (centro). Para landing/arquivo-morto/arquivista,
  inclua `loading="lazy"` direto na tag.
- **Scripts** com `defer`. Sem `async` (quebra ordem de dependências do app).
- **Catálogo** (`layers.json` + `groups.json`) carregado **uma vez** e
  indexado em `Map`. Nunca refetche por interação.
- **`queryRenderedFeatures`** sempre com `{ layers: [...] }` para escopar.
- **Animações canvas** (landing): limit `requestAnimationFrame` a ~30fps
  quando o canvas estiver fora do viewport (via IntersectionObserver).

---

## 10. Fluxo de trabalho do agente

1. **Ler antes de escrever.** Abra o arquivo afetado, o design system
   relevante e qualquer dado JSON envolvido. Nunca presuma o schema.
2. **Reproduzir antes de corrigir.** Use `?debug=1`, `localStorage.centroDebug=1`,
   ou simplesmente carregue a página em browser limpo (incógnito).
3. **Checar console e Network.** Logs do centro usam `[CENTRO] ...`;
   preserve esse prefixo.
4. **Validar diagnósticos com evidência.** Especialmente diagnósticos de
   outros agentes/LLMs — confirme o sintoma com forense empírica
   (`md5sum`, `find -printf`, devtools) antes de aplicar.
5. **Mudar o mínimo.** Esta base prioriza coerência narrativa e
   estabilidade visual sobre refactor.
6. **Atualizar catálogo / fixtures.** Se adicionar layer, post, comando CLI
   ou rota narrativa, registre no índice apropriado.
7. **Rodar `npm run ci`** (ou `npm test`). Toda a suíte deve permanecer
   verde — **173 testes** (144 sanity + 29 HTTP) · ver `docs/testing/`.
8. **Atualizar `AGENT.md`** se mudar uma convenção transversal.
9. **Actualizar `docs/almas/alma-NN.md`** quando entregar missão dessa fase.

---

## 11. Definição de Pronto

Tarefa só está concluída quando:

- [ ] Carrega sem erro em `http://127.0.0.1:8080/centro/` (neste repo; landing/arquivo-morto/arquivista em repos irmãos).
- [ ] Devtools console sem erros vermelhos durante interação normal.
- [ ] Network sem 404 em assets locais.
- [ ] Visual coerente com a página (paleta, tipografia, data-theme).
- [ ] pt-BR em todo texto visível ao jogador.
- [ ] `aria-label` em todo controle interativo novo.
- [ ] Sem `setHTML` / `innerHTML` com dados externos. Auditável:
      `rg 'setHTML|innerHTML\s*=' centro/ landing/ arquivo-morto/ arquivista/`.
- [ ] `prefers-reduced-motion` respeitado em qualquer animação nova.
- [ ] `npm test` verde — ver §10.
- [ ] Sem **runtime dependency** nova em `package.json` salvo exceções
      aprovadas neste documento (hoje: `three` para a Visão subterrânea).
      DevDependencies para test/sync/lint seguem fluxo normal de PR — ver §12.

---

## 12. Quando recusar ou pedir esclarecimento

Pare e pergunte antes de:

- Adicionar **runtime dependency** (algo carregado pelo browser): bundle
  npm, CDN, serviço online novo. Basemap OpenFreeMap e YouTube embed do
  arquivo-morto já estão aprovados; qualquer host novo exige discussão.
  devDependencies (test, sync, lint) seguem fluxo normal de PR.
- Trocar `BASEMAP_STYLE` (afeta visual, glyphs, sprite e a presença do
  layer `building-3d` em todos os zooms).
- Apagar ou renomear arquivos em `centro/data/processed/`,
  `centro/data/context/`, `centro/data/catalog/`, `arquivo-morto/posts/`,
  `arquivo-morto/assets/`, `arquivista/data/`,   `centro/assets/pistas/` ou
  `landing/assets/` (mídia da landing). Os ícones em `centro/assets/icons/` são
  **regenerados** por `npm run sync:lucide-icons` — renomear via
  `icon-manifest.json` está ok desde que o sync rode em seguida.
- Alterar a estrutura do catálogo (`layers.json` / `groups.json` /
  `context-layers.json` / `context-groups.json` / `layer-unlocks.json`).
- Mexer em senhas narrativas (`SENHA = 'apoio'` na landing, `marco zero` no
  arquivista) — são parte do design narrativo, não bugs.
- Modificar o email/telefone de contato em CTAs de patrocínio.
- Alterar `MAPLIBRE_LOCALE_PT_BR` ou strings **narrativas** (copy da
  landing, posts do arquivo-morto, comandos do CLI do arquivista, nomes
  de OP:*, glossário do ARG). Microcorrecções de UI técnica (`Carregando…`,
  `Camadas`, mensagens de toast neutro) podem entrar com revisão de pt-BR.
- Voltar a baixar tiles em massa de `tile.openstreetmap.org` (viola usage
  policy — esse foi o incidente que motivou OpenFreeMap).
- Ampliar uso de Three.js para além da Visão subterrânea / Fase 7 (§7.1).

### 12.1 Dívida tolerada — não "limpar" por iniciativa própria

Itens **ainda abertos** (reabrir só com gate CAPRI):

| Item | Estado | Onde está |
|---|---|---|
| `centro/centro-runtime.js` (~745 linhas) | Parcial — R1–R6 extraíram POI, triângulo, sidebar, ARG resync, chrome, map-init | `centro/map/`, `centro/ui/`, `centro/features/` |
| `arquivista/js/script.js` (~846 linhas) | Parcial — `open-application.js` extrai dock/apps; script principal ainda grande | `arquivista/js/` |
| `04a_zeis2__polygon` (cidade inteira) | Só **5 polígonos** no viewport do mapa (clip bbox); não intersecta `16_regiao_centro` | `sync:geojson-from-salto` |
| Fases 2–6, 8–13 (missões narrativas) | **Scaffold** — módulos `centro/missions/alma-NN/` + fichas `docs/almas/`; gates em `phase-gates.json` | `mission-orchestrator.js` |
| Fase 7 subsolo (render 3D) | Missão **implementada** (`alma-07`); Three.js ainda em `subterranean-cutaway.js` | `centro/missions/alma-07/` |
| Contraste WCAG AA formal (outros pares) | Parcial — corrigidos `.as-digital-aviso` e `nav-retorno` terminal; resto em `docs/accessibility/contrast-notes.md` | design system |
| Playwright browser E2E | HTTP + smoke manual cobrem regressões; Playwright opcional se instalar browsers | `docs/testing/smoke-centro.md` |
| PMTiles offline Brasil | Fora de scope — ver `docs/offline-scope.md` | — |
| `map-icons.js` gerado só do manifest (E-02 fase 2) | DEFER — hoje manifest + `map-icons.js` em paridade manual via sync | `scripts/sync-lucide-icons.mjs` |

**Implementado (2026-05–07):** context wired (**21 camadas** sidebar, 9 grupos), OSM ruas/endereços/quadras, `sync:geojson-from-salto`, triângulo overlay com resync por fase, deep-link `?clues=` e `?phase=`, `phase-gates.json` v2, sidebar 4 tabs (default **13 Almas**), badge `#centro-phase-badge`, boot híbrido (`runMapBootPolicy`), módulos `buildings-3d.js` / `poi-theme-filter.js` / `subterranean-cutaway.js` / `master-mode.js`, refactor runtime R1–R6, **missões por alma** (`centro/missions/`, `docs/almas/`, Fase 7 com avanço 13/13→8), execution map em `docs/architecture/map-init-flow.md`.

---

## 13. Glossário do ARG

- **Protocolo 13 Almas** — codinome do projeto inteiro.
- **Arquivo / ARQUIVO//SP** — identidade visual e brand da landing.
- **O Arquivista** — personagem central; "operador" não identificado que
  vaza dossiês. Voz dos textos do arquivo-morto.
- **Comissão de Alinhamento** — antagonista narrativo. Não é entidade real.
- **Caderno do Arquivista** — UI lateral no arquivo-morto onde clue-words
  clicadas são acumuladas. Persistido em `localStorage`.
- **Pista** — `<button class="clue-word">` no arquivo-morto **ou** symbol layer
  com `.pista-popup` no centro (`addPistasLayer`, ícone `icon-pista`). São
  conceitos paralelos.
- **POI** — ponto de interesse cartográfico (centro): memória paulistana,
  acervo tombado, bem arqueológico, monumento.
- **Setor** — polígono de interdição/controle territorial no centro.
- **Eixo** — linha de fluxo (controle primário, expansão) no centro.
- **Anomalia fluviária** — cicatriz de rio soterrado (Saracura, Itororó,
  Anhangabaú original) no centro.
- **OP:** — operação de navegação no centro. Cada `OP:*` é um `flyTo`
  pré-configurado em `window.CENTRO_POIS`.
- **Aresta Fria** — codinome in-character da Rua São Bento.
- **Dossiê** — termo polivalente: pode ser o módulo Centro inteiro, um post
  do arquivo-morto, ou uma seção da landing (`#sobre`).
- **Cota** — nível de patrocínio (Rastro, Vestígio, Arquivo Vivo,
  Permanência Digital). Estão na seção patrocínio da landing.

---

**Lembrete final:** Cada superfície é uma entrada. Todas as pistas levam
ao mesmo arquivo. Quando você mexe em uma parte, lembre-se de que o
jogador chegou aqui por outra — e tem F12 aberto. Trabalhe como se cada
commit fosse um envelope lacrado sendo entregue à investigação dele.
