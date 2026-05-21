# WCAG — Avaliação básica de contraste (Centro)

> **Status CAPRI:** dívida visual **aceita** — falhas documentadas abaixo; correção requer redesign aprovado (fora do escopo atual).

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
| Meta footer (inline) | `#666666` | `#1a1a1a` | 3.0:1 | **FAIL** | OK |
| Accent vermelho (`--centro-accent`) | `#dc2626` | `#1a1a1a` | 3.6:1 | **FAIL** | OK |
| Status verde (inline) | `#4ade80` | `#1a1a1a` | 10.0:1 | OK | OK |
| Aviso digital (`.as-digital-aviso`) | `#404040` | `#1a1a1a` | 1.7:1 | **FAIL** | **FAIL** |
| Nav link muted (`.nav-retorno-link`) | `rgba(220,38,38,0.55)` | `#050505` | ~2.0:1* | **FAIL** | **FAIL** |

\* estimativa com opacidade sobre fundo escuro.

## Resultados — navegação inferior (inline)

| Elemento | Foreground | Background | Ratio | AA normal |
|---|---|---|---|---|
| Botões OP (`#ddd`) | `#dddddd` | `#222222` (aprox.) | ~9.0:1 | OK |

## Pendências registradas (sem correção nesta fase)

1. **Meta footer `#666`** — legível apenas como texto grande; revisar se usado em `<span>` pequeno.
2. **Accent `#dc2626` em texto pequeno** — chrome HUD forense; falha AA normal. Regra: usar `--color-danger` (`#ef4444`) para alertas em texto pequeno; reservar `--color-accent-strong` para bordas/indicadores. Ver `docs/design-system/brand-decision.md`.
3. **`.as-digital-aviso` `#404040`** — contraste insuficiente; módulo arquivista/digital, fora do runtime centro ativo.
4. **Links `.nav-retorno-link` com opacidade 0.55** — falha AA; não alterados (restrição: sem redesenho UI).
5. **Animações CSS** (`as-shake`, `as-reveal`) — `prefers-reduced-motion` adicionado em `centro-sidebar.css` para o módulo arquivista; landing tem regra própria.

## Animação do rio

Fora do escopo do runtime. Hidrografia exibida como camada estática do catálogo (`05_hidrografia_rios__line`). Utilitários geométricos permanecem em `centro/features/rio-animado.js` (documentado, não carregado em `index.html`).

## Próximo passo recomendado (auditoria completa)

- TC-010 em `docs/capri/test-matrix.md` (navegação por teclado + contraste automatizado).
- Ferramenta: axe-core ou Lighthouse a11y em `/centro/` com mapa carregado.
