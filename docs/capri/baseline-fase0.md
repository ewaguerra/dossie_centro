# Baseline Fase 0 — projeto_centro

> **Data de registro:** 2026-05-21  
> **Escopo:** estado inicial pós-plano CAPRI, antes de fechamento de pendências de auditoria.

## Comandos de verificação

```bash
npm test
python3 server.py 8080
```

## Suíte de testes (baseline congelado)

| Métrica | Valor |
|---|---|
| Comando | `npm test` |
| Arquivos | `tests/sanity.test.js`, `tests/http.test.js` |
| Total | **35** |
| Passando | **35** |
| Falhas | **0** |

## Greps de baseline (estado esperado)

| Termo | Resultado esperado |
|---|---|
| `function addPOILayer` em `centro/` | **1** (`centro-runtime.js`) |
| `centro-main.js` | **ausente** |
| `bindProfileCardEffect` | **0** ocorrências |
| `rioAnimationFrame` / `rioAnimationStart` | **0** em `centro/` |
| `lucide` (runtime centro) | **0** em HTML/runtime |
| `vendor/three` | **0** paths |
| `onclick=` em `centro/index.html` | **0** |
| `<script>` inline em `centro/index.html` | **0** |

## Assets HTTP críticos (via `server.py`)

Todos devem retornar **200**:

- `/centro/index.html`
- `/pages/centro/centro-runtime.js`
- `/osm-style.json`
- `/vendor/maplibre/maplibre-gl.js`
- GeoJSON + SVG dos 4 POIs (ver `tests/http.test.js`)

## Headers de cache (`server.py`)

| Path | Cache-Control |
|---|---|
| `/vendor/*`, `/app/vendor/*` | `public, max-age=31536000, immutable` |
| `*.html` | `no-cache` |
| `*.js`, `*.css` | `public, max-age=3600` |
| demais | `public, max-age=300` |

## Runtime de produção

- **Entrada:** `centro/index.html`
- **JS principal:** `centro/centro-runtime.js`
- **Harness dev (não produção):** `centro/test-full.html`

## Limitações conhecidas no baseline

Ver `docs/capri/offline-scope.md`, `docs/capri/wcag-contrast-notes.md`, `docs/capri/smoke-centro.md`.
