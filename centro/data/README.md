# Zona Centro — Dados locais (contexto urbano)

Este diretório contém snapshots GeoJSON usados pela página `pages/centro/` (MapLibre), gerados a partir de dados OSM/Overpass e recortados pelo polígono oficial do Centro.

## Limite oficial do Centro (contorno laranja)

- **Arquivo**: `pages/centro/data/processed/16_regiao_centro__polygon.geojson`
- **Uso**: contorno/outline no mapa e recorte espacial para gerar contexto urbano

## Contexto urbano (camadas do sidebar)

Arquivos:

- **Ruas e Vias**: `pages/centro/data/context/15_osm_ruas__line.geojson`
  - **Origem**: `data/osm/raw/15_osm_ruas__line.json`
  - **Observação**: cobertura efetivamente completa do bbox do Centro após rebuild

- **Endereços e Números**: `pages/centro/data/context/15_osm_enderecos__point.geojson`
  - **Origem**: `data/osm/raw/15_osm_enderecos__point.json`
  - **Observação**: cobertura pode ser parcial por disponibilidade real do OSM
  - **UX**: pontos aparecem em `minzoom >= 16`; labels (números) em `minzoom >= 17`

Metadados:

- Catálogo: `pages/centro/data/catalog/context-layers.json`
  - Campos relevantes: `coverage`, `coverageNote`, `minzoom`, `maxzoom`, `style.paint`

## Como regenerar (com autorização explícita)

1) Baixar OSM via Overpass para o bbox do Centro (com padding técnico):

```bash
python scripts/baixar_osm_filtros.py --allow-external --area centro --only 15_osm_ruas__line 15_osm_enderecos__point
```

2) Recortar e gerar snapshots locais do Centro:

```bash
python scripts/build_centro_urban_context.py
```

## Nota importante

O contorno laranja é **um limite** (a “cerca”), não uma garantia de densidade homogênea de endereços/números em toda a área. A disponibilidade de `addr:housenumber` no OSM varia por trecho.

