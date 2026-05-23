# Data Lineage — projeto_centro

> Genealogia dos dados cartográficos: o que vive em cada pasta, quem é
> consumidor de runtime, quem é artefato de pipeline, e por que algumas
> coisas parecem "fora do lugar" mas estão lá por contrato.

**Atualizado:** 2026-05-23 · gates `MAP-DATA-GOV-A`, `DATA-PERF-D1`, `DATA-DOCS-D1B` ·
base de evidência: auditoria empírica (`find -printf`, `jq .features|length`,
`git log`) + catálogos commitados em `centro/data/catalog/`.

Este documento é o cartório dos dados. Quando algo no `centro/data/`
parecer "sobra histórica", consulte aqui antes de apagar.

---

## 1. Princípio soberano

```text
Para o jogador (browser) e para o deploy:
  fonte da verdade = ficheiros commitados em projeto_centro.

O browser nunca lê:
  ../mapa_sp_salto/      (repositório irmão, opcional)
  WFS GeoSampa           (fora do runtime)
  Overpass / OSM         (fora do runtime)
  Tile servers OSM       (fora do runtime — ver docs/offline-scope.md)

O único host externo permitido em runtime de mapa:
  tiles.openfreemap.org  (basemap vector)
```

A regra é normativa, não descritiva: um PR que reintroduza fetch dinâmico
de WFS/Overpass no runtime do `/centro/` é regressão imediata.

`mapa_sp_salto` existe como **upstream de manutenção**: pipeline mais
amplo (cidade inteira, raw OSM, scripts shapely de recorte). Quem clona
só `projeto_centro` **não precisa** do salto para o mapa funcionar — todo
GeoJSON consumido pelo runtime está commitado aqui.

Ver também: `AGENT.md` §4 *Soberania de dados*.

---

## 2. Organização das pastas

### 2.1 `centro/data/catalog/` — contratos

São os arquivos que o runtime lê para montar a sidebar, decidir gates de
ARG e validar coverage.

| Arquivo | Função | Consumidor |
|---|---|---|
| `layers.json` | 10 camadas processed da sidebar (eixo, ZEIS, hidrografia, contorno) | `catalog-load.js` |
| `groups.json` | 5 grupos da sidebar (urbanístico, ZEIS, hidrografia…) | `catalog-load.js` |
| `context-layers.json` | 15 camadas contextuais inventariadas (OSM, patrimônio, geotécnica, declividade) | `catalog-load.js` |
| `context-groups.json` | grupos das contextuais | `catalog-load.js` |
| `context-wired.json` | **subset** de 14 IDs efetivamente wired na sidebar | `catalog-load.js` |
| `layer-unlocks.json` | mapa `layerId → [clueId, …]` para gates do Caderno do Arquivista | `layer-unlocks.js` |
| `phase-gates.json` | mapa `layerId → fase mínima` para gates ARG | `protocolo-phase.js` |
| `data_freshness_report.json` | **legacy/auditoria** (ver §4) | nenhum runtime |
| `knowledge.generated.json` | **legacy/auditoria** (ver §4) | nenhum runtime |

### 2.2 `centro/data/processed/` — runtime principal

10 GeoJSON, 407 features, 0,77 MiB. Camadas urbanísticas centrais do
Dossiê (eixos, ZEIS, hidrografia, alagamentos, contorno do centro).
Toda entrada tem 1:1 em `layers.json`.

### 2.3 `centro/data/context/` — runtime contextual + relatórios

16 GeoJSON, 38.133 features, 16,62 MiB. Camadas expandíveis na sidebar
(OSM, patrimônio, geotécnica, declividade) + alguns relatórios e
artefatos de pipeline que ficaram lado a lado.

| Categoria | Padrão de nome | Exemplo |
|---|---|---|
| Camada wired (sidebar) | `*.geojson` | `centro_bem_tombado__polygon.geojson` |
| Camada não wired | `centro_pois_turisticos__point.geojson` | exceção oficial — §4 |
| Relatório de build | `*_build_report.json` | `centro_acervo_tombado_build_report.json` |
| Relatório de match | `*_match_report.json` | `centro_pois_turisticos_match_report.json` |
| Audit de baixa confiança | `*_low_confidence_audit.json` | `centro_pois_turisticos_low_confidence_audit.json` |
| Cards (UI) | `*_cards.json` | `centro_pois_turisticos_cards.json` |
| Órfão conhecido | (ver §4) | `centro_pistas_rua_sao_bento__point.geojson` |

A pasta está **semanticamente inchada**, mas funcional. Mover relatórios
para subpasta seria refator de pipeline (afeta `sync:geojson-from-salto`)
— não está no escopo deste gate.

### 2.4 `centro/data/raw/` — intermediário não runtime

1 arquivo: `geosampa_rios_centro_raw.geojson` (180 features, 0,27 MiB).
É o **insumo bruto** do GeoSampa antes do recorte/normalização que gera
`centro/data/context/centro_rios_geosampa__line.geojson`. Permanece no
repo como audit trail. Nunca é servido ao browser.

### 2.5 `centro/assets/pistas/` — fonte operacional das pistas

Estas pistas (Rua São Bento, ARG) **não** moram em `centro/data/`. Elas
vivem em `centro/assets/pistas/`:

| Arquivo | Função |
|---|---|
| `rua-sao-bento-pistas.json` | dados das pistas (texto, cards, coords) |
| `rua-sao-bento-1862.jpg` | imagem histórica |
| `rua-sao-bento-1902.jpg` | imagem histórica |
| `rua-sao-bento-atual.jpg` | imagem atual |
| `rua-sao-bento-thumb.jpg` | thumbnail |

Consumidor: `centro/features/pistas.js` → `addPistasLayer`.

### 2.6 `arquivo-morto/data/pistas.json` — pistas do blog (≠ mapa)

Arquivo separado, com **propósito diferente**: alimenta o Caderno do
Arquivista no `/arquivo-morto/`, não o mapa. As entradas aqui escrevem em
`localStorage.protocolo13_caderno_clues`, que é depois lido pelo Centro
para gates de `layer-unlocks.json`. Mas a *layer* do mapa não vem deste
arquivo. Ver `AGENT.md` §5.3 *Ponte para o Centro*.

---

## 3. Fluxos de carregamento

```text
Sidebar processed (10 camadas)
  layers.json + groups.json
  → catalog-load.js → addLayerToMap(cfg)
  → addCatalogLayerToMap → ensureSource(geojson)
  → fetch processed/*.geojson SOB DEMANDA (apenas se checkbox marcada)

Sidebar context (14 camadas wired)
  context-layers.json filtrado por context-wired.json
  → mesmo pipeline acima
  → fetch context/*.geojson SOB DEMANDA

Default visibility (auto-load)
  ly.visible !== false em sidebar-panel.js (linha 67)
  → checkbox renderizada marcada
  → sidebar-events.js dispara 'change' no map.load
  → fetch IMEDIATO no boot

POIs patrimoniais (sempre visíveis)
  initMap → addPOILayer → poi-icons.js
  → carrega memoria_paulistana, acervo_tombado, bem_arqueologico, monumentos
  → DUPLICATE: as mesmas 4 layers também estão em context-wired
    (decisão registrada — ver §4 e GEO-POI-DEDUP futuro)

Pistas Rua São Bento (sempre visíveis)
  initMap → addPistasLayer → centro/features/pistas.js
  → consome centro/assets/pistas/rua-sao-bento-pistas.json

Triângulo histórico, buildings 3D, subterrâneo
  initMap → módulos próprios em centro/features/
  → fora do catálogo
```

**Implicação prática:** mudar `visible: true → false` em
`context-layers.json` corta o fetch inicial, mas não impede que o jogador
ative manualmente. É o mecanismo correto para "default off".

---

## 4. Exceções oficiais (não corrigir)

### 4.1 `centro_pois_turisticos__point` está em `context-layers.json`, **fora** de `context-wired.json`

```text
Motivo: a layer é carregada por addPOILayer (initMap), não pelo
        checkbox da sidebar. Ela aparece em context-layers.json apenas
        para que o catálogo conheça suas propriedades (style, source,
        feature_count) — mas não vai para a sidebar.

Contrato: AGENT.md §5.5 — "Excluída da sidebar: centro_pois_turisticos
          (já em addPOILayer)".

Teste: tests/sanity.test.js — "MAP-DATA-GOV-A: centro_pois_turisticos
       está em context-layers mas fora de context-wired (contrato)".

NÃO adicionar a context-wired.json. Quebraria addPOILayer + sidebar
duplicada.
```

### 4.2 POIs patrimoniais aparecem em **dois** pipelines

Os 4 POIs patrimoniais aparecem **simultaneamente** em:

```text
context-wired.json (sidebar wired)
  centro_memoria_paulistana__point
  centro_acervo_tombado__point
  centro_bem_arqueologico__point
  centro_monumentos__point

addPOILayer / poi-icons.js (sempre visível, com filtro temático em #poi-legend)
  mesmas 4 IDs
```

```text
Status: arquiteturalmente redundante, funcionalmente correto.
        Refator (GEO-POI-DEDUP) é gate próprio — toca initMap, sidebar,
        POI legend e UX. Fora do escopo de MAP-DATA-GOV-A.

NÃO remover de wired sem reabrir a decisão.
```

### 4.3 Órfãos conhecidos (no disco, fora do catálogo)

```text
centro/data/context/centro_pistas_rua_sao_bento__point.geojson
  - 1 feature, 390 bytes
  - resíduo de migração; pistas reais vivem em centro/assets/pistas/
  - 0 referências em código
  - mantido por governança (audit trail), removível em gate próprio

centro/data/raw/geosampa_rios_centro_raw.geojson
  - 180 features, 0,27 MiB
  - insumo bruto para centro/data/context/centro_rios_geosampa__line.geojson
  - audit trail do pipeline
```

```text
Teste: tests/sanity.test.js — "GEO-B: órfãos conhecidos documentados
       (raw e pistas ARG)" — verifica que ambos existem no disco.

Se algum dia algum órfão for removido, atualize:
  - tests/sanity.test.js (constante KNOWN_ORPHANS)
  - este documento (§4.3)
  - centro/data/raw/README.md (se for o caso)
```

### 4.4 Relatórios legados em `centro/data/catalog/`

```text
knowledge.generated.json
  - 0 referências de código
  - paths internos apontam para data/processed/01_macrozoneamento/...
    e geojson_extraidos/... que NÃO existem neste repo
  - é fóssil de pipeline (mapa_sp_salto-style)

data_freshness_report.json
  - 0 referências de código de runtime
  - 1 menção descritiva em centro/README.md ("optional, for popup
    enrichment") — não há binding ativo
  - paths internos no mesmo formato legado
```

```text
Status: legacy/auditoria — NÃO são fonte de runtime.
        Manter por enquanto (audit trail e referência histórica).
        Mover para centro/data/legacy/ é gate próprio.

NÃO reconciliar paths legados com o repo atual. São fósseis,
não infraestrutura.
```

---

## 5. Pipeline de regeneração

### 5.1 O que `projeto_centro` regenera sozinho

```bash
npm run sync:geojson-from-salto
```

Regenera **apenas 3 arquivos**:

| ID | Destino | Origem (mapa_sp_salto) |
|---|---|---|
| `04a_zeis2__polygon` | `centro/data/processed/04a_zeis2__polygon.geojson` | `data/processed/03_zoneamento/04a_zeis2__polygon.geojson` |
| `15_osm_ruas__line` | `centro/data/context/15_osm_ruas__line.geojson` | `data/osm/processed/15_osm_ruas__line.geojson` |
| `15_osm_enderecos__point` | `centro/data/context/15_osm_enderecos__point.geojson` | `data/osm/processed/15_osm_enderecos__point.geojson` |

Implementação: `scripts/sync-geojson-from-salto.py`. Requer `shapely` e
o repo `mapa_sp_salto` clonado lado a lado.

### 5.2 O que **não** se regenera deste repo

Os outros **24 GeoJSON** do `centro/data/` dependem de:

```text
- scripts em mapa_sp_salto (recorte BBox, normalização, agregação)
- WFS GeoSampa (patrimônio, geotécnica, declividade, hidrografia)
- Overpass API / OSM (POIs turísticos, monumentos)
- curadoria manual (centro/assets/pistas/rua-sao-bento-pistas.json)
- builds upstream cujo histórico/script vivem fora deste repo
```

Por isso **`rebuild:all` não existe** neste repo. Apagar todo
`centro/data/*.geojson` e tentar regenerar daria um repo quebrado.

### 5.3 Regra operacional

```text
1. Fonte de verdade para runtime:
     o que está commitado em projeto_centro/centro/data/.

2. Regeneração quando o salto mudar:
     correr sync:geojson-from-salto e COMMITAR o output.

3. Regeneração de uma camada nova/mudada que NÃO está no JOBS list:
     responsabilidade do upstream (mapa_sp_salto) +
     copiar manualmente para projeto_centro + commitar.
```

---

## 6. Riscos conhecidos

### 6.1 Peso por arquivo (top 3 = 83% do total GeoJSON)

| Arquivo | Tamanho | Features | Status atual |
|---|---:|---:|---|
| `15_osm_enderecos__point` | 7,44 MiB | 23.932 | `visible: false` (decisão MAP-DATA-GOV-A — §6.2) |
| `15_osm_ruas__line` | 4,12 MiB | 10.108 | `visible: false` (DATA-PERF-D1 — heavy/default-off) |
| `centro_bem_tombado__polygon` | 3,10 MiB | 2.974 | `visible: false` |

Total: 27 GeoJSON, 38.720 features, 17,66 MiB.

`15_osm_ruas__line` era a única camada heavy ainda com `visible: true` no boot.
Decisão `DATA-PERF-D1`: trocar para `visible: false`. Continua wired na sidebar;
toggle manual intacto (`sidebar-events.js` dispara fetch sob demanda → HTTP 200).
Ganho no boot: ~4,1 MiB / 10.108 features fora do fetch inicial. `minzoom: 12`
preservado (decisão de renderização, não de download). Mesma política
heavy/default-off que `15_osm_enderecos__point` e `centro_bem_tombado__polygon`.

### 6.2 Default visibility de OSM endereços

`15_osm_enderecos__point` ficou tempo significativo com `visible: true`
no catálogo. A combinação com `minzoom: 16` significava que o jogador
**baixava 7,44 MiB no boot** mas só **via** a camada após dar zoom 16+.

Decisão `MAP-DATA-GOV-A`: trocar para `visible: false`. Continua
ativável manualmente. `minzoom` permanece 16 (decisão de renderização,
não de download).

Próximo passo natural (gate futuro): converter para PMTiles e/ou clusterizar.

### 6.3 POIs patrimoniais em dois pipelines

Ver §4.2. Refator GEO-POI-DEDUP fica para gate próprio.

### 6.4 Pipeline parcial

Ver §5.2. Repo não regenera todos os GeoJSON sozinho. Aceito como
arquitetura — `mapa_sp_salto` é upstream oficial.

### 6.5 Pasta `context/` semanticamente inchada

Mistura camadas wired, camada não wired (POI turístico), relatórios e
órfão. Reorganização (subpastas `reports/`, `orphans/`) é gate próprio
porque toca `sync:geojson-from-salto` e os globs de `tests/sanity.test.js`.

---

## 7. Decisões abertas (humanas)

Itens que código não resolve sozinho — quando decidir, voltar aqui e
mover para "decidido".

| Pergunta | Status | Notas |
|---|---|---|
| POIs patrimoniais: sidebar + addPOILayer ou só addPOILayer? | Aberta | gate GEO-POI-DEDUP |
| `centro_pistas_rua_sao_bento` órfão: remover? | Aberta | governança primeiro; remoção em gate próprio |
| `knowledge.generated` / `data_freshness`: mover para `legacy/`? | Aberta | gate próprio; sem urgência |
| PMTiles para OSM endereços? | Aberta | depende de tooling de build |

---

## Referências

- `AGENT.md` §4 *Soberania de dados*
- `AGENT.md` §5.5 *Centro / catálogos*
- `AGENT.md` §7 *Playbook MapLibre*
- `docs/offline-scope.md` (basemap, tiles, cache)
- `docs/stack.md` (versões, scripts npm)
- `tests/sanity.test.js` (testes GEO-B + MAP-DATA-GOV-A)
- `scripts/sync-geojson-from-salto.py` (pipeline parcial)
