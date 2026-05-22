# Matriz de testes — projeto_centro

**Suíte automatizada:** `npm test` → **84 testes** (66 sanity + 18 HTTP) · verificado 2026-05-22

## Automatizados (sanity)

| ID | Caso | Entrada | Comando |
|---|---|---|---|
| TC-001 | HTML raiz redireciona landing | `index.html` | `npm test` |
| TC-002 | Landing parseável | `landing/index.html` | `npm test` |
| TC-003 | Centro scripts locais | `centro/index.html` | `npm test` |
| TC-004 | Runtime parseável | `centro-runtime.js` | `npm test` |
| TC-011 | Sem JS inline no centro | `centro/index.html` | `npm test` |
| TC-012 | Sem handlers inline | 4 páginas | `npm test` |
| TC-013 | addPOILayer idempotente | `centro-runtime.js` | `npm test` |
| TC-014 | Sem bundle Lucide no runtime | HTML + runtime | `npm test` |
| TC-016 | Listeners UI sidebar/nav | `centro-runtime.js` | `npm test` |
| TC-025 | Arquivista MapLibre local | `arquivista/index.html` | `npm test` |
| TC-026 | tokens.css + a11y.css | 4 páginas | `npm test` |
| TC-029 | centroToast sem inline | `centro-runtime.js` | `npm test` |
| TC-035 | Filtro temático POI na sidebar | `#poi-legend`, `getThemeFilters` | `npm test` |
| TC-036 | Persistência filtro POI | `POI_THEME_STORAGE_KEY` | `npm test` |
| TC-037 | Ícones Lucide SVG distintos | `centro/assets/icons/` | `npm test` |
| TC-038 | resolveLayerIcon + halo | `map-icons.js`, runtime | `npm test` |

## Automatizados (HTTP — server.py porta 9876)

| ID | Caso | Saída esperada |
|---|---|---|
| TC-021 | `/centro/index.html` | 200, `no-cache` |
| TC-022 | `/vendor/maplibre/maplibre-gl.js` | 200, immutable |
| TC-023 | GeoJSON + SVG POI | todos 200 |
| TC-024 | OpenFreeMap no runtime | URL `tiles.openfreemap.org` |
| TC-024b | Bake antigo removido | `osm-style.json` ≠ 200; tiles locais ≠ 200 |
| TC-027 | Módulos CSS centro | todos 200 |

## Smoke manual (browser)

Ver [smoke-centro.md](./smoke-centro.md).

| ID | Caso | Prioridade |
|---|---|---|
| TC-030 | Console limpo | Alta |
| TC-031 | POIs + filtro temático | Alta |
| TC-032 | flyTo OP:* | Média |
| TC-033 | Sidebar + catálogo | Média |

## Acessibilidade manual — TC-010

> Viewport 375×812 · `python3 server.py` · foco visível MVP (não WCAG 2.2 AA completo)

| Página | Foco Tab OK |
|---|---|
| `/landing/` | 10/10 |
| `/arquivo-morto/` | 10/10 |
| `/arquivista/` | 8/8 (dock fora do Tab — dívida) |
| `/centro/` | 11/11 |

Detalhes de contraste: [../accessibility/contrast-notes.md](../accessibility/contrast-notes.md).

## CI local

Sem GitHub Actions. Rodar `npm run ci` antes de push: [ci-local.md](./ci-local.md).

## Expansão futura

| ID | Caso | Tipo |
|---|---|---|
| TC-006 | landing → centro | e2e |
| TC-010b | axe-core `/centro/` | a11y |

Ver também: [../offline-scope.md](../offline-scope.md), [../stack.md](../stack.md).
