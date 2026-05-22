# Tokens — referência

Fonte: `vendor/app/styles/tokens.css`  
Carregamento: **primeiro** `<link>` de CSS em landing, centro, arquivo-morto e arquivista.

## Cor — identidade & acento

| Token | Valor | Uso |
|---|---|---|
| `--color-accent` | `#f59e0b` | Acento semântico (identidade) |
| `--color-brand` | `var(--color-accent)` | Alias — marca do produto |
| `--color-accent-soft` | `rgba(245,158,11,0.15)` | Fundos sutis |
| `--color-brand-soft` | alias | Compatibilidade |
| `--color-brand-dim` | `#b45309` | Selos, confidencial |
| `--color-brand-border` | `rgba(245,158,11,0.18)` | Bordas âmbar (nav, cards) |
| `--color-accent-strong` | `#dc2626` | HUD forense Centro (não marca) |

## Cor — superfície & texto

| Token | Valor |
|---|---|
| `--color-bg` | `#04070f` |
| `--color-bg-elev-1` | `#0d1220` |
| `--color-bg-elev-2` | `#1a1a1a` |
| `--color-text` | `#e8e4d8` |
| `--color-text-mid` / `--color-text-mute` | `#a3a3a3` |
| `--color-text-muted` | `#999999` |
| `--color-border` | `#404040` (neutro UI) |

> **Nota:** o spec MVP sugere `--color-border` âmbar; neste projeto a borda âmbar é `--color-brand-border` para não conflitar com bordas neutras do Centro.

## Cor — semântica

| Token | Valor |
|---|---|
| `--color-success` | `#22c55e` |
| `--color-warning` | `var(--color-accent)` |
| `--color-danger` | `#ef4444` |

## Tipografia

| Token | Stack |
|---|---|
| `--font-mono` | `'Courier New', Courier, monospace` |
| `--font-serif` | `Georgia, 'Times New Roman', serif` |
| `--font-ui` | system UI stack |
| `--font-code` | `var(--font-mono)` — alias; **Fira Code não usada** (ver [typography.md](./typography.md)) |

## Escala, espaçamento, radius, shadow, motion, z-index

Ver blocos correspondentes em `tokens.css`. Destaques:

- `--fs-xs` … `--fs-2xl` (inclui `2.25rem`)
- `--space-1` … `--space-12`
- `--radius-xs` / `--sm` / `--md`
- `--shadow-sm` / `--md` / `--lg`
- `--ease-out`, `--dur-fast`, `--dur-base`
- `--z-base` … `--z-hud`

## Tokens locais (coexistem)

| Módulo | Ficheiro | Exemplos |
|---|---|---|
| Landing | `landing.css` | `--bg`, `--red`, `--border-2` |
| Centro | `centro/styles/centro-vars.css` | `--centro-accent`, `--jesuit-frame-*` |
| Arquivo-morto | `arquivo-morto.css` | `--am-bg`, `--am-amber-dim` |
| Arquivista | `linux-desktop.css` | `--gnome-blue`, tema OS |

## Validação

```bash
grep -R "tokens.css" landing centro arquivo-morto arquivista
npm test   # HTTP 200 /app/styles/tokens.css
node scripts/smoke-visual-colors.mjs
```
