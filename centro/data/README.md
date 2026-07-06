# Zona Centro — Dados locais

Snapshots GeoJSON e contratos de catálogo usados pela página `/centro/` (MapLibre), recortados pelo polígono oficial do Centro.

**Gate DATA-ORG-B1** (2026-05-23): documentação de responsabilidades — nenhum arquivo foi movido neste gate.

**Gate DATA-ORG-B2** (2026-05-23): relatórios não-runtime movidos para `reports/` — runtime, catálogos e GeoJSON intocados.

Genealogia detalhada, fluxos de carregamento e exceções oficiais: [`docs/data-lineage.md`](../../docs/data-lineage.md).

---

## Organização atual

| Pasta | Função | Runtime? |
|---|---|---|
| `catalog/` | 7 contratos JSON (sidebar, gates ARG) | sim |
| `processed/` | GeoJSON urbanístico principal | sim |
| `context/` | GeoJSON contextual (OSM, patrimônio, geotécnica) | sim |
| `raw/` | fontes brutas preserváveis | não |
| `reports/` | build, match, audit, legacy | **não** |
| raiz | `icon-manifest.json` | sim |

`reports/` **não é servido ao browser** nem lido pelo runtime — audit trail de pipeline e curadoria.

---

## Responsabilidades (estado no disco)

### `catalog/` — contratos do runtime

Arquivos que o runtime e os testes usam para montar sidebar, gates ARG e validar coverage:

| Arquivo | Função |
|---|---|
| `layers.json` | 10 camadas processed da sidebar |
| `groups.json` | grupos da sidebar processed |
| `context-layers.json` | 15 camadas contextuais inventariadas |
| `context-groups.json` | grupos das contextuais |
| `context-wired.json` | subset de 14 IDs wired na sidebar |
| `layer-unlocks.json` | `layerId → [clueId, …]` (Caderno do Arquivista) |
| `phase-gates.json` | `layerId → fase mínima` (gates ARG) |

### `processed/` — camadas tratadas (runtime principal)

GeoJSON urbanístico central: subsetores, ZEIS, eixos, hidrografia, alagamentos, contorno do Centro.

- Contorno oficial (outline laranja): `processed/16_regiao_centro__polygon.geojson`
- Toda entrada tem 1:1 em `catalog/layers.json`
- Fetch **sob demanda** quando checkbox marcada; algumas camadas têm `visible: true` e baixam no boot

### `context/` — GeoJSON contextual (runtime)

Somente `.geojson` — relatórios foram para `reports/` (DATA-ORG-B2).

| Categoria | Padrão | Exemplo |
|---|---|---|
| Camada wired (sidebar) | `*.geojson` | `centro_rios_geosampa__line.geojson` |

POI turístico (`centro_pois_turisticos__point`) foi para `geojson/special/pois/` (B4B-2).
Fóssil Rua São Bento foi para `archive/fossils/` (B5) — runtime usa `assets/pistas/`.

Catálogo: `catalog/context-layers.json` + filtro `catalog/context-wired.json`.

### `reports/` — relatórios e fósseis de auditoria (não runtime)

| Subpasta | Conteúdo |
|---|---|
| `build/` | `build_report.json`, `context_build_report.json`, `*_build_report.json` (12) |
| `poi/` | match, proximity, audit, missing, cards de POIs turísticos |
| `three-d/` | match/missing da Catedral Sé 3D |
| `legacy/` | `knowledge.generated.json`, `data_freshness_report.json` |

`context_build_report.json` é escrito por `npm run sync:geojson-from-salto` em `reports/build/`.

### `raw/` — fonte bruta preservável

| Arquivo | Função |
|---|---|
| `geosampa_rios_centro_raw.geojson` | insumo bruto GeoSampa → derivado `context/centro_rios_geosampa__line.geojson` |

Nunca servido ao browser. Audit trail do pipeline.

### Raiz de `centro/data/`

| Arquivo | Natureza |
|---|---|
| `icon-manifest.json` | contrato de ícones (runtime) |

---

## Estrutura-alvo (parcialmente aplicada)

Reorganização **dentro** de `centro/data/` — não outro repositório. Cada gaveta confessa sua função:

```text
centro/data/
├── README.md                 ← este arquivo
│
├── catalog/                  ← só contrato runtime (7 JSON) ✓
│   ├── layers.json
│   ├── groups.json
│   ├── context-layers.json
│   ├── context-groups.json
│   ├── context-wired.json
│   ├── layer-unlocks.json
│   └── phase-gates.json
│
├── geojson/                  ← heavy/ ✓ (B3B); special/ ✓ (B4B-1, B4B-2)
│   ├── processed/            ← hoje: processed/ (raiz)
│   ├── context/              ← hoje: context/ (sem reports) ✓
│   ├── heavy/                ← 3 GeoJSON heavy ✓ (B3B)
│   └── special/
│       ├── pois/             ← centro_pois_turisticos ✓ (B4B-2)
│       └── arg/              ← centro_arquivo_superficial ✓ (B4B-1)
│
├── raw/                      ← fontes brutas preserváveis ✓
│
├── reports/                  ← build/match/audit/legacy ✓ (DATA-ORG-B2)
│   ├── build/
│   ├── poi/
│   ├── three-d/
│   └── legacy/
│
└── archive/
    └── fossils/              ← centro_pistas_rua_sao_bento ✓ (B5)
```

### Regra de `geojson/heavy/`

```text
Nada em heavy/ deve carregar no boot.
Tudo em heavy/ deve ser manual, gated, lazy ou tileado no futuro.
```

Camadas na política heavy/default-off (em `geojson/heavy/` desde DATA-ORG-B3B-move):

| ID | Arquivo | Tamanho | Features | Catálogo |
|---|---|---:|---:|---|
| `15_osm_ruas__line` | `geojson/heavy/15_osm_ruas__line.geojson` | ~4,2 MB | 10.108 | `weightClass: heavy`, `loadPolicy: manual`, `visible: false` |
| `15_osm_enderecos__point` | `geojson/heavy/15_osm_enderecos__point.geojson` | ~7,5 MB | 23.932 | `weightClass: heavy`, `loadPolicy: manual`, `visible: false` |
| `centro_bem_tombado__polygon` | `geojson/heavy/centro_bem_tombado__polygon.geojson` | ~3,2 MB | 2.974 | `weightClass: heavy`, `loadPolicy: manual`, `visible: false` |

Estes três arquivos representam ~83% do peso total GeoJSON.

### Regra de `geojson/special/`

Dados runtime com fluxo especial fora do checkbox padrão:

- `pois/centro_pois_turisticos__point.geojson` — `addPOILayer`, fora de `context-wired` (**B4B-2**)
- `streets/centro_ruas_nomes__line.geojson` — labels de nomes actuais/históricos; gerado por `npm run build:street-names`; activado com `15_osm_ruas__line` (**STREET-NAMES**)
- `arg/centro_arquivo_superficial__point.geojson` — camada ARG wired (**B4B-1**)

`centro_pois_turisticos__point` é carregado no boot por `addPOILayer` via `POI_TURISTICO_LAYER_FILE`.
Permanece em `context-layers.json` (catálogo conhece props) mas **fora** de
`context-wired.json`.

`centro_ruas_nomes__line` é derivado de `15_osm_ruas__line` + `catalog/street-names-catalog.json`.
Regenerar: `npm run build:street-names`. Consumido por `street-labels-overlay.js` quando a
Malha de Circulação está activa.

`triangulo-historico.js` deriva o polígono das ruas OSM (`STREET_NAMES_LAYER_FILE` / `STREETS_LAYER_FILE`).

`centro_arquivo_superficial__point` é **on-after-unlock**: `visible: true` no catálogo,
mas phase gate fase 6 + `layer-unlocks` (`guardiao-tampa`) impedem fetch antes do desbloqueio.

Pistas Rua São Bento **não** moram aqui: runtime usa `centro/assets/pistas/rua-sao-bento-pistas.json`.

---

## Fósseis em `archive/fossils/` (DATA-ORG-B5)

Artefatos históricos **não-runtime**, preservados por audit trail:

| Arquivo | Motivo |
|---|---|
| `archive/fossils/centro_pistas_rua_sao_bento__point.geojson` | 390 B, 1 feature, placeholder; pistas reais em `centro/assets/pistas/rua-sao-bento-pistas.json` |

---

## Ordem de execução (gates)

| Gate | Escopo | Status |
|---|---|---|
| **DATA-ORG-B1** | Documentar responsabilidades (este README) | **feito** |
| **DATA-PERF-D1** | `15_osm_ruas`: `visible: true → false` | **feito** (2026-05-23) |
| **DATA-ORG-B2** | Mover relatórios não-runtime → `reports/` | **feito** (2026-05-23) |
| **DATA-ORG-B3B-metadata** | `weightClass` / `loadPolicy` no catálogo heavy | **feito** (2026-05-23) |
| **DATA-ORG-B3B-resolver** | `buildLayerDataUrl` + `geojson/heavy/` | **feito** (2026-05-23) |
| **DATA-ORG-B3B-move** | Mover 3 GeoJSON → `geojson/heavy/` | **feito** (2026-05-23) |
| **DATA-ORG-B4B-1** | Mover ARG → `geojson/special/arg/` | **feito** (2026-05-23) |
| **DATA-ORG-B4B-2** | Mover POI turístico → `geojson/special/pois/` | **feito** (2026-05-23) |
| **DATA-ORG-B5** | Mover fósseis → `archive/fossils/` | **feito** (2026-05-23) |

Próximo passo organizacional: ver [`docs/data-org-summary-c.md`](../../docs/data-org-summary-c.md)
(síntese final B1–B5). Gates sugeridos: **DATA-PERF-POI-DEDUP**, **GEO-POI-DEDUP** / **DATA-META**.

---

## Limite oficial do Centro (contorno laranja)

- **Arquivo**: `processed/16_regiao_centro__polygon.geojson`
- **Uso**: contorno/outline no mapa e recorte espacial para gerar contexto urbano

---

## OSM — ruas e endereços

| Camada | Arquivo | Default boot | Observação |
|---|---|---|---|
| Malha de Circulação | `geojson/heavy/15_osm_ruas__line.geojson` | off (`visible: false`) | wired; activável na sidebar |
| Endereços e Números | `geojson/heavy/15_osm_enderecos__point.geojson` | off (`visible: false`) | cobertura parcial OSM; labels em `minzoom >= 17` |

Metadados: `catalog/context-layers.json` (`coverage`, `minzoom`, `style.paint`).

**Origem (manutenção):** `npm run sync:geojson-from-salto` a partir de `mapa_sp_salto`; ficheiros servidos **daqui** em produção.

### Regenerar (com autorização explícita)

1. Baixar OSM via Overpass para o bbox do Centro:

```bash
python scripts/baixar_osm_filtros.py --allow-external --area centro --only 15_osm_ruas__line 15_osm_enderecos__point
```

2. Recortar e gerar snapshots locais:

```bash
python scripts/build_centro_urban_context.py
```

O contorno laranja é **um limite**, não garantia de densidade homogênea de endereços em toda a área.

---

## Referências

- [`docs/data-lineage.md`](../../docs/data-lineage.md) — genealogia, fluxos, exceções, pipeline
- [`AGENT.md`](../../AGENT.md) §4 *Soberania de dados*, §5.5 *Catálogos*
- [`centro/README.md`](../README.md) — visão geral do módulo Centro
