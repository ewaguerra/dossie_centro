# Zona Centro — Dados locais

Snapshots GeoJSON e contratos de catálogo usados pela página `/centro/` (MapLibre), recortados pelo polígono oficial do Centro.

**Gate DATA-ORG-B1** (2026-05-23): documentação de responsabilidades — nenhum arquivo foi movido, renomeado ou deletado neste gate.

Genealogia detalhada, fluxos de carregamento e exceções oficiais: [`docs/data-lineage.md`](../../docs/data-lineage.md).

---

## Problema atual

`centro/data/` mistura quatro naturezas diferentes:

| Natureza | Onde está hoje | Deveria ser |
|---|---|---|
| Contrato runtime | `catalog/` (+ 2 fósseis dentro) | só contrato |
| GeoJSON do mapa | `context/`, `processed/` | `geojson/*` |
| Fonte bruta | `raw/` | `raw/` (ok) |
| Relatórios / fósseis | espalhados em `catalog/`, `context/` e raiz | `reports/`, `archive/fossils/` |

O cheiro ruim principal: **`context/` mistura GeoJSON runtime com relatórios de build, match, audit e um fóssil de pistas**.

---

## Responsabilidades atuais (estado no disco)

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

**Candidatos a sair** (fósseis/relatórios, não contrato runtime — mover em DATA-ORG-B2):

- `knowledge.generated.json` (~385 KB) — 0 referências de código; paths internos legados
- `data_freshness_report.json` (~110 KB) — 0 binding runtime ativo

### `processed/` — camadas tratadas (runtime principal)

GeoJSON urbanístico central: subsetores, ZEIS, eixos, hidrografia, alagamentos, contorno do Centro.

- Contorno oficial (outline laranja): `processed/16_regiao_centro__polygon.geojson`
- Toda entrada tem 1:1 em `catalog/layers.json`
- Fetch **sob demanda** quando checkbox marcada; algumas camadas têm `visible: true` e baixam no boot

### `context/` — camadas contextuais + relatórios misturados

GeoJSON usado pelo mapa (OSM, patrimônio, geotécnica, declividade) **e** artefatos de pipeline que ficaram lado a lado:

| Categoria | Padrão | Exemplo |
|---|---|---|
| Camada wired (sidebar) | `*.geojson` | `centro_rios_geosampa__line.geojson` |
| Camada não wired (POI) | `centro_pois_turisticos__point.geojson` | carregada por `addPOILayer`, não sidebar |
| Relatório de build | `*_build_report.json` | `centro_acervo_tombado_build_report.json` |
| Relatório de match | `*_match_report.json` | `centro_pois_turisticos_match_report.json` |
| Audit / missing | `*_audit.json`, `*_missing*.json` | `centro_pois_turisticos_low_confidence_audit.json` |
| Proximity | `*_proximity_report.txt` | `centro_pois_turisticos_proximity_report.txt` |
| Cards (UI auxiliar) | `*_cards.json` | `centro_pois_turisticos_cards.json` |
| Fóssil conhecido | (fora do catálogo) | `centro_pistas_rua_sao_bento__point.geojson` |

Catálogo: `catalog/context-layers.json` + filtro `catalog/context-wired.json`.

### `raw/` — fonte bruta preservável

| Arquivo | Função |
|---|---|
| `geosampa_rios_centro_raw.geojson` | insumo bruto GeoSampa → derivado `context/centro_rios_geosampa__line.geojson` |

Nunca servido ao browser. Audit trail do pipeline.

### Raiz de `centro/data/` — misc

| Arquivo | Natureza |
|---|---|
| `icon-manifest.json` | contrato de ícones (runtime) |
| `build_report.json` | relatório de build processed |
| `context_build_report.json` | relatório de build context (escrito por `sync:geojson-from-salto`) |

---

## Estrutura-alvo (futura)

Reorganização **dentro** de `centro/data/` — não outro repositório. Cada gaveta confessa sua função:

```text
centro/data/
├── README.md                 ← este arquivo
│
├── catalog/                  ← só contrato runtime (7 JSON)
│   ├── layers.json
│   ├── groups.json
│   ├── context-layers.json
│   ├── context-groups.json
│   ├── context-wired.json
│   ├── layer-unlocks.json
│   └── phase-gates.json
│
├── geojson/
│   ├── processed/            ← camadas tratadas leves/médias (hoje: processed/)
│   ├── context/              ← camadas contextuais normais (hoje: context/, sem reports)
│   ├── heavy/                ← monstros sob demanda (ver § Gigantes)
│   └── special/
│       ├── pois/             ← centro_pois_turisticos__point.geojson
│       └── arg/              ← centro_arquivo_superficial__point.geojson
│
├── raw/                      ← fontes brutas preserváveis
│
├── reports/
│   ├── build/
│   ├── poi/
│   ├── freshness/
│   ├── match/
│   └── legacy/
│
└── archive/
    └── fossils/              ← sobras históricas documentadas
```

### Regra de `geojson/heavy/`

```text
Nada em heavy/ deve carregar no boot.
Tudo em heavy/ deve ser manual, gated, lazy ou tileado no futuro.
```

Camadas candidatas a `heavy/` (hoje ainda em `context/`):

| ID | Arquivo | Tamanho | Features | Boot hoje |
|---|---|---:|---:|---|
| `15_osm_ruas__line` | `15_osm_ruas__line.geojson` | ~4,2 MB | 10.108 | **sim** (`visible: true`) — gargalo DATA-PERF-D1 |
| `15_osm_enderecos__point` | `15_osm_enderecos__point.geojson` | ~7,5 MB | 23.932 | não (`visible: false`) |
| `centro_bem_tombado__polygon` | `centro_bem_tombado__polygon.geojson` | ~3,2 MB | 2.974 | não (`visible: false`) |

Estes três arquivos representam ~83% do peso total GeoJSON.

### Regra de `geojson/special/`

Dados runtime com fluxo especial fora do checkbox padrão:

- `pois/centro_pois_turisticos__point.geojson` — `addPOILayer`, fora de `context-wired`
- `arg/centro_arquivo_superficial__point.geojson` — camada ARG wired

Pistas Rua São Bento **não** moram aqui: runtime usa `centro/assets/pistas/rua-sao-bento-pistas.json`.

---

## Relatórios e fósseis conhecidos

### Relatórios (mover para `reports/` em DATA-ORG-B2)

**Raiz:**

- `build_report.json`
- `context_build_report.json`

**Em `context/`:**

- `*_build_report.json` (12 arquivos)
- `centro_pois_turisticos_match_report.json`
- `centro_catedral_se_3d_match_report.json`
- `centro_pois_turisticos_low_confidence_audit.json`
- `centro_pois_turisticos_missing_coordinates.json`
- `centro_catedral_se_3d_missing.json`
- `centro_pois_turisticos_proximity_report.txt`

**Em `catalog/` (legacy):**

- `knowledge.generated.json`
- `data_freshness_report.json`

### Fósseis (mover para `archive/fossils/` em DATA-ORG-B5)

| Arquivo | Motivo |
|---|---|
| `context/centro_pistas_rua_sao_bento__point.geojson` | 390 B, 1 feature, fora do catálogo; pistas reais em `centro/assets/pistas/` |

---

## Ordem de execução (gates)

Movimentação física só depois que o território está documentado e o runtime sabe resolver caminhos novos.

| Gate | Escopo | Status |
|---|---|---|
| **DATA-ORG-B1** | Documentar responsabilidades (este README) | **feito** |
| **DATA-ORG-B2** | Mover relatórios não-runtime → `reports/` | pendente |
| **DATA-PERF-D1** | `15_osm_ruas`: `visible: true → false` | pendente |
| **DATA-ORG-B3** | Criar `geojson/heavy/` + resolver de paths | pendente |
| **DATA-ORG-B4** | Classificar `special/pois` e `special/arg` | pendente |
| **DATA-ORG-B5** | Mover fósseis → `archive/fossils/` | pendente |

O maior ganho imediato de performance não vem de mover pasta — vem de **`15_osm_ruas` com `visible: false`** (DATA-PERF-D1).

---

## Limite oficial do Centro (contorno laranja)

- **Arquivo**: `processed/16_regiao_centro__polygon.geojson`
- **Uso**: contorno/outline no mapa e recorte espacial para gerar contexto urbano

---

## OSM — ruas e endereços

| Camada | Arquivo | Observação |
|---|---|---|
| Malha de Circulação | `context/15_osm_ruas__line.geojson` | cobertura completa do bbox do Centro |
| Endereços e Números | `context/15_osm_enderecos__point.geojson` | cobertura parcial OSM; labels em `minzoom >= 17` |

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
