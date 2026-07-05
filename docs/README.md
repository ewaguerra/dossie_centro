# Documentação do projeto

Tudo que descreve **este repositório (Centro/mapa)** — stack, testes, offline, design system, decisões (ADR).

Documentação do ARG completo (superfícies, pistas, fluxo do jogador, contratos) vive no repositório privado **`dossie_arg_contracts`**.

## CAPRI (inteligência externa)

**CAPRI** é um framework de análise (requisitos, riscos, gates, backlog). Usamos como **referência para pensar** o projeto — não como pasta de docs dentro do repo.

| CAPRI (fora) | Este repo (aqui) |
|---|---|
| Método, rubricas, análises, épicos | Código do Centro, `AGENT.md`, `docs/` |
| “Como avaliar / priorizar” | “O que ficou decidido e como rodar o mapa” |

Quando uma análise CAPRI gera uma decisão, ela vira **ADR**, entrada em `docs/stack.md`, teste em `docs/testing/`, ou regra em `AGENT.md`.

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
| [architecture/map-init-flow.md](./architecture/map-init-flow.md) | Fluxo de init do mapa |

## Repositórios irmãos (ARG)

| Repo | Superfície |
|---|---|
| `dossie_landing_portal` | Landing `/landing/` |
| `dossie_arquivo_morto` | Arquivo Morto `/arquivo-morto/` |
| `dossie_arquivista` | Arquivista `/arquivista/` |
| `dossie_arg_contracts` | Contratos ARG, glossário, smoke manual |

## Guia do agente / contribuidor

- **[AGENT.md](../AGENT.md)** — convenções de código, MapLibre, ARG, DoD

## Antes de cada push

```bash
npm run ci
```
