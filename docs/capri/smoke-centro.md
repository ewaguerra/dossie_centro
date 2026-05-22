# Smoke manual — `/centro/`

> Checklist pós-correção CAPRI. Itens 1–2 também cobertos por `node scripts/smoke-centro.mjs`.

## Pré-requisitos

```bash
npm test                    # 58/58
python3 server.py           # http://127.0.0.1:8080
node scripts/smoke-centro.mjs   # assets + console (parcial)
```

Abrir: **http://127.0.0.1:8080/centro/index.html**

**Mapa offline:** tiles em `centro/assets/tiles/`; glyphs em `vendor/maplibre/fonts/`. Regenerar: `node scripts/bake-centro-tiles.mjs`.

## Checklist

| # | Verificação | OK |
|---|---|---|
| 1 | DevTools Console: sem erros vermelhos de JS | ☑ |
| 2 | Network: runtime, GeoJSON, **tiles locais**, **glyphs locais** → **200** | ☑ |
| 3 | Mapa raster OSM visível **sem internet** | ☑ |
| 4 | **4 ícones POI SVG** visíveis no viewport central | ☑ |
| 5 | Clique em POI abre popup | ☑ |
| 6 | Botões OP:* fazem flyTo | ☑ |
| 7 | `#sidebar-toggle` e tecla `S` alternam sidebar | ☑ |
| 8 | Sidebar lista grupos de camadas após load | ☑ |
| 9 | 4 markers de pistas (Rua São Bento) com popup | ☑ |

## Headless / CI

`node scripts/smoke-centro.mjs` — assets HTTP + console (SwiftShader). POIs/flyTo interactivos: browser real ou Playwright (TC-010).

## Foco + mobile (375px)

Evidência Playwright 2026-05-22 — ver **TC-010** em [test-matrix.md](./test-matrix.md).
