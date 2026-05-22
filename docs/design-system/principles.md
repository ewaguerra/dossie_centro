# Princípios — design system mínimo

> **Escopo:** tokens e componentes **transversais** entre os quatro módulos.  
> **Não é** um redesign unificado — cada página mantém identidade narrativa própria.

## Objetivos

1. **Unificar o que se repete** — foco, nav-retorno, botões base, tokens de cor/marca.
2. **Preservar identidades locais** — HUD vermelho do Centro, verde terminal do Arquivista, serif da Landing.
3. **Offline-first** — sem CDN, sem Google Fonts, sem build step.
4. **Evolução incremental** — uma mudança lógica por commit; CSS legado coexiste até migração.

## Identidades por módulo

| Módulo | Cor dominante | Tipografia dominante | Padrão de layout |
|---|---|---|---|
| `landing/` | Âmbar (`--color-brand`) | Serif + mono | Elevador / scroll |
| `centro/` | Vermelho HUD (`--color-accent-strong`) | Mono | Mapa + sidebar (drawer) |
| `arquivo-morto/` | Âmbar | Serif + mono | Dossier / documento |
| `arquivista/` | Verde terminal + tema OS | Mono + UI sans | Desktop simulado |

## Decisão âmbar vs vermelho

Regra canónica — detalhes em [brand-decision.md](./brand-decision.md):

| Cor | Token | Quando usar |
|---|---|---|
| **Âmbar** `#f59e0b` | `--color-brand` | Identidade do produto, nav cross-módulo, cartografia, patrocínio, CTAs primários |
| **Vermelho HUD** `#dc2626` | `--color-accent-strong` | Chrome forense do Centro — moldura, bordas ops, indicadores live, toast erro (fundo) |
| **Vermelho alerta** `#ef4444` | `--color-danger` | Texto de erro, badges críticos, links destrutivos — preferir em texto pequeno |
| **Confidencial** `#d97706` | `--color-confidential` | Toast aviso, selos CONFIDENCIAL |

**Não fazer:** substituir o HUD vermelho do Centro por âmbar; usar vermelho como marca em landing/arquivo-morto.

## Tipografia — quando usar cada stack

| Token | Stack | Quando usar |
|---|---|---|
| `--font-mono` | Courier New, Courier | UI técnica, botões DS, terminal, labels OP:*, código, metadados |
| `--font-serif` | Georgia, Times New Roman | Prosa narrativa, títulos de dossier, landing editorial |
| `--font-ui` | System UI sans | Toast, textos de sistema legíveis em tamanho pequeno |
| `--font-code` | alias de `--font-mono` | Compat legado; preferir `--font-mono` em código novo |

Ver [typography.md](./typography.md) — Fira Code **não** é usada (offline).

## Padrões de superfície (sem classe única no DS)

O MVP não define `.drawer` nem `.modal` globais. Usar os padrões abaixo:

| Padrão | Implementação actual | z-index | Notas |
|---|---|---|---|
| **Drawer** | `.sidebar` (Centro) | `--z-overlay` (40) | Painel lateral colapsável; full-width em ≤768px |
| **Modal / popup** | `.card--popup`, hamburger dropdown, janelas Arquivista | `--z-modal` (1000) | Bloqueio de interacção parcial; sem trap de foco formal |
| **Toast** | `.toast` + `centroToast()` | `--z-toast` (900) | Feedback temporário; não substituir erros persistentes |
| **Card** | `.card`, `.card--inspector`, `.card--popup` | contexto local | Conteúdo agrupado; inspector claro para dossiês |

## Hierarquia z-index

Ordem crescente (ver [tokens.md](./tokens.md)):

`--z-base` → `--z-overlay` → `--z-nav` → `--z-toast` → `--z-modal` → `--z-hud`

- Nav fixa (narrative-nav, nav-retorno): `--z-nav` / `--z-hud`
- Sidebar aberta: abaixo de modal/hamburger
- Toast: acima do mapa, abaixo de modal crítico

## Restrições (não negociáveis)

- Sem framework CSS, sem bundler, sem npm para assets de runtime
- Texturas decorativas externas removidas — ver [offline-textures.md](./offline-textures.md)
- Breakpoints literais em `@media` — ver [breakpoints.md](./breakpoints.md)
- **WCAG completo não declarado** — ver [accessibility.md](./accessibility.md)

## Como contribuir

1. Novos tokens → `vendor/app/styles/tokens.css` + actualizar [tokens.md](./tokens.md)
2. Novos componentes base → `components.css` + [components.md](./components.md)
3. Foco / motion → `a11y.css` + [accessibility.md](./accessibility.md)
4. Validar: `npm test`

## Referências

- [README](./README.md) — índice e ordem de carregamento
- [brand-decision.md](./brand-decision.md) — inventário âmbar/vermelho
- [baseline-visual.md](./baseline-visual.md) — estado pré/pós DS
