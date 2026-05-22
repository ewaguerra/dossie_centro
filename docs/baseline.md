# Baseline — projeto_centro

> Snapshot de referência para comparar regressões futuras.

**Atualizado:** 2026-05-22

## Comandos

```bash
npm run ci
python3 server.py 8080
```

## Suíte de testes

| Métrica | Valor |
|---|---|
| Comando | `npm run ci` / `npm test` |
| Arquivos | `tests/sanity.test.js`, `tests/http.test.js` |
| Total | **103** |
| Passando | **103** |

## Greps de baseline

| Termo | Esperado |
|---|---|
| `function addPOILayer` em `centro/` | **1** |
| `centro-main.js` | ausente |
| `rioAnimationFrame` em runtime produção | **0** |
| `BASEMAP_STYLE` | contém `openfreemap.org` |
| `osm-style.json` na raiz | ausente |
| Bundle `lucide` no HTML centro | ausente |

## Funcionalidades congeladas neste baseline

- 4 POI patrimoniais (symbol + SVG)
- Pistas Rua São Bento (symbol layer)
- Filtro temático `#poi-legend` + `centroPoiThemeFilter`
- Basemap OpenFreeMap liberty
- MapLibre 5.x em `vendor/maplibre/`

## Docs relacionadas

- [stack.md](./stack.md)
- [offline-scope.md](./offline-scope.md)
- [testing/test-matrix.md](./testing/test-matrix.md)
