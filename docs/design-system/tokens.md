# Tokens — referência

Fonte: `vendor/app/styles/tokens.css`

## Marca e semântica

| Token | Valor | Uso |
|---|---|---|
| `--color-brand` | `#f59e0b` | Marca do produto, nav cross-módulo |
| `--color-brand-dim` | `#b45309` | Selos, confidencial |
| `--color-brand-soft` | `rgba(245,158,11,0.15)` | Fundos sutis |
| `--color-brand-border` | `rgba(245,158,11,0.18)` | Bordas nav-retorno |
| `--color-accent-strong` | `#dc2626` | HUD forense Centro |
| `--color-danger` | `#dc2626` | Erros / alerta |
| `--color-accent` | `var(--color-brand)` | Default semântico |

## Neutros

| Token | Valor |
|---|---|
| `--color-bg` | `#04070f` |
| `--color-bg-elev-1` | `#0d1220` |
| `--color-bg-elev-2` | `#1a1a1a` |
| `--color-text` | `#e8e4d8` |
| `--color-text-muted` | `#999999` |
| `--color-border` | `#404040` |

## Tipografia

| Token | Stack |
|---|---|
| `--font-mono` | `'Courier New', Courier, monospace` |
| `--font-serif` | `Georgia, 'Times New Roman', serif` |
| `--font-ui` | system UI stack |
| `--font-code` | `var(--font-mono)` — **Fira Code removida** |

## Escala e espaçamento

- `--fs-xs` … `--fs-xl` (modular ~1.125)
- `--space-1` … `--space-12` (base 4px)

## Breakpoints (referência)

| Token | px |
|---|---|
| `--bp-sm` | 480 |
| `--bp-md` | 640 |
| `--bp-lg` | 768 |
| `--bp-xl` | 1024 |

> Media queries usam valores literais; tokens servem como documentação única.

## Tokens locais Centro

Ver `centro/styles/centro-vars.css` — `--jesuit-frame-*`, `--sidebar-*`, `--protocol-alpha-*`.
