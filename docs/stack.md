# Stack — projeto_centro

> Referência da stack em uso. Atualizar quando mudar versões, basemap ou contagem de testes.

**Verificado:** 2026-07-06 · comando: `npm run ci`

| Tecnologia | Versão | Origem | Notas |
|---|---|---|---|
| MapLibre GL JS | 5.24.x | `vendor/maplibre/` via `npm run sync:maplibre` | Self-host; sem CDN |
| Basemap | OpenFreeMap `liberty` | `tiles.openfreemap.org` / proxy `/basemap/` | Online; ver [offline-scope.md](./offline-scope.md) |
| Three.js | ^0.18x | `vendor/three/` via `npm run sync:three` | Só Visão subterrânea (Fase 7) |
| Ícones mapa | Lucide paths | `lucide-static` (dev) → `centro/assets/icons/*.svg` | Browser não carrega JS Lucide |
| Runtime Centro | — | `centro/centro-runtime.js` | IIFE vanilla + `subterranean-cutaway.js` (ES module) |
| Servidor dev | Python 3 | `server.py` | Proxy + cache headers; Windows: `python server.py` |
| Deploy | Vercel | `vercel.json` | Rewrites `/centro/`; proxy `/basemap/`; ver README |
| Testes | node:test | `tests/sanity.test.js`, `tests/http.test.js` | **144 sanity + 29 HTTP = 173** (`npm run ci`) |
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
| `context-wired.json` + `context-groups.json` | **Sim** — sidebar Território | **11** camadas context (OSM, quadras fiscais, geotecnia, arquivo superficial, etc.) |
| `sidebar-exclude.json` | **Sim** — filtro UI | Remove POIs duplicados do Território (continuam via `addPOILayer`) |
| `layer-unlocks.json` | **Sim** — sidebar bloqueada | Exige `protocolo13_caderno_clues` (Arquivo Morto) |
| `phase-gates.json` | **Sim** — fases ARG | `layerMinPhase`, `themeMinPhase`, `featureMinPhase`, `souls[]` |
| `context-layers.json` | **Inventário** | Referência; wired real em `context-wired.json` |

**Total sidebar:** 21 camadas wired, 9 grupos narrativos.

Camadas **fora de scope** até haver dados:

| ID / tema | Motivo |
|---|---|
| `centro_pois_turisticos__point` (context) | Já servido por `addPOILayer` — evita duplicata na sidebar |
| POIs patrimoniais (`sidebar-exclude.json`) | Carregados por `addPOILayer` + filtro Evidências |

## Boot policy (2026-07)

| Momento | Comportamento |
|---|---|
| 1ª senha (`joelma`) | Prefs apagadas; `runMapBootPolicy` → mapa limpo, tab 13 Almas |
| Visitas seguintes | `restoreSavedMapPreferences` — toggles e filtros POI persistidos |
| Resync ARG | `arg-resync.resync()` — gates only; **sem** wipe de overlays |

Ver `AGENT.md` §5.5 e [architecture/map-init-flow.md](./architecture/map-init-flow.md).
