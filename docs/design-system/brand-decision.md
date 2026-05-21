# Decisão de marca — PROTOCOLO 13 ALMAS

> **Data:** 2026-05-21 · Aprovada para design system mínimo viável

## Decisão

| Papel | Cor | Token | Uso |
|---|---|---|---|
| **Marca do produto** | `#f59e0b` (âmbar) | `--color-brand` | Landing, arquivo-morto, links cross-módulo, nav-retorno |
| **HUD forense Centro** | `#dc2626` (vermelho) | `--color-accent-strong` | Moldura jesuit, sidebar ops, alertas do mapa |
| **Alerta / perigo** | `#dc2626` | `--color-danger` | Erros, status crítico |
| **Confidencial / selo** | `#d97706` | `--color-brand-dim` | Badges “CONFIDENCIAL” |
| **Sucesso** | `#22c55e` / `#4ade80` | `--color-success` | STATUS EM ANÁLISE |

## Rationale

1. **Âmbar** aparece em landing + arquivo-morto + patrocínio — é a identidade narrativa “Arquivo dos Soterrados”.
2. **Vermelho** no Centro é intencional: HUD militar/forense “PROTOCOLO ALPHA”. Não será removido; será **escopado** via `--color-accent-strong`.
3. Comentário legado “laranja cartográfico” no CSS do Centro estava **correto na intenção**, incorreto na implementação (`#dc2626`). Tokens separam marca vs HUD.

## Regra de uso

- Cross-navigation (`.nav-retorno`, hamburger “PROTOCOLO”) → `--color-brand`
- Centro sidebar, jesuit frame, toast erro → `--color-accent-strong`
- Texto pequeno em vermelho → evitar; preferir `--color-brand` ou `--color-text` + ícone/borda vermelha

## Não escopo

- Redesign visual completo do Centro
- Claim WCAG AA total (ver `docs/capri/wcag-contrast-notes.md`)
