import { describe, it } from 'node:test';
import assert from 'node:assert';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function read(path) {
  return readFileSync(join(ROOT, path), 'utf-8');
}

function exists(path) {
  return existsSync(join(ROOT, path));
}

function loadCentroMapSafe() {
  const src = read('centro/map/map-safe.js');
  const sandbox = { window: { CENTRO: {} }, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.CENTRO.map;
}

function loadSymbolPopupLayerModule() {
  const sandbox = {
    window: { CENTRO: {} },
    console,
    document: {
      createElement: function () {
        return {};
      },
    },
    maplibregl: {
      Popup: function (opts) {
        this._opts = opts;
        this.setLngLat = function () { return this; };
        this.setDOMContent = function () { return this; };
        this.addTo = function () { return this; };
      },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(read('centro/map/map-safe.js'), sandbox);
  vm.runInContext(read('centro/map/symbol-popup-layer.js'), sandbox);
  return sandbox.window.CENTRO.map;
}

function loadLayerDataUrlModule() {
  const sandbox = { window: { CENTRO: { map: {} } }, console };
  vm.createContext(sandbox);
  vm.runInContext(read('centro/map/layer-data-url.js'), sandbox);
  return sandbox.window.CENTRO.map;
}

function loadCatalogLayerControllerModule() {
  const sandbox = { window: { CENTRO: { map: {} } }, console };
  vm.createContext(sandbox);
  vm.runInContext(read('centro/map/layer-data-url.js'), sandbox);
  vm.runInContext(read('centro/map/catalog-layer-controller.js'), sandbox);
  return sandbox.window.CENTRO.map;
}

function makeMockMap(existingSources, existingLayers) {
  existingSources = existingSources || {};
  existingLayers = existingLayers || {};
  const map = {
    _sources: Object.assign({}, existingSources),
    _layers: Object.assign({}, existingLayers),
    getSource: function (id) { return this._sources[id] || null; },
    getLayer: function (id) { return this._layers[id] || null; },
    removeSource: function (id) { delete this._sources[id]; },
    removeLayer: function (id) { delete this._layers[id]; },
  };
  return map;
}

function makeCatalogDeps(map, overrides) {
  const activeLayers = new Set();
  const calls = { ensureSource: [], ensureLayer: [], ensureImage: [], warns: [], toasts: [] };
  const base = {
    map: map,
    activeLayers: activeLayers,
    ensureSource: function (m, id, cfg) { calls.ensureSource.push({ id, cfg }); m._sources[id] = cfg; },
    ensureLayer: function (m, lcfg, beforeId) { calls.ensureLayer.push({ id: lcfg.id, type: lcfg.type, paint: lcfg.paint, beforeId }); m._layers[lcfg.id] = lcfg; },
    ensureImage: function () { return Promise.resolve(); },
    buildLayerDataUrl: function (cfg) { return '/centro/data/processed/' + (cfg.file || cfg.id + '.geojson'); },
    applyLayerZoomBounds: function (layerDef) { return layerDef; },
    getInsertBeforeId: function () { return 'before-id'; },
    getMapIconHaloPaint: function () { return { 'icon-halo-color': '#fff', 'icon-halo-width': 2 }; },
    resolveLayerIcon: null,
    toast: function (msg, level) { calls.toasts.push({ msg, level }); },
    warn: function (...args) { calls.warns.push(args); },
  };
  return { deps: Object.assign({}, base, overrides), calls, activeLayers };
}

function loadSidebarLayerStateModule() {
  const sandbox = { window: { CENTRO: {} }, console };
  vm.createContext(sandbox);
  vm.runInContext(read('centro/features/sidebar-layer-state.js'), sandbox);
  return sandbox.window.CENTRO.sidebarLayerState;
}

function loadSidebarEventsModule() {
  const sandbox = {
    window: { CENTRO: { ui: {} } },
    console,
    Event: class Event {
      constructor(type) {
        this.type = type;
      }
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(read('centro/ui/sidebar-events.js'), sandbox);
  return sandbox.window.CENTRO.ui.wireLayerCheckboxes;
}

function makeMockCheckbox(layerId, opts) {
  opts = opts || {};
  const cb = {
    type: 'checkbox',
    checked: opts.checked !== undefined ? opts.checked : false,
    disabled: !!opts.disabled,
    dataset: { layerId: layerId },
    _handler: null,
    addEventListener: function (_ev, fn) {
      this._handler = fn;
    },
    dispatchEvent: function () {
      if (this._handler) this._handler();
    },
  };
  return cb;
}

function makeMockPanel(checkboxes) {
  return {
    _boxes: checkboxes,
    querySelectorAll: function (sel) {
      if (sel.indexOf(':checked') !== -1) {
        return this._boxes.filter(function (b) {
          return b.checked && !b.disabled;
        });
      }
      return this._boxes;
    },
  };
}

describe('projeto_centro — sanity checks', () => {

  // ── Páginas principais existem ──────────────────────────────────
  it('deve ter index.html raiz que redireciona para landing', () => {
    const html = read('index.html');
    assert.ok(html.includes('landing'));
  });

  it('deve ter landing/index.html', () => {
    assert.ok(exists('landing/index.html'));
  });

  it('deve ter centro/index.html', () => {
    assert.ok(exists('centro/index.html'));
  });

  it('deve ter arquivo-morto/index.html', () => {
    assert.ok(exists('arquivo-morto/index.html'));
  });

  it('deve ter arquivista/index.html', () => {
    assert.ok(exists('arquivista/index.html'));
  });

  // ── JS críticos existem e são parseáveis ────────────────────────
  it('centro-runtime.js deve ser parseável', () => {
    const src = read('centro/centro-runtime.js');
    assert.doesNotThrow(() => new Function(src));
  });

  it('utils.js deve ser parseável', () => {
    const src = read('centro/utils.js');
    assert.doesNotThrow(() => new Function(src));
  });

  // ── HTML deve manter dependências críticas do mapa ─────────────
  it('centro/index.html deve conter maplibre', () => {
    const html = read('centro/index.html');
    assert.ok(html.includes('maplibre'), 'MapLibre ausente do HTML');
  });

  // ── CSS crítico existe ──────────────────────────────────────────
  it('centro-sidebar.css deve existir como agregador', () => {
    assert.ok(exists('centro/centro-sidebar.css'));
    const agg = read('centro/centro-sidebar.css');
    assert.ok(agg.includes("@import url('styles/sidebar.css')"), 'agregador importa sidebar');
  });

  it('centro CSS modular: modulos por responsabilidade', () => {
    const modules = [
      'centro/styles/layout.css',
      'centro/styles/sidebar.css',
      'centro/styles/narrative-nav.css',
      'centro/styles/feature-inspector.css',
      'centro/styles/profile-card.css',
      'centro/styles/jesuit-frame.css',
      'centro/styles/map-popups.css',
      'centro/styles/responsive.css',
    ];
    for (const file of modules) {
      assert.ok(exists(file), `${file} ausente`);
    }
    const html = read('centro/index.html');
    assert.ok(html.includes('/pages/centro/styles/layout.css'), 'index carrega layout.css');
    assert.ok(html.includes('/pages/centro/styles/sidebar.css'), 'index carrega sidebar.css');
    assert.ok(!html.includes('/pages/centro/centro-sidebar.css'), 'index usa modulos explicitos');
  });

  // ── UX — Sidebar close button ───────────────────────────────────
  it('centro/index.html deve ter sidebar-close-btn', () => {
    const html = read('centro/index.html');
    assert.ok(html.includes('sidebar-close-btn'), 'sidebar-close-btn ausente');
  });

  // ── Features — POI layers (fluxo único) ─────────────────────────
  it('centro-runtime.js deve ter uma unica implementacao idempotente de addPOILayer', () => {
    const runtime = read('centro/centro-runtime.js');
    const defs = runtime.match(/function addPOILayer/g) || [];
    assert.strictEqual(defs.length, 1, 'deve existir apenas uma definicao de addPOILayer');
    assert.ok(runtime.includes('ensureSource'), 'ensureSource ausente');
    assert.ok(runtime.includes('ensureLayer'), 'ensureLayer ausente');
    assert.ok(runtime.includes('ensureImage'), 'ensureImage ausente');
    assert.ok(runtime.includes('bindLayerEventOnce'), 'bindLayerEventOnce ausente');
    assert.ok(runtime.includes('styleSupportsTextLabels'), 'styleSupportsTextLabels ausente');
    assert.ok(runtime.includes('MEMORIA_PAULISTANA_LAYERS'), 'POI layer MEMORIA ausente');
    assert.ok(runtime.includes('ACERVO_TOMBADO_LAYERS'), 'POI layer ACERVO ausente');
    assert.ok(runtime.includes('BEM_ARQUEOLOGICO_LAYERS'), 'POI layer ARQUEOLOGIA ausente');
    assert.ok(runtime.includes('MONUMENTOS_LAYERS'), 'POI layer MONUMENTOS ausente');
    assert.ok(runtime.includes('MAPA_SP_ICONS'), 'runtime deve usar registry MAPA_SP_ICONS');
    assert.ok(runtime.includes('resolvePatrimonio'), 'resolvePatrimonio ausente');
  });

  it('centro-runtime.js: pistas usam symbol layer via addPistasLayer (sem Marker generico)', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('function addPistasLayer'), 'addPistasLayer ausente');
    assert.ok(runtime.includes('rsb-pistas-icon'), 'layer rsb-pistas-icon ausente');
    assert.ok(!runtime.includes('new maplibregl.Marker({ color:'), 'nao deve usar Marker vermelho generico');
  });

  it('map-icons.js: registry patrimonio e pistas com resolve helpers', () => {
    const icons = read('vendor/app/config/map-icons.js');
    assert.ok(icons.includes('patrimonio'), 'patrimonio registry ausente');
    assert.ok(icons.includes('scroll-text'), 'icone memoria (scroll-text) ausente');
    assert.ok(icons.includes('resolvePatrimonio'), 'resolvePatrimonio ausente');
    assert.ok(icons.includes('resolvePistasIcon'), 'resolvePistasIcon ausente');
    assert.ok(icons.includes('icon-pista'), 'icon-pista ausente');
  });

  it('icones POI SVG sao distintos (gerados de lucide-static, nao map-pin)', () => {
    const files = [
      'centro/assets/icons/icon-memoria.svg',
      'centro/assets/icons/icon-acervo.svg',
      'centro/assets/icons/icon-arqueologia.svg',
      'centro/assets/icons/icon-monumentos.svg',
    ];
    const bodies = files.map(function (path) {
      const svg = read(path);
      assert.ok(svg.includes('viewBox="0 0 32 32"'), path + ' deve ser canvas 32px');
      assert.ok(svg.includes('<path'), path + ' deve conter paths Lucide');
      assert.ok(!svg.includes('a7 7 0 0 0-7 7c0 5'), path + ' nao deve ser map-pin generico');
      return svg.replace(/\s+/g, ' ');
    });
    const unique = new Set(bodies);
    assert.strictEqual(unique.size, bodies.length, 'cada POI patrimonial deve ter SVG unico');
  });

  it('centro-runtime.js: addLayerToMap usa resolveLayerIcon para pontos da sidebar', () => {
    const runtime = read('centro/centro-runtime.js');
    const ctrl = read('centro/map/catalog-layer-controller.js');
    // resolveLayerIcon é injetado pelo runtime via buildCatalogLayerDeps
    assert.ok(runtime.includes('resolveLayerIcon'), 'resolveLayerIcon ausente no runtime');
    // addPointLayerWithIcon migrou para o controller (Gate 4.5E-B)
    assert.ok(ctrl.includes('addPointLayerWithIcon'), 'addPointLayerWithIcon ausente no controller');
    assert.ok(runtime.includes('getMapIconHaloPaint'), 'halo de icones ausente');
    assert.ok(runtime.includes('icon-halo-color'), 'icon-halo-color ausente');
  });

  it('icon-droplets.svg existe para camada de alagamentos', () => {
    const svg = read('centro/assets/icons/icon-droplets.svg');
    assert.ok(svg.includes('<path'), 'droplets deve conter paths Lucide');
    assert.ok(svg.includes('#0284c7'), 'droplets deve usar azul hidrologico');
  });

  it('icones POI usam fills distintos (nao confundir vermelho com ouro)', () => {
    function ringStroke(path) {
      const svg = read(path);
      const match = svg.match(/class="map-icon-disc"[^>]*stroke="([^"]+)"/)
        || svg.match(/<circle cx="16" cy="16" r="14" fill="#fdfbf7" stroke="([^"]+)"/);
      assert.ok(match, 'disco forense com stroke de categoria ausente em ' + path);
      return match[1];
    }
    const strokes = [
      ringStroke('centro/assets/icons/icon-memoria.svg'),
      ringStroke('centro/assets/icons/icon-acervo.svg'),
      ringStroke('centro/assets/icons/icon-arqueologia.svg'),
      ringStroke('centro/assets/icons/icon-monumentos.svg'),
      ringStroke('centro/assets/icons/icon-pista.svg'),
      ringStroke('centro/assets/icons/icon-droplets.svg'),
    ];
    const unique = new Set(strokes);
    assert.strictEqual(unique.size, strokes.length, 'cada icone deve ter cor unica: ' + strokes.join(', '));
    assert.strictEqual(strokes[4], '#eab308', 'pistas deve ser ouro');
    assert.strictEqual(strokes[3], '#be123c', 'monumentos deve ser carmesim');
  });

  it('icones POI usam Lucide stroke puro (fill none, como botoes OP)', () => {
    const memoria = read('centro/assets/icons/icon-memoria.svg');
    assert.ok(memoria.includes('fill="none"'), 'paths Lucide devem ser stroke-only');
    assert.ok(memoria.includes('stroke-width="2"'), 'stroke-width Lucide padrao');
    assert.ok(memoria.includes('fill="#fdfbf7"'), 'disco papel forense (--centro-paper)');
    assert.ok(memoria.includes('data-template="disc-forensic"'), 'template disc-forensic');
    assert.ok(memoria.includes('width="32"'), 'canvas 32px');
  });

  it('centro/index.html expoe legenda poi-legend com filtro por tematica', () => {
    const html = read('centro/index.html');
    assert.ok(html.includes('poi-legend-details'), 'filtro tematico deve ser recolhivel (details)');
    assert.ok(html.includes('poi-legend__summary'), 'summary do filtro tematico ausente');
    assert.ok(html.includes('poi-legend__list'), 'lista poi-legend ausente');
    assert.ok(html.includes('poi-legend__kicker'), 'kicker poi-legend ausente');
    assert.ok(html.includes('Filtro por temática'), 'titulo de filtro ausente');
    assert.ok(html.includes('poi-legend__hint'), 'hint poi-legend ausente');
  });

  it('map-icons.js expoe getThemeFilters com layerIds do patrimonio', () => {
    const icons = read('vendor/app/config/map-icons.js');
    assert.ok(icons.includes('getThemeFilters'), 'getThemeFilters ausente');
    assert.ok(icons.includes('getLegendItems'), 'getLegendItems ausente');
    assert.ok(icons.includes('layerIds'), 'layerIds ausente');
    assert.ok(icons.includes('memoria-paulistana-icon'), 'layer memoria ausente');
    assert.ok(icons.includes('rsb-pistas-icon'), 'layer pistas ausente');
    assert.ok(icons.includes('palette'), 'palette central ausente');
  });

  it('centro-runtime.js filtra visibilidade de tematicas POI no mapa', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('setupPoiThemeFilter'), 'setupPoiThemeFilter ausente');
    assert.ok(runtime.includes('applyAllPoiThemeFilters'), 'applyAllPoiThemeFilters ausente');
    assert.ok(runtime.includes('CENTRO.poiThemeFilter'), 'runtime deve delegar filtro POI');
    const poiFilter = read('centro/features/poi-theme-filter.js');
    assert.ok(poiFilter.includes('centroPoiThemeFilter'), 'persistencia de filtro ausente');
    assert.ok(poiFilter.includes('setLayoutProperty'), 'toggle de visibilidade ausente');
  });

  // ── Fase 3 — HTML declarativo, runtime externo ──────────────────
  it('centro/index.html nao deve conter JavaScript inline', () => {
    const html = read('centro/index.html');
    const inlineScripts = html.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi) || [];
    assert.strictEqual(inlineScripts.length, 0, 'nao deve haver blocos script inline');
    const scriptTags = html.match(/<script[^>]+>/gi) || [];
    assert.ok(scriptTags.length > 0, 'deve carregar scripts externos');
    scriptTags.forEach(function(tag) {
      assert.ok(/\bsrc=/.test(tag), 'cada script deve ter src: ' + tag);
      assert.ok(
        /\bdefer\b/.test(tag) || /\btype="module"/.test(tag),
        'cada script deve usar defer ou type=module: ' + tag
      );
    });
    assert.ok(html.includes('/pages/centro/centro-runtime.js'), 'deve carregar centro-runtime.js');
  });

  it('centro/index.html nao deve conter handlers inline de eventos', () => {
    const html = read('centro/index.html');
    const inlineHandlers = ['onclick', 'onmouseover', 'onmouseout', 'onchange', 'onsubmit'];
    inlineHandlers.forEach(function(attr) {
      assert.ok(!new RegExp('\\b' + attr + '\\s*=').test(html), attr + ' inline no HTML');
    });
    assert.ok(html.includes('data-nav-lng'), 'botoes OP devem usar data-nav-*');
  });

  it('centro-runtime.js deve registrar event listeners para UI do centro', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('function setupSidebarToggle'), 'setupSidebarToggle ausente');
    assert.ok(runtime.includes('function setupNarrativeNav'), 'setupNarrativeNav ausente');
    assert.ok(!/onclick\s*=/.test(runtime), 'runtime nao deve gerar onclick inline');
  });

  it('centro-runtime.js deve conter modulos de inicializacao extraidos do HTML', () => {
    const runtime = read('centro/centro-runtime.js');
    const modules = [
      'function bootstrap',
      'function initMap',
      'function addPOILayer',
      'function loadSidebarData',
      'setupCentroUiFromModules',
      'window.centroNavigate',
      'window.centroGoTo',
    ];
    modules.forEach(function(token) {
      assert.ok(runtime.includes(token), token + ' ausente no runtime');
    });
    assert.ok(!runtime.includes('<style'), 'runtime nao deve conter markup HTML inline');
  });

  // ── Arquivista — MapLibre local (sem CDN) ───────────────────────
  it('arquivista/index.html deve usar maplibre local sem unpkg', () => {
    const html = read('arquivista/index.html');
    assert.ok(!/unpkg\.com/i.test(html), 'nao deve referenciar unpkg');
    assert.ok(html.includes('/vendor/maplibre/maplibre-gl.js'), 'deve carregar maplibre local');
    assert.ok(html.includes('/vendor/maplibre/maplibre-gl.css'), 'deve carregar css maplibre local');
  });

  it('centro/index.html nao deve carregar rio-animado.js (producao)', () => {
    const html = read('centro/index.html');
    assert.ok(!html.includes('rio-animado.js'), 'producao nao carrega rio-animado');
  });

  it('centro/test-full.html deve estar marcado como harness dev', () => {
    const html = read('centro/test-full.html');
    assert.ok(html.includes('DEV ONLY'), 'test-full deve declarar escopo dev');
    assert.ok(html.includes('centro/index.html'), 'deve referenciar entry de producao');
  });

  it('design system: tokens.css contem tokens MVP completos', () => {
    const css = read('vendor/app/styles/tokens.css');
    const required = [
      '--color-accent:',
      '--color-accent-soft',
      '--color-warning',
      '--fs-2xl',
      '--space-12',
      '--shadow-lg',
      '--z-modal',
      '--dur-base',
    ];
    for (const token of required) {
      assert.ok(css.includes(token), `tokens.css deve conter ${token}`);
    }
  });

  it('design system: todas paginas principais carregam a11y.css', () => {
    for (const page of ['landing/index.html', 'centro/index.html', 'arquivo-morto/index.html', 'arquivista/index.html']) {
      const html = read(page);
      assert.ok(html.includes('/app/styles/a11y.css'), `${page} deve carregar a11y.css`);
    }
  });

  it('design system: a11y.css foco global e reduced-motion', () => {
    const css = read('vendor/app/styles/a11y.css');
    assert.ok(css.includes(':focus-visible'), 'a11y deve ter focus-visible');
    assert.ok(css.includes('var(--color-accent)'), 'foco deve usar --color-accent');
    assert.ok(css.includes('var(--radius-xs)'), 'foco deve usar --radius-xs');
    assert.ok(css.includes('prefers-reduced-motion: reduce'), 'a11y deve ter reduced-motion');
    assert.ok(css.includes('scroll-behavior: auto'), 'reduced-motion deve resetar scroll');
  });

  it('design system: todas paginas principais carregam tokens.css', () => {
    for (const page of ['landing/index.html', 'centro/index.html', 'arquivo-morto/index.html', 'arquivista/index.html']) {
      const html = read(page);
      assert.ok(html.includes('/app/styles/tokens.css'), `${page} deve carregar tokens.css`);
    }
  });

  it('design system: centro/index.html sem style inline', () => {
    const html = read('centro/index.html');
    assert.ok(!html.includes('style="'), 'centro nao deve ter style= inline');
    assert.ok(html.includes('/app/styles/tokens.css'), 'deve carregar tokens.css');
    assert.ok(html.includes('/app/styles/components.css'), 'deve carregar components.css');
    assert.ok(html.includes('btn btn--nav'), 'nav buttons devem usar .btn');
    assert.ok(html.includes('btn btn--ghost btn--icon'), 'hamburger deve usar .btn');
    assert.ok(html.includes('sidebar-open-btn btn btn--icon'), 'sidebar open deve usar .btn');
    assert.ok(html.includes('btn btn--bare btn--icon-sm'), 'sidebar close deve usar .btn');
  });

  it('design system: components.css contem componentes-base MVP', () => {
    const css = read('vendor/app/styles/components.css');
    const required = [
      '.btn--primary',
      '.btn--brand-solid',
      '.btn--brand-ghost',
      '.btn--subtle',
      '.btn--block',
      '.btn--ghost',
      '.btn--icon',
      '.input',
      '.checkbox',
      '.card--popup',
      '.card--inspector',
      '.toast',
      '.empty-state',
      '.skeleton',
    ];
    for (const selector of required) {
      assert.ok(css.includes(selector), `${selector} ausente em components.css`);
    }
    assert.ok(css.includes(':disabled'), 'estados disabled ausentes');
    assert.ok(css.includes(':hover'), 'estados hover ausentes');
    assert.ok(css.includes(':active'), 'estados active ausentes');
  });

  it('design system: nav-retorno unificado com BEM e data-theme', () => {
    const css = read('vendor/app/styles/components.css');
    assert.ok(css.includes('.nav-retorno__link'), 'nav-retorno__link ausente');
    assert.ok(css.includes('min-width: 44px'), 'touch target 44px ausente');
    assert.ok(css.includes('[data-theme="terminal"]'), 'tema terminal ausente');
    assert.ok(css.includes('[data-theme="hud"]'), 'tema hud ausente');
    assert.ok(!css.includes('.nav-retorno-link'), 'classe legada nav-retorno-link ainda presente');
    assert.ok(!css.includes('.linux-desktop .nav-retorno'), 'override linux-desktop duplicado');

    const am = read('arquivo-morto/index.html');
    assert.ok(am.includes('data-theme="brand"'), 'arquivo-morto deve usar data-theme=brand');
    assert.ok(am.includes('nav-retorno__link'), 'arquivo-morto deve usar BEM');

    const arq = read('arquivista/index.html');
    assert.ok(arq.includes('data-theme="terminal"'), 'arquivista deve usar data-theme=terminal');
    assert.ok(arq.includes('nav-retorno__link--primary'), 'arquivista link primary');

    const linux = read('arquivista/css/linux-desktop.css');
    assert.ok(!linux.includes('.nav-retorno'), 'linux-desktop nao deve redefinir nav-retorno');
  });

  it('design system: sem Fira Code, Google Fonts nem texturas externas no runtime', () => {
    const runtimeCss = [
      'centro/styles/layout.css',
      'centro/styles/sidebar.css',
      'centro/styles/narrative-nav.css',
      'centro/styles/feature-inspector.css',
      'centro/styles/profile-card.css',
      'centro/styles/jesuit-frame.css',
      'centro/styles/map-popups.css',
      'centro/styles/responsive.css',
      'centro/styles/centro-chrome.css',
      'landing/landing.css',
      'arquivo-morto/css/arquivo-morto.css',
      'arquivista/css/utility.css',
      'arquivista/css/style.css',
      'arquivista/css/desktop-layout.css',
      'arquivista/css/linux-desktop.css',
      'arquivista/css/window-system.css',
      'arquivista/css/effects.css',
      'vendor/app/styles/tokens.css',
      'vendor/app/styles/components.css',
    ];
    for (const file of runtimeCss) {
      const css = read(file);
      assert.ok(!/Fira Code|Fira\+Code|fonts\.googleapis/.test(css), `${file} sem Fira/CDN fontes`);
      assert.ok(!/transparenttextures|unsplash|wixstatic/i.test(css), `${file} sem CDN textura`);
    }
    const runtimeHtml = [
      'centro/index.html',
      'landing/index.html',
      'arquivo-morto/index.html',
      'arquivista/index.html',
    ];
    for (const file of runtimeHtml) {
      const html = read(file);
      assert.ok(!/transparenttextures|unsplash|wixstatic/i.test(html), `${file} sem CDN textura/img`);
    }
    assert.ok(exists('vendor/app/styles/tokens.css'), 'tokens.css existe');
    assert.ok(exists('vendor/app/styles/a11y.css'), 'a11y.css existe');
    assert.ok(exists('vendor/app/styles/components.css'), 'components.css existe');
    const centroCss = read('centro/styles/sidebar.css') + read('centro/styles/map-popups.css');
    assert.ok(/var\(--font-mono\)|var\(--font-code\)/.test(centroCss), 'centro usa tokens mono');
  });

  it('design system: narrative-nav visivel no mobile (flyTo)', () => {
    const css = read('centro/styles/narrative-nav.css');
    const responsive = read('centro/styles/responsive.css');
    assert.ok(css.includes('jesuit-frame-bottom'), 'nav posicionada acima da moldura');
    assert.ok(css.includes('overflow-x: auto'), 'nav com scroll horizontal');
    assert.ok(css.includes('min-height: 44px'), 'touch target nos botoes');
    assert.match(css, /\.narrative-nav\s*\{[^}]*display:\s*flex/s, 'nav sempre flex');
    assert.ok(!responsive.includes('narrative-nav'), 'responsive nao esconde narrative-nav');
    assert.ok(!responsive.includes('700px'), 'centro usa --bp-lg 768px');
  });

  it('design system: landing migrou tokens amber legados', () => {
    const css = read('landing/landing.css');
    assert.ok(!/--amber\s*:/.test(css), 'landing sem --amber local');
    assert.ok(css.includes('var(--color-brand)'), 'landing usa color-brand');
    assert.ok(css.includes('--brand-mid'), 'landing opacidades consolidadas');
    assert.ok(!css.includes('--brand-mid:        var(--brand-mid)'), 'sem alias circular brand-mid');
    assert.ok(!css.includes('--font-mono: var(--font-mono)'), 'landing sem alias circular de fonte');
  });

  it('design system: landing CTAs usam btn DS (brand-solid, brand-ghost, subtle)', () => {
    const html = read('landing/index.html');
    const css = read('landing/landing.css');
    assert.ok(html.includes('btn--brand-solid'), 'hero/patrocinio usam btn--brand-solid');
    assert.ok(html.includes('btn--brand-ghost'), 'hero secundarios usam btn--brand-ghost');
    assert.ok(html.includes('btn--subtle'), 'tier cards usam btn--subtle');
    assert.ok(!html.includes('class="btn-primary"'), 'sem btn-primary legado');
    assert.ok(!html.includes('tier-cta'), 'sem tier-cta legado');
    assert.ok(!css.includes('.tier-cta'), 'landing.css sem bloco tier-cta');
    assert.ok(!css.includes('.btn-primary'), 'landing.css sem bloco btn-primary');
    assert.ok(!html.includes('portal-btn" class="portal-btn'), 'portal usa btn DS');
    assert.ok(html.includes('id="portal-btn" class="btn btn--primary"'), 'portal btn--primary');
    assert.ok(!css.includes('.portal-btn'), 'landing.css sem bloco portal-btn');
  });

  it('design system: arquivo-morto controles youtube usam btn--primary', () => {
    const html = read('arquivo-morto/index.html');
    const css = read('arquivo-morto/css/arquivo-morto.css');
    assert.ok(html.includes('btn btn--primary'), 'botoes youtube usam btn DS');
    assert.ok(!html.includes('youtube-anexo__btn'), 'sem classe youtube-anexo__btn legada');
    assert.ok(!css.includes('.youtube-anexo__btn'), 'css sem bloco youtube-anexo__btn');
    assert.ok(css.includes('.youtube-anexo__controls .btn'), 'overrides finos no anexo');
  });

  it('design system: arquivo-morto migrou tokens amber legados', () => {
    const css = read('arquivo-morto/css/arquivo-morto.css');
    assert.ok(!/--am-amber\s*:/.test(css), 'arquivo-morto sem --am-amber local');
    assert.ok(css.includes('var(--color-brand)'), 'arquivo-morto usa color-brand');
    assert.ok(css.includes('var(--color-brand-dim)'), 'arquivo-morto usa color-brand-dim');
    assert.ok(css.includes('var(--color-danger)'), 'am-red aponta para color-danger');
    assert.ok(!/border-color: rgba\(245,\s*158,\s*11/.test(css), 'consumidores usam aliases locais');
  });

  it('design system: arquivista tem media queries criticas', () => {
    const css = read('arquivista/css/linux-desktop.css');
    assert.ok(css.includes('max-width: 768px'), 'mq tablet');
    assert.ok(css.includes('max-width: 640px'), 'mq phone');
    assert.ok(css.includes('max-width: 480px'), 'mq phone estreito');
    assert.ok(css.includes('min-width: min(320px'), 'janelas limitadas ao viewport');
  });

  it('centro-sidebar.css agregador nao deve referenciar BANNER_SITE.png ausente', () => {
    const css = read('centro/styles/sidebar.css') + read('centro/styles/jesuit-frame.css');
    assert.ok(!css.includes('BANNER_SITE.png'), 'nao deve referenciar PNG inexistente');
  });

  // ── Lucide: devDependency + sync, nunca bundle no browser ───────
  it('centro nao deve carregar bundle Lucide no runtime', () => {
    const html = read('centro/index.html');
    const runtime = read('centro/centro-runtime.js');
    assert.ok(!/lucide/i.test(html), 'referencia Lucide no HTML');
    assert.ok(!/lucide/i.test(runtime), 'referencia Lucide no runtime');
    assert.ok(!exists('vendor/lucide'), 'pasta vendor/lucide nao deve existir');
    assert.ok(html.includes('aria-hidden="true"'), 'icones decorativos com aria-hidden');
    assert.ok(html.includes('aria-label="Navegar para o Triângulo Histórico"'), 'botao OP:TRIÂNGULO acessivel');
    assert.ok(html.includes('aria-label="Navegar para a Praça da Sé"'), 'botao OP:SÉ acessivel');
    assert.ok(html.includes('aria-label="Navegar para o Vale do Anhangabaú"'), 'botao OP:ANHANGABAÚ acessivel');
    assert.ok(html.includes('aria-label="Navegar para a visão geral do mapa"'), 'botao OP:GERAL acessivel');
  });

  it('lucide-static e sync-lucide-icons configurados para gerar SVGs offline', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.ok(pkg.devDependencies && pkg.devDependencies['lucide-static'], 'lucide-static devDependency ausente');
    assert.ok(pkg.scripts['sync:lucide-icons'], 'script sync:lucide-icons ausente');
    assert.ok(exists('scripts/sync-lucide-icons.mjs'), 'sync-lucide-icons.mjs ausente');
    assert.ok(exists('centro/data/icon-manifest.json'), 'icon-manifest.json ausente');
    const manifest = JSON.parse(read('centro/data/icon-manifest.json'));
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 6, 'manifest deve listar icones');
    assert.ok(manifest.template && manifest.template.id === 'disc-forensic', 'template disc-forensic no manifest');
  });

  // ── Rio / animação — sem variáveis mortas ───────────────────────
  it('nao deve conter variaveis mortas de animacao de rio no centro', () => {
    const rio = read('centro/features/rio-animado.js');
    const runtime = read('centro/centro-runtime.js');
    assert.ok(!rio.includes('rioAnimationFrame'), 'rioAnimationFrame ainda presente');
    assert.ok(!rio.includes('rioAnimationStart'), 'rioAnimationStart ainda presente');
    assert.ok(!rio.includes('RIO_FLOW_DASHES'), 'RIO_FLOW_DASHES ainda presente');
    assert.ok(!/\brequestAnimationFrame\s*\(/.test(rio), 'requestAnimationFrame em rio-animado.js');
    assert.ok(!/\brequestAnimationFrame\s*\(/.test(runtime), 'requestAnimationFrame em centro-runtime.js');
    assert.ok(rio.includes('FORA DO ESCOPO'), 'rio-animado.js deve documentar escopo');
  });

  // ── Performance — Lazy loading ──────────────────────────────────
  it('centro: ui toast e lazy-assets carregados antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const toastIdx = html.indexOf('ui/toast.js');
    const lazyIdx = html.indexOf('ui/lazy-assets.js');
    assert.ok(toastIdx > -1 && lazyIdx > -1, 'scripts ui/toast e ui/lazy-assets ausentes');
    assert.ok(toastIdx < runtimeIdx && lazyIdx < runtimeIdx, 'ui scripts devem preceder centro-runtime.js');
    assert.ok(toastIdx < lazyIdx, 'toast.js deve preceder lazy-assets.js');

    const toast = read('centro/ui/toast.js');
    const lazy = read('centro/ui/lazy-assets.js');
    assert.doesNotThrow(() => new Function(toast));
    assert.doesNotThrow(() => new Function(lazy));
    assert.ok(toast.includes('window.centroToast'), 'toast.js deve expor centroToast');
    assert.ok(toast.includes('CENTRO.ui.setupToast'), 'toast.js registra CENTRO.ui.setupToast');
    assert.ok(lazy.includes('MutationObserver'), 'lazy-assets.js usa MutationObserver');
    assert.ok(lazy.includes('loading", "lazy"'), 'lazy-assets.js aplica loading lazy');
    assert.ok(lazy.includes('CENTRO.ui.setupLazyImageObserver'), 'lazy-assets registra setupLazyImageObserver');
  });

  // ── UX — Toast feedback ─────────────────────────────────────────
  it('centro/index.html deve conter centroToast', () => {
    const toast = read('centro/ui/toast.js');
    assert.ok(toast.includes('centroToast'), 'centroToast ausente em ui/toast.js');
    assert.ok(toast.includes('centro-toast'), 'centro-toast element ausente');
    assert.ok(toast.includes('toast is-hidden'), 'toast usa classe DS');
    assert.ok(toast.includes('toast__close'), 'toast usa BEM close');
    assert.ok(!toast.includes('toastEl.style.cssText'), 'toast sem style.cssText');
    assert.ok(!toast.includes('toastEl.style.background'), 'toast sem cor inline');
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('setupCentroUiFromModules'), 'runtime delega UI via setupCentroUiFromModules');
  });

  it('centro-runtime.js: showInspector debug usa card--inspector sem inline', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('showInspector'), 'showInspector presente');
    assert.ok(runtime.includes('card card--inspector'), 'debug inspector usa card DS');
    assert.ok(runtime.includes('debug-inspector__body'), 'debug inspector body com classe');
    const fn = runtime.slice(
      runtime.indexOf('function showInspector'),
      runtime.indexOf('function initMap')
    );
    assert.ok(!fn.includes('style.cssText'), 'showInspector sem style.cssText');
    assert.ok(!fn.includes('style='), 'showInspector sem style inline em HTML');
  });

  // ── Navegação — flyTo ───────────────────────────────────────────
  it('centro/index.html deve conter centroNavigate e centroGoTo', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('centroNavigate'), 'centroNavigate ausente');
    assert.ok(runtime.includes('centroGoTo'), 'centroGoTo ausente');
    assert.ok(runtime.includes('CENTRO_POIS'), 'CENTRO_POIS ausente');
  });

  // ── Features — Feature scripts parseáveis ───────────────────────
  it('todos os feature scripts em centro/features/ devem ser parseáveis', () => {
    const files = ['triangulo-historico.js', 'rio-animado.js', 'pistas.js', 'poi-icons.js'];
    files.forEach(function(f) {
      const path = 'centro/features/' + f;
      assert.ok(exists(path), f + ' nao encontrado');
      assert.doesNotThrow(() => new Function(read(path)), f + ' nao parseavel');
    });
  });

  // ── XSS-safety — popups via DOM API ─────────────────────────────
  it('centro: map-popups.js carregado antes do runtime, sem innerHTML', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const popupsIdx = html.indexOf('ui/map-popups.js');
    const lazyIdx = html.indexOf('ui/lazy-assets.js');
    assert.ok(popupsIdx > -1, 'ui/map-popups.js ausente no HTML');
    assert.ok(lazyIdx < popupsIdx && popupsIdx < runtimeIdx, 'map-popups.js deve preceder centro-runtime.js');

    const popups = read('centro/ui/map-popups.js');
    assert.doesNotThrow(() => new Function(popups));
    assert.ok(popups.includes('CENTRO.ui.createPoiPopupNode'), 'export createPoiPopupNode ausente');
    assert.ok(popups.includes('CENTRO.ui.createPistaPopupNode'), 'export createPistaPopupNode ausente');
    assert.ok(popups.includes('createElement'), 'factories devem usar createElement');
    assert.ok(popups.includes('textContent'), 'factories devem usar textContent');
    assert.ok(!popups.includes('innerHTML'), 'map-popups.js nao deve usar innerHTML');
    assert.ok(!popups.includes('.setHTML('), 'map-popups.js nao deve usar setHTML');
    assert.ok(popups.includes('poi-popup'), 'factory POI usa classe poi-popup');
    assert.ok(popups.includes('pista-popup__desc'), 'factory pista monta descricao');

    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('setDOMContent') || read('centro/map/symbol-popup-layer.js').includes('setDOMContent'), 'popups devem usar setDOMContent');
    assert.ok(runtime.includes('addSymbolPopupLayer'), 'runtime delega via addSymbolPopupLayer');
    assert.ok(runtime.includes('createPoiPopupNode'), 'runtime referencia export createPoiPopupNode');
    assert.ok(runtime.includes('createPistaPopupNode'), 'runtime referencia export createPistaPopupNode');
    assert.ok(!runtime.includes('function createPoiPopupNode'), 'runtime nao duplica factory POI');
    assert.ok(!runtime.includes('function createPistaPopupNode'), 'runtime nao duplica factory pista');
    assert.ok(!runtime.includes('pista-popup__desc'), 'markup pista-popup so no modulo');
    assert.ok(!runtime.includes('pista-popup__img'), 'markup pista-popup so no modulo');
    assert.ok(!/Popup\([^)]*\)[\s\S]{0,300}\.setHTML\(/.test(runtime), 'runtime nao deve usar setHTML em Popup');
    assert.ok(!/innerHTML\s*=\s*"<[a-z]/i.test(runtime) || runtime.includes('panel.innerHTML = ""'), 'runtime evita injecao via innerHTML literal');
  });

  // ── PR A: pure sidebar/catalog helpers ───────────────────────────
  it('centro: sidebar-layer-state.js carregado antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const stateIdx = html.indexOf('sidebar-layer-state.js');
    const phaseIdx = html.indexOf('protocolo-phase.js');
    assert.ok(stateIdx > -1, 'sidebar-layer-state.js ausente no HTML');
    assert.ok(phaseIdx < stateIdx && stateIdx < runtimeIdx, 'sidebar-layer-state deve preceder centro-runtime.js');

    const mod = read('centro/features/sidebar-layer-state.js');
    assert.doesNotThrow(() => new Function(mod));
    assert.ok(mod.includes('CENTRO.sidebarLayerState'), 'export sidebarLayerState ausente');
    assert.ok(!mod.includes('document.'), 'sidebar-layer-state sem DOM');
    assert.ok(!mod.includes('localStorage'), 'sidebar-layer-state sem localStorage');
    assert.ok(!mod.includes('getSource'), 'sidebar-layer-state sem MapLibre');
    assert.ok(!mod.includes('addLayer'), 'sidebar-layer-state sem MapLibre addLayer');
    assert.ok(!mod.includes('layerUnlocks'), 'sidebar-layer-state nao le ARG runtime');
    assert.ok(!mod.includes('protocoloPhase'), 'sidebar-layer-state nao le protocoloPhase');

    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('getSidebarLayerStateHelper'), 'runtime delega sidebarLayerState');
    assert.ok(!runtime.includes('filePath.indexOf("data/context/")'), 'buildLayerDataUrl nao duplicado no runtime');
  });

  it('sidebar-layer-state.js: lock state e mensagens preservam texto atual', () => {
    const state = loadSidebarLayerStateModule();
    assert.strictEqual(state.getMinPhaseLabel(3), '3');
    assert.strictEqual(state.getMinPhaseLabel(null), '?');

    const clueLocked = state.getLayerLockState({
      isClueUnlocked: false,
      isPhaseUnlocked: true,
      minPhase: 5,
    });
    assert.strictEqual(clueLocked.locked, true);
    assert.strictEqual(clueLocked.clueLocked, true);
    assert.strictEqual(clueLocked.phaseLocked, false);
    assert.strictEqual(state.getLayerRowClass(clueLocked), 'layer-row layer-row--locked');
    assert.strictEqual(
      state.getLockMessage(clueLocked, 'sidebar-hint'),
      ' (bloqueada — registre pistas no Caderno)'
    );
    assert.strictEqual(state.getLockMessage(clueLocked, 'sidebar-meta'), 'bloqueada');
    assert.ok(
      state.getLockMessage(clueLocked, 'toast').includes('Caderno do Arquivista'),
      'toast clue lock'
    );

    const phaseLocked = state.getLayerLockState({
      isClueUnlocked: true,
      isPhaseUnlocked: false,
      minPhase: 7,
    });
    assert.strictEqual(phaseLocked.phaseLocked, true);
    assert.strictEqual(state.getLayerRowClass(phaseLocked), 'layer-row layer-row--locked layer-row--phase-locked');
    assert.strictEqual(
      state.getLockMessage(phaseLocked, 'sidebar-hint'),
      ' (bloqueada — avance de fase no ARG)'
    );
    assert.strictEqual(state.getLockMessage(phaseLocked, 'sidebar-meta'), 'fase 7');
    assert.ok(state.getLockMessage(phaseLocked, 'toast').includes('fase mínima 7'), 'toast phase lock');
  });

  it('centro: layer-data-url.js carregado apos map-safe e antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const urlIdx = html.indexOf('layer-data-url.js');
    const mapSafeIdx = html.indexOf('map/map-safe.js');
    assert.ok(urlIdx > -1, 'layer-data-url.js ausente no HTML');
    assert.ok(mapSafeIdx < urlIdx && urlIdx < runtimeIdx, 'layer-data-url deve ficar entre map-safe e runtime');

    const mod = read('centro/map/layer-data-url.js');
    assert.doesNotThrow(() => new Function(mod));
    assert.ok(mod.includes('buildLayerDataUrl'), 'export buildLayerDataUrl ausente');
    assert.ok(mod.includes('applyLayerZoomBounds'), 'export applyLayerZoomBounds ausente');
    assert.ok(!mod.includes('document.'), 'layer-data-url sem DOM');
    assert.ok(!mod.includes('localStorage'), 'layer-data-url sem localStorage');
    assert.ok(!mod.includes('getSource'), 'layer-data-url sem MapLibre');
    assert.ok(!mod.includes('addLayer'), 'layer-data-url sem MapLibre addLayer');
    assert.ok(!mod.includes('ensureSource'), 'layer-data-url sem ensureSource');

    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('getCentroMapHelper("buildLayerDataUrl")'), 'runtime delega buildLayerDataUrl');
    assert.ok(runtime.includes('getCentroMapHelper("applyLayerZoomBounds")'), 'runtime delega applyLayerZoomBounds');
  });

  it('layer-data-url.js: URLs e zoom bounds preservam comportamento', () => {
    const mapMod = loadLayerDataUrlModule();
    assert.strictEqual(
      mapMod.buildLayerDataUrl({ file: 'data/context/centro_foo.geojson' }),
      '/centro/data/context/centro_foo.geojson'
    );
    assert.strictEqual(
      mapMod.buildLayerDataUrl({ file: 'data/processed/centro_bar.geojson' }),
      '/centro/data/processed/centro_bar.geojson'
    );
    assert.strictEqual(
      mapMod.buildLayerDataUrl({ file: 'legacy/processed/centro_baz.geojson' }),
      '/centro/data/processed/centro_baz.geojson'
    );

    const layerDef = { id: 'test-fill', type: 'fill' };
    const withZoom = mapMod.applyLayerZoomBounds(layerDef, { minzoom: 14, maxzoom: 17 });
    assert.strictEqual(withZoom.minzoom, 14);
    assert.strictEqual(withZoom.maxzoom, 17);
    assert.strictEqual(mapMod.applyLayerZoomBounds({ id: 'x' }, {}).minzoom, undefined);
  });

  // ── Gate 4.5C: sidebar-panel render ─────────────────────────────
  it('centro: sidebar-panel.js carregado antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const panelIdx = html.indexOf('ui/sidebar-panel.js');
    const popupsIdx = html.indexOf('ui/map-popups.js');
    assert.ok(panelIdx > -1, 'sidebar-panel.js ausente no HTML');
    assert.ok(popupsIdx < panelIdx && panelIdx < runtimeIdx, 'sidebar-panel deve preceder centro-runtime.js');

    const panel = read('centro/ui/sidebar-panel.js');
    assert.doesNotThrow(() => new Function(panel));
    assert.ok(panel.includes('CENTRO.ui.renderSidebarPanel'), 'export renderSidebarPanel ausente');
    assert.ok(panel.includes('createElement'), 'sidebar-panel usa createElement');
    assert.ok(panel.includes('textContent'), 'sidebar-panel usa textContent');
    const lockStateMod = read('centro/features/sidebar-layer-state.js');
    assert.ok(lockStateMod.includes('layer-row--locked'), 'classe locked em sidebar-layer-state');
    assert.ok(lockStateMod.includes('layer-row--phase-locked'), 'classe phase-locked em sidebar-layer-state');
    assert.ok(panel.includes('getLayerRowClass'), 'sidebar-panel delega row class');
    assert.ok(panel.includes('data-layer-id') || panel.includes('layerId'), 'data-layer-id via dataset');
    assert.ok(!panel.includes('localStorage'), 'sidebar-panel sem localStorage');
    assert.ok(!panel.includes('getSource'), 'sidebar-panel sem MapLibre');
    assert.ok(!panel.includes('addLayer'), 'sidebar-panel sem addLayer');
    assert.ok(!panel.includes('fetch('), 'sidebar-panel sem fetch');
    assert.ok(!panel.includes('layerUnlocks'), 'sidebar-panel nao le ARG runtime');
    assert.ok(!panel.includes('protocoloPhase'), 'sidebar-panel nao le protocoloPhase');
    assert.ok(!/innerHTML\s*=\s*[`'"][^`'"]+\$\{/.test(panel), 'sem innerHTML com interpolacao de catalogo');

    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('CENTRO.ui.renderSidebarPanel'), 'runtime delega renderSidebarPanel');
    assert.ok(!runtime.includes('details.className = "group"'), 'render DOM nao duplicado no runtime');
    assert.strictEqual((runtime.match(/function wireLayerCheckboxes/g) || []).length, 1, 'wireLayerCheckboxes intacto');
    assert.strictEqual((runtime.match(/function renderSidebarPanel/g) || []).length, 1, 'wrapper renderSidebarPanel no runtime');
  });

  it('sidebar-panel.js: render basico com deps injetadas', () => {
    const sandbox = {
      window: { CENTRO: { ui: {} } },
      document: {
        createElement: function (tag) {
          const node = {
            tagName: tag.toUpperCase(),
            className: '',
            textContent: '',
            open: false,
            disabled: false,
            checked: false,
            dataset: {},
            children: [],
            appendChild: function (child) {
              this.children.push(child);
            },
            setAttribute: function () {},
          };
          return node;
        },
        createTextNode: function (text) {
          return { nodeType: 3, textContent: text };
        },
      },
      console,
    };
    vm.createContext(sandbox);
    vm.runInContext(read('centro/ui/sidebar-panel.js'), sandbox);
    const render = sandbox.window.CENTRO.ui.renderSidebarPanel;
    const panel = sandbox.document.createElement('div');
    render({
      panel: panel,
      groups: [{ id: 'g1', title: 'Grupo Teste' }],
      layers: [
        { id: 'ly-open', group: 'g1', title: 'Aberta', visible: true, feature_count: 3 },
        { id: 'ly-lock', group: 'g1', title: 'Fase', visible: true },
      ],
      resolveSidebarLockState: function (id) {
        if (id === 'ly-lock') {
          return {
            locked: true,
            clueLocked: false,
            phaseLocked: true,
            minPhaseLabel: '2',
          };
        }
        return { locked: false, clueLocked: false, phaseLocked: false };
      },
      getLayerRowClass: function (state) {
        return state.locked ? 'layer-row layer-row--locked layer-row--phase-locked' : 'layer-row';
      },
      getLockMessage: function (state, kind) {
        if (kind === 'sidebar-meta') return 'fase 2';
        return ' (bloqueada — avance de fase no ARG)';
      },
      getMinPhaseLabel: function () {
        return '2';
      },
    });
    assert.ok(panel.children.length >= 1, 'panel recebeu grupos');
    const htmlDump = JSON.stringify(panel);
    assert.ok(htmlDump.includes('layer-row--phase-locked'), 'phase-locked renderizado');
    assert.ok(htmlDump.includes('fase 2'), 'meta fase preservada');
    assert.ok(htmlDump.includes('ly-open'), 'camada aberta presente');
  });

  // ── Gate 4.5D-B: sidebar-events wiring ───────────────────────────
  it('centro: sidebar-events.js carregado antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const eventsIdx = html.indexOf('ui/sidebar-events.js');
    const panelIdx = html.indexOf('ui/sidebar-panel.js');
    assert.ok(eventsIdx > -1, 'sidebar-events.js ausente no HTML');
    assert.ok(panelIdx < eventsIdx && eventsIdx < runtimeIdx, 'sidebar-events deve preceder centro-runtime.js');

    const events = read('centro/ui/sidebar-events.js');
    assert.doesNotThrow(() => new Function(events));
    assert.ok(events.includes('CENTRO.ui.wireLayerCheckboxes'), 'export wireLayerCheckboxes ausente');
    assert.ok(events.includes('data-layer-id'), 'contrato data-layer-id');
    assert.ok(!events.includes('localStorage'), 'sidebar-events sem localStorage');
    assert.ok(!events.includes('catalogIndex'), 'sidebar-events sem catalogIndex');
    assert.ok(!events.includes('protocoloPhase'), 'sidebar-events sem protocoloPhase');
    assert.ok(!events.includes('layerUnlocks'), 'sidebar-events sem layerUnlocks');
    assert.ok(!events.includes('getSource'), 'sidebar-events sem MapLibre getSource');
    assert.ok(!/[^.]addLayer\s*\(/.test(events), 'sidebar-events sem addLayer MapLibre');
    assert.ok(!events.includes('maplibregl'), 'sidebar-events sem maplibregl');
    assert.ok(!events.includes('fetch('), 'sidebar-events sem fetch');
    assert.ok(!events.includes('data-centro-wired'), 'sem guard panel-level');

    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('CENTRO.ui.wireLayerCheckboxes'), 'runtime delega wireLayerCheckboxes');
    assert.ok(runtime.includes('getLockToastMessage'), 'runtime expoe toast lock via wrapper');
    assert.ok(!runtime.includes('querySelectorAll("input[type=\\"checkbox\\"][data-layer-id]")'), 'query wire nao duplicado no runtime');
    assert.ok(runtime.includes('function addLayerToMap'), 'addLayerToMap permanece no runtime');
    assert.ok(runtime.includes('function removeLayerFromMap'), 'removeLayerFromMap permanece no runtime');
    assert.strictEqual((runtime.match(/function wireLayerCheckboxes/g) || []).length, 1, 'wrapper wireLayerCheckboxes');
  });

  it('sidebar-events.js: wiring mock checkbox unlocked/checked chama addLayerToMap', () => {
    const wire = loadSidebarEventsModule();
    const cb = makeMockCheckbox('ly-poly', { checked: false });
    const panel = makeMockPanel([cb]);
    let addCalls = 0;
    wire(panel, {
      hasCatalog: function () { return true; },
      getLayerConfig: function (id) { return id === 'ly-poly' ? { id: 'ly-poly', geom: 'polygon' } : null; },
      isLayerAccessible: function () { return true; },
      getLockToastMessage: function () { return 'lock'; },
      whenMapReady: function (fn) { fn(); return Promise.resolve(); },
      addLayerToMap: function () { addCalls++; return Promise.resolve(); },
      removeLayerFromMap: function () {},
      toast: function () {},
    });
    cb.checked = true;
    cb.dispatchEvent();
    assert.strictEqual(addCalls, 1, 'addLayerToMap uma vez');
  });

  it('sidebar-events.js: wiring mock unchecked chama removeLayerFromMap', () => {
    const wire = loadSidebarEventsModule();
    const cb = makeMockCheckbox('ly-line', { checked: false });
    const panel = makeMockPanel([cb]);
    let removeCalls = 0;
    wire(panel, {
      hasCatalog: function () { return true; },
      getLayerConfig: function (id) { return { id: id, geom: 'line' }; },
      isLayerAccessible: function () { return true; },
      getLockToastMessage: function () { return ''; },
      whenMapReady: function (fn) { fn(); return Promise.resolve(); },
      addLayerToMap: function () {},
      removeLayerFromMap: function (id) { removeCalls++; assert.strictEqual(id, 'ly-line'); },
      toast: function () {},
    });
    cb.dispatchEvent();
    assert.strictEqual(removeCalls, 1, 'removeLayerFromMap uma vez');
  });

  it('sidebar-events.js: wiring mock locked reverte checked e chama toast', () => {
    const wire = loadSidebarEventsModule();
    const cb = makeMockCheckbox('ly-lock', { checked: true });
    const panel = makeMockPanel([cb]);
    let addCalls = 0;
    let toastMsg = '';
    wire(panel, {
      hasCatalog: function () { return true; },
      getLayerConfig: function () { return { id: 'ly-lock' }; },
      isLayerAccessible: function () { return false; },
      getLockToastMessage: function () { return 'Camada bloqueada. TESTE'; },
      whenMapReady: function (fn) { fn(); return Promise.resolve(); },
      addLayerToMap: function () { addCalls++; },
      removeLayerFromMap: function () {},
      toast: function (msg) { toastMsg = msg; },
    });
    cb.dispatchEvent();
    assert.strictEqual(cb.checked, false, 'checkbox revertido');
    assert.ok(toastMsg.includes('TESTE'), 'toast lock chamado');
    assert.strictEqual(addCalls, 0, 'addLayerToMap nao chamado');
  });

  it('sidebar-events.js: bootstrap checked:not(:disabled) dispara change', () => {
    const wire = loadSidebarEventsModule();
    const cb = makeMockCheckbox('ly-boot', { checked: true });
    const panel = makeMockPanel([cb]);
    let addCalls = 0;
    wire(panel, {
      hasCatalog: function () { return true; },
      getLayerConfig: function (id) { return { id: id, geom: 'point' }; },
      isLayerAccessible: function () { return true; },
      getLockToastMessage: function () { return ''; },
      whenMapReady: function (fn) { fn(); return Promise.resolve(); },
      addLayerToMap: function () { addCalls++; return Promise.resolve(); },
      removeLayerFromMap: function () {},
      toast: function () {},
    });
    assert.strictEqual(addCalls, 1, 'bootstrap dispara addLayerToMap');
  });

  // ── Gate 4.5E-B: catalog-layer-controller ───────────────────────
  it('centro: catalog-layer-controller.js carregado depois de layer-data-url e antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const ctrlIdx = html.indexOf('catalog-layer-controller.js');
    const urlIdx = html.indexOf('layer-data-url.js');
    assert.ok(ctrlIdx > -1, 'catalog-layer-controller.js ausente no HTML');
    assert.ok(urlIdx < ctrlIdx && ctrlIdx < runtimeIdx, 'catalog-layer-controller deve ficar entre layer-data-url e runtime');

    const ctrl = read('centro/map/catalog-layer-controller.js');
    assert.doesNotThrow(() => new Function(ctrl));
    assert.ok(ctrl.includes('addCatalogLayerToMap'), 'export addCatalogLayerToMap ausente');
    assert.ok(ctrl.includes('removeCatalogLayerFromMap'), 'export removeCatalogLayerFromMap ausente');
    assert.ok(!ctrl.includes('localStorage'), 'controller sem localStorage');
    assert.ok(!ctrl.includes('document.'), 'controller sem DOM');
    assert.ok(!ctrl.includes('querySelector'), 'controller sem querySelector');
    assert.ok(!ctrl.includes('catalogIndex'), 'controller sem catalogIndex');
    assert.ok(!ctrl.includes('layerUnlocks'), 'controller sem layerUnlocks');
    assert.ok(!ctrl.includes('protocoloPhase'), 'controller sem protocoloPhase');
    assert.ok(!ctrl.includes('fetch('), 'controller sem fetch');

    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('function addLayerToMap'), 'wrapper addLayerToMap no runtime');
    assert.ok(runtime.includes('function removeLayerFromMap'), 'wrapper removeLayerFromMap no runtime');
    assert.ok(runtime.includes('addCatalogLayerToMap'), 'runtime delega addCatalogLayerToMap');
    assert.ok(runtime.includes('removeCatalogLayerFromMap'), 'runtime delega removeCatalogLayerFromMap');
    assert.ok(!runtime.includes('function addPointLayerWithIcon'), 'addPointLayerWithIcon nao mais no runtime');
  });

  it('catalog-layer-controller: polygon layer criado com contratos imutáveis', async () => {
    const map = makeMockMap();
    const { deps, calls, activeLayers } = makeCatalogDeps(map);
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-poly', geom: 'polygon', file: 'test.geojson' }, deps);
    assert.strictEqual(calls.ensureSource.length, 1, 'ensureSource chamado');
    assert.strictEqual(calls.ensureSource[0].id, 'test-poly-src', 'sourceId preservado');
    assert.strictEqual(calls.ensureLayer.length, 1, 'ensureLayer chamado');
    assert.strictEqual(calls.ensureLayer[0].id, 'test-poly-fill', 'layer fill id correto');
    assert.strictEqual(calls.ensureLayer[0].type, 'fill', 'tipo fill');
    assert.strictEqual(calls.ensureLayer[0].beforeId, 'before-id', 'beforeId injetado');
    assert.ok(activeLayers.has('test-poly'), 'activeLayers.add chamado');
  });

  it('catalog-layer-controller: line layer criado com contratos imutáveis', async () => {
    const map = makeMockMap();
    const { deps, calls, activeLayers } = makeCatalogDeps(map);
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-line', geom: 'line', file: 'test.geojson' }, deps);
    assert.strictEqual(calls.ensureLayer[0].id, 'test-line', 'layer id sem -fill');
    assert.strictEqual(calls.ensureLayer[0].type, 'line', 'tipo line');
    assert.strictEqual(calls.ensureLayer[0].paint['line-width'], 2, 'line-width 2 default');
    assert.ok(activeLayers.has('test-line'));
  });

  it('catalog-layer-controller: point com ícone OK cria symbol layer', async () => {
    const map = makeMockMap();
    let ensureImageId = null;
    const { deps, calls, activeLayers } = makeCatalogDeps(map, {
      resolveLayerIcon: function (id) { return '/icons/' + id + '.svg'; },
      ensureImage: function (m, id, path) { ensureImageId = id; return Promise.resolve(); },
    });
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-pt', geom: 'point', file: 'test.geojson' }, deps);
    assert.strictEqual(ensureImageId, 'test-pt-symbol', 'imageId {id}-symbol');
    assert.strictEqual(calls.ensureLayer[0].type, 'symbol', 'tipo symbol');
    assert.ok(calls.ensureLayer[0].paint['icon-halo-width'] !== undefined || calls.ensureLayer[0].paint['icon-halo-color'] !== undefined, 'halo paint aplicado');
    assert.ok(activeLayers.has('test-pt'));
  });

  it('catalog-layer-controller: point com ícone null faz fallback circle', async () => {
    const map = makeMockMap();
    const { deps, calls, activeLayers } = makeCatalogDeps(map, {
      resolveLayerIcon: null,
    });
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-pt2', geom: 'point', file: 'test.geojson' }, deps);
    assert.strictEqual(calls.ensureLayer[0].type, 'circle', 'fallback circle');
    assert.strictEqual(calls.ensureLayer[0].paint['circle-radius'], 6, 'radius 6');
    assert.ok(activeLayers.has('test-pt2'));
  });

  it('catalog-layer-controller: point com ensureImage falha faz fallback circle', async () => {
    const map = makeMockMap();
    const { deps, calls, activeLayers } = makeCatalogDeps(map, {
      resolveLayerIcon: function () { return '/icon.svg'; },
      ensureImage: function () { return Promise.reject(new Error('load fail')); },
    });
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-pt3', geom: 'point', file: 'test.geojson' }, deps);
    assert.strictEqual(calls.ensureLayer[0].type, 'circle', 'circle após icon fail');
    assert.ok(calls.warns.length >= 1, 'warn chamado');
    assert.ok(activeLayers.has('test-pt3'));
  });

  it('catalog-layer-controller: source existente é idempotente', async () => {
    const map = makeMockMap({ 'test-idem-src': {} });
    const { deps, calls, activeLayers } = makeCatalogDeps(map);
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-idem', geom: 'polygon' }, deps);
    assert.strictEqual(calls.ensureLayer.length, 0, 'nenhum ensureLayer se source existe');
    assert.ok(!activeLayers.has('test-idem'), 'activeLayers nao add em idempotente');
  });

  it('catalog-layer-controller: remove polygon remove fill + source + activeLayers.delete', () => {
    const map = makeMockMap(
      { 'test-rm-src': {} },
      { 'test-rm-fill': {}, 'test-rm': {} }
    );
    const activeLayers = new Set(['test-rm']);
    const ctrl = loadCatalogLayerControllerModule();
    ctrl.removeCatalogLayerFromMap('test-rm', {
      map: map,
      activeLayers: activeLayers,
    });
    assert.ok(!map._layers['test-rm-fill'], 'fill removido');
    assert.ok(!map._layers['test-rm'], 'layer removido');
    assert.ok(!map._sources['test-rm-src'], 'source removido');
    assert.ok(!activeLayers.has('test-rm'), 'activeLayers.delete');
  });

  it('catalog-layer-controller: erro em ensureSource chama warn e toast, nao add activeLayers', async () => {
    const map = makeMockMap();
    const { deps, calls, activeLayers } = makeCatalogDeps(map, {
      ensureSource: function () { throw new Error('source fail'); },
    });
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-err', geom: 'polygon' }, deps);
    assert.ok(calls.warns.length >= 1, 'warn chamado');
    assert.ok(calls.toasts.length >= 1, 'toast chamado');
    assert.ok(calls.toasts[0].msg.includes('test-err'), 'toast menciona layer id');
    assert.ok(!activeLayers.has('test-err'), 'activeLayers nao add em erro');
  });

  it('catalog-layer-controller: minzoom/maxzoom aplicados via applyLayerZoomBounds', async () => {
    const map = makeMockMap();
    const zooms = [];
    const { deps, calls } = makeCatalogDeps(map, {
      applyLayerZoomBounds: function (layerDef, cfg) {
        zooms.push({ minzoom: cfg.minzoom, maxzoom: cfg.maxzoom });
        return layerDef;
      },
    });
    const ctrl = loadCatalogLayerControllerModule();
    await ctrl.addCatalogLayerToMap({ id: 'test-zoom', geom: 'line', minzoom: 14, maxzoom: 17 }, deps);
    assert.ok(zooms.length >= 1, 'applyLayerZoomBounds chamado');
    assert.strictEqual(zooms[0].minzoom, 14);
    assert.strictEqual(zooms[0].maxzoom, 17);
  });

  // ── Symbol popup layer factory ──────────────────────────────────
  it('centro: symbol-popup-layer.js carregado antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const symbolIdx = html.indexOf('symbol-popup-layer.js');
    const mapSafeIdx = html.indexOf('map/map-safe.js');
    assert.ok(symbolIdx > -1, 'symbol-popup-layer.js ausente no HTML');
    assert.ok(mapSafeIdx < symbolIdx && symbolIdx < runtimeIdx, 'symbol-popup-layer deve preceder centro-runtime.js');

    const symbol = read('centro/map/symbol-popup-layer.js');
    assert.doesNotThrow(() => new Function(symbol));
    assert.ok(symbol.includes('CENTRO.map.addSymbolPopupLayer'), 'export addSymbolPopupLayer ausente');
    assert.ok(symbol.includes('setDOMContent'), 'factory usa setDOMContent');
    assert.ok(!symbol.includes('innerHTML'), 'symbol-popup-layer sem innerHTML');
    assert.ok(!symbol.includes('.setHTML('), 'symbol-popup-layer sem setHTML');
    assert.ok(!symbol.includes('POI_TEXT_FONT'), 'factory nao conhece POI_TEXT_FONT');
    assert.ok(!symbol.includes('styleSupportsTextLabels'), 'factory nao conhece styleSupportsTextLabels');
    assert.ok(!symbol.includes('getMapIconHaloPaint'), 'factory nao conhece getMapIconHaloPaint');
    assert.ok(!symbol.includes('pistaItemFromProperties'), 'factory nao conhece pistaItemFromProperties');
    assert.ok(symbol.includes('getMapFn("ensureSource")'), 'factory delega ensureSource');

    const runtime = read('centro/centro-runtime.js');
    assert.strictEqual((runtime.match(/function addPOILayer/g) || []).length, 1, 'uma addPOILayer');
    assert.strictEqual((runtime.match(/function addPistasLayer/g) || []).length, 1, 'uma addPistasLayer');
    assert.ok(runtime.includes('getCentroMapHelper("addSymbolPopupLayer")'), 'wrappers delegam factory');
    assert.ok(!runtime.includes('bindLayerEventOnce(mapInstance, "click", iconLayerId'), 'click handler so na factory');

    const criticalIds = [
      'memoria-paulistana-source', 'memoria-paulistana-icon',
      'acervo-tombado-source', 'acervo-tombado-icon',
      'bem-arqueologico-source', 'bem-arqueologico-icon',
      'monumentos-source', 'monumentos-icon',
      'poi-turistico-source', 'poi-turistico-icon',
      'rsb-pistas-source', 'rsb-pistas-icon', 'rsb-pista-icon',
    ];
    criticalIds.forEach(function (id) {
      assert.ok(runtime.includes(id), id + ' ausente no runtime');
    });
    assert.ok(runtime.includes('labelLayerId: poiCfg.id + "-label"'), 'pattern label layer POI');
  });

  it('symbol-popup-layer.js: factory idempotente com mock map', async () => {
    const mapApi = loadSymbolPopupLayerModule();
    var ensureSourceCalls = 0;
    var ensureImageCalls = 0;
    var ensureLayerCalls = 0;
    var bindCalls = 0;
    var mockMap = {
      getCanvas: function () { return { style: {} }; },
    };
    mapApi.ensureSource = function () { ensureSourceCalls++; };
    mapApi.ensureImage = async function () { ensureImageCalls++; };
    mapApi.ensureLayer = function () { ensureLayerCalls++; };
    mapApi.bindLayerEventOnce = function () { bindCalls++; };

    var interactionIds = [];
    await mapApi.addSymbolPopupLayer(mockMap, {
      sourceId: 'test-source',
      iconLayerId: 'test-icon',
      source: { type: 'geojson', data: { type: 'FeatureCollection', features: [{ type: 'Feature' }] } },
      imageId: 'test-img',
      iconPath: '/icon.svg',
      iconLayout: { 'icon-image': 'test-img' },
      iconPaint: {},
      label: null,
      popup: {
        factoryKey: 'createPoiPopupNode',
        buildArgs: function () { return ['A', 'B']; },
      },
      interactionLayerIds: interactionIds,
      returnFeatureCount: true,
    });

    assert.strictEqual(ensureSourceCalls, 1);
    assert.strictEqual(ensureImageCalls, 1);
    assert.strictEqual(ensureLayerCalls, 1, 'sem label quando label null');
    assert.strictEqual(bindCalls, 3, 'click + mouseenter + mouseleave');
    assert.deepStrictEqual(interactionIds, ['test-icon']);

    ensureLayerCalls = 0;
    await mapApi.addSymbolPopupLayer(mockMap, {
      sourceId: 'test-source',
      iconLayerId: 'test-icon',
      source: { type: 'geojson', data: '/data.geojson' },
      imageId: 'test-img',
      iconPath: '/icon.svg',
      iconLayout: { 'icon-image': 'test-img' },
      iconPaint: {},
      label: {
        layerId: 'test-label',
        enabled: true,
        layout: { 'text-field': ['get', 'name'] },
        paint: {},
      },
      popup: {
        factoryKey: 'createPoiPopupNode',
        buildArgs: function () { return ['A', '']; },
      },
      interactionLayerIds: interactionIds,
    });
    assert.strictEqual(ensureLayerCalls, 2, 'icon + label quando label.enabled');
  });

  // ── MapLibre safe helpers ───────────────────────────────────────
  it('centro: map-safe.js carregado antes do runtime', () => {
    const html = read('centro/index.html');
    const runtimeIdx = html.indexOf('centro-runtime.js');
    const mapSafeIdx = html.indexOf('map/map-safe.js');
    const popupsIdx = html.indexOf('ui/map-popups.js');
    assert.ok(mapSafeIdx > -1, 'map/map-safe.js ausente no HTML');
    assert.ok(popupsIdx < mapSafeIdx && mapSafeIdx < runtimeIdx, 'map-safe.js deve preceder centro-runtime.js');

    const mapSafe = read('centro/map/map-safe.js');
    assert.doesNotThrow(() => new Function(mapSafe));
    assert.ok(mapSafe.includes('CENTRO.map.ensureSource'), 'export ensureSource ausente');
    assert.ok(mapSafe.includes('CENTRO.map.ensureLayer'), 'export ensureLayer ausente');
    assert.ok(mapSafe.includes('CENTRO.map.ensureImage'), 'export ensureImage ausente');
    assert.ok(mapSafe.includes('CENTRO.map.bindLayerEventOnce'), 'export bindLayerEventOnce ausente');
    assert.ok(mapSafe.includes('__centroPoiHandlers'), 'bindLayerEventOnce usa registry idempotente');

    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('getCentroMapHelper'), 'runtime delega via getCentroMapHelper');
    assert.ok(runtime.includes('ensureSource'), 'runtime referencia ensureSource');
    assert.ok(runtime.includes('ensureLayer'), 'runtime referencia ensureLayer');
    assert.ok(runtime.includes('ensureImage'), 'runtime referencia ensureImage');
    assert.ok(runtime.includes('bindLayerEventOnce'), 'runtime referencia bindLayerEventOnce');
    assert.ok(!runtime.includes('mapInstance.addSource'), 'addSource so no modulo map-safe');
    assert.ok(!runtime.includes('__centroPoiHandlers'), 'handler registry so no modulo map-safe');
    assert.ok(!runtime.includes('function isSvgUrl'), 'isSvgUrl so no modulo map-safe');
  });

  it('map-safe.js: helpers idempotentes com mock map', () => {
    const map = loadCentroMapSafe();
    var sources = { 'existing-source': true };
    var layers = { 'existing-layer': true };
    var addSourceCalls = 0;
    var addLayerCalls = 0;
    var mockMap = {
      getSource: function (id) { return sources[id] ? {} : null; },
      addSource: function (id) { sources[id] = true; addSourceCalls++; },
      getLayer: function (id) { return layers[id] ? {} : null; },
      addLayer: function (cfg) { layers[cfg.id] = true; addLayerCalls++; },
    };

    map.ensureSource(mockMap, 'existing-source', { type: 'geojson', data: {} });
    map.ensureSource(mockMap, 'existing-source', { type: 'geojson', data: {} });
    assert.strictEqual(addSourceCalls, 0, 'ensureSource nao duplica source existente');

    map.ensureSource(mockMap, 'new-source', { type: 'geojson', data: {} });
    map.ensureSource(mockMap, 'new-source', { type: 'geojson', data: {} });
    assert.strictEqual(addSourceCalls, 1, 'ensureSource adiciona source uma vez');

    map.ensureLayer(mockMap, { id: 'existing-layer', type: 'fill', source: 's' });
    map.ensureLayer(mockMap, { id: 'existing-layer', type: 'fill', source: 's' });
    assert.strictEqual(addLayerCalls, 0, 'ensureLayer nao duplica layer existente');

    map.ensureLayer(mockMap, { id: 'new-layer', type: 'fill', source: 's' });
    map.ensureLayer(mockMap, { id: 'new-layer', type: 'fill', source: 's' });
    assert.strictEqual(addLayerCalls, 1, 'ensureLayer adiciona layer uma vez');

    var onCalls = 0;
    var eventMap = {
      __centroPoiHandlers: {},
      on: function () { onCalls++; },
    };
    var handler = function () {};
    map.bindLayerEventOnce(eventMap, 'click', 'poi-layer', handler);
    map.bindLayerEventOnce(eventMap, 'click', 'poi-layer', handler);
    assert.strictEqual(onCalls, 1, 'bindLayerEventOnce nao registra handler duplicado');
  });

  // ── Click handler escopado e debug-gated ────────────────────────
  it('centro-runtime.js: click inspector e debug-gated e queryRenderedFeatures e escopado', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('DEBUG_INSPECTOR'), 'flag DEBUG_INSPECTOR ausente');
    assert.ok(runtime.includes('if (DEBUG_INSPECTOR)'), 'inspector deve ser gated pelo flag');
    assert.ok(/queryRenderedFeatures\s*\(\s*e\.point\s*,\s*queryOpts\s*\)/.test(runtime) || /queryRenderedFeatures\s*\(\s*e\.point\s*,\s*\{\s*layers/.test(runtime), 'queryRenderedFeatures deve passar layers');
    assert.ok(runtime.includes('poiInteractionLayerIds'), 'lista de layers POI para escopar a query ausente');
  });

  // ── Integridade catálogo (layers.json ↔ groups.json ↔ disco) ───
  it('catalogo: cada layer aponta para geojson existente e grupo valido', () => {
    const catalog = JSON.parse(read('centro/data/catalog/layers.json'));
    const groups = JSON.parse(read('centro/data/catalog/groups.json'));
    const layers = catalog.layers || [];
    const groupIds = new Set(groups.map(function (g) { return g.id; }));
    const layerIds = new Set();

    for (var i = 0; i < layers.length; i++) {
      var ly = layers[i];
      assert.ok(ly.id, 'layer sem id');
      assert.ok(!layerIds.has(ly.id), 'id duplicado: ' + ly.id);
      layerIds.add(ly.id);
      assert.ok(ly.file, ly.id + ' sem campo file');
      assert.ok(
        exists('centro/' + ly.file),
        ly.id + ' aponta para arquivo inexistente: ' + ly.file
      );
      assert.ok(groupIds.has(ly.group), ly.id + ' referencia grupo ausente: ' + ly.group);
    }

    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var listed = group.layers || [];
      for (var j = 0; j < listed.length; j++) {
        assert.ok(layerIds.has(listed[j]), 'groups.json lista layer ausente de layers.json: ' + listed[j]);
      }
      var inGroup = layers.filter(function (l) { return l.group === group.id; }).map(function (l) { return l.id; });
      assert.deepStrictEqual(
        listed.slice().sort(),
        inGroup.slice().sort(),
        'groups.json layers[] diverge de layers.json para grupo ' + group.id
      );
    }
  });

  // ── Catalog cache ───────────────────────────────────────────────
  it('centro-runtime.js: catalogo carregado uma unica vez e indexado por id', () => {
    const runtime = read('centro/centro-runtime.js');
    const load = read('centro/features/catalog-load.js');
    assert.ok(runtime.includes('function loadCatalog'), 'loadCatalog ausente');
    assert.ok(runtime.includes('catalogIndex'), 'catalogIndex ausente no runtime');
    assert.ok(runtime.includes('CENTRO.catalogLoad'), 'runtime deve delegar a catalog-load');
    assert.ok(load.includes('new Map()'), 'indice deve usar Map nativo em catalog-load');
    assert.ok(!/\bsetInterval\s*\(/.test(runtime), 'wiring deve ser direto, sem chamada setInterval');
    assert.ok(!runtime.includes('bindLayerCheckboxesWhenReady'), 'polling antigo deve estar removido');
    assert.ok(runtime.includes('mapReadyPromise'), 'mapReadyPromise gating de addLayer/removeLayer ausente');
  });

  // ── map.loadImage canonico para raster, Image() para SVG ────────
  it('map-safe.js: ensureImage roteia SVG via Image() e raster via map.loadImage', () => {
    const mapSafe = read('centro/map/map-safe.js');
    assert.ok(mapSafe.includes('mapInstance.loadImage'), 'deve usar map.loadImage para raster');
    assert.ok(mapSafe.includes('response.data'), 'deve usar response.data do loadImage');
    assert.ok(mapSafe.includes('isSvgUrl'), 'detector de SVG ausente');
    assert.ok(mapSafe.includes('loadHtmlImage'), 'fallback Image() ausente');
    assert.ok(/!isSvgUrl\([^)]+\)\s*&&/.test(mapSafe), 'SVG deve evitar createImageBitmap pipeline');
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('getCentroMapHelper("ensureImage")'), 'runtime delega ensureImage');
  });

  // ── MapOptions PT-BR e attribution compacto ─────────────────────
  it('centro-runtime.js: MapOptions com locale PT-BR e attributionControl compacto', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('MAPLIBRE_LOCALE_PT_BR'), 'tabela locale PT-BR ausente');
    assert.ok(runtime.includes('NavigationControl.ZoomIn'), 'chaves de locale ausentes');
    assert.ok(runtime.includes('Aproximar zoom'), 'traducao PT-BR ausente');
    assert.ok(/attributionControl:\s*\{\s*compact:\s*true\s*\}/.test(runtime), 'attributionControl compact ausente');
    assert.ok(runtime.includes('locale: MAPLIBRE_LOCALE_PT_BR'), 'locale nao passado ao Map');
  });

  // ── Contraste WCAG labels POI ───────────────────────────────────
  it('centro-runtime.js: labels POI usam texto escuro com halo branco', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('"text-color": "#1a1a1a"'), 'texto escuro ausente');
    assert.ok(runtime.includes('"text-halo-color": "#ffffff"'), 'halo branco ausente');
    assert.ok(/"text-halo-width":\s*1\.5/.test(runtime), 'halo width 1.5');
    assert.ok(!/"text-color":\s*"#fff"/.test(runtime), 'nao deve manter branco antigo');
  });

  // ── Maquete 3D (fill-extrusion OpenFreeMap) ─────────────────────
  it('centro/index.html deve expor toggle de maquete 3D na sidebar', () => {
    const html = read('centro/index.html');
    const runtime = read('centro/centro-runtime.js');
    assert.ok(html.includes('centro-buildings-3d-toggle'), 'checkbox 3D ausente no HTML');
    assert.ok(html.includes('Maquete estrutural 3D'), 'label da maquete 3D ausente');
    assert.ok(html.includes('sidebar-extras'), 'container sidebar-extras ausente');
    assert.ok(html.includes('buildings-legend'), 'legenda de faixas de altura ausente');
    assert.ok(runtime.includes('BUILDINGS_3D_LAYER_ID'), 'constante da layer 3D ausente');
    assert.ok(runtime.includes('setBuildings3DEnabled'), 'handler setBuildings3DEnabled ausente');
    assert.ok(runtime.includes('CENTRO.buildings3D'), 'runtime deve delegar 3D a buildings-3d.js');
    const b3d = read('centro/features/buildings-3d.js');
    assert.ok(b3d.includes('getBuildings3DExtrusionPaint'), 'modulo 3D deve aplicar paint do theme');
    assert.ok(html.includes('buildings-3d.js'), 'index deve carregar buildings-3d.js');
  });

  it('centro: visão subterrânea usa Three.js vendorizado em custom layer', () => {
    const html = read('centro/index.html');
    const runtime = read('centro/centro-runtime.js');
    const feature = read('centro/features/subterranean-cutaway.js');
    const css = read('centro/styles/subterranean-cutaway.css');
    const gates = JSON.parse(read('centro/data/catalog/phase-gates.json'));
    const pkg = JSON.parse(read('package.json'));

    assert.ok(html.includes('centro-subterranean-toggle'), 'toggle subterrâneo ausente');
    assert.ok(html.includes('subterranean-cutaway.css'), 'CSS subterrâneo ausente');
    assert.ok(html.includes('subterranean-cutaway.js'), 'feature subterrânea ausente');
    assert.ok(html.includes('type="module" src="/pages/centro/features/subterranean-cutaway.js"'), 'feature Three deve carregar como module');
    assert.ok(runtime.includes('CENTRO.subterraneanCutaway'), 'runtime deve delegar visão subterrânea');
    assert.ok(runtime.includes('centro:subterranean-ready'), 'runtime deve tolerar carregamento module');
    assert.ok(feature.includes('type: "custom"'), 'deve usar custom layer MapLibre');
    assert.ok(feature.includes('import * as THREE'), 'feature deve importar Three.js');
    assert.ok(feature.includes('/vendor/three/three.module.min.js'), 'Three deve vir de vendor local');
    assert.ok(feature.includes('new THREE.Scene'), 'scene Three ausente');
    assert.ok(feature.includes('new THREE.WebGLRenderer'), 'renderer Three ausente');
    assert.ok(feature.includes('new THREE.Raycaster'), 'Raycaster Three ausente');
    assert.ok(feature.includes('agua-calada'), 'gate agua-calada ausente');
    assert.ok(feature.includes('aresta-fria'), 'gate aresta-fria ausente');
    assert.ok(feature.includes('peso-fundacao'), 'gate peso-fundacao ausente');
    assert.ok(pkg.dependencies && pkg.dependencies.three, 'three dependency ausente');
    assert.ok(pkg.scripts && pkg.scripts['sync:three'], 'sync:three ausente');
    assert.ok(exists('scripts/sync-three.mjs'), 'sync-three.mjs ausente');
    assert.ok(exists('vendor/three/three.module.min.js'), 'three.module.min.js vendorizado ausente');
    assert.ok(exists('vendor/three/three.core.min.js'), 'three.core.min.js vendorizado ausente (dep de three.module.min.js)');
    assert.strictEqual(gates.phaseTitles['7'], 'Rasgue o Asfalto');
    assert.ok(css.includes('subterranean-active'), 'estado visual subterrâneo ausente');
  });

  it('theme.js expoe helpers de fill-extrusion para buildings3D', () => {
    const theme = read('vendor/app/config/theme.js');
    assert.ok(theme.includes('getBuildings3DExtrusionColorExpression'), 'expressao de cor ausente');
    assert.ok(theme.includes('getBuildings3DExtrusionPaint'), 'paint extrusion ausente');
    assert.ok(theme.includes('getBuildings3DFilter'), 'filtro hide_3d ausente');
    assert.ok(theme.includes('heightBands'), 'heightBands preservado');
  });

  // ── Test harness CDN removidos ──────────────────────────────────
  it('test-map.html e test-centro-like.html (raiz) nao devem existir (CDN)', () => {
    assert.ok(!exists('test-map.html'), 'test-map.html (CDN) ainda presente');
    assert.ok(!exists('test-centro-like.html'), 'test-centro-like.html (CDN) ainda presente');
  });

  // ── MapLibre v5 + sync-maplibre.mjs ─────────────────────────────
  it('package.json declara maplibre-gl ^5 e sync script', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.ok(pkg.dependencies && pkg.dependencies['maplibre-gl'], 'maplibre-gl ausente');
    assert.match(pkg.dependencies['maplibre-gl'], /^\^5\./, 'maplibre-gl deve estar em ^5.x');
    assert.ok(pkg.scripts && pkg.scripts['sync:maplibre'], 'script sync:maplibre ausente');
    assert.ok(pkg.scripts.postinstall && pkg.scripts.postinstall.includes('sync-maplibre'), 'postinstall maplibre sync ausente');
    assert.ok(pkg.scripts.postinstall && pkg.scripts.postinstall.includes('sync-three'), 'postinstall three sync ausente');
    assert.ok(exists('scripts/sync-maplibre.mjs'), 'sync-maplibre.mjs ausente');
    assert.ok(exists('scripts/sync-three.mjs'), 'sync-three.mjs ausente');
    const sync = read('scripts/sync-maplibre.mjs');
    assert.ok(sync.includes('vendor/maplibre'), 'sync deve mirar vendor/maplibre');
    assert.ok(sync.includes('node_modules/maplibre-gl/dist'), 'sync deve copiar de node_modules');
  });

  // ── Migra\u00e7\u00e3o para OpenFreeMap ─────────────────────────────────
  it('runtime aponta para OpenFreeMap como basemap (vector tiles gratuitos)', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('BASEMAP_STYLE'), 'constante BASEMAP_STYLE ausente');
    assert.ok(
      runtime.includes('tiles.openfreemap.org/styles/'),
      'runtime deve apontar para OpenFreeMap'
    );
    assert.ok(!runtime.includes('"/osm-style.json"'), 'runtime nao deve usar osm-style.json local');
    assert.ok(
      runtime.includes('POI_TEXT_FONT'),
      'POI_TEXT_FONT centralizado para casar com fontstack do basemap'
    );
    assert.ok(
      runtime.includes('Noto Sans Regular'),
      'POI labels devem usar Noto Sans (default OpenFreeMap)'
    );
  });

  it('artefatos do bake offline antigo foram removidos', () => {
    assert.ok(!exists('osm-style.json'), 'osm-style.json removido');
    assert.ok(!exists('centro/assets/tiles'), 'diret\u00f3rio de tiles removido');
    assert.ok(!exists('vendor/maplibre/fonts'), 'cache de glyphs removido');
    assert.ok(!exists('scripts/bake-centro-tiles.mjs'), 'bake script removido');
    assert.ok(!exists('test-simples.html'), 'harness test-simples removido');
  });

  // ── MapLibre agent fixes (hash, layering, fallback, healthcheck) ─
  it('centro-runtime.js valida hash/view contra maxBounds no load', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('clampViewToCentroBounds'), 'clampViewToCentroBounds ausente');
    assert.ok(runtime.includes('LngLatBounds.convert(CENTRO_MAX_BOUNDS)'), 'validacao de bounds ausente');
    assert.ok(runtime.includes('clampViewToCentroBounds(map)'), 'clamp deve rodar no load');
  });

  it('centro-runtime.js insere camadas do catalogo abaixo dos POIs (beforeId)', () => {
    const runtime = read('centro/centro-runtime.js');
    const mapSafe = read('centro/map/map-safe.js');
    assert.ok(runtime.includes('getCatalogInsertBeforeId'), 'getCatalogInsertBeforeId ausente');
    assert.ok(mapSafe.includes('addLayer(layerConfig, beforeId)'), 'ensureLayer deve aceitar beforeId');
    assert.ok(runtime.includes('getCatalogInsertBeforeId()'), 'addLayerToMap deve usar beforeId');
  });

  it('centro-runtime.js fallback de icone POI e por categoria, nao unico', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('POI_FALLBACK_ICON_BY_ID'), 'mapa de fallback ausente');
    assert.ok(runtime.includes('resolvePatrimonioIconPath'), 'helper resolvePatrimonioIconPath ausente');
    assert.ok(runtime.includes('icon-arqueologia.svg'), 'fallback arqueologia ausente');
    assert.ok(runtime.includes('icon-monumentos.svg'), 'fallback monumentos ausente');
  });

  it('healthcheck CLI ESM substitui centro-healthcheck.js obsoleto', () => {
    assert.ok(!exists('centro/centro-healthcheck.js'), 'healthcheck CJS legado deve estar removido');
    assert.ok(exists('scripts/centro-healthcheck.mjs'), 'scripts/centro-healthcheck.mjs ausente');
    const pkg = JSON.parse(read('package.json'));
    assert.ok(pkg.scripts && pkg.scripts['healthcheck:centro'], 'npm run healthcheck:centro ausente');
  });

  it('POI turistico wired no runtime e map-icons', () => {
    const runtime = read('centro/centro-runtime.js');
    const icons = read('vendor/app/config/map-icons.js');
    const poiIcons = read('centro/features/poi-icons.js');
    assert.ok(runtime.includes('poi-turistico'), 'runtime deve carregar POI turistico');
    assert.ok(runtime.includes('centro_pois_turisticos__point'), 'geojson turistico ausente');
    assert.ok(icons.includes('"poi-turistico"'), 'map-icons patrimonio turistico ausente');
    assert.ok(icons.includes('icon-turismo'), 'icone turismo ausente no registry');
    assert.ok(poiIcons.includes('poi-turistico-source'), 'poi-icons source turistico ausente');
    assert.ok(exists('centro/data/context/centro_pois_turisticos__point.geojson'), 'geojson turistico ausente');
  });

  it('ponte transmidia: caderno localStorage e layer-unlocks no centro', () => {
    const runtime = read('centro/centro-runtime.js');
    const arquivo = read('arquivo-morto/js/arquivo-morto.js');
    assert.ok(runtime.includes('protocolo13_caderno_clues'), 'chave caderno ausente no centro');
    assert.ok(runtime.includes('layer-unlocks.json'), 'fetch layer-unlocks ausente');
    assert.ok(runtime.includes('isLayerUnlocked'), 'isLayerUnlocked ausente');
    const lockStateMod = read('centro/features/sidebar-layer-state.js');
    assert.ok(
      lockStateMod.includes('layer-row--locked'),
      'UI locked ausente em sidebar-layer-state'
    );
    assert.ok(runtime.includes('resolveSidebarLockState'), 'runtime usa lock state module');
    assert.ok(arquivo.includes('protocolo13_caderno_clues'), 'persistencia caderno ausente no arquivo-morto');
    assert.ok(exists('centro/data/catalog/layer-unlocks.json'), 'layer-unlocks.json ausente');
  });

  it('sync-lucide-icons valida paridade manifest vs map-icons', () => {
    const sync = read('scripts/sync-lucide-icons.mjs');
    assert.ok(sync.includes('validateManifestRegistryParity'), 'validacao de paridade ausente');
    assert.ok(sync.includes('MAP_ICONS_PATH'), 'map-icons.js deve ser lido pelo sync');
  });

  // ── Backlog AGENT implementado (2026-05) ────────────────────────
  it('centro: modulos features catalog-load, layer-unlocks, protocolo-phase', () => {
    assert.ok(exists('centro/features/catalog-load.js'), 'catalog-load.js ausente');
    assert.ok(exists('centro/features/layer-unlocks.js'), 'layer-unlocks.js ausente');
    assert.ok(exists('centro/features/protocolo-phase.js'), 'protocolo-phase.js ausente');
    const html = read('centro/index.html');
    assert.ok(html.includes('catalog-load.js'), 'index deve carregar catalog-load');
    assert.ok(html.includes('layer-unlocks.js'), 'index deve carregar layer-unlocks');
    const load = read('centro/features/catalog-load.js');
    assert.ok(load.includes('context-wired.json'), 'catalog-load deve ler context-wired');
  });

  it('04a_zeis2: geojson no viewport e wired em layers/groups', () => {
    const z2 = JSON.parse(read('centro/data/processed/04a_zeis2__polygon.geojson'));
    assert.ok(z2.features && z2.features.length > 0, 'zeis2 deve ter features no viewport');
    const layers = JSON.parse(read('centro/data/catalog/layers.json'));
    const groups = JSON.parse(read('centro/data/catalog/groups.json'));
    assert.ok(layers.layers.some((l) => l.id === '04a_zeis2__polygon'), 'zeis2 em layers.json');
    const zg = groups.find((g) => g.id === '03_zoneamento');
    assert.ok(zg && zg.layers.includes('04a_zeis2__polygon'), 'zeis2 em groups 03_zoneamento');
    assert.ok(exists('scripts/sync-geojson-from-salto.py'), 'script sync salto ausente');
  });

  it('centro: phase-gates, modulos 3D/POI e gates na sidebar', () => {
    assert.ok(exists('centro/data/catalog/phase-gates.json'), 'phase-gates.json ausente');
    const gates = JSON.parse(read('centro/data/catalog/phase-gates.json'));
    assert.ok(gates.layerMinPhase && Object.keys(gates.layerMinPhase).length > 0, 'layerMinPhase vazio');
    const html = read('centro/index.html');
    assert.ok(html.includes('poi-theme-filter.js'), 'index deve carregar poi-theme-filter.js');
    assert.ok(html.includes('centro-phase-badge'), 'badge de fase no centro ausente');
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('isLayerPhaseUnlocked'), 'gate de fase ausente no runtime');
    const lockStateMod = read('centro/features/sidebar-layer-state.js');
    assert.ok(
      lockStateMod.includes('layer-row--phase-locked'),
      'UI phase-locked ausente em sidebar-layer-state'
    );
    assert.ok(runtime.includes('getLayerRowClass') || runtime.includes('resolveSidebarLockState'), 'runtime delega row class lock');
    const phase = read('centro/features/protocolo-phase.js');
    assert.ok(phase.includes('phase-gates.json'), 'protocolo-phase deve carregar gates');
    assert.ok(phase.includes('isLayerPhaseUnlocked'), 'API isLayerPhaseUnlocked ausente');
  });

  it('WCAG: contraste aviso digital e nav terminal', () => {
    const popups = read('centro/styles/map-popups.css');
    assert.match(
      popups,
      /\.as-digital-aviso\s*\{[^}]*color:\s*#9ca3af/,
      'aviso digital deve usar cor com contraste melhor'
    );
    const components = read('vendor/app/styles/components.css');
    assert.match(
      components,
      /\.nav-retorno\[data-theme="terminal"\][^}]*--nav-retorno-link:\s*rgba\(0,\s*255,\s*0,\s*0\.82\)/,
      'link terminal deve usar opacidade >= 0.82'
    );
  });

  it('arquivista: open-application.js extraido do script principal', () => {
    assert.ok(exists('arquivista/js/open-application.js'), 'open-application.js ausente');
    const html = read('arquivista/index.html');
    assert.ok(html.includes('open-application.js'), 'index deve carregar open-application.js');
    const script = read('arquivista/js/script.js');
    assert.ok(script.includes('openArquivistaApplication'), 'script deve delegar openApplication');
  });

  it('context-wired.json lista 14 camadas com ficheiro no disco', () => {
    const wired = JSON.parse(read('centro/data/catalog/context-wired.json'));
    assert.strictEqual(wired.layerIds.length, 14);
    assert.ok(wired.layerIds.includes('15_osm_ruas__line'), 'OSM ruas wired');
    assert.ok(wired.layerIds.includes('15_osm_enderecos__point'), 'OSM enderecos wired');
    for (const id of wired.layerIds) {
      const ctx = JSON.parse(read('centro/data/catalog/context-layers.json'));
      const ly = ctx.layers.find((l) => l.id === id);
      assert.ok(ly && ly.file, 'layer ' + id + ' sem file em context-layers');
      assert.ok(exists('centro/' + ly.file), ly.file + ' ausente no disco');
    }
  });

  it('centro-runtime wired triangulo historico no map load', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('addTrianguloHistoricoOverlay'), 'overlay triangulo ausente');
    assert.ok(runtime.includes('CENTRO.catalogLoad'), 'deve delegar catalogo a catalog-load');
  });

  it('arquivista: tpl-geoscanner removido e skip-link presente', () => {
    const html = read('arquivista/index.html');
    assert.ok(!html.includes('tpl-geoscanner'), 'template geoscanner morto deve estar removido');
    assert.ok(html.includes('skip-link'), 'skip-link ausente');
    assert.ok(html.includes('href="#desktop"'), 'skip-link deve apontar ao desktop');
  });

  it('arquivista geoscanner redirecciona com deep-link clues quando houver caderno', () => {
    const js = read('arquivista/js/open-application.js');
    assert.ok(js.includes('case "geoscanner"') || js.includes("case 'geoscanner'"), 'handler geoscanner ausente');
    assert.ok(js.includes('protocolo13_caderno_clues'), 'deve ler caderno para query clues');
    assert.ok(js.includes('?clues='), 'deve montar query clues no redirect');
  });

  it('landing: assets usam /landing/assets/ (nao pages/centro/assets)', () => {
    const html = read('landing/index.html');
    const js = read('landing/landing.js');
    assert.ok(html.includes('/landing/assets/'), 'landing HTML deve usar /landing/assets/');
    assert.ok(!html.includes('/pages/centro/assets/'), 'nao deve referenciar path legado no HTML');
    assert.ok(js.includes('/landing/assets/'), 'landing.js deve usar /landing/assets/');
    assert.ok(exists('landing/assets/README.md'), 'README de assets da landing ausente');
  });

  it('server.py: alias legado pages/centro/assets para landing/assets', () => {
    const py = read('server.py');
    assert.ok(py.includes('/pages/centro/assets/'), 'proxy deve tratar assets legados');
    assert.ok(py.includes("landing', 'assets'"), 'destino deve ser landing/assets');
  });

  it('landing: fase ARG protocolo13_phase e copy honesta', () => {
    const js = read('landing/landing.js');
    const html = read('landing/index.html');
    assert.ok(js.includes('protocolo13_phase'), 'init fase ausente');
    assert.ok(html.includes('protocolo-phase-badge'), 'badge de fase ausente');
    assert.ok(html.includes('fase 1 activa'), 'copy deve indicar fase 1 activa');
  });

  // ── Popup CSS classes ───────────────────────────────────────────
  it('map-popups.css contem classes para poi-popup e pista-popup', () => {
    const css = read('centro/styles/map-popups.css');
    assert.ok(css.includes('.poi-popup'), '.poi-popup ausente');
    assert.ok(css.includes('.pista-popup'), '.pista-popup ausente');
    assert.ok(css.includes('.pista-popup__title'), '.pista-popup__title ausente');
    assert.ok(css.includes('.pista-popup__desc'), '.pista-popup__desc ausente');
    assert.ok(css.includes('.pista-popup__img'), '.pista-popup__img ausente');
    assert.ok(css.includes('.pista-popup__source'), '.pista-popup__source ausente');
  });
});
