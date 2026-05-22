# PROTOCOLO 13 ALMAS — Dossiê Centro

Mapa interativo do centro de São Paulo com camadas urbanas temáticas e navegação narrativa.

## Stack

| Camada | Tecnologia |
|---|---|
| Mapa | MapLibre GL JS ^5.0.0 (vendor self-host) |
| Basemap | OpenFreeMap vector tiles (gratuito, sem chave) |
| Ícones | Lucide via `lucide-static` (dev) → SVG em `centro/assets/icons/` |
| Servidor | Python http.server (proxy) |
| Testes | Node.js node:test |

## Setup

```bash
# Instalar dependências (também sincroniza vendor/maplibre via postinstall)
npm install

# Resync manual do vendor MapLibre (após upgrade local de node_modules)
npm run sync:maplibre

# Regenerar ícones do mapa a partir de lucide-static (devDependency)
npm run sync:lucide-icons

# Iniciar servidor (porta opcional, default 8080)
python3 server.py
python3 server.py 3000
```

Acessar: http://127.0.0.1:8080/centro/

## Testes e CI local

Repositório privado — **sem GitHub Actions**. Rodar antes de cada push:

```bash
npm run ci    # 106 testes (sanity + HTTP)
npm run healthcheck:centro   # catálogo offline (opcional)
# ou
npm test
```

Detalhes: [docs/testing/ci-local.md](docs/testing/ci-local.md)

## Estrutura

```
projeto_centro/
├── centro/              # Página principal do dossiê
│   ├── index.html       # Mapa + sidebar + navegação
│   ├── centro-runtime.js # Runtime principal extraído do HTML
│   ├── centro-sidebar.css
│   ├── features/        # Módulos de features (triângulo, rio, pistas, POI)
│   ├── assets/          # Imagens e ícones
│   └── data/            # GeoJSON e catálogo de camadas
├── landing/             # Página de entrada
├── arquivo-morto/       # Módulo narrativo
├── arquivista/          # Módulo de arquivo
├── vendor/              # Dependências copiadas (maplibre, app)
├── server.py            # Servidor proxy com resolução de paths e cache headers
└── tests/               # Testes de sanidade
```

> `centro/features/rio-animado.js` mantém utilitários de hidrografia; animação de fluxo está fora do escopo do runtime (ver `docs/accessibility/contrast-notes.md`).

## Funcionalidades

- 13 camadas no mapa (9 catálogo + 4 POI contextuais)
- Sidebar com 5 grupos de camadas (toggle)
- 4 POI patrimoniais sempre visíveis (selos SVG temáticos)
- 4 pistas históricas da Rua São Bento (symbol layer + popup)
- Filtro temático de evidências na sidebar (`#poi-legend`)
- Navegação flyTo entre pontos de interesse
- Lazy loading de imagens
- Toast de feedback para erros
- CI local (`npm run ci`) — ver [docs/testing/ci-local.md](docs/testing/ci-local.md)

## Rotas do Servidor

| Path | Origem |
|---|---|
| `/pages/centro/*` | `./centro/*` |
| `/pages/centro/assets/*` | `./landing/assets/*` (legado) |
| `/landing/assets/*` | `./landing/assets/*` |
| `/app/*` | `./vendor/app/*` |
| `/vendor/maplibre/*` | `./vendor/maplibre/*` |
| `/centro/*` | `./centro/*` (default handler) |

## Basemap

O mapa usa [OpenFreeMap](https://openfreemap.org/) (vector tiles open-source, sem chave). O estilo é configurável no topo de `centro/centro-runtime.js`:

```js
var BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
// alternativas: positron | bright | dark-matter
```

Histórico: o bake raster local original (`scripts/bake-centro-tiles.mjs`) foi removido após violação da OSM tile usage policy ter levado a 1378 tiles placeholder de "Access blocked" sendo servidos como conteúdo válido. Detalhes em [`docs/offline-scope.md`](docs/offline-scope.md). Índice de docs: [`docs/README.md`](docs/README.md).

### Sobrevivência do bug do cache imortal

A versão antiga do `server.py` marcava `/centro/assets/tiles/*` como `Cache-Control: public, max-age=31536000, immutable`. O navegador foi instruído a **nunca revalidar** essas PNGs por 1 ano. Se você abriu `/centro/` antes do fix, ainda vê os placeholders "Access blocked / 403" mesmo com os arquivos apagados — eles estão no disk cache do browser e o browser respeita o `immutable`.

Para limpar (uma vez só, por máquina):

1. DevTools (F12) → aba **Application** → **Storage** → botão **"Clear site data"** (marca tudo) → recarregar a aba.
2. Alternativa: `chrome://settings/content/all` → procurar `127.0.0.1` ou `localhost` → remover.
3. Aba anônima funciona como atalho temporário (ela não compartilha disk cache com a janela normal).

O novo `server.py` usa `Cache-Control: no-cache, must-revalidate` em todo conteúdo do projeto (apenas `/vendor/` continua `immutable`, porque é third-party estável). Cada request fica sujeito a `If-Modified-Since` / `ETag` — devolve 304 quase sempre, e qualquer fix novo aparece imediatamente sem necessidade de hard refresh.

## Licença

Projeto narrativo — PROTOCOLO 13 ALMAS.

## Arquitetura

### Fluxo de dados

```
1. index.html carrega MapLibre GL JS + MAPA_SP scripts
2. `centro-runtime.js` cria `new maplibregl.Map({style: BASEMAP_STYLE})` apontando para OpenFreeMap
3. map.on('load') dispara:
   ├── POI layers (memória, acervo, arqueologia, monumentos) — symbol + selo SVG
   ├── Pistas Rua São Bento (fetch JSON → addPistasLayer symbol)
   └── Click-to-inspect (queryRenderedFeatures → showInspector, ?debug=1)
4. DOMContentLoaded dispara:
   ├── Sidebar: fetch catalog → render checkboxes
   └── Checkbox change → addLayerToMap / removeLayerFromMap
5. Navegação flyTo via CENTRO_POIS + centroGoTo(id)
```

### Decisões técnicas

| Decisão | Motivo |
|---|---|
| Runtime externo (`centro-runtime.js`) | HTML válido, menor acoplamento e manutenção mais simples |
| fetch direto vs CENTRO.utils | Evitar dependência de DOM para resolução de URL |
| MutationObserver para lazy loading | Capturar imagens inseridas dinamicamente (popups) |
| Toast via window.centroToast | Feedback visível sem depender de framework |
| Popups via `setDOMContent` (sem `setHTML`) | A doc do MapLibre avisa que `setHTML` não sanitiza — DOM API com `textContent` elimina superfície XSS |
| `queryRenderedFeatures` escopado em `{ layers: [...] }` | Recomendação MapLibre + perf em v5 (Set-based layer membership) |
| Catálogo em `Map` indexado (sem refetch por toggle) | Evita refetch de `layers.json` por mudança de checkbox |
| `map.loadImage` em vez de `new Image()` | Canônico; passa pelo pipeline de `transformRequest` e expõe erros via `on('error')` |
| Inspector debug atrás de `?debug=1` | Ferramenta de dev fora do clique de produção |
| `locale` PT-BR + `attributionControl: { compact: true }` | UI em português e attribution compacta no mobile |
| `postinstall: sync-maplibre.mjs` | Mantém `vendor/maplibre/` alinhado com `node_modules/maplibre-gl/dist/` |
