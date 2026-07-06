# Matriz de testes — projeto_centro

**Suíte automatizada:** `npm test` → **173 testes** (144 sanity + 29 HTTP) · verificado 2026-07-06

> **Nota:** landing, arquivo-morto e arquivista vivem em repos irmãos — testes abaixo focam no **Centro** servido por este repositório.

## Automatizados (sanity)

| ID | Caso | Entrada | Comando |
|---|---|---|---|
| TC-001 | HTML raiz redireciona `/centro/` | `index.html` | `npm test` |
| TC-003 | Centro scripts locais | `centro/index.html` | `npm test` |
| TC-004 | Runtime parseável | `centro-runtime.js` | `npm test` |
| TC-011 | Sem JS inline no centro | `centro/index.html` | `npm test` |
| TC-013 | addPOILayer idempotente | `poi-bootstrap.js` | `npm test` |
| TC-014 | Sem bundle Lucide no runtime | HTML + runtime | `npm test` |
| TC-016 | Listeners UI sidebar/nav | `centro-runtime.js` | `npm test` |
| TC-029 | centroToast sem inline | `centro-runtime.js` | `npm test` |
| TC-035 | Filtro temático POI na sidebar | `#poi-legend`, `getThemeFilters` | `npm test` |
| TC-036 | Persistência filtro POI v3 | `loadState` + `localStorage` | `npm test` |
| TC-037 | Ícones Lucide SVG distintos | `centro/assets/icons/` | `npm test` |
| TC-038 | resolveLayerIcon + halo | `map-icons.js`, runtime | `npm test` |
| TC-039 | Sidebar 4 tabs + default 13 Almas | `centro-chrome.js` | `npm test` |
| TC-040 | phase-gates.json v2 | `phase-gates.json` + features | `npm test` |
| TC-041 | Boot híbrido + arg-resync triângulo | `runMapBootPolicy`, `arg-resync.js` | `npm test` |

## Automatizados (HTTP — server.py porta 9876)

| ID | Caso | Saída esperada |
|---|---|---|
| TC-021 | `/centro/index.html` | 200, `no-cache` |
| TC-022 | `/vendor/maplibre/maplibre-gl.js` | 200, immutable |
| TC-023 | GeoJSON + SVG POI | todos 200 |
| TC-024 | Basemap local + proxy `/basemap/` | `liberty.json`, `vercel.json` |
| TC-024b | Bake antigo removido | `osm-style.json` ≠ 200; tiles locais ≠ 200 |
| TC-027 | Módulos CSS centro | todos 200 |
| TC-028 | `/landing/` removido | 404 |

## Smoke manual (browser)

Ver [smoke-centro.md](./smoke-centro.md).

| ID | Caso | Prioridade |
|---|---|---|
| TC-030 | Console limpo | Alta |
| TC-031 | POIs + filtro temático (tema + épocas) | Alta |
| TC-032 | flyTo OP:* | Média |
| TC-033 | Sidebar 4 tabs + catálogo **21 camadas** | Média |
| TC-034 | Triângulo após `?phase=11` sem wipe de overlays | Média |
| TC-035 | Fresh boot: senha → mapa limpo; reload → prefs mantidas | Alta |

## Acessibilidade manual — TC-010

> Viewport 375×812 · `python3 server.py` · foco visível MVP (não WCAG 2.2 AA completo)

| Página | Foco Tab OK |
|---|---|
| `/centro/` | 11/11 |

Landing, Arquivo Morto e Arquivista são testados nos repos irmãos (`dossie_landing_portal`, `dossie_arquivo_morto`, `dossie_arquivista`).

Detalhes de contraste: [../accessibility/contrast-notes.md](../accessibility/contrast-notes.md).

## CI local

Sem GitHub Actions. Rodar `npm run ci` antes de push: [ci-local.md](./ci-local.md).

## Expansão futura

| ID | Caso | Tipo |
|---|---|---|
| TC-006 | landing → centro (cross-repo) | e2e |
| TC-010b | axe-core `/centro/` | a11y |

Ver também: [../offline-scope.md](../offline-scope.md), [../stack.md](../stack.md).
