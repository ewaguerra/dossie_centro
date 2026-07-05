# WCAG — Avaliação básica de contraste (Centro)

> **Status:** dívida visual **aceita** — falhas documentadas abaixo; correção requer redesign aprovado.

> **Escopo:** amostragem manual de pares foreground/background dos elementos principais de `/centro/`.  
> **Não constitui** auditoria WCAG 2.2 completa (sem teste de teclado, ARIA, zoom 200%, etc.).

## Metodologia

- Ratio calculado via fórmula WCAG 2.1 (luminância relativa).
- Fundo de referência da sidebar: `#1a1a1a`.
- Limiares: **AA normal** ≥ 4.5:1 · **AA large** ≥ 3:1.

## Resultados — sidebar e HUD

| Elemento | Foreground | Background | Ratio | AA normal | AA large |
|---|---|---|---|---|---|
| Texto principal (`--color-text`) | `#e5e5e5` | `#1a1a1a` | 13.8:1 | OK | OK |
| Texto muted (`--color-text-muted`) | `#999999` | `#1a1a1a` | 6.1:1 | OK | OK |
| Intro sidebar (inline) | `#888888` | `#1a1a1a` | 4.9:1 | OK | OK |
| Meta footer (`.sidebar-header__meta`) | `var(--color-text-muted)` `#999` | `#1a1a1a` | 6.1:1 | OK | OK |
| Layer meta (`.layer-meta`) | `var(--color-text-muted)` `#999` | `#1a1a1a` | 6.1:1 | OK | OK |
| Accent vermelho HUD (`--centro-accent`) | `#dc2626` | `#1a1a1a` | 3.6:1 | **FAIL** em texto pequeno | OK | Reservar para bordas; texto HUD usa `--color-danger` |
| Status verde (inline) | `#4ade80` | `#1a1a1a` | 10.0:1 | OK | OK |
| Aviso digital (`.as-digital-aviso`) | `#9ca3af` | `#1a1a1a` | ~5.5:1 | **PASS** | verificar | Corrigido 2026-05 |
| Nav link muted (`.nav-retorno__link`, tema terminal) | `rgba(0,255,0,0.82)` | `#050505` | ~* | **PASS** estimado | verificar | Corrigido 2026-05 |

\* estimativa com opacidade sobre fundo escuro.

## Resultados — navegação inferior (inline)

| Elemento | Foreground | Background | Ratio | AA normal |
|---|---|---|---|---|
| Botões OP (`#ddd`) | `#dddddd` | `#222222` (aprox.) | ~9.0:1 | OK |

## Pendências (sem correção nesta fase)

1. ~~**Accent `#dc2626` em texto pequeno**~~ — corrigido 2026-07: `.sidebar-header__eyebrow` e `.layer-row--active .layer-title` usam `--color-danger`; accent reservado a bordas/checkboxes.
2. **`.as-digital-aviso` `#404040`** — módulo arquivista, fora do runtime centro.
3. **Links `.nav-retorno__link` (terminal) opacidade 0.55** — falha AA.
4. **Animações** — `prefers-reduced-motion` em `a11y.css` e módulos específicos.

## Animação do rio

Fora do runtime de produção. Hidrografia estática via catálogo. Utilitários em `centro/features/rio-animado.js` (não carregado em `index.html`).

## Próximo passo

- TC-010b em [../testing/test-matrix.md](../testing/test-matrix.md) (axe-core / Lighthouse).
- Evidência teclado/foco em TC-010 (2026-05-22).
