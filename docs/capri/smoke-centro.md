# Smoke manual — `/centro/`

> Checklist pós-correção CAPRI. Itens 1–2 também cobertos por `node scripts/smoke-centro.mjs`.

## Pré-requisitos

```bash
npm test                    # 35/35
python3 server.py           # http://127.0.0.1:8080
node scripts/smoke-centro.mjs   # assets + console (parcial)
```

Abrir: **http://127.0.0.1:8080/centro/index.html**

## Checklist

| # | Verificação | OK |
|---|---|---|
| 1 | DevTools Console: sem erros vermelhos de JS (warnings de tile rede aceitáveis se offline) | ☑ |
| 2 | Network: `centro-runtime.js`, 4 SVG POI, 4 GeoJSON → **200** | ☑ |
| 3 | Mapa raster OSM visível (requer rede) | ☐ |
| 4 | **4 ícones POI SVG** visíveis no viewport central | ☐ |
| 5 | Clique em POI abre popup | ☐ |
| 6 | Botões OP:TRIÂNGULO / SÉ / ANHANGABAÚ / GERAL fazem flyTo | ☐ |
| 7 | `#sidebar-toggle` e tecla `S` alternam sidebar | ☐ |
| 8 | Sidebar lista grupos de camadas após load | ☐ |
| 9 | 4 markers de pistas (Rua São Bento) com popup | ☐ |

## Headless / CI

`scripts/smoke-centro.mjs` valida **12 assets HTTP** + **0 erros JS** no console (Chrome headless).  
WebGL/mapas/POIs visíveis **não** validados em headless (`webglHeadless: failed`).

## Registro de execução

| Data | Executor | Resultado | Notas |
|---|---|---|---|
| 2026-05-21 | `scripts/smoke-centro.mjs` | **PARTIAL PASS** | 12/12 assets 200; 0 erros JS console; WebGL headless indisponível |
| 2026-05-21 | auditoria headless inicial | INCONCLUSIVE | WebGL context failed |

## Gate VERIFIED — smoke

- **Automatizado (TC-030 parcial + TC-023):** PASS
- **Visual/interativo (TC-031–033, itens 3–9):** pendente browser com GPU (~2 min manual)
