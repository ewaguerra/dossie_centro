# Fluxo de inicialização — Centro (MapLibre)

> Execution map referenciado em `AGENT.md` §5.5 e §10.  
> **Verificado:** 2026-07-06 · commit pós boot híbrido (`runMapBootPolicy`) + Onda A.

## Duas fases de boot

O Centro arranca em **duas fases paralelas** que convergem quando o mapa dispara `load`:

| Fase | Quando | O quê |
|------|--------|-------|
| **DOM** | `DOMContentLoaded` → `bootstrap()` | UI sidebar, tabs (default **13 Almas**), toggles, guia, listeners ARG |
| **Mapa** | `bootstrap()` → `initMap()` → `map.on("load")` | OpenFreeMap, POIs, pistas, boot policy, 3D/subsolo |

```mermaid
sequenceDiagram
  participant Gate as centro-access-gate
  participant RT as centro-runtime.js
  participant Map as map-init.js
  participant POI as poi-bootstrap
  participant Policy as runMapBootPolicy

  Gate->>RT: install(onUnlock) → startCentro()
  RT->>RT: setup UI, loadSidebar, initMap()
  Map->>POI: bootPoiLayers (layers visibility none)
  Map->>Policy: initBuildings3D + initSubterranean
  Map->>Policy: runMapBootPolicy
  alt fresh boot (1ª senha)
    Policy->>Policy: applyBasemapOnlyView
  else visita seguinte
    Policy->>Policy: restoreSavedMapPreferences
  end
  Map->>RT: mapReadyResolve
```

## Ordem de scripts (`centro/index.html`)

Scripts com `defer` executam **na ordem do HTML** antes de `DOMContentLoaded`.

| # | Bloco | Ficheiros (principais) |
|---|--------|-----------|
| 0 | Chrome | `surface-links.js` |
| 1 | Vendor mapa | `maplibre-gl.js` |
| 2 | Design system | `theme.js`, `knowledge.js`, `map-icons.js`, `ui-texts.js`, utils, `popup-renderer.js` |
| 3 | Centro utils | `centro/utils.js` |
| 4 | Features | `triangulo-historico`, `pistas`, `poi-icons`, **`poi-era-classifier`**, `buildings-3d`, `poi-theme-filter`, `layer-unlocks`, `catalog-load`, `protocolo-phase`, **`master-mode`**, missões `alma-01`…`alma-13`, **`centro-access-gate`**, **`arg-resync`**, `sidebar-layer-state` |
| 5 | Subsolo | `subterranean-cutaway.js` (**`type="module"`**) |
| 6 | UI | `toast`, `lazy-assets`, **`investigation-ray`**, `map-popups`, sidebar modules, **`centro-chrome`** |
| 7 | Map infra | **`basemap-config`**, `map-safe`, `layer-data-url`, `catalog-layer-controller`, `symbol-popup-layer`, `poi-bootstrap`, `triangulo-overlay`, **`map-init`** |
| 8 | Runtime | **`centro-runtime.js`** (orquestrador) |

**Nota:** `rio-animado.js` **não** está na lista — só em `centro/test-full.html`.

## `bootstrap()` — ordem interna

```text
accessGate.install(startCentro)   → gate senha ou skip (?master=1 / já granted)
startCentro():
  setupCentroUiFromModules()
  setupMissionsOrchestrator()
  setupArgStateListener()         → arg-resync.install()
  master.install()                → se ?master=1
  chrome.install()                → tabs (default 13 Almas), tecla S, nav OP:*
  setupBuildings3DToggle / setupSubterraneanToggle / setupPoiThemeFilter
  loadSidebarData()               → sidebar-orchestrator.load()
  initMap()
```

**Importante:** `resetFreshMapPreferences()` corre **só** em `grantAccess()` (1ª senha),
não em cada `startCentro()`.

## `map.on("load")` — ordem interna (`map-init.js`)

1. `clampViewToCentroBounds` — hash URL vs `CENTRO_MAX_BOUNDS`
2. `ensureMapGroundReadable` — fundo `#f8f4f0` no layer `background`
3. `bootPoiLayers` — `addPOILayer` × 5 + pistas RSB (layers criados com `visibility: none`)
4. Debug inspector (só `?debug=1` ou `centroDebug`)
5. `initBuildings3DState` / `initSubterraneanState`
6. **`runMapBootPolicy(mapInstance)`** — fresh boot **ou** `restoreSavedMapPreferences`
7. `mapReadyPromise` resolve

**Triângulo histórico:** sync via `restoreSavedMapPreferences()` (visitas com prefs) e
`arg-resync.resync()` — **não** no fresh boot (mapa limpo remove overlay).

## Resync de gates ARG

Quando a fase ou o caderno mudam, **`arg-resync.resync()`** (via `centro:arg-state-changed` ou `storage`) reaplica:

| Consumidor | Módulo |
|------------|--------|
| Sidebar Território + 13 Almas | `sidebar-orchestrator.load()` via `loadSidebarData()` |
| Filtro temático Evidências | `poi-theme-filter.syncPhaseGate` |
| Maquete 3D | `buildings-3d.syncPhaseGate` |
| Pistas RSB | `pistas.syncPhaseGate` |
| Visão subterrânea | `subterranean-cutaway.syncPhaseGate` |
| Triângulo Histórico | `triangulo-overlay.sync()` via `syncTrianguloHistoricoOverlay()` |

**Sem** `scheduleBasemapOnlyBoot` / wipe de overlays no resync sidebar.

**Disparadores:**

- `document` event `centro:arg-state-changed` (ex.: `protocolo-phase.setPhase`)
- `window` event `storage` — chaves `protocolo13_caderno_clues`, `protocolo13_phase` (outra aba)

## Catálogo sidebar (Território)

| Fonte | Ficheiros | Camadas wired |
|-------|-----------|---------------|
| Processed | `layers.json` + `groups.json` | **10** |
| Context | `context-wired.json` + `context-groups.json` | **11** |
| Exclusão UI | `sidebar-exclude.json` | −4 POI duplicados (continuam via `addPOILayer`) |
| **Total sidebar** | | **21 camadas**, **9 grupos** |

Inventário extra (não wired na sidebar): `context-layers.json` (referência).

### Locks sobrepostos

| Mecanismo | Ficheiro | Efeito |
|-----------|----------|--------|
| Pista Caderno | `layer-unlocks.json` | `.layer-row--clue-locked` |
| Fase ARG | `phase-gates.json` → `layerMinPhase` | `.layer-row--phase-locked` |
| Feature | `featureMinPhase` | toggles 3D / RSB / subsolo disabled |

**Subsolo (gate composto):** fase ≥ 7 **e** pistas `agua-calada`, `aresta-fria`, `peso-fundacao` — ver `subterranean-cutaway.js`.

## Sidebar — 4 tabs

| Tab | ID DOM | Conteúdo principal |
|-----|--------|-------------------|
| 13 Almas | `#sidebar-tab-fases` | `#phases-panel`, botão guia missão |
| Visualização | `#sidebar-tab-opcoes` | 3D, subsolo, guia missão |
| Território | `#sidebar-tab-camadas` | 21 camadas, 3 secções narrativas |
| Evidências | `#sidebar-tab-pois` | Filtro temático POI + toggle RSB |

Tab activa por defeito: **13 Almas** (`centro-chrome.js`).

## Namespace global (runtime)

| Símbolo | Origem |
|---------|--------|
| `window.CENTRO.*` | features, ui, map modules |
| `window.CENTRO_POIS` | flyTo OP:* (runtime) |
| `window.MAPA_SP_ICONS` | `map-icons.js` |
| `window.MAPA_SP_POPUP` | popups DOM-safe |
| `window.centroToast` | `ui/toast.js` |
| `window.CENTRO.runMapBootPolicy` | boot híbrido (export runtime) |

## Dados OSM / ZEIS (origem `mapa_sp_salto`)

```bash
npm run sync:geojson-from-salto   # clip ao polígono 16_regiao_centro (+ ZEIS-2 ao bbox)
```

Requer `shapely` e repo irmão `../mapa_sp_salto`. Output **commitado** em `centro/data/`.

## Próximo passo estrutural

Plano histórico para fatiar `centro-runtime.js`: [runtime-refactor-plan.md](./runtime-refactor-plan.md) (R1–R6 **concluídos**).

## Smoke manual

Ver [../testing/smoke-centro.md](../testing/smoke-centro.md).
