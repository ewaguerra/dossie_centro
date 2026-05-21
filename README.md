# PROTOCOLO 13 ALMAS — Dossiê Centro

Mapa interativo do centro de São Paulo com camadas urbanas temáticas e navegação narrativa.

## Stack

| Camada | Tecnologia |
|---|---|
| Mapa | MapLibre GL JS 4.7.1 |
| Ícones | SVG inline |
| Servidor | Python http.server (proxy) |
| Testes | Node.js node:test |

## Setup

```bash
# Instalar dependências
npm install

# Iniciar servidor (porta opcional, default 8080)
python3 server.py
python3 server.py 3000
```

Acessar: http://127.0.0.1:8080/centro/

## Testes

```bash
npm test
# ou
node --test tests/sanity.test.js
```

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
├── server.py            # Servidor proxy com resolução de paths
├── osm-style.json       # Estilo OSM Raster
└── tests/               # Testes de sanidade
```

> `centro/features/rio-animado.js` mantém utilitários de hidrografia; animação de fluxo está fora do escopo do runtime (ver `docs/capri/wcag-contrast-notes.md`).

## Funcionalidades

- 13 camadas no mapa (9 catálogo + 4 POI contextuais)
- Sidebar com 5 grupos de camadas (toggle)
- Marcadores históricos da Rua São Bento (4 pontos)
- Navegação flyTo entre pontos de interesse
- Lazy loading de imagens
- Toast de feedback para erros
- CI/CD via GitHub Actions

## Rotas do Servidor

| Path | Origem |
|---|---|
| `/pages/centro/*` | `./centro/*` |
| `/app/*` | `./vendor/app/*` |
| `/vendor/maplibre/*` | `./vendor/maplibre/*` |
| `/centro/*` | `./centro/*` (default handler) |

## Licença

Projeto narrativo — PROTOCOLO 13 ALMAS.

## Arquitetura

### Fluxo de dados

```
1. index.html carrega MapLibre GL JS + MAPA_SP scripts
2. `centro-runtime.js` cria `new maplibregl.Map({style: '/osm-style.json'})`
3. map.on('load') dispara:
   ├── POI layers (memória, acervo, arqueologia, monumentos)
   ├── Markers de pistas (fetch → JSON → new maplibregl.Marker)
   └── Click-to-inspect (queryRenderedFeatures → showInspector)
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
