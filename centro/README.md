# Centro Zone Standalone Page

Página independente para renderizar e explorar dados cartográficos da Zona Centro de São Paulo.

## Objective

Provide a focused, standalone interface for viewing and interacting with geographic features specific to the Centro zone, without dependencies on the main app's routing or global layer catalogs.

## Architecture

- **Entry point**: `index.html`
- **Orchestrator**: `centro-runtime.js` (runtime ativo)
- **Styles**: `centro-sidebar.css`
- **No app.js dependency**: Does not load `app/main.js`, `app/router.js`, or `catalog-orchestrator.js`

## Data Sources

### Regional Catalog
- **Source**: `data/catalog/zones/centro.json`
- **Contains**: 6 layers organized in 4 groups
- **Scope**: Only Centro zone features

### Groups and Metadata
- **Groups**: `data/catalog/groups.json` (loaded for title resolution)
- **Freshness**: `data/catalog/data_freshness_report.json` (optional, for popup enrichment)

### GeoJSON Files
All 6 GeoJSON files are pre-processed and available:
1. `02a_subsetores_arco_tamanduatei__polygon.geojson` (~9.4 KB)
2. `02a_subsetores_central__polygon.geojson` (~3.6 KB)
3. `02a_subsetores_farialima_aguasespraiadas_chucrizaidan__polygon.geojson` (~25.4 KB)
4. `13_seguranca__point.geojson` (~2.3 KB)
5. `12_existentes__point.geojson` (~2.7 KB)
6. `16_regiao_centro__polygon.geojson` (~207.4 KB)

**Total**: ~250 KB, 18 features across 6 layers

## Features

### Sidebar
- Group-based layer organization using `<details>` disclosure
- Checkbox toggle for layer visibility
- Feature count + file size metadata per layer
- Zoom button to focus on layer bounds
- Status indicator showing active layer count

### Map
- MapLibre GL JS with Carto Positron basemap
- Lazy-loaded GeoJSON: only fetches when activated
- Zoom-to-bounds using layer `bbox` from catalog
- Click-to-inspect: shows feature properties in floating inspector

### Inspector Panel
- Feature property display via MAPA_SP_POPUP renderer
- Responsive floating panel with close button
- Anchored to bottom-left of viewport

## Module Reuse

Inherits pure utilities from `app/` without copying:
- `app/utils/formatters.js` — text and number formatting
- `app/utils/html-utils.js` — HTML escaping and helpers
- `app/utils/value-utils.js` — value parsing and validation
- `app/utils/freshness-utils.js` — date field collection
- `app/utils/card-utils.js` — layer metadata formatting
- `app/renderers/popup-renderer.js` — popup HTML generation
- `app/config/theme.js` — CSS variables for colors
- `app/config/knowledge.js` — field interpretation rules
- `app/config/map-icons.js` — map icon definitions
- `app/config/ui-texts.js` — centralized UI text

## Constraints and Scope

### In Scope
✓ Centro zone only (6 layers, 4 groups)  
✓ Lazy-loaded GeoJSON on demand  
✓ Popup/inspector via shared MAPA_SP_POPUP  
✓ Metadata display (feature count, size)  
✓ Zoom-to-layer with bbox  
✓ Responsive sidebar and map  

### Out of Scope
✗ Other zones (Sul, Norte, Leste, Oeste)  
✗ Global layer catalogs  
✗ Hash-based routing  
✗ Layer search/filtering (beyond group disclosure)  
✗ Export or batch operations  
✗ Theme overrides or customization  
✗ Analysis or measurement tools  

## Testing

Suíte atual do projeto:
```bash
npm test
```

Validation checks:
- ✓ No hardcoded other-zone references
- ✓ No `global.json` references
- ✓ No app/main.js, app/router.js, catalog-orchestrator dependencies
- ✓ Proper CSS layout (flex, layer-main, layer-meta)
- ✓ Popup and card API integration
- ✓ Syntax: `node --check centro/centro-runtime.js`

## Future Enhancements

- **Multi-zone expansion**: Follow same pattern for pages/norte/, pages/sul/, pages/leste/, pages/oeste/
- **Advanced filtering**: Layer attribute search within groups
- **Performance**: Consider pre-loading high-volume layers (e.g., 16_regiao_centro at 207 KB)
- **Offline support**: Bundle GeoJSON for standalone deployment
- **Custom theming**: Allow Centro-specific color overrides via CSS variables

## References

- Architecture study: `docs/CENTRO_STANDALONE_BLUEPRINT.md`
- Extraction manifest: `reports/centro_standalone_manifest.md`
- MVP progress: `reports/centro_page_mvp_report.md`
