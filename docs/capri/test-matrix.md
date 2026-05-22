# Test Matrix — projeto_centro

## Matriz de Testes (automatizados)

| ID | Caso | Tipo | Entrada | Saída Esperada | Comando | Status |
|---|---|---|---|---|---|---|
| TC-001 | HTML raiz existe e redireciona | sanity | `index.html` | Arquivo presente, contém "landing" | `npm test` | passing |
| TC-002 | Landing carrega | sanity | `landing/index.html` | HTML parseável | `npm test` | passing |
| TC-003 | Centro carrega com scripts locais | sanity | `centro/index.html` | maplibre + runtime externo | `npm test` | passing |
| TC-004 | Runtime extraído parseável | sanity | `centro/centro-runtime.js` | `new Function()` OK | `npm test` | passing |
| TC-005 | CSS crítico existe | sanity | `centro/centro-sidebar.css` | Arquivo existe | `npm test` | passing |
| TC-011 | Sem JS inline no centro | sanity | `centro/index.html` | 0 `<script>` sem `src` | `npm test` | passing |
| TC-012 | Sem handlers inline | sanity | `centro/index.html` | 0 `onclick=` etc. | `npm test` | passing |
| TC-013 | addPOILayer único | sanity | `centro-runtime.js` | 1 definição idempotente | `npm test` | passing |
| TC-014 | Lucide ausente | sanity | centro HTML/runtime | sem referências | `npm test` | passing |
| TC-015 | Rio animação morta removida | sanity | `rio-animado.js`, runtime | sem `rioAnimationFrame` | `npm test` | passing |
| TC-016 | Event listeners UI | sanity | `centro-runtime.js` | `setupSidebarToggle`, `setupNarrativeNav` | `npm test` | passing |
| TC-021 | HTTP centro + runtime | http | `/centro/index.html` | 200, `no-cache` | `npm test` | passing |
| TC-022 | HTTP vendor cache | http | `/vendor/maplibre/maplibre-gl.js` | 200, immutable 1y | `npm test` | passing |
| TC-023 | HTTP assets POI | http | 4 geojson + 4 svg | todos 200 | `npm test` | passing |
| TC-024 | osm-style offline | http | `/osm-style.json` | tiles/glyphs locais, sem `https://` em URLs de recurso | `npm test` | passing |
| TC-024a | Tile raster manifest | http | `/centro/assets/tiles/manifest.json` | sample tile 200 | `npm test` | passing |
| TC-024b | Glyph PBF local | http | `/vendor/maplibre/fonts/.../0-255.pbf` | 200 octet-stream | `npm test` | passing |
| TC-025 | Arquivista sem unpkg | sanity | `arquivista/index.html` | MapLibre local | `npm test` | passing |
| TC-026 | Design system tokens/a11y | sanity | 4 páginas HTML | `/app/styles/tokens.css` + `a11y.css` | `npm test` | passing |
| TC-027 | Centro CSS modular HTTP | http | 8 módulos `centro/styles/` | todos 200 | `npm test` | passing |
| TC-028 | narrative-nav mobile | sanity | `narrative-nav.css` | sem ocultar flyTo | `npm test` | passing |
| TC-029 | centroToast sem inline | sanity | `centro-runtime.js` | classes `.toast` | `npm test` | passing |
| TC-029a | Landing CTAs `.btn` DS | sanity | `landing/index.html` | brand-solid/ghost/subtle | `npm test` | passing |

## Smoke manual (browser WebGL)

Ver `docs/capri/smoke-centro.md` — TC-030 a TC-039.

| ID | Caso | Tipo | Prioridade |
|---|---|---|---|
| TC-030 | Console limpo (sem erros JS) | smoke | Alta |
| TC-031 | 4 POIs SVG visíveis | smoke | Alta |
| TC-032 | flyTo botões OP | smoke | Média |
| TC-033 | Sidebar + camadas | smoke | Média |
| TC-034 | Mapa raster offline (sem rede) | smoke | Alta |

## TC-010 — Acessibilidade teclado (evidência MVP)

> **Tipo:** a11y manual + Playwright · **Data:** 2026-05-22 · **Viewport:** 375×812  
> **Ambiente:** `python3 server.py` · **Claim:** foco visível MVP — **não** constitui WCAG 2.2 AA completo.

### Foco visível (Tab sequencial)

| Página | Elementos focáveis | `:focus-visible` OK | Notas |
|---|---|---|---|
| `/landing/` | 10/10 | 10/10 | CTAs `.btn` DS adoptados |
| `/arquivo-morto/` | 10/10 | 10/10 | — |
| `/arquivista/` | 8/8 | 8/8 | `.dock-item` div sem tabindex — **fora do Tab** (dívida) |
| `/centro/` | 11/11 | 11/11 | incl. `#sidebar-toggle`, `.nav-btn` |

### Centro 375px — narrative-nav + flyTo

| Verificação | Resultado |
|---|---|
| `#narrative-nav` visível | flex 368×53px, in viewport |
| Botão `OP:SÉ` flyTo | hash mapa alterado após clique |
| `.nav-btn` focável | `:focus-visible` com outline token |

### Mapa offline (Network)

| Request | Status |
|---|---|
| `/centro/assets/tiles/15/12139/18590.png` | 200 |
| `/vendor/maplibre/fonts/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf` | 200 |
| `osm-style.json` — tiles/glyphs | paths locais (sem fetch externo) |

### Pendências TC-010 (não resolvidas nesta fase)

- axe-core / Lighthouse contraste automatizado
- Arquivista `.dock-item` por teclado
- Zoom 200%, ARIA completo, leitor de ecrã

## Expansão futura

| ID | Caso | Tipo | Prioridade |
|---|---|---|---|
| TC-006 | Navegação landing → centro | e2e | Média |
| TC-010b | axe-core em `/centro/` com mapa | a11y | Média |

Ver também: `docs/capri/wcag-contrast-notes.md`, `docs/capri/offline-scope.md`, `docs/capri/baseline-fase0.md`.

## Relação com Gate TC

Estado actual da suíte automatizada: **58/58 passando** (`npm test`, 2026-05-22) — 41 sanity + 17 HTTP + 2 suites.

Regenerar mapa offline: `node scripts/bake-centro-tiles.mjs` (1378 tiles + 32 glyph PBF).
