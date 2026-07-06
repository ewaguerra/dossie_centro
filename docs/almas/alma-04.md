# alma-04 — Acervo e memória

| Campo | Valor |
|---|---|
| **Fase** | 4 / 13 |
| **ID** | `alma-04` |
| **Kicker** | Quarta Alma |
| **Módulo código** | [`centro/missions/alma-04/`](../../centro/missions/alma-04/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço automático por pistas: **≥ 8 pistas** no caderno → Fase 4.

### Camadas (`layerMinPhase`)

- `centro_bem_arqueologico__point`
- `centro_acervo_tombado__point`
- `centro_memoria_paulistana__point`


### Temas POI (`themeMinPhase`)

- `memoria-paulistana`
- `acervo-tombado`
- `bem-arqueologico`


### Features (`featureMinPhase`)

- _(nenhum nesta fase)_


---

## O que já existe

Camadas acervo/memória/arqueologia; temas POI correspondentes.

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-04/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão acervo e memória.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=4` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
