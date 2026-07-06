# alma-02 — Hidrografia soterrada

| Campo | Valor |
|---|---|
| **Fase** | 2 / 13 |
| **ID** | `alma-02` |
| **Kicker** | Segunda Alma |
| **Módulo código** | [`centro/missions/alma-02/`](../../centro/missions/alma-02/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço automático por pistas: **≥ 2 pistas** no caderno → Fase 2.

### Camadas (`layerMinPhase`)

- `03_eixo_existente__polygon`
- `03a_eixo_previsto__polygon`
- `05_hidrografia_rios__line`
- `centro_rios_geosampa__line`
- `centro_area_inundavel__polygon`
- `centro_rios_osm__line`


### Temas POI (`themeMinPhase`)

- `pistas`


### Features (`featureMinPhase`)

- `pistas-rsb`


---

## O que já existe

Gates técnicos; feature `pistas-rsb`; tema POI `pistas`.

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-02/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão hidrografia soterrada (narrativa + passos).
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=2` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
