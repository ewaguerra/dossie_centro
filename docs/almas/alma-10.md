# alma-10 — Risco sistémico

| Campo | Valor |
|---|---|
| **Fase** | 10 / 13 |
| **ID** | `alma-10` |
| **Kicker** | Décima Alma |
| **Módulo código** | [`centro/missions/alma-10/`](../../centro/missions/alma-10/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço **não** automático por contagem de pistas (narrativa / missão / query dev).

### Camadas (`layerMinPhase`)

- `04_zeis1__polygon`
- `04a_zeis2__polygon`
- `04a_zeis3__polygon`


### Temas POI (`themeMinPhase`)

- _(nenhum nesta fase)_


### Features (`featureMinPhase`)

- _(nenhum nesta fase)_


---

## O que já existe

Camadas ZEIS 1/2/3.

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-10/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão risco sistémico.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=10` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
