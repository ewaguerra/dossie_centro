# Baseline Visual — projeto_centro

> **Snapshot histórico:** 2026-05-21 · **Pré-design-system**  
> Para o estado **actual**, ver secção [Pós-DS](#estado-pós-design-system-mvp) abaixo.

## Páginas auditadas (pré-DS)

| Página | CSS principal | Linhas CSS | Tokens `:root` | `style=` inline |
|---|---|---|---|---|
| `landing/` | `landing.css` | ~2611 | 16 vars âmbar | poucos |
| `centro/` | `centro-sidebar.css` | ~1818 | 23 vars (vermelho) | **23** |
| `arquivo-morto/` | `arquivo-morto.css` | ~597 | 14 vars âmbar | poucos |
| `arquivista/` | 4 arquivos CSS | ~600 cada | split day/night | thumbs inline |

## Paletas por página (pré-unificação)

| Token | Landing | Centro | Arquivo-morto | Arquivista |
|---|---|---|---|---|
| Acento primário | `#f59e0b` | `#dc2626` | `#f59e0b` | `#ff003c` / `#0078d4` |
| Fundo | `#04070f` | `#121212` | `#080c16` | tema OS |
| Texto | `#e8e4d8` | `#e5e5e5` | `#d4c9b0` | varia |

## Tipografia (pré-DS)

| Família | Onde | Carregada? |
|---|---|---|
| Courier New | 4 páginas | sistema |
| Fira Code | centro, arquivista | **não** (fallback silencioso) |
| Georgia | landing, arquivo-morto | sistema |
| Segoe UI / system | landing, arquivista | sistema |

## Componentes duplicados (pré-DS)

- `.nav-retorno` — 4 implementações CSS distintas
- Botões — 5+ padrões no Centro sem `.btn` base
- Foco `:focus-visible` — só parcial no Centro

## Dependências visuais externas (pré-DS)

| URL | Arquivo |
|---|---|
## Dependências externas removidas (pós-DS)

| CDN | Substituto |
|---|---|
| `transparenttextures.com` | SVG pontilhado + gradiente em `sidebar.css` |
| `images.unsplash.com` | Gradientes `--bg-image` no Arquivista |
| `static.wixstatic.com` | `.prova-hidrica-evidence` (CSS) |

Ver [offline-textures.md](./offline-textures.md).

---

## Estado pós-design-system (MVP)

> **Actualizado:** 2026-05-22 · Referência para comparação com auditoria original.

| Item | Pré-DS | Pós-DS | Doc |
|---|---|---|---|
| `centro/index.html` inline `style=` | **23** | **0** | [centro-markup.md](./centro-markup.md) |
| Tokens globais | 0 | `tokens.css` | [tokens.md](./tokens.md) |
| Foco / reduced-motion | parcial | `a11y.css` global | [a11y.md](./a11y.md) |
| Fira Code runtime | referenciada | removida → `--font-mono` | [typography.md](./typography.md) |
| Texturas CDN | sim | removidas | [auditoria-final.md](./auditoria-final.md) |
| `nav-retorno` | 4 CSS | 1 base + overrides | [components.md](./components.md) |
| Testes automatizados | 35 | **44** | `npm test` |

### Centro — CSS actual

| Ficheiro | Função |
|---|---|
| `centro/styles/centro-vars.css` | Tokens HUD locais |
| `centro/styles/centro-chrome.css` | UI extraída do HTML (hamburger, header, narrative-nav) |
| `centro/centro-sidebar.css` | Sidebar, mapa, inspector (~1764 linhas) |

### Validação actual

```bash
grep -c 'style="' centro/index.html   # 0
npm test                              # 44/44
node scripts/smoke-visual-colors.mjs
```
