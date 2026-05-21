# Auditoria final — Design System MVP

> **Data:** 2026-05-21 · Pós-implementação

## Resumo

| Critério | Baseline | Pós-DS | Status |
|---|---|---|---|
| Tokens compartilhados | 0 | `tokens.css` + `centro-vars.css` | ☑ |
| Foco visível global | Parcial/ausente | `a11y.css` | ☑ |
| Reduced motion | Ausente | `a11y.css` | ☑ |
| Fira Code | Referenciada, não carregada | Removida → `--font-code` | ☑ |
| Inline `style=` Centro | 23 | 0 | ☑ |
| nav-retorno unificado | 3 implementações | `components.css` | ☑ |
| Texturas CDN | transparenttextures + unsplash | Gradientes locais | ☑ |
| Componentes-base | Ad hoc | `.btn`, `.nav-retorno`, `.badge` | ☑ parcial |
| centro-sidebar modular | 1818 linhas monolítico | vars + chrome extraídos; ~1700 linhas restantes | ◐ |
| Breakpoints unificados | Divergentes | Tokens documentados; media queries ainda literais | ◐ |
| Arquivista mobile | Desktop-only | Media queries mínimas 768/480 | ◐ |
| WCAG AA completo | Não auditado | Não claim — ver wcag-contrast-notes | — |

## Divergências auditoria × código

1. **Vermelho `#dc2626` em texto pequeno** — mantido no HUD Centro por narrativa; documentado em `brand-decision.md` e `wcag-contrast-notes.md`. Não corrigido para AA sem alterar identidade.
2. **Modularização centro-sidebar** — extraídos apenas `centro-vars.css` e `centro-chrome.css`; jesuit-frame, inspector e profile-card permanecem no ficheiro principal.
3. **Inputs/cards/popups** — não migrados para `components.css` (fora do MVP).

## Testes automatizados

- `npm test` — sanity (0 inline, sem Fira/unsplash) + HTTP (`tokens.css`, `centro-chrome.css`)
- `node scripts/smoke-centro.mjs` — assets 200

## Validação visual pendente (browser real)

Ver `docs/capri/smoke-centro.md` itens 3–9: mapa, sidebar, narrative-nav scroll mobile, nav-retorno em cada módulo.

## Score estimado pós-DS

| Dimensão | Antes | Depois |
|---|---|---|
| Tokens / consistência | 2/10 | 6/10 |
| A11y foco | 3/10 | 7/10 |
| Modularidade CSS | 2/10 | 5/10 |
| Offline | 6/10 | 9/10 |
| **Média DS** | **~4.3/10** | **~6.8/10** |

Não representa conformidade WCAG nem qualidade visual subjetiva — apenas cobertura técnica do MVP.
