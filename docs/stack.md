# Stack — projeto_centro

> Referência da stack em uso. Atualizar quando mudar versões, basemap ou contagem de testes.

**Verificado:** 2026-07-05 · comando: `npm run ci`

| Tecnologia | Versão | Origem | Notas |
|---|---|---|---|
| MapLibre GL JS | 5.24.x | `vendor/maplibre/` via `npm run sync:maplibre` | Self-host; sem CDN |
| Basemap | OpenFreeMap `liberty` | `tiles.openfreemap.org` | Online; ver [offline-scope.md](./offline-scope.md) |
| Three.js | ^0.18x | `vendor/three/` via `npm run sync:three` | Só Visão subterrânea (Fase 7) |
| Ícones mapa | Lucide paths | `lucide-static` (dev) → `centro/assets/icons/*.svg` | Browser não carrega JS Lucide |
| Runtime Centro | — | `centro/centro-runtime.js` | IIFE vanilla + `subterranean-cutaway.js` (ES module) |
| Servidor dev | Python 3 | `server.py` | Proxy + cache headers; Windows: `python server.py` |
| Testes | node:test | `tests/sanity.test.js`, `tests/http.test.js` | **139 sanity + 28 HTTP = 167** (`npm run ci`) |
| Node.js | ≥18 | `package.json` `engines` | CI local na máquina da autora |

## Scripts npm

| Script | Função |
|---|---|
| `npm test` / `npm run ci` | Sanity + HTTP (sobe `server.py` na porta 9876) |
| `npm run healthcheck:centro` | Valida catálogo temático offline |
| `npm run sync:maplibre` | Copia MapLibre de `node_modules` para `vendor/` |
| `npm run sync:three` | Copia Three.js para `vendor/three/` |
| `npm run sync:lucide-icons` | Regenera SVGs + valida paridade manifest ↔ `map-icons.js` |

## Catálogo de camadas (Centro)

| Catálogo | Wired no runtime | Notas |
|---|---|---|
| `layers.json` + `groups.json` | **Sim** — sidebar Território | **10** camadas processed |
| `context-wired.json` + `context-groups.json` | **Sim** — sidebar Território | **10** camadas context (OSM ruas/endereços, geotecnia, arquivo superficial, etc.) |
| `sidebar-exclude.json` | **Sim** — filtro UI | Remove POIs duplicados do Território (continuam via `addPOILayer`) |
| `layer-unlocks.json` | **Sim** — sidebar bloqueada | Exige `protocolo13_caderno_clues` (Arquivo Morto) |
| `phase-gates.json` | **Sim** — fases ARG | `layerMinPhase`, `themeMinPhase`, `featureMinPhase`, `souls[]` |
| `context-layers.json` | **Inventário** | Referência; wired real em `context-wired.json` |

**Total sidebar:** 20 camadas wired, 9 grupos narrativos.

Camadas **fora de scope** até haver dados:

| ID / tema | Motivo |
|---|---|
| `centro_pois_turisticos__point` (context) | Já servido por `addPOILayer` — evita duplicata na sidebar |
| `04a_zeis2__polygon` (fora do viewport) | 386 na cidade; **5** no bbox do mapa — ver `sync:geojson-from-salto` |
| Macroáreas SP completas, regiões além do Centro | Roadmap produto |

Fluxo de init: [architecture/map-init-flow.md](./architecture/map-init-flow.md).

## Gates ARG (implementados)

| Mecanismo | Ficheiro | Estado |
|---|---|---|
| Fases 1–13 (camadas, temas, features) | `phase-gates.json` v2 | **Implementado** |
| Avanço automático por contagem de pistas | `clueCountAdvance` (até fase 6) | **Implementado** |
| Subsolo Fase 7 + 3 pistas (`REQUIRED_CLUES`) | `subterranean-cutaway.js` | **Implementado** |
| Conteúdo narrativo fases 7–13 | posts, missões, copy | **Roadmap** |

## Limitações aceitas

| Tópico | Documento |
|---|---|
| Basemap online | [offline-scope.md](./offline-scope.md) |
| Contraste WCAG parcial | [accessibility/contrast-notes.md](./accessibility/contrast-notes.md) |
| Smoke WebGL manual | [testing/smoke-centro.md](./testing/smoke-centro.md) |
| Playwright E2E | Opcional — HTTP + smoke manual cobrem regressões |

## CI

Repositório **privado**, sem GitHub Actions. Ver [testing/ci-local.md](./testing/ci-local.md).
