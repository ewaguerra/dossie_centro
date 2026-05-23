# Documentação do projeto

Tudo que descreve **este repositório** — stack, testes, offline, design system, decisões (ADR).

## CAPRI (inteligência externa)

**CAPRI** é um framework de análise (requisitos, riscos, gates, backlog). Usamos como **referência para pensar** o projeto — não como pasta de docs dentro do repo.

| CAPRI (fora) | Este repo (aqui) |
|---|---|
| Método, rubricas, análises, épicos | Código, `AGENT.md`, `docs/` |
| “Como avaliar / priorizar” | “O que ficou decidido e como rodar” |

Quando uma análise CAPRI gera uma decisão, ela vira **ADR**, entrada em `docs/stack.md`, teste em `docs/testing/`, ou regra em `AGENT.md` — nunca uma cópia de artefatos CAPRI em `docs/capri/`.

## Índice

| Documento | Conteúdo |
|---|---|
| [stack.md](./stack.md) | Versões, scripts npm, limitações |
| [offline-scope.md](./offline-scope.md) | O que funciona sem internet |
| [data-lineage.md](./data-lineage.md) | Genealogia dos dados, fluxos, exceções, pipeline |
| [baseline.md](./baseline.md) | Snapshot de testes e greps |
| [testing/ci-local.md](./testing/ci-local.md) | Verificação antes do push (sem GitHub Actions) |
| [testing/test-matrix.md](./testing/test-matrix.md) | Casos TC-001 … |
| [testing/smoke-centro.md](./testing/smoke-centro.md) | Checklist browser `/centro/` |
| [accessibility/contrast-notes.md](./accessibility/contrast-notes.md) | Contraste WCAG (amostragem) |
| [adr/0001-site-estatico-sem-framework.md](./adr/0001-site-estatico-sem-framework.md) | Decisão: site estático |
| [design-system/README.md](./design-system/README.md) | Tokens, componentes, a11y |

## Guia do agente / contribuidor

- **[AGENT.md](../AGENT.md)** — convenções de código, MapLibre, ARG, DoD

## Antes de cada push

```bash
npm run ci
```
