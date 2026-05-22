# Texturas offline — decisões

> Eliminação de dependências visuais externas (`transparenttextures.com`, `unsplash.com` e equivalentes).

## Princípio

Texturas decorativas usam **CSS puro**, **SVG inline/data-URL** ou **gradientes** — nunca fetch de rede em runtime.

## Substituições

| Antes (CDN) | Depois | Arquivo |
|---|---|---|
| `transparenttextures.com` (sidebar Centro) | Gradiente + padrão SVG 6×6 pontos | `centro/styles/sidebar.css` |
| `images.unsplash.com` (desktop Arquivista) | `--bg-image: linear-gradient(...)` | `arquivista/css/style.css`, `utility.css` |
| `static.wixstatic.com` (galeria PROVA_HÍDRICA) | `.prova-hidrica-evidence` (CSS) | `arquivista/index.html`, `utility.css` |
| Ruído landing | `feTurbulence` em data-URL SVG | `landing/landing.css` |

## O que permanece online (fora do escopo visual decorativo)

| Recurso | Motivo |
|---|---|
| Tiles OSM | Basemap MapLibre |
| Glyphs demotiles | Labels POI no mapa |
| YouTube embed (arquivo-morto) | Conteúdo narrativo opcional com iframe |

Ver [offline-scope.md](../capri/offline-scope.md).

## Validação

```bash
grep -R "transparenttextures\|unsplash\|wixstatic" --include="*.css" --include="*.html" .
npm test   # inclui assert em sanity.test.js
```

Nenhum match em CSS/HTML de runtime = critério atendido.
