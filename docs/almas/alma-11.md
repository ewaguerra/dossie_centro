# alma-11 — Triângulo fechado

| Campo | Valor |
|---|---|
| **Fase** | 11 / 13 |
| **ID** | `alma-11` |
| **Kicker** | Décima Primeira Alma |
| **Módulo código** | [`centro/missions/alma-11/`](../../centro/missions/alma-11/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço **não** automático por contagem de pistas (narrativa / missão / query dev).

### Camadas (`layerMinPhase`)

- _(nenhum nesta fase)_


### Temas POI (`themeMinPhase`)

- _(nenhum nesta fase)_


### Features (`featureMinPhase`)

- `triangulo-historico`


---

## O que já existe

Feature `triangulo-historico` (overlay).

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-11/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão triângulo fechado.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=11` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
