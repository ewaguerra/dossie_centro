# Stack — projeto_centro

> Referência da stack em uso. Atualizar quando mudar versões, basemap ou contagem de testes.

**Verificado:** 2026-05-22 · comando: `npm test`

| Tecnologia | Versão | Origem | Notas |
|---|---|---|---|
| MapLibre GL JS | 5.24.x | `vendor/maplibre/` via `npm run sync:maplibre` | Self-host; sem CDN |
| Basemap | OpenFreeMap `liberty` | `tiles.openfreemap.org` | Online; ver [offline-scope.md](./offline-scope.md) |
| Ícones mapa | Lucide paths | `lucide-static` (dev) → `centro/assets/icons/*.svg` | Browser não carrega JS Lucide |
| Runtime Centro | — | `centro/centro-runtime.js` | IIFE vanilla, sem bundler |
| Servidor dev | Python 3 | `server.py` | Proxy + cache headers |
| Testes | node:test | `tests/sanity.test.js`, `tests/http.test.js` | **82** testes (`npm test`) |
| Node.js | ≥18 | `package.json` `engines` | CI local na máquina da autora |

## Scripts npm

| Script | Função |
|---|---|
| `npm test` | Sanity + HTTP (sobe `server.py` na porta 9876 dentro do http.test) |
| `npm run ci` | Alias da suíte completa — rodar antes de `git push` |
| `npm run sync:maplibre` | Copia MapLibre de `node_modules` para `vendor/` |
| `npm run sync:lucide-icons` | Regenera SVGs a partir de `centro/data/icon-manifest.json` |

## Limitações aceitas

| Tópico | Documento |
|---|---|
| Basemap online | [offline-scope.md](./offline-scope.md) |
| Contraste WCAG parcial | [accessibility/contrast-notes.md](./accessibility/contrast-notes.md) |
| Smoke WebGL manual | [testing/smoke-centro.md](./testing/smoke-centro.md) |

## CI

Repositório **privado**, sem GitHub Actions (zero minutos / zero custo). Ver [testing/ci-local.md](./testing/ci-local.md).
