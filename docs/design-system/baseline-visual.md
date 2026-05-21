# Baseline Visual — projeto_centro

> **Data:** 2026-05-21 · Pré-design-system

## Páginas auditadas

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

## Tipografia

| Família | Onde | Carregada? |
|---|---|---|
| Courier New | 4 páginas | sistema |
| Fira Code | centro, arquivista | **não** (fallback silencioso) |
| Georgia | landing, arquivo-morto | sistema |
| Segoe UI / system | landing, arquivista | sistema |

## Componentes duplicados

- `.nav-retorno` — 4 implementações CSS distintas
- Botões — 5+ padrões no Centro sem `.btn` base
- Foco `:focus-visible` — só parcial no Centro

## Dependências visuais externas (offline)

| URL | Arquivo |
|---|---|
| `transparenttextures.com` | `centro-sidebar.css` |
| `images.unsplash.com` | `arquivista/css/*.css`, `index.html` |

## Testes baseline

```bash
npm test   # 35/35 (pré-DS)
grep -c 'style=' centro/index.html   # 23
grep -r 'Fira Code' centro/ arquivista/  # 9+ refs
```
