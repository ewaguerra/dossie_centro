# Acessibilidade

Fonte principal: `vendor/app/styles/a11y.css`  
Carregamento: **segundo** `<link>` após `tokens.css` nas quatro páginas principais.

> **Declaração de escopo:** este projecto **não** reivindica conformidade WCAG 2.2 completa. Não houve auditoria formal com ferramentas automatizadas em todas as páginas nem teste sistemático de teclado, zoom 200% e ARIA. O que segue documenta o **MVP de acessibilidade visual** implementado e as **limitações conhecidas**.

---

## Foco visível (`:focus-visible`)

Outline aplicado globalmente a elementos interactivos e componentes DS:

- Nativos: `button`, `[role="button"]`, `a`, `input`, `select`, `textarea`, `summary`
- Focusáveis: `[tabindex]:not([tabindex="-1"])`
- DS: `.btn`, `.input`, `.checkbox`, `.toast__close`, `.nav-retorno__link`, `.nav-btn`, `.hamburger-btn`, `.hamburger-link`

Propriedades:

```css
outline: 2px solid var(--color-accent);  /* âmbar — identidade */
outline-offset: 2px;
border-radius: var(--radius-xs);
```

### Override Centro HUD

Dentro de `.has-jesuit-frame`, botões do chrome forense usam outline **vermelho**:

- `.nav-btn`, `.btn--ghost`, `.btn--bare`, `.sidebar-open-btn`
- Cor: `--color-accent-strong`

Isto alinha o foco com a identidade visual do Centro sem misturar âmbar no HUD.

### Foco local adicional

Estilos locais **mantidos** onde acrescentam contexto narrativo:

- `.clue-word:focus-visible` (arquivo-morto)
- Regras em `landing.css`, `centro-sidebar.css`

Não remover foco local sem verificar duplicação visual.

---

## Reduced motion

`@media (prefers-reduced-motion: reduce)` em `a11y.css`:

| Efeito | Comportamento |
|---|---|
| `html` | `scroll-behavior: auto !important` |
| `*, *::before, *::after` | Animações e transições ≈ instantâneas (`0.01ms`) |

Complementos locais:

- `.skeleton` — shimmer desactivado em `components.css`
- Landing — scanlines / animações próprias
- Centro — `.as-shake`, `.as-reveal` em módulos arquivista
- MapLibre — animações de câmara não são interceptadas pelo CSS global

**Validação manual:** DevTools → Rendering → *Emulate CSS media feature* → `prefers-reduced-motion: reduce`.

---

## Contraste conhecido

Amostragem manual documentada em `docs/accessibility/contrast-notes.md`. Resumo:

### Passa AA normal (≥ 4.5:1) sobre `#1a1a1a`

| Par | Ratio aprox. |
|---|---|
| `--color-text` `#e8e4d8` | ~13.8:1 |
| `--color-text-muted` `#999999` | ~6.1:1 |
| Botões OP `#dddddd` / `#222222` | ~9.0:1 |
| Toast erro `#fff` / `#dc2626` | OK (texto branco) |

### Falhas conhecidas (dívida aceite)

| Elemento | Foreground | Problema | Mitigação actual |
|---|---|---|---|
| Meta footer inline | `#666666` | ~3.0:1 — FAIL AA normal | Usar só em texto grande ou migrar para `--color-text-muted` |
| `--color-accent-strong` em texto pequeno | `#dc2626` | ~3.6:1 — FAIL AA normal | Reservar para bordas/indicadores; texto → `--color-danger` |
| `.as-digital-aviso` | `#404040` | ~1.7:1 | Módulo legado; fora do runtime activo |
| `.nav-retorno[data-theme="terminal"]` links | `rgba(0,255,0,0.55)` | FAIL estimado | Identidade terminal; sem redesenho nesta fase |

Regras de cor: [brand-decision.md](./brand-decision.md)

---

## Touch targets

| Componente | Mínimo | Onde |
|---|---|---|
| `.nav-retorno__link` | 44×44 px | `components.css` |
| `.narrative-nav .nav-btn` | 44 px altura | `narrative-nav.css` @ ≤640px |
| `.btn--icon` | 40×40 px | DS base |

Ícones menores (28 px) existem em `.btn--icon-sm` — usar com área clicável ampliada ou `aria-label` claro; preferir 44 px em acções primárias mobile.

---

## Teclado e ARIA

### Implementado parcialmente

- Botões nativos `<button>` no Centro migrado
- `aria-label` em controles icónicos (sidebar close, nav)
- `aria-expanded` / `aria-haspopup` no hamburger (Centro)
- Toast com `role="status"` recomendado (runtime legado ainda não usa)

### Limitações conhecidas

| Área | Limitação |
|---|---|
| MapLibre | Mapa não totalmente operável por teclado; popups dependem de mouse/touch |
| Modal / drawer | Sem focus trap formal; Tab pode sair para o mapa |
| Arquivista | Janelas draggable — sem ordem de tab documentada |
| Centro toast inline | Criado via JS sem classes DS completas |
| Skip links | Não implementados globalmente |
| Landmarks | `<main>`, `<nav>` inconsistentes entre módulos |

Próximo passo recomendado (fora do MVP): TC-010 em `docs/testing/test-matrix.md` — axe-core ou Lighthouse.

---

## Checklist manual (4 páginas)

1. **Tab / Shift+Tab** — foco visível em links, botões, inputs
2. **Reduced motion** — animações cessam ou ficam estáticas
3. **375px viewport** — narrative-nav e nav-retorno clicáveis; sem overflow horizontal grave
4. **Contraste** — texto principal legível; aceitar falhas documentadas no HUD/terminal

```bash
grep -R "focus-visible" vendor landing centro arquivo-morto arquivista
grep -R "prefers-reduced-motion" vendor landing centro arquivo-morto arquivista
npm test
```

---

## O que este DS não garante

- Conformidade WCAG 2.2 Level AA ou AAA
- Compatibilidade completa com leitores de ecrã em mapas e simulador OS
- Contraste em todos os estados hover/focus/disabled
- Testes automatizados de a11y no CI

Para auditoria formal, usar ferramentas externas e registar resultados em `docs/testing/`.

---

## Referências

- `vendor/app/styles/a11y.css`
- [principles.md](./principles.md) — restrições de escopo
- [brand-decision.md](./brand-decision.md) — âmbar vs vermelho e contraste
- `docs/accessibility/contrast-notes.md` — ratios detalhados
