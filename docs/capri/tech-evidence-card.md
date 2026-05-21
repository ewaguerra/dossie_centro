# Tech Evidence Card — projeto_centro

## Stack detection (Ciclo 1B — maio 2026, pós-CAPRI)

| Tecnologia | Versão | Fonte | Status | Evidência |
|---|---|---|---|---|
| MapLibre GL JS | 4.7.1 | `vendor/maplibre/maplibre-gl.js` | VERIFIED | Self-host em Centro e Arquivista; sem unpkg. |
| Runtime Centro | n/a | `centro/centro-runtime.js` | VERIFIED | IIFE; bootstrap + mapa + POI + UI. |
| Ícones UI | SVG inline | `centro/index.html` | VERIFIED | Lucide removido. |
| Cache HTTP | n/a | `server.py` | VERIFIED | Testes HTTP assertam Cache-Control. |
| Testes | node:test | `tests/*.test.js` | VERIFIED | 35/35 passando. |
| JavaScript | ES modules / IIFE | Nativo browser | VERIFIED | Sem bundler. |
| HTML5 / CSS3 | W3C | Nativo browser | VERIFIED | `centro/index.html` declarativo. |
| Node.js | >=18 | `package.json` | VERIFIED | Engine >=18. |

## Limitações documentadas

| Tópico | Doc | Status |
|---|---|---|
| Offline parcial (tiles/glyphs remotos) | `offline-scope.md` | ACCEPTED |
| Contraste WCAG parcial | `wcag-contrast-notes.md` | ACCEPTED (dívida visual) |
| Smoke browser WebGL | `smoke-centro.md` | PARTIAL (`scripts/smoke-centro.mjs` OK) |
| Baseline Fase 0 | `baseline-fase0.md` | REGISTERED |

## Riscos

| Risco | Mitigação |
|---|---|
| Regressão POI / runtime | TC-013, TC-023, smoke TC-031 |
| CDN residual | TC-025; grep unpkg no monorepo |
| Console errors | Smoke TC-030 em browser real |

## Harness dev (não produção)

`centro/test-full.html` — integração opcional com `rio-animado.js`; produção usa `centro/index.html` apenas.
