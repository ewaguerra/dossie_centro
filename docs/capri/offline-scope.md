# Escopo offline — projeto_centro

> Define o que funciona **sem internet** após `python3 server.py`.

## Offline garantido (app local)

| Recurso | Origem |
|---|---|
| HTML/CSS/JS do Centro | `centro/`, `vendor/`, proxy `/app/*` |
| MapLibre GL JS | `vendor/maplibre/` (Centro e Arquivista) |
| GeoJSON, catálogo, ícones POI | `centro/data/`, `centro/assets/` |
| Imagens de pistas locais | `centro/assets/pistas/*.jpg` |

## Requer rede (pré-existente, fora do escopo CAPRI atual)

| Recurso | URL | Impacto |
|---|---|---|
| Tiles basemap OSM | `tile.openstreetmap.org` | Mapa raster vazio offline |
| Glyphs MapLibre (labels POI) | `demotiles.maplibre.org` | Labels de texto POI omitidos; ícones SVG permanecem |
| YouTube embed (arquivo-morto) | `youtube-nocookie.com` | Vídeo anexo; página funciona sem carregar iframe |
| Links/fontes em metadados GeoJSON | diversos | Só afetam links em popups |

**Texturas decorativas:** removidas de CDN — ver [offline-textures.md](../design-system/offline-textures.md).

## Restrição “sem CDN” no monorepo

- **Centro:** sem CDN em runtime de produção ✓
- **Arquivista:** MapLibre migrado para `/vendor/maplibre/*` (2026-05-21) ✓
- **Landing / arquivo-morto:** verificar individualmente se necessário

## Self-host futuro (opcional)

Para offline total do mapa:

1. Tiles raster locais ou MBTiles + source no `osm-style.json`
2. Glyphs em `vendor/fonts/` ou path relativo no style
3. Substituir textura CSS por asset em `centro/assets/`
