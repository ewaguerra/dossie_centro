# DATA-ORG-SUMMARY-C — Estado final de `centro/data/`

> Síntese oficial após o ciclo estrutural DATA-ORG (B1 → B5).
> **Commit de referência:** `70b231b` · **Data:** 2026-05-23
>
> Este documento é a “foto do paciente vivo”. Para genealogia detalhada, ver
> [`data-lineage.md`](data-lineage.md). Para responsabilidades operacionais, ver
> [`centro/data/README.md`](../centro/data/README.md).

Nenhum arquivo, catálogo, runtime ou GeoJSON foi alterado neste gate — apenas
documentação.

---

## 1. Ciclo concluído

| Gate | Escopo | Commit era |
|---|---|---|
| **DATA-ORG-B1** | Documentar responsabilidades (`centro/data/README.md`) | docs |
| **DATA-ORG-B2** | Relatórios não-runtime → `reports/` | `d829146` |
| **DATA-PERF-D1** | `15_osm_ruas` default-off | `e206ce3` |
| **DATA-ORG-B3B** | Heavy → `geojson/heavy/` + resolver + metadata | `a222490` |
| **DATA-ORG-B4B-1** | ARG → `geojson/special/arg/` | `40e6e8f` |
| **DATA-ORG-B4B-2A** | Normalizar URL POI turístico | `37b57f9` |
| **DATA-ORG-B4B-2** | POI turístico → `geojson/special/pois/` | `fc23a45` |
| **DATA-ORG-B5** | Fóssil RSB → `archive/fossils/` | `70b231b` |

---

## 2. Árvore final

```text
centro/data/                          (~19 MiB total)
├── README.md
├── icon-manifest.json
│
├── catalog/                          7 JSON — contratos runtime
│   ├── layers.json
│   ├── groups.json
│   ├── context-layers.json
│   ├── context-groups.json
│   ├── context-wired.json
│   ├── layer-unlocks.json
│   └── phase-gates.json
│
├── processed/                        10 GeoJSON — sidebar processed (~808 KiB)
│
├── context/                          10 GeoJSON — contextual wired leve (~2,0 MiB)
│
├── geojson/
│   ├── heavy/                        3 GeoJSON — manual/default-off (~15 MiB)
│   └── special/
│       ├── arg/                      1 GeoJSON — ARG on-after-unlock
│       └── pois/                     1 GeoJSON — POI turístico boot load
│
├── reports/                          21 arquivos — não runtime (~644 KiB)
│   ├── build/     (12)
│   ├── poi/       (5)
│   ├── three-d/   (2)
│   └── legacy/    (2)
│
├── archive/
│   └── fossils/                    1 GeoJSON — fóssil RSB (~4 KiB)
│
└── raw/                              1 GeoJSON — fonte bruta GeoSampa (~276 KiB)
```

**Nota:** pistas Rua São Bento **não** moram em `centro/data/`. Runtime usa
`centro/assets/pistas/rua-sao-bento-pistas.json`.

---

## 3. Responsabilidades por pasta

| Pasta | Função | Runtime? | Consumidor |
|---|---|---|---|
| `catalog/` | Contratos JSON (sidebar, gates ARG) | sim | `catalog-load.js`, testes, healthcheck |
| `processed/` | GeoJSON urbanístico principal (ZEIS, eixos, hidrografia, contorno) | sim | sidebar via `layers.json` |
| `context/` | GeoJSON contextual leve wired na sidebar | sim | sidebar via `context-wired.json` |
| `geojson/heavy/` | OSM ruas/endereços + bem tombado; manual, default-off | sim (sob demanda) | sidebar + `buildLayerDataUrl` |
| `geojson/special/arg/` | Camada ARG `centro_arquivo_superficial__point` | sim (gated) | sidebar + phase/unlock gates |
| `geojson/special/pois/` | POI turístico `centro_pois_turisticos__point` | sim (boot) | `addPOILayer` + Triângulo Histórico |
| `reports/` | Build, match, audit, legacy | **não** | pipeline / curadoria humana |
| `archive/fossils/` | Artefatos históricos preservados | **não** | documentação / audit trail |
| `raw/` | Insumo bruto preservável (GeoSampa rios) | **não** | pipeline → derivado em `context/` |

**Resolver canônico:** `centro/map/layer-data-url.js` (`buildLayerDataUrl`, `fetchLayerGeojson`).
**Constante POI turístico:** `POI_TURISTICO_LAYER_FILE` em `centro/features/poi-icons.js`.

---

## 4. Contagens (auditoria em disco, 2026-05-23)

| Métrica | Valor |
|---|---|
| Total de arquivos em `centro/data/` | **57** |
| Total de GeoJSON | **27** |
| GeoJSON em `context/` | **10** |
| GeoJSON em `processed/` | **10** |
| GeoJSON em `geojson/heavy/` | **3** |
| GeoJSON em `geojson/special/` | **2** (arg + pois) |
| Fósseis em `archive/fossils/` | **1** |
| Relatórios em `reports/` | **21** (build 12, poi 5, three-d 2, legacy 2) |
| Raw | **1** |
| Catálogo JSON | **7** |
| Raiz (`README`, `icon-manifest`) | **2** |

**Peso GeoJSON heavy:** ~83% do peso total (~15 MiB / ~19 MiB em `centro/data/`).

---

## 5. Contratos principais (confirmados)

| Contrato | Estado |
|---|---|
| **24 camadas** na sidebar | 10 `layers.json` + 14 `context-wired.json` ✓ |
| **9 grupos** na sidebar | 5 `groups.json` + 4 `context-groups.json` ✓ |
| **3 heavy** fora do boot | `visible: false`, `loadPolicy: manual` ✓ |
| **POI turístico** | `geojson/special/pois/`; em `context-layers.json`; **fora** de `context-wired` ✓ |
| **ARG superficial** | `geojson/special/arg/`; wired; fase **6** + `guardiao-tampa` ✓ |
| **Rua São Bento GeoJSON** | fóssil em `archive/fossils/`; **não** runtime ✓ |
| **Pistas RSB reais** | `centro/assets/pistas/rua-sao-bento-pistas.json` ✓ |
| **raw/geosampa** | preservado em `raw/` como audit trail ✓ |
| **`context/` limpo** | somente GeoJSON contextual normal (sem fóssil, sem heavy, sem special) ✓ |

---

## 6. Validação (2026-05-23)

| Check | Resultado |
|---|---|
| `npm test` | **151/151 PASS** |
| `npm run healthcheck:centro` | **43/43 PASS** |
| `main` remoto | `70b231b` |

Gates DATA-ORG cobertos por testes dedicados: B3B, B4B-1, B4B-2A, B4B-2, B5.

---

## 7. Riscos residuais

| Risco | Severidade | Notas |
|---|---|---|
| **Fetch duplicado POI turístico** | média | `addTrianguloHistoricoOverlay` + `addPOILayer` baixam o mesmo GeoJSON no boot pela mesma URL canônica. Cache HTTP amortiza parcialmente. Gate: **DATA-PERF-POI-DEDUP**. |
| **Dualidade POI patrimonial** | média | 4 POIs patrimoniais aparecem em sidebar **e** `addPOILayer`. Funcionalmente correto; arquiteturalmente redundante. Gate: **GEO-POI-DEDUP** (decisão humana). |
| **raw/geosampa preservado** | baixa | Insumo bruto intencional; não é fóssil. Não mover para `archive/`. |
| **Metadata stale no catálogo** | baixa | Ex.: `centro_pois_turisticos__point` tem `feature_count: 64`, `expected_count: 79`, `missing_count: 15`. `file_size_bytes` presente só em subset de camadas. Gate: **DATA-META**. |
| **PMTiles / vector tiles para heavy** | futura | Heavy layers (~15 MiB) candidatos a tileado. Estudo antes de implementar. Gate: **DATA-PMTILES-STUDY**. |
| **Smoke E2E heavy/special** | baixa | `scripts/smoke-centro.mjs` cobre assets estáticos; não valida toggle heavy nem unlock ARG. Gate opcional: **E2E-SMOKE-A**. |
| **Fóssil/arquivo acessível via HTTP** | baixa | `/centro/data/archive/fossils/...` servível pelo static server; nenhum consumidor runtime. |

---

## 8. Próximos gates recomendados (máx. 3)

### 1. DATA-PERF-POI-DEDUP (prioridade alta)

Compartilhar um único fetch/cache do POI turístico entre Triângulo Histórico e
`addPOILayer`. URL canônica já unificada (B4B-2A); falta deduplicar o download.

### 2. GEO-POI-DEDUP ou DATA-META (prioridade média)

- **GEO-POI-DEDUP:** decidir se POIs patrimoniais ficam só em `addPOILayer`, só
  na sidebar, ou em ambos com contrato explícito.
- **DATA-META:** reconciliar `feature_count`, `expected_count`, `file_size_bytes`
  no catálogo com o disco real.

### 3. DATA-PMTILES-STUDY ou E2E-SMOKE-A (prioridade baixa)

- **DATA-PMTILES-STUDY:** avaliar tileado para os 3 heavy (~83% do peso).
- **E2E-SMOKE-A:** smoke Playwright para heavy toggle + ARG unlock + POI boot.

**PMTiles depois** de dedup e contratos — primeiro limpar duplicidade, depois
trocar o motor da carruagem.

---

## 9. Mapa mental rápido

```text
Boot leve     → processed/ + context/ (wired, visible conforme catálogo)
Boot pesado   → evitado: heavy default-off; special/pois sim (POI)
Sob demanda   → geojson/heavy/ (checkbox sidebar)
Gated         → special/arg/ (fase 6 + guardiao-tampa)
Fora sidebar  → special/pois/ (addPOILayer)
Não runtime   → reports/, archive/fossils/, raw/
```
