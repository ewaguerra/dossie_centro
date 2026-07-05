# Smoke manual — `/centro/`

Checklist pós-alteração no mapa. Itens parciais também via `node scripts/smoke-centro.mjs`.

## Pré-requisitos

```bash
npm run ci                 # 167/167
python3 server.py          # http://127.0.0.1:8080
node scripts/smoke-centro.mjs   # assets + console (parcial)
```

Abrir: **http://127.0.0.1:8080/centro/**

**Basemap:** OpenFreeMap online (`tiles.openfreemap.org`). Sem rede, o mapa base não carrega; app local (HTML, GeoJSON, ícones) continua servido. Ver [../offline-scope.md](../offline-scope.md).

## Checklist

| # | Verificação | OK |
|---|---|---|
| 1 | DevTools Console: sem erros vermelhos de JS | ☐ |
| 2 | Network: runtime, GeoJSON, ícones SVG → **200** | ☐ |
| 3 | Basemap vector visível **com internet** | ☐ |
| 4 | **4 ícones POI** patrimoniais visíveis | ☐ |
| 5 | Filtro temático `#poi-legend`: abrir/fechar bloco; marcar/desmarcar oculta camadas | ☐ |
| 6 | Clique em POI abre popup | ☐ |
| 7 | Botões OP:* fazem flyTo | ☐ |
| 8 | `#sidebar-toggle` e tecla `S` alternam sidebar | ☐ |
| 9 | Sidebar lista grupos de camadas após load | ☐ |
| 10 | Pistas Rua São Bento (symbol layer) com popup | ☐ |
| 11 | Triângulo Histórico (overlay preto) visível com fase ≥ 11 | ☐ |
| 11b | Avançar fase para 11 (`?phase=11`) **sem reload** → overlay aparece | ☐ |
| 12 | Sidebar: grupos context (Topografia, Património, Geotécnica…) + OSM ruas/endereços | ☐ |
| 12b | ZEIS-2 em Controlo Zonal (5 polígonos no viewport; off por defeito) | ☐ |
| 13 | Camada bloqueada → toast; `?clues=agua-calada` desbloqueia hidro | ☐ |
| 14 | Subsolo: exige fase 7 + 3 pistas; toggle disabled quando bloqueado | ☐ |
| 15 | Guia missão: abre só por botão (13 Almas ou Visualização), fecha com ✕ / Escape | ☐ |

## Headless

`node scripts/smoke-centro.mjs` — HTTP assets + console. POIs/flyTo interativos exigem browser real.

## Foco + mobile (375px)

Evidência manual 2026-05-22 — ver **TC-010** em [test-matrix.md](./test-matrix.md).
