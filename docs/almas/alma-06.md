# alma-06 — Arquivo superficial

| Campo | Valor |
|---|---|
| **Fase** | 6 / 13 |
| **ID** | `alma-06` |
| **Kicker** | Sexta Alma |
| **Módulo código** | [`centro/missions/alma-06/`](../../centro/missions/alma-06/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço automático por pistas: **≥ 14 pistas** no caderno → Fase 6.

### Camadas (`layerMinPhase`)

- `centro_declividade__polygon`
- `centro_arquivo_superficial__point`


### Temas POI (`themeMinPhase`)

- _(nenhum nesta fase)_


### Features (`featureMinPhase`)

- _(nenhum nesta fase)_


---

## O que já existe

Camada `centro_arquivo_superficial__point`; avanço auto até aqui via `clueCountAdvance`.

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-06/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão arquivo superficial; transição narrativa para Fase 7.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=6` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
