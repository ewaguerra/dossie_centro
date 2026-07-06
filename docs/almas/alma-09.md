# alma-09 — Malha urbana

| Campo | Valor |
|---|---|
| **Fase** | 9 / 13 |
| **ID** | `alma-09` |
| **Kicker** | Nona Alma |
| **Módulo código** | [`centro/missions/alma-09/`](../../centro/missions/alma-09/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço **não** automático por contagem de pistas (narrativa / missão / query dev).

### Camadas (`layerMinPhase`)

- `15_osm_ruas__line`
- `15_osm_enderecos__point`


### Temas POI (`themeMinPhase`)

- _(nenhum nesta fase)_


### Features (`featureMinPhase`)

- `buildings-3d`


---

## O que já existe

OSM ruas/endereços; feature `buildings-3d`.

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-09/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
  - [ ] Missão malha urbana — activar Malha OSM e ler labels (`street-names-atual`).
  - [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=9` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
