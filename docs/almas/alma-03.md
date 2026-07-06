# alma-03 — Património rígido

| Campo | Valor |
|---|---|
| **Fase** | 3 / 13 |
| **ID** | `alma-03` |
| **Kicker** | Terceira Alma |
| **Módulo código** | [`centro/missions/alma-03/`](../../centro/missions/alma-03/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço automático por pistas: **≥ 5 pistas** no caderno → Fase 3.

### Camadas (`layerMinPhase`)

- `17_alagamentos_contexto_hidrografico__point`
- `centro_monumentos__point`
- `centro_bem_tombado__polygon`
- `centro_pois_turisticos__point`


### Temas POI (`themeMinPhase`)

- `monumentos`
- `poi-turistico`


### Features (`featureMinPhase`)

- _(nenhum nesta fase)_


---

## O que já existe

Camadas monumentos/tombados; temas `monumentos`, `poi-turistico`.

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-03/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão património rígido.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=3` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
