# Baseline — projeto_centro

> Snapshot de referência para comparar regressões futuras.

**Atualizado:** 2026-07-06

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
| Total | **173** (144 sanity + 29 HTTP) |
| Passando | **173** |

## Greps de baseline

| Termo | Esperado |
|---|---|
| `function addPOILayer` em `centro/` | **1** |
| `centro-main.js` | ausente |
| `rioAnimationFrame` em runtime produção | **0** |
| `BASEMAP_STYLE` | contém `openfreemap.org` |
| `osm-style.json` na raiz | ausente |
| Bundle `lucide` no HTML centro | ausente |
| `scheduleBasemapOnlyBoot` | ausente |
| Sidebar wired | **21 camadas** (10 processed + 11 context) |

## Funcionalidades congeladas neste baseline

- POIs patrimoniais via `addPOILayer` + filtro temático Evidências (schema v3, sub-filtros época)
- Pistas Rua São Bento (toggle dedicado)
- Boot híbrido: fresh boot limpo; visitas seguintes restauram prefs
- Basemap OpenFreeMap liberty
- MapLibre 5.x em `vendor/maplibre/`
- Tab sidebar default: **13 Almas**

## Docs relacionadas

- [stack.md](./stack.md)
- [offline-scope.md](./offline-scope.md)
- [testing/test-matrix.md](./testing/test-matrix.md)
