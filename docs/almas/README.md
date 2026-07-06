# 13 Almas — fichas de missão

Um ficheiro **por alma** para registar o que já está implementado e o backlog narrativo/técnico de cada fase do Protocolo 13.

| Ficha | Fase | Título | Kicker |
|---|---|---|---|
| [alma-01](./alma-01.md) | 1 | Superfície | Primeira Alma |
| [alma-02](./alma-02.md) | 2 | Hidrografia soterrada | Segunda Alma |
| [alma-03](./alma-03.md) | 3 | Património rígido | Terceira Alma |
| [alma-04](./alma-04.md) | 4 | Acervo e memória | Quarta Alma |
| [alma-05](./alma-05.md) | 5 | Geotecnia | Quinta Alma |
| [alma-06](./alma-06.md) | 6 | Arquivo superficial | Sexta Alma |
| [alma-07](./alma-07.md) | 7 | Rasgue o Asfalto | Sétima Alma |
| [alma-08](./alma-08.md) | 8 | Setores interditos | Oitava Alma |
| [alma-09](./alma-09.md) | 9 | Malha urbana | Nona Alma |
| [alma-10](./alma-10.md) | 10 | Risco sistémico | Décima Alma |
| [alma-11](./alma-11.md) | 11 | Triângulo fechado | Décima Primeira Alma |
| [alma-12](./alma-12.md) | 12 | Comissão | Décima Segunda Alma |
| [alma-13](./alma-13.md) | 13 | Permanência | Décima Terceira Alma |

## Convenção

Cada `alma-NN.md` segue a mesma estrutura:

1. **Gates técnicos** — o que `phase-gates.json` libera nesta fase
2. **O que já existe** — código e comportamento actual no Centro
3. **O que vamos trabalhar** — checklist editável
4. **Como testar** — atalhos dev e UI

Código de missão: `centro/missions/alma-NN/index.js`. Ver [`AGENT.md`](../AGENT.md) §5.5.1.

## Estado geral (2026-07)

| Área | Situação |
|---|---|
| Fases 1–6 | Gates + avanço automático por pistas (`clueCountAdvance`) |
| Fase 7 | Missão subsolo **parcial** — ver [alma-07.md](./alma-07.md) |
| Fases 8–13 | Gates técnicos; missões narrativas por implementar |
