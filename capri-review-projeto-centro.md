# CAPRI Review — projeto_centro

## Estado consolidado (2026-05-21, pós-fechamento de pendências)

- Gate de testes automatizados: **35/35** passando (`npm test`).
- Baseline formal: `docs/capri/baseline-fase0.md`.
- HTML principal válido (`centro/index.html`): declarativo, sem `<style>` em `<script>`, sem JS/handlers inline.
- Runtime JS: `centro/centro-runtime.js` (IIFE, bootstrap + mapa + POI + UI).
- POI: implementação única idempotente de `addPOILayer`; ícones SVG locais.
- Legado removido: `centro-main.js`, Lucide, Three.js, `bindProfileCardEffect`, animação de rio.
- Handlers: `setupSidebarToggle`, `setupNarrativeNav` (sem `onclick` inline).
- Cache HTTP: `server.py` com política por tipo de asset (testada em `tests/http.test.js`).
- Arquivista: MapLibre self-host (`/vendor/maplibre/*`), sem unpkg.
- Docs CAPRI: `test-matrix.md`, `tech-evidence-card.md`, `offline-scope.md`, `wcag-contrast-notes.md`, `smoke-centro.md`.

## Evidências objetivas

| Verificação | Resultado |
|---|---|
| `npm test` | 35/35 passando |
| Assets POI (4 geojson + 4 svg) | HTTP 200 |
| `/pages/centro/centro-runtime.js` | HTTP 200 |
| Cache vendor | `max-age=31536000, immutable` |
| grep `bindProfileCardEffect` | 0 |
| grep `rioAnimationFrame` / `rioAnimationStart` em `centro/` | 0 |
| grep `unpkg.com` (exc. node_modules) | 0 |

## Limitações aceitas (documentadas)

| Tópico | Documento | Status |
|---|---|---|
| Offline parcial (tiles OSM + glyphs remotos) | `docs/capri/offline-scope.md` | ACCEPTED |
| Contraste WCAG parcial | `docs/capri/wcag-contrast-notes.md` | ACCEPTED |
| Smoke browser WebGL | `docs/capri/smoke-centro.md` | Ver registro de execução |

## Gate VERIFIED

- **Automatizado:** GO (35/35, smoke parcial assets+console OK).
- **Completo:** requer smoke manual TC-030–033 em browser real (WebGL).

## Riscos residuais

- POIs e console só comprovados visualmente via smoke (não headless sem GPU).
- Basemap depende de rede (`osm-style.json` → tile.openstreetmap.org).
