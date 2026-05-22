# Auditoria final — Design System MVP

> **Data inicial:** 2026-05-21 · **Actualizado:** 2026-05-22  
> **Veredicto:** **GO** — design system mínimo funcional (com parciais documentados)

Este documento reflecte o **estado actual do código**, não o snapshot intermédio da primeira auditoria.

---

## Resumo executivo

| Critério | Pré-DS | Pós-MVP (actual) | Status |
|---|---|---|---|
| Tokens globais | 0 | `tokens.css` + `centro-vars.css` | ☑ |
| `a11y.css` (foco + reduced-motion) | parcial | 4 páginas principais | ☑ |
| `components.css` | ad hoc | `.btn`, `.input`, `.card`, `.toast`, `.nav-retorno` | ☑ |
| Fira Code em runtime | referenciada | removida → `--font-mono` | ☑ |
| Inline `style=` Centro HTML | 23 | **0** | ☑ |
| `nav-retorno` | 4 implementações CSS | 1 base + `data-theme` | ☑ |
| Texturas CDN decorativas | sim | removidas (runtime) | ☑ |
| Centro CSS modular | monólito ~1818 linhas | **10 módulos** + agregador | ☑ |
| `centroToast()` | inline JS | classes `.toast` DS | ☑ |
| Tokens âmbar landing/arquivo-morto | locais (`--amber`) | `var(--color-brand)` + aliases | ☑ |
| Mapa Centro offline | tiles/glyphs CDN | **1378 tiles + 32 PBF locais** | ☑ |
| Breakpoints | divergentes | tokens documentados; MQ literais | ◐ |
| Adopção `.btn` cross-módulo | Centro only | Centro + **Landing** (hero/tier/portal); Arquivista legado | ◐ |
| Arquivista mobile | desktop-only | MQ mínimas 768/640/480 | ◐ |
| WCAG AA completo | não auditado | **não declarado** | — |

---

## Centro — 10 módulos CSS

Carregados explicitamente em `centro/index.html` (ordem de cascata):

| # | Ficheiro | Responsabilidade |
|---|---|---|
| 1 | `centro/styles/centro-vars.css` | Tokens HUD locais |
| 2 | `centro/styles/centro-chrome.css` | Hamburger, header sidebar |
| 3 | `centro/styles/layout.css` | Reset, html/body, `#map` |
| 4 | `centro/styles/sidebar.css` | Sidebar, layers, evidence |
| 5 | `centro/styles/narrative-nav.css` | Barra OP:* / flyTo |
| 6 | `centro/styles/feature-inspector.css` | Inspector + debug JSON |
| 7 | `centro/styles/profile-card.css` | ProfileCard pistas |
| 8 | `centro/styles/jesuit-frame.css` | Moldura HUD |
| 9 | `centro/styles/map-popups.css` | Popups, parceiros, tooltips |
| 10 | `centro/styles/responsive.css` | Media queries, toast mobile |

**Agregador legado:** `centro/centro-sidebar.css` (`@import` dos 8 módulos de conteúdo — exclui vars/chrome).

---

## Testes automatizados

```bash
npm test   # 58/58 (41 sanity + 17 HTTP + suites)
node scripts/smoke-visual-colors.mjs
node scripts/bake-centro-tiles.mjs   # regenerar tiles/glyphs offline
node scripts/smoke-centro.mjs
```

Cobertura DS relevante: tokens/components/a11y carregados, 0 inline HTML Centro, narrative-nav mobile, migração âmbar, toast sem `style.cssText`, módulos CSS HTTP 200, **mapa offline** (style local + tile + glyph HTTP 200).

---

## Divergências resolvidas (auditoria anterior × código actual)

| Item desactualizado na doc antiga | Estado actual |
|---|---|
| “Modularização parcial — só vars + chrome” | **10 módulos** extraídos; monólito reduzido a agregador |
| “~1700 linhas restantes em centro-sidebar” | Conteúdo movido para `centro/styles/*.css` |
| “44/44 testes” | **58/58** (sanity + HTTP offline mapa) |
| “centroToast inline” | Migrado para `.toast` / `.toast--warn` |
| “tiles OSM externos” | **Self-hosted** — `centro/assets/tiles/` + glyphs locais |

---

## Pendências reais (mantidas)

1. **Contraste WCAG** — accent HUD em texto pequeno; terminal verde opacidade — ver [wcag-contrast-notes.md](../capri/wcag-contrast-notes.md). Meta sidebar/layer-meta corrigidos P1 (`--color-text-muted`). Sem claim WCAG completo.
2. **Arquivista** — carrega DS mas não adopta `.btn` em todo o HTML.
3. **JS dinâmico Centro** — popups de pistas e painel de camadas ainda geram `style=` em strings HTML (fora do `index.html`).
4. **YouTube arquivo-morto** — embed requer rede (documentado em offline-scope).
5. **Rename `--centro-accent`** → `--centro-hud-alert` — refactor futuro.

---

## Score estimado (auditoria UX/UI pós-MVP)

| Dimensão | Pré-DS | Pós-MVP |
|---|---|---|
| Coesão tokens / DS | ~25/100 | ~78/100 |
| Adopção real nos módulos | ~20/100 | ~68/100 |
| A11y visual MVP | ~30/100 | ~76/100 |
| Offline mapa + decorativo | ~40/100 | ~92/100 |
| **Média composta** | **~29/100** | **~79/100** |

Não representa conformidade WCAG nem qualidade estética subjetiva.

---

## Referências

- [baseline-visual.md](./baseline-visual.md) — pré-DS vs pós-MVP
- [README.md](./README.md) — índice do design system
- [brand-decision.md](./brand-decision.md) — âmbar vs vermelho
- [accessibility.md](./accessibility.md) — limitações a11y
