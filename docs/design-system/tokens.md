# Tokens — referência

Fonte canónica: `vendor/app/styles/tokens.css`  
Carregamento: **primeiro** `<link>` de CSS em landing, centro, arquivo-morto e arquivista.

Tokens locais por módulo **coexistem** (ver secção final). Preferir tokens globais em código novo.

---

## Cor — identidade & acento

| Token | Valor | Quando usar |
|---|---|---|
| `--color-accent` | `#f59e0b` | Acento semântico (= identidade) |
| `--color-brand` | `var(--color-accent)` | Marca do produto, CTAs, nav cross-módulo |
| `--color-accent-soft` | `rgba(245,158,11,0.15)` | Fundos sutis âmbar |
| `--color-brand-soft` | alias | Compatibilidade |
| `--color-brand-dim` | `#b45309` | Estados active, selos escuros |
| `--color-brand-border` | `rgba(245,158,11,0.18)` | Bordas de marca (nav-retorno default, cards) |

### HUD forense (Centro — não é marca)

| Token | Valor | Quando usar |
|---|---|---|
| `--color-accent-strong` | `#dc2626` | Moldura jesuit, bordas ops, `.btn--ghost`, toast erro |
| `--color-accent-strong-dark` | `#991b1b` | Estados active no chrome vermelho |
| `--color-accent-strong-muted` | `#fca5a5` | Hover em links HUD |
| `--color-accent-strong-bg` | `#fef2f2` | Fundos claros de alerta (inspector) |

> Regra completa: [brand-decision.md](./brand-decision.md) · [principles.md](./principles.md)

---

## Cor — superfície & texto

| Token | Valor | Quando usar |
|---|---|---|
| `--color-bg` | `#04070f` | Fundo de página escuro |
| `--color-bg-elev-1` | `#0d1220` | Inputs, painéis elevados |
| `--color-bg-elev-2` | `#1a1a1a` | Botões default, sidebar Centro |
| `--color-bg-subtle` | `#121212` | Cards, fundos secundários |
| `--color-text` | `#e8e4d8` | Texto principal |
| `--color-text-mid` / `--color-text-mute` | `#a3a3a3` | Texto secundário |
| `--color-text-muted` | `#999999` | Placeholders, metadados |
| `--color-border` | `#404040` | Bordas neutras UI |
| `--color-border-light` | `#262626` | Bordas subtis em cards |

> Borda **âmbar** = `--color-brand-border`, não `--color-border`.

---

## Cor — semântica

| Token | Valor | Quando usar |
|---|---|---|
| `--color-success` | `#22c55e` | Status positivo |
| `--color-success-bright` | `#4ade80` | Destaque verde (status live) |
| `--color-warning` | `var(--color-accent)` | Avisos não críticos |
| `--color-danger` | `#ef4444` | Erro, hostilidade — **texto pequeno** |
| `--color-confidential` | `#d97706` | CONFIDENCIAL, `.toast--warn` |

---

## Tipografia

| Token | Stack | Quando usar |
|---|---|---|
| `--font-mono` | `'Courier New', Courier, monospace` | Botões, terminal, labels OP:*, metadados |
| `--font-serif` | `Georgia, 'Times New Roman', serif` | Prosa, títulos editoriais (landing, dossier) |
| `--font-ui` | system UI sans | Toast, UI legível em corpo pequeno |
| `--font-code` | `var(--font-mono)` | Alias legado |

### Escala (`--fs-*`)

| Token | Valor | Uso típico |
|---|---|---|
| `--fs-xs` | `0.72rem` | Badges, labels uppercase, nav-retorno |
| `--fs-sm` | `0.8125rem` | Botões, inputs, corpo compacto |
| `--fs-base` | `1rem` | Corpo default |
| `--fs-md` | `1.125rem` | Subtítulos |
| `--fs-lg` | `1.42rem` | Títulos secção |
| `--fs-xl` | `1.8rem` | Títulos hero |
| `--fs-2xl` | `2.25rem` | Display |

Detalhes Fira Code / offline: [typography.md](./typography.md)

---

## Espaçamento (base 4px)

| Token | Valor |
|---|---|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-6` | `1.5rem` (24px) |
| `--space-8` | `2rem` (32px) |
| `--space-12` | `3rem` (48px) |

Usar múltiplos consistentes — evitar valores ad hoc (`padding: 7px`) em código novo.

---

## Radius

| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | `2px` | Badges, nav-retorno, foco outline |
| `--radius-sm` | `4px` | Botões, inputs, toast |
| `--radius-md` | `8px` | Cards, narrative-nav |

---

## Shadow

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 2px 6px rgba(0,0,0,0.4)` | Popups compactos |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` | Toast, card--popup |
| `--shadow-lg` | `0 10px 30px rgba(0,0,0,0.6)` | Inspector, modais |

---

## Motion

| Token | Valor | Uso |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Transições UI |
| `--dur-fast` | `150ms` | Hover, border, opacity |
| `--dur-base` | `250ms` | Toast, skeleton shimmer |

Respeitar `prefers-reduced-motion` — ver [accessibility.md](./accessibility.md).

---

## Z-index

| Token | Valor | Camada |
|---|---|---|
| `--z-base` | `1` | Conteúdo mapa / base |
| `--z-overlay` | `40` | Sidebar, overlays locais |
| `--z-nav` | `100` | narrative-nav (Centro) |
| `--z-toast` | `900` | `.toast` |
| `--z-modal` | `1000` | Hamburger dropdown, modais |
| `--z-hud` | `1100` | `.nav-retorno`, chrome superior |

Excepção documentada: `.nav-retorno[data-theme="terminal"]` usa `z-index: 100001` no Arquivista (legado OS).

---

## Breakpoints

Custom properties **não funcionam** em `@media`. Usar literais:

| Token | Valor | Uso |
|---|---|---|
| `--bp-sm` | `480px` | Phone estreito |
| `--bp-md` | `640px` | Phone / phablet |
| `--bp-lg` | `768px` | Tablet portrait |
| `--bp-xl` | `1024px` | Tablet landscape |

Mapa por módulo: [breakpoints.md](./breakpoints.md)

---

## Guia rápido — âmbar vs vermelho vs mono vs serif

| Escolha | Token / classe | Exemplo |
|---|---|---|
| Marca, CTA, nav entre módulos | `--color-brand`, `.btn--primary` | nav-retorno default, hamburger “PROTOCOLO” |
| Chrome HUD Centro | `--color-accent-strong`, `.btn--ghost` | Moldura, OP:*, sidebar ops |
| Erro legível (< 14px) | `--color-danger` | Badge alerta, texto erro |
| UI técnica | `--font-mono` | Botões, inputs DS |
| Prosa narrativa | `--font-serif` | Landing hero, arquivo-morto |
| Feedback sistema | `--font-ui`, `.toast` | Mensagens temporárias |

---

## Tokens locais (coexistem)

| Módulo | Ficheiro | Exemplos |
|---|---|---|
| Landing | `landing/landing.css` | `--bg-2`, `--border-2`, `--brand-*` (opacidades); marca via `--color-brand` |
| Centro | `centro/styles/centro-vars.css` | `--centro-accent` → alias HUD (ver abaixo) |
| Arquivo-morto | `arquivo-morto/css/arquivo-morto.css` | `--am-bg`, `--am-border`, `--am-brand-*`; sólidos via `--color-brand` |
| Arquivista | `arquivista/css/linux-desktop.css` | `--gnome-blue`, tema day/night |

### Alias `--centro-accent` (Centro HUD)

| Alias local | Aponta para | Semântica |
|---|---|---|
| `--centro-accent` | `--color-accent-strong` (`#dc2626`) | Chrome HUD forense — **não** é marca âmbar |
| `--centro-accent-dark` | `--color-accent-strong-dark` | Estado active HUD |
| `--centro-accent-bg` | `--color-accent-strong-bg` | Fundo claro de alerta |
| `--centro-accent-muted` | `--color-accent-strong-muted` | Hover/links HUD |

Renomeação futura (`--centro-hud-alert`) documentada em [brand-decision.md](./brand-decision.md); fora do escopo de refactor nesta fase.

Migrar para tokens globais apenas quando o módulo for tocado — não refactor em massa.

---

## Validação

```bash
grep -R "tokens.css" landing centro arquivo-morto arquivista
npm test
node scripts/smoke-visual-colors.mjs
```
