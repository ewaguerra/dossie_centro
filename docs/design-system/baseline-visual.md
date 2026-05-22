# Baseline Visual — projeto_centro

Documento com **duas camadas**:
1. [Snapshot pré-Design System](#snapshot-pré-design-system) — histórico (2026-05-21)
2. [Estado pós-MVP Design System](#estado-pós-mvp-design-system) — código actual (2026-05-22)

Para veredicto e pendências: [auditoria-final.md](./auditoria-final.md).

---

## Snapshot pré-Design System

> **Data:** 2026-05-21 · **Não alterar** — referência histórica.

### Páginas auditadas

| Página | CSS principal | Linhas CSS | Tokens `:root` | `style=` inline |
|---|---|---|---|---|
| `landing/` | `landing.css` | ~2611 | 16 vars âmbar | poucos |
| `centro/` | `centro-sidebar.css` | ~1818 | 23 vars (vermelho) | **23** |
| `arquivo-morto/` | `arquivo-morto.css` | ~597 | 14 vars âmbar | poucos |
| `arquivista/` | 4 arquivos CSS | ~600 cada | split day/night | thumbs inline |

### Paletas (pré-unificação)

| Token | Landing | Centro | Arquivo-morto | Arquivista |
|---|---|---|---|---|
| Acento primário | `#f59e0b` | `#dc2626` | `#f59e0b` | `#ff003c` / `#0078d4` |
| Fundo | `#04070f` | `#121212` | `#080c16` | tema OS |
| Texto | `#e8e4d8` | `#e5e5e5` | `#d4c9b0` | varia |

### Tipografia (pré-DS)

| Família | Onde | Carregada? |
|---|---|---|
| Courier New | 4 páginas | sistema |
| Fira Code | centro, arquivista | **não** (fallback silencioso) |
| Georgia | landing, arquivo-morto | sistema |
| Segoe UI / system | landing, arquivista | sistema |

### Problemas transversais (pré-DS)

- `.nav-retorno` — **4 implementações CSS** distintas
- Botões — 5+ padrões no Centro sem `.btn` base
- Foco `:focus-visible` — só parcial no Centro
- **4 universos visuais** isolados (landing âmbar, centro vermelho HUD, arquivo-morto âmbar, arquivista OS)

### Dependências visuais externas (pré-DS)

| URL | Onde |
|---|---|
| `transparenttextures.com` | sidebar Centro |
| `images.unsplash.com` | Arquivista |
| `static.wixstatic.com` | Arquivista |
| Google Fonts (Fira Code) | referência sem `@font-face` local |

---

## Estado pós-MVP Design System

> **Actualizado:** 2026-05-22 · Alinhado com commits `ec5aebf`…`6339f7b`.

### Checklist transversal

| Item | Pré-DS | Pós-MVP | Doc |
|---|---|---|---|
| Design System global | ausente | `tokens.css` + `a11y.css` + `components.css` | [README.md](./README.md) |
| `centro/index.html` inline `style=` | **23** | **0** | [centro-markup.md](./centro-markup.md) |
| Fira Code runtime | referenciada | removida → `--font-mono` | [typography.md](./typography.md) |
| Texturas CDN decorativas | sim | removidas do runtime | [offline-textures.md](./offline-textures.md) |
| `nav-retorno` | 4 CSS | 1 base BEM + `data-theme` | [components.md](./components.md) |
| Tokens âmbar landing/AM | `--amber` / `--am-amber` | `var(--color-brand)` + aliases locais | [tokens.md](./tokens.md) |
| `centroToast()` | inline JS | `.toast` DS | [components.md](./components.md) |
| Foco / reduced-motion | parcial | global `a11y.css` | [accessibility.md](./accessibility.md) |
| Testes `npm test` | 35 | **58/58** | [auditoria-final.md](./auditoria-final.md) |
| Landing `.btn` DS | legado | hero/tier/portal adoptados | [components.md](./components.md) |
| Mapa offline | tiles/glyphs externos | **1378 tiles + glyphs locais** | [offline-scope.md](../capri/offline-scope.md) |

### Centro — 10 módulos CSS (+ vars + chrome)

| Ficheiro | Função |
|---|---|
| `centro/styles/centro-vars.css` | Tokens HUD (`--centro-accent`, moldura) |
| `centro/styles/centro-chrome.css` | Hamburger, header sidebar |
| `centro/styles/layout.css` | Reset, `#map` |
| `centro/styles/sidebar.css` | Sidebar, layers, evidence |
| `centro/styles/narrative-nav.css` | OP:* / flyTo (scroll mobile) |
| `centro/styles/feature-inspector.css` | Inspector produção + debug JSON |
| `centro/styles/profile-card.css` | ProfileCard pistas |
| `centro/styles/jesuit-frame.css` | Moldura HUD |
| `centro/styles/map-popups.css` | Popups mapa |
| `centro/styles/responsive.css` | Breakpoints, toast mobile |

`centro/centro-sidebar.css` — agregador `@import` (URLs legadas).

### Dependências externas removidas (pós-DS)

| CDN | Substituto |
|---|---|
| `transparenttextures.com` | SVG pontilhado em `sidebar.css` |
| `images.unsplash.com` | Gradientes locais no Arquivista |
| `static.wixstatic.com` | `.prova-hidrica-evidence` (CSS) |

Tiles mapa e glyphs — **self-hosted** (Opção C); ver [offline-scope.md](../capri/offline-scope.md).

### Validação

```bash
grep -c 'style="' centro/index.html   # 0
npm test                              # 58/58
node scripts/bake-centro-tiles.mjs    # offline mapa (se regenerar)
```

### Pendências visíveis (pós-MVP)

- Arquivista: `.btn` DS não adoptado em todo o HTML
- JS Centro: strings HTML com `style=` em popups/painel camadas
- WCAG AA completo: **não declarado** (ver TC-010 evidência MVP)
