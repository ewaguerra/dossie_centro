# Design System — PROTOCOLO 13 ALMAS (MVP)

> **Escopo:** tokens e componentes mínimos compartilhados entre os quatro módulos, **sem redesenhar** a narrativa visual de cada página.

## Objetivo

Unificar o que é transversal (marca, foco, nav-retorno, tipografia mono) mantendo identidades locais:

| Módulo | Identidade preservada |
|---|---|
| `landing/` | Âmbar, serif, elevador |
| `centro/` | HUD vermelho, moldura jesuit, MapLibre |
| `arquivo-morto/` | Âmbar, dossier |
| `arquivista/` | Desktop Linux, verde terminal |

## Arquivos do sistema

| Arquivo | Função |
|---|---|
| `vendor/app/styles/tokens.css` | Tokens globais (`--color-brand`, espaçamento, z-index, breakpoints) |
| `vendor/app/styles/a11y.css` | `:focus-visible` global + `prefers-reduced-motion` |
| `vendor/app/styles/components.css` | `.btn`, `.nav-retorno`, `.badge` |
| `centro/styles/centro-vars.css` | Tokens HUD forense (escopo Centro) |
| `centro/styles/centro-chrome.css` | Hamburger, header sidebar, narrative-nav |

## Como carregar (ordem)

```html
<link rel="stylesheet" href="/app/styles/tokens.css" />
<link rel="stylesheet" href="/app/styles/a11y.css" />
<link rel="stylesheet" href="/app/styles/components.css" />
<!-- CSS específico do módulo depois -->
```

Centro adicionalmente:

```html
<link href="/pages/centro/styles/centro-vars.css" rel="stylesheet" />
<link href="/pages/centro/styles/centro-chrome.css" rel="stylesheet" />
<link href="/pages/centro/centro-sidebar.css" rel="stylesheet" />
```

## Decisões documentadas

- [Baseline visual](./baseline-visual.md) — estado pré-DS
- [Tipografia / Fira Code](./typography.md)
- [Acessibilidade global](./a11y.md)
- [Decisão âmbar vs vermelho](./brand-decision.md) — identidade vs alerta vs HUD
- [Tokens](./tokens.md)
- [Componentes](./components.md)
- [Auditoria final](./auditoria-final.md)

## Restrições (não negociáveis)

- Sem CDN, sem framework, sem build step
- Offline-first (texturas externas removidas)
- Uma mudança lógica por commit
- WCAG completo **não** declarado — ver `docs/capri/wcag-contrast-notes.md`

## Validação

```bash
npm test
node scripts/smoke-centro.mjs
```

Smoke manual de browser: `docs/capri/smoke-centro.md` (itens 3–9).
