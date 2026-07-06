# alma-05 — Geotecnia

| Campo | Valor |
|---|---|
| **Fase** | 5 / 13 |
| **ID** | `alma-05` |
| **Kicker** | Quinta Alma |
| **Módulo código** | [`centro/missions/alma-05/`](../../centro/missions/alma-05/) |

Registo canónico de gates: [`phase-gates.json`](../../centro/data/catalog/phase-gates.json). Arquitectura de missões: [`missions-almas.md`](../architecture/missions-almas.md).

---

## Gates técnicos (desbloqueiam nesta fase)

Avanço automático por pistas: **≥ 11 pistas** no caderno → Fase 5.

### Camadas (`layerMinPhase`)

- `centro_carta_geotecnica__polygon`
- `centro_risco_alagamento__point`


### Temas POI (`themeMinPhase`)

- _(nenhum nesta fase)_


### Features (`featureMinPhase`)

- _(nenhum nesta fase)_


---

## O que já existe

Camadas geotécnicas (carta, risco alagamento).

---

## O que vamos trabalhar

- [ ] Definir passos de missão em `centro/missions/alma-05/index.js` (`missions[]`)
- [ ] Implementar `onActivate` / `onResync` / `isComplete()`
- [ ] Missão geotecnia.
- [ ] Actualizar esta ficha quando houver entrega

---

## Como testar

| Atalho | Uso |
|---|---|
| `?phase=5` | Força fase ARG (dev) |
| `?clues=id1,id2` | Injecta pistas no caderno — ver [`layer-unlocks.json`](../../centro/data/catalog/layer-unlocks.json) |
| Tab **13 Almas** | Estado Activa / Concluída / Bloqueada na sidebar |

---

## Notas

_(Espaço livre para decisões, pistas do Arquivo Morto, links a `dossie_arg_contracts`, etc.)_
