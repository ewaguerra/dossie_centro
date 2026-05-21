# Decisão de identidade visual — âmbar vs vermelho

> **Data:** 2026-05-21 · **Status:** aprovada  
> **Escopo:** regra semântica de cor para todo o `projeto_centro`

## Decisão executiva

| Papel semântico | Cor | Token global | Regra |
|---|---|---|---|
| **Identidade do produto** | `#f59e0b` (âmbar) | `--color-brand` / `--color-accent` | Marca transversal, navegação cross-módulo, cartografia, selos de tipo, patrocínio |
| **Alerta / perigo / hostilidade** | `#ef4444` | `--color-danger` | Texto de erro, badges críticos, links destrutivos, estados de risco |
| **Chrome HUD forense (Centro)** | `#dc2626` | `--color-accent-strong` | Moldura jesuit, bordas ops, indicadores “live”, toast erro (fundo), camadas de risco no mapa — **não é identidade de marca** |
| **Aviso / confidencial** | `#d97706` | `--color-confidential` | Toast warn, selos CONFIDENCIAL |
| **Sucesso** | `#22c55e` | `--color-success` | Status positivo |

```css
/* tokens.css — hierarquia canônica */
--color-brand:   #f59e0b;   /* identidade */
--color-accent:  var(--color-brand);
--color-danger:  #ef4444;   /* alerta — preferir em texto pequeno */
--color-accent-strong: #dc2626; /* HUD / chrome forense — evitar texto < 14px */
```

## Contexto da auditoria

1. Comentário legado “laranja cartográfico” descrevia a **intenção de marca** (`#f59e0b`).
2. O Centro implementou **vermelho** (`#dc2626`) como `--centro-accent` no sidebar/HUD — tom “red ops”, não âmbar.
3. Landing e arquivo-morto já usavam âmbar como identidade predominante (agora via `--color-brand`).
4. `#dc2626` em texto pequeno **falha WCAG AA** (~3.6:1 sobre `#1a1a1a`) — ver `docs/capri/wcag-contrast-notes.md`.

**Conclusão:** âmbar = identidade; vermelho = alerta ou chrome forense escopado. Não unificar tudo em vermelho nem substituir o HUD do Centro por âmbar nesta fase.

## Inventário — `#dc2626` (runtime)

| Local | Papel | Semântica | Ação |
|---|---|---|---|
| `tokens.css` `--color-accent-strong` | definição | HUD forense | **Manter** |
| `tokens.css` `--color-danger` (legado) | era `#dc2626` | conflito semântico | **Corrigido → `#ef4444`** |
| `centro-vars.css` → `--centro-accent` | alias | HUD chrome (nome legado) | **Manter alias**; documentado |
| `centro-sidebar.css` `--centro-accent` (18×) | bordas/texto sidebar | HUD ops | **Manter** (chrome) |
| `centro-sidebar.css` `.parceiros-btn__indicator--on` | ponto 8px | alerta live | **Manter** (não é texto) |
| `centro-sidebar.css` `.as-tooltip__badge` 0.55rem | texto badge | alerta | **Migrar → `--color-danger`** |
| `centro-chrome.css` hamburger/nav | bordas HUD | chrome | **Manter** |
| `components.css` `.btn--ghost` | borda Centro | chrome | **Manter** |
| `a11y.css` foco Centro HUD | outline | chrome | **Manter** |
| `centro-runtime.js` toast erro | fundo + texto branco | alerta | **Manter** (contraste OK) |
| `theme.js` camadas mapa risco | geometria | dado geoespacial | **Manter** |
| `arquivista/utility.css` `.text-red-600` | utilitário | alerta | **Manter** |

## Inventário — `#f59e0b` (identidade)

| Módulo | Uso | Token alvo |
|---|---|---|
| `landing/` | acento predominante | `--color-brand` ✓ |
| `arquivo-morto/` | kicker, links, bordas | `--color-brand` ✓ |
| `centro/` POI card seleção | hover/seleção | `--color-accent` (= brand) ✓ |
| `centro/` badges tipo, patrocínio | selos narrativos | `--color-brand` |
| `centro/utils.js` `CENTRO_COLOR` | utilitário mapa | brand (contorno região) |
| `theme.js` região centro polygon | cartografia | brand ✓ |
| `centro-chrome.css` hamburger “PROTOCOLO” | nav cross-módulo | `--color-brand` ✓ |

## Inventário — `#ef4444` (alerta)

| Módulo | Uso |
|---|---|
| `arquivo-morto.css` `--am-red` | glitch narrativo |
| `centro-sidebar.css` `.as-*` erros/voltar | popup patrocinado |
| `theme.js` POI tipo perigo | dado semântico |
| `tokens.css` `--color-danger` | token canônico |

## Aliases legados (Centro)

| Alias local | Aponta para | Nota |
|---|---|---|
| `--centro-accent` | `--color-accent-strong` | **Nome enganoso** — não é acento de marca; é chrome HUD. Não renomear nesta fase (18+ usos). |
| `--jesuit-frame-blue` | `--color-accent-strong` | Nome histórico; cor é vermelho alerta |

## Regras de uso (obrigatórias)

1. **Cross-navigation** (`.nav-retorno`, hamburger “← PROTOCOLO”) → `--color-brand`.
2. **Identidade / cartografia / patrocínio** → `--color-brand` ou `--color-accent`.
3. **Erro, hostilidade, destruição** → `--color-danger` (`#ef4444`); evitar `#dc2626` em texto pequeno.
4. **Moldura HUD, bordas sidebar ops, indicadores live** → `--color-accent-strong` (`#dc2626`).
5. **Texto pequeno (< 14px) em vermelho** → usar `--color-danger` ou `--color-text` + borda/ícone vermelho; checar contraste.
6. **Não** usar vermelho como substituto de âmbar em landing/arquivo-morto.

## Mudança visual declarada

| Alteração | Impacto |
|---|---|
| `--color-danger`: `#dc2626` → `#ef4444` | Texto de alerta que migrar para o token fica levemente mais claro |
| `.as-tooltip__badge` → `var(--color-danger)` | Badge 0.55rem ligeiramente mais legível |
| Demais HUD vermelho | **Sem alteração** nesta etapa |

## Não escopo

- Redesign completo do Centro (sidebar vermelha permanece como chrome forense).
- Claim WCAG AA total.
- Migrar `--centro-accent` para novo nome.
- Alterar camadas MapLibre em `theme.js`.

## Etapa futura

- Renomear `--centro-accent` → `--centro-hud-alert` (refactor dedicado; 18+ usos em `centro-sidebar.css`).

## Validação

```bash
npm test
node scripts/smoke-visual-colors.mjs   # 4 páginas — âmbar marca vs vermelho HUD/alerta
grep -R "#dc2626" . --include='*.css' --include='*.js'
grep -R "#f59e0b" . --include='*.css' --include='*.js'
grep -R "#ef4444" . --include='*.css' --include='*.js'
```

Revisão visual manual: landing, centro, arquivo-morto, arquivista — confirmar âmbar em nav/marca e vermelho só em HUD/alerta.

## Referências

- `vendor/app/styles/tokens.css`
- `centro/styles/centro-vars.css`
- `docs/capri/wcag-contrast-notes.md`
