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
  it('centro-sidebar.css deve existir', () => {
    assert.ok(exists('centro/centro-sidebar.css'));
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
  });

  it('design system: sem Fira Code, Google Fonts nem texturas externas no runtime', () => {
    const runtimeCss = [
      'centro/centro-sidebar.css',
      'centro/styles/centro-chrome.css',
      'landing/landing.css',
      'arquivo-morto/css/arquivo-morto.css',
      'arquivista/css/utility.css',
      'arquivista/css/linux-desktop.css',
      'arquivista/css/window-system.css',
      'arquivista/css/effects.css',
      'vendor/app/styles/tokens.css',
      'vendor/app/styles/components.css',
    ];
    for (const file of runtimeCss) {
      const css = read(file);
      assert.ok(!/Fira Code|Fira\+Code|fonts\.googleapis/.test(css), `${file} sem Fira/CDN fontes`);
    }
    const centroCss = read('centro/centro-sidebar.css');
    assert.ok(/var\(--font-mono\)|var\(--font-code\)/.test(centroCss), 'centro usa tokens mono');
    assert.ok(!/transparenttextures|unsplash/.test(centroCss), 'centro sem CDN textura');
    assert.ok(exists('vendor/app/styles/tokens.css'), 'tokens.css existe');
    assert.ok(exists('vendor/app/styles/a11y.css'), 'a11y.css existe');
    assert.ok(exists('vendor/app/styles/components.css'), 'components.css existe');
  });

  it('centro-sidebar.css nao deve referenciar BANNER_SITE.png ausente', () => {
    const css = read('centro/centro-sidebar.css');
    assert.ok(!css.includes('BANNER_SITE.png'), 'nao deve referenciar PNG inexistente');
  });

  // ── Lucide removido — SVG inline na navegação ───────────────────
  it('centro nao deve carregar bundle Lucide', () => {
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
});
