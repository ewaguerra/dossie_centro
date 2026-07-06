# alma-01 — Superfície

| Campo | Valor |
|---|---|
| **Fase** | 1 / 13 |
| **ID** | `alma-01` |
| **Kicker** | Primeira Alma |
| **Módulo código** | [`centro/missions/alma-01/`](../../centro/missions/alma-01/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

### Camadas (`layerMinPhase`)

- `16_regiao_centro__polygon`
- `02a_subsetores_central__polygon`


### Temas POI (`themeMinPhase`)

- _(nenhum nesta fase)_


### Features (`featureMinPhase`)

- _(nenhum nesta fase)_


---

## O que já existe

Gates técnicos

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-01/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão narrativa da Superfície.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=1` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
