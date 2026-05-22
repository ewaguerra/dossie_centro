import { describe, it } from 'node:test';
import assert from 'node:assert';
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
    assert.ok(runtime.includes('resolveLayerIcon'), 'resolveLayerIcon ausente');
    assert.ok(runtime.includes('addPointLayerWithIcon'), 'addPointLayerWithIcon ausente');
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
    assert.ok(runtime.includes('POI_THEME_STORAGE_KEY'), 'persistencia de filtro ausente');
    assert.ok(runtime.includes('setLayoutProperty'), 'toggle de visibilidade ausente');
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
      assert.ok(/\bdefer\b/.test(tag), 'cada script deve usar defer: ' + tag);
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
      'function setupLazyImageObserver',
      'function setupToast',
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
  it('centro/index.html deve conter lazy loading observer', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('loading", "lazy"') || runtime.includes('loading="lazy"'), 'loading=lazy ausente');
    assert.ok(runtime.includes('MutationObserver'), 'MutationObserver ausente');
  });

  // ── UX — Toast feedback ─────────────────────────────────────────
  it('centro/index.html deve conter centroToast', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('centroToast'), 'centroToast ausente');
    assert.ok(runtime.includes('centro-toast'), 'centro-toast element ausente');
    assert.ok(runtime.includes('toast is-hidden'), 'toast usa classe DS');
    assert.ok(runtime.includes('toast__close'), 'toast usa BEM close');
    assert.ok(!runtime.includes('toastEl.style.cssText'), 'toast sem style.cssText');
    assert.ok(!runtime.includes('toastEl.style.background'), 'toast sem cor inline');
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
  it('centro-runtime.js: popups POI e Pista nao usam setHTML com strings concatenadas', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('setDOMContent'), 'popups devem usar setDOMContent');
    assert.ok(runtime.includes('createPoiPopupNode'), 'POI popup builder DOM ausente');
    assert.ok(runtime.includes('createPistaPopupNode'), 'Pista popup builder DOM ausente');
    assert.ok(!/Popup\([^)]*\)[\s\S]{0,300}\.setHTML\(/.test(runtime), 'runtime nao deve usar setHTML em Popup');
    assert.ok(!/innerHTML\s*=\s*"<[a-z]/i.test(runtime) || runtime.includes('panel.innerHTML = ""'), 'runtime evita injecao via innerHTML literal');
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
    assert.ok(runtime.includes('function loadCatalog'), 'loadCatalog ausente');
    assert.ok(runtime.includes('catalogIndex'), 'catalogIndex (Map) ausente');
    assert.ok(runtime.includes('new Map()'), 'indice deve usar Map nativo');
    assert.ok(!/\bsetInterval\s*\(/.test(runtime), 'wiring deve ser direto, sem chamada setInterval');
    assert.ok(!runtime.includes('bindLayerCheckboxesWhenReady'), 'polling antigo deve estar removido');
    assert.ok(runtime.includes('mapReadyPromise'), 'mapReadyPromise gating de addLayer/removeLayer ausente');
  });

  // ── map.loadImage canonico para raster, Image() para SVG ────────
  it('centro-runtime.js: ensureImage roteia SVG via Image() e raster via map.loadImage', () => {
    const runtime = read('centro/centro-runtime.js');
    assert.ok(runtime.includes('mapInstance.loadImage'), 'deve usar map.loadImage para raster');
    assert.ok(runtime.includes('response.data'), 'deve usar response.data do loadImage');
    assert.ok(runtime.includes('isSvgUrl'), 'detector de SVG ausente');
    assert.ok(runtime.includes('loadHtmlImage'), 'fallback Image() ausente');
    assert.ok(/!isSvgUrl\([^)]+\)\s*&&/.test(runtime), 'SVG deve evitar createImageBitmap pipeline');
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
    assert.ok(runtime.includes('MAPA_SP_THEME'), 'runtime deve usar theme.js para paint 3D');
    assert.ok(runtime.includes('getBuildings3DExtrusionPaint'), 'runtime deve aplicar paint do theme');
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
    assert.ok(pkg.scripts.postinstall && pkg.scripts.postinstall.includes('sync-maplibre'), 'postinstall sync ausente');
    assert.ok(exists('scripts/sync-maplibre.mjs'), 'sync-maplibre.mjs ausente');
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
    assert.ok(runtime.includes('getCatalogInsertBeforeId'), 'getCatalogInsertBeforeId ausente');
    assert.ok(runtime.includes('addLayer(layerConfig, beforeId)'), 'ensureLayer deve aceitar beforeId');
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
