# PROTOCOLO 13 ALMAS — Dossiê Centro (mapa)

Mapa interativo `/centro/` — cartografia forense do centro de São Paulo.

Landing, Arquivo Morto, Arquivista e contratos ARG vivem em repositórios privados separados (`dossie_landing_portal`, `dossie_arquivo_morto`, `dossie_arquivista`, `dossie_arg_contracts`).

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

**Windows:** use `python server.py` (o launcher `python3` pode não existir). O servidor imprime mensagens em UTF-8; se houver erro de encoding no console, defina `PYTHONIOENCODING=utf-8`.

Acessar: http://127.0.0.1:8080/centro/ (`/` redirecciona para `/centro/`)

### Links do menu hamburger (dev local)

Neste repositório, `/landing/`, `/arquivo-morto/` e `/arquivista/` respondem **404** — as superfícies vivem em repos irmãos. Para dev multi-repo, copie [`config/surface-links.local.example.json`](config/surface-links.local.example.json) ou defina no HTML:

```html
<script>
  window.CENTRO_SURFACE_LINKS = {
    landing: "https://landing.exemplo.com/",
    "arquivo-morto": "https://arquivo.exemplo.com/",
    arquivista: "https://arquivista.exemplo.com/"
  };
</script>
```

### Pistas e Fase 7 (visão subterrânea)

A pista `aresta-fria` desbloqueia a Fase 7 via Arquivo Morto ou deep-link `?clues=aresta-fria` (não está em `layer-unlocks.json` — só em `subterranean-cutaway.js`).

## Testes e CI local

Repositório privado — **sem GitHub Actions**. Rodar antes de cada push:

```bash
npm run ci
npm run healthcheck:centro
node scripts/smoke-centro.mjs   # requer server.py a correr
```

Detalhes: [docs/testing/ci-local.md](docs/testing/ci-local.md)

## Estrutura

```
projeto_centro/
├── centro/              # Mapa + sidebar + runtime
│   ├── index.html
│   ├── centro-runtime.js
│   ├── features/        # catalog-load, layer-unlocks, POI, pistas, …
│   ├── assets/          # Ícones SVG e pistas Rua São Bento
│   └── data/            # GeoJSON + catálogo de camadas
├── vendor/              # maplibre, three, design system (app)
├── server.py            # Proxy + 404 em rotas removidas
├── scripts/             # sync vendors, healthcheck, smoke
└── tests/               # sanity + HTTP integration
```

> `centro/features/rio-animado.js` mantém utilitários de hidrografia; animação de fluxo está fora do escopo do runtime (ver `docs/accessibility/contrast-notes.md`).

## Funcionalidades

- 20 camadas wired na sidebar Território (10 processed + 10 context), 9 grupos; 6 temas em Evidências
- 4 POI patrimoniais + POI turístico; 4 pistas Rua São Bento
- Desbloqueio por pistas (`layer-unlocks.json`) e gates de fase (`phase-gates.json`)
- Matriz de Endereçamento (`15_osm_enderecos__point`) desligada no boot
- Maquete 3D + Visão subterrânea (Three.js vendor)

## Ponte transmídia

O Centro **consome** pistas via `localStorage.protocolo13_caderno_clues`, query `?clues=` e `layer-unlocks.json`. **localStorage não atravessa domínios** — ver `dossie_arg_contracts`.

## Rotas do Servidor

| Path | Comportamento |
|---|---|
| `/`, `/index.html` | Redirecciona para `/centro/` |
| `/centro/*`, `/pages/centro/*` | `./centro/*` |
| `/app/*` | `./vendor/app/*` |
| `/vendor/*` | `./vendor/*` |
| `/landing/`, `/arquivo-morto/`, `/arquivista/` | **404** (repos separados) |

## Links externos configuráveis (hamburger)

O menu hamburger do Centro usa `data-surface-link` e resolve URLs em três camadas:

1. `window.CENTRO_SURFACE_LINKS` (override em runtime, opcional)
2. `/config/surface-links.json` (config do ambiente/deploy)
3. defaults locais no script (`/landing/`, `/arquivo-morto/`, `/arquivista/`)

Arquivos do contrato:

- `centro/ui/surface-links.js`
- `config/surface-links.json`
- `centro/index.html` (atributos `data-surface-link`)

Exemplo para deploy multi-repo com URLs absolutas:

```html
<script>
  window.CENTRO_SURFACE_LINKS = {
    landing: "https://landing.exemplo.com/",
    "arquivo-morto": "https://arquivo.exemplo.com/",
    arquivista: "https://arquivista.exemplo.com/"
  };
</script>
```

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

