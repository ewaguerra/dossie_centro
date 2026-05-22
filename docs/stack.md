# Stack — projeto_centro

> Referência da stack em uso. Atualizar quando mudar versões, basemap ou contagem de testes.

**Verificado:** 2026-05-22 · comando: `npm run ci`

| Tecnologia | Versão | Origem | Notas |
|---|---|---|---|
| MapLibre GL JS | 5.24.x | `vendor/maplibre/` via `npm run sync:maplibre` | Self-host; sem CDN |
| Basemap | OpenFreeMap `liberty` | `tiles.openfreemap.org` | Online; ver [offline-scope.md](./offline-scope.md) |
| Ícones mapa | Lucide paths | `lucide-static` (dev) → `centro/assets/icons/*.svg` | Browser não carrega JS Lucide |
| Runtime Centro | — | `centro/centro-runtime.js` | IIFE vanilla, sem bundler |
| Servidor dev | Python 3 | `server.py` | Proxy + cache headers |
| Testes | node:test | `tests/sanity.test.js`, `tests/http.test.js` | **103 testes** (`npm run ci`) |
| Node.js | ≥18 | `package.json` `engines` | CI local na máquina da autora |

## Scripts npm

| Script | Função |
|---|---|
| `npm test` / `npm run ci` | Sanity + HTTP (sobe `server.py` na porta 9876) |
| `npm run healthcheck:centro` | Valida catálogo temático offline |
| `npm run sync:maplibre` | Copia MapLibre de `node_modules` para `vendor/` |
| `npm run sync:lucide-icons` | Regenera SVGs + valida paridade manifest ↔ `map-icons.js` |

## Catálogo de camadas (Centro)

| Catálogo | Wired no runtime | Notas |
|---|---|---|
| `layers.json` + `groups.json` | **Sim** — sidebar | 9 camadas temáticas com GeoJSON no disco |
| `layer-unlocks.json` | **Sim** — sidebar bloqueada | Exige `protocolo13_caderno_clues` (Arquivo Morto) |
| `context-layers.json` | **Não** (inventário) | 15 entradas; 13 com ficheiro; OSM ruas/endereços ausentes |

Camadas **fora de scope** até haver dados:

| ID / tema | Motivo |
|---|---|
| `15_osm_ruas__line`, `15_osm_enderecos__point` | GeoJSON ausente no disco (não wired) |
| `centro_pois_turisticos__point` (context) | Já servido por `addPOILayer` — evita duplicata na sidebar |
| `04a_zeis2__polygon` | GeoJSON vazio — WONT FIX até geometria (CAPRI G-07) |
| Macroáreas SP completas, regiões além do Centro | Roadmap produto |

Fluxo de init: [architecture/map-init-flow.md](./architecture/map-init-flow.md).

## Limitações aceitas

| Tópico | Documento |
|---|---|
| Basemap online | [offline-scope.md](./offline-scope.md) |
| Contraste WCAG parcial | [accessibility/contrast-notes.md](./accessibility/contrast-notes.md) |
| Smoke WebGL manual | [testing/smoke-centro.md](./testing/smoke-centro.md) |
| 13 fases ARG | Roadmap produto — não implementadas |

## CI

Repositório **privado**, sem GitHub Actions. Ver [testing/ci-local.md](./testing/ci-local.md).
