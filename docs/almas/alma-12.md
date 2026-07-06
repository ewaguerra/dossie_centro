# alma-12 — Comissão

| Campo | Valor |
|---|---|
| **Fase** | 12 / 13 |
| **ID** | `alma-12` |
| **Kicker** | Décima Segunda Alma |
| **Módulo código** | [`centro/missions/alma-12/`](../../centro/missions/alma-12/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço **não** automático por contagem de pistas (narrativa / missão / query dev).

### Camadas (`layerMinPhase`)

- _(nenhum nesta fase)_


### Temas POI (`themeMinPhase`)

- _(nenhum nesta fase)_


### Features (`featureMinPhase`)

- _(nenhum nesta fase)_


---

## O que já existe

Gates técnicos mínimos nesta fase.

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-12/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão Comissão.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=12` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
