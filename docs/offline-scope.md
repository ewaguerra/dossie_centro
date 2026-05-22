# Escopo offline — projeto_centro

> Define o que funciona **sem internet** após `python3 server.py`.

**Atualizado:** 2026-05-22 — basemap migrado de OSM raster offline (bake quebrado) para **OpenFreeMap vector tiles online** (gratuito, sem chave).

---

## Histórico — por que abandonamos o bake raster offline

O bake original (`scripts/bake-centro-tiles.mjs`) baixava tiles de `tile.openstreetmap.org` violando a [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/): User-Agent sem URL/email real, bulk download de 1378 tiles, throttle de ~8 req/s. A OSM detectou e passou a servir um **PNG placeholder de "Access blocked"** com HTTP 200 para todas as requisições.

Validação forense pós-incidente (2026-05-22):

```
1378 PNG em centro/assets/tiles/
todos com tamanho idêntico (6987 bytes)
todos com MD5 idêntico (c069a15b2cc2d6b6f527ad09eb93c61a)
→ todos são o mesmo placeholder "Access blocked"
```

Removidos na migração: `osm-style.json`, `centro/assets/tiles/`, `vendor/maplibre/fonts/`, `scripts/bake-centro-tiles.mjs`.

---

## Estado atual

### Online (depende de rede)

| Recurso | Origem | Tipo |
|---|---|---|
| Basemap (tiles + glyphs + sprite) | `https://tiles.openfreemap.org/styles/liberty` | Vector tiles gratuitas (OpenFreeMap) |
| Style alternativo | `liberty` / `positron` / `bright` / `dark-matter` | Trocável em `BASEMAP_STYLE` do runtime |

OpenFreeMap é open-source, sem chave, sem limite. Dados originais OSM (ODbL). [openfreemap.org](https://openfreemap.org/)

### Offline garantido (app local)

| Recurso | Origem |
|---|---|
| HTML/CSS/JS do Centro | `centro/`, `vendor/`, proxy `/app/*` |
| MapLibre GL JS | `vendor/maplibre/` (sync'd de `node_modules` via `npm run sync:maplibre`) |
| GeoJSON, catálogo, ícones POI | `centro/data/`, `centro/assets/` |
| Imagens de pistas locais | `centro/assets/pistas/*.jpg` |

---

## Caminho para offline completo (opcional, futuro)

Se houver requisito de cartografia 100% offline, OpenFreeMap disponibiliza **PMTiles** baixáveis:

- Brasil completo: ~2.5 GB (`.pmtiles`)
- Servir via `pmtiles://` protocol no MapLibre + `pmtiles` JS plugin

Não está no escopo atual. Documentado em [openfreemap.org/self_hosting](https://openfreemap.org/self_hosting/).

---

## Requer rede (fora do mapa)

| Recurso | URL | Impacto |
|---|---|---|
| YouTube embed (arquivo-morto) | `youtube-nocookie.com` | Vídeo anexo; página legível sem iframe |
| Links/fontes em metadados GeoJSON | diversos | Só afetam links em popups |

---

## Restrição "sem CDN no runtime"

A regra visava **proibir bundle JS/CSS via CDN** (Lucide, Three.js, jQuery etc.).

OpenFreeMap não é "CDN de bundle" — é **fonte de dados cartográficos** servidos via HTTPS:

- ✓ Sem CDN de JS/CSS (MapLibre em `vendor/maplibre/`)
- ✓ Sem chave de API
- ✓ Sem rastreamento de usuário
- ✓ Licença ODbL respeitada (atribuição via `attributionControl`)

---

## Testes automatizados

- `http.test.js`: runtime aponta para OpenFreeMap; `osm-style.json` e tiles locais retornam ≠ 200.
- `sanity.test.js`: `BASEMAP_STYLE`, ícones, filtro temático POI.
- `npm test` — suíte completa (82 testes).

Smoke browser: [testing/smoke-centro.md](./testing/smoke-centro.md).
