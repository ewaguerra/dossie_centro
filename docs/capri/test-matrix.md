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
| TC-024 | osm-style glyphs | http | `/osm-style.json` | campo `glyphs` presente | `npm test` | passing |
| TC-025 | Arquivista sem unpkg | sanity | `arquivista/index.html` | MapLibre local | `npm test` | passing |

## Smoke manual (browser WebGL)

Ver `docs/capri/smoke-centro.md` — TC-030 a TC-039.

| ID | Caso | Tipo | Prioridade |
|---|---|---|---|
| TC-030 | Console limpo (sem erros JS) | smoke | Alta |
| TC-031 | 4 POIs SVG visíveis | smoke | Alta |
| TC-032 | flyTo botões OP | smoke | Média |
| TC-033 | Sidebar + camadas | smoke | Média |

## Expansão futura

| ID | Caso | Tipo | Prioridade |
|---|---|---|---|
| TC-006 | Navegação landing → centro | e2e | Média |
| TC-010 | Acessibilidade teclado + axe | a11y | Média |

Ver também: `docs/capri/wcag-contrast-notes.md`, `docs/capri/offline-scope.md`, `docs/capri/baseline-fase0.md`.

## Relação com Gate TC

Estado atual da suíte automatizada: **35/35 passando** (`npm test`, 2026-05-21).
