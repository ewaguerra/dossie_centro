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
| `vendor/app/styles/components.css` | `.btn`, `.input`, `.card`, `.toast`, `.nav-retorno`, `.badge` |
| `centro/styles/centro-vars.css` | Tokens HUD forense (escopo Centro) |
| `centro/styles/centro-chrome.css` | Hamburger, header sidebar |
| `centro/styles/layout.css` … `responsive.css` | CSS modular do Centro (ver `centro-markup.md`) |
| `centro/centro-sidebar.css` | Agregador `@import` (compat legada) |

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
<link href="/pages/centro/styles/layout.css" rel="stylesheet" />
<link href="/pages/centro/styles/sidebar.css" rel="stylesheet" />
<link href="/pages/centro/styles/narrative-nav.css" rel="stylesheet" />
<link href="/pages/centro/styles/feature-inspector.css" rel="stylesheet" />
<link href="/pages/centro/styles/profile-card.css" rel="stylesheet" />
<link href="/pages/centro/styles/jesuit-frame.css" rel="stylesheet" />
<link href="/pages/centro/styles/map-popups.css" rel="stylesheet" />
<link href="/pages/centro/styles/responsive.css" rel="stylesheet" />
```

## Decisões documentadas

- [Princípios](./principles.md) — escopo, âmbar/vermelho, drawer/modal/toast
- [Tokens](./tokens.md) — cor, tipografia, espaçamento, z-index
- [Componentes](./components.md) — `.btn`, `.card`, `.nav-retorno`, `.toast`
- [Acessibilidade](./accessibility.md) — foco, motion, contraste, limitações
- [Baseline visual](./baseline-visual.md) — snapshot pré-DS + estado pós-DS
- [Texturas offline](./offline-textures.md) — sem CDN decorativo
- [Breakpoints](./breakpoints.md) — 480 / 640 / 768 / 1024 + responsivo
- [Centro sem inline](./centro-markup.md) — migração dos 23 `style=` do HTML
- [Tipografia / Fira Code](./typography.md)
- [Decisão âmbar vs vermelho](./brand-decision.md) — identidade vs alerta vs HUD
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
