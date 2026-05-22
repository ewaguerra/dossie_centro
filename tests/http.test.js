import { describe, it, after, before } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = 9876;
const BASE = `http://127.0.0.1:${PORT}`;

let server = null;

function fetchPath(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject).end();
  });
}

function waitForServer(maxMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > maxMs) return reject(new Error('Timeout'));
      fetchPath('/').then(() => resolve()).catch(() => setTimeout(check, 200));
    }
    check();
  });
}

describe('projeto_centro — HTTP integration', () => {
  before(async () => {
    server = spawn('python3', [join(ROOT, 'server.py'), String(PORT)], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await waitForServer();
  });

  after(() => {
    if (server) {
      server.kill();
      server = null;
    }
  });

  it('deve responder 200 em /centro/index.html', async () => {
    const res = await fetchPath('/centro/index.html');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('/pages/centro/centro-runtime.js'), 'HTML deve carregar runtime externo do Centro');
    assert.ok(!/lucide/i.test(res.body), 'HTML nao deve referenciar Lucide');
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });

  it('runtime deve referenciar basemap OpenFreeMap (sem osm-style.json local)', async () => {
    const res = await fetchPath('/pages/centro/centro-runtime.js');
    assert.strictEqual(res.status, 200);
    assert.ok(
      res.body.includes('tiles.openfreemap.org/styles/'),
      'runtime deve apontar para OpenFreeMap'
    );
    assert.ok(!res.body.includes('/osm-style.json'), 'runtime nao deve referenciar osm-style.json');
  });

  it('osm-style.json, tiles e glyphs locais foram removidos com a migra\u00e7\u00e3o para OpenFreeMap', async () => {
    const styleRes = await fetchPath('/osm-style.json');
    assert.notStrictEqual(styleRes.status, 200, 'osm-style.json nao deve existir');
    const tileRes = await fetchPath('/centro/assets/tiles/14/6067/9301.png');
    assert.notStrictEqual(tileRes.status, 200, 'tiles locais nao devem existir');
    const glyphRes = await fetchPath('/vendor/maplibre/fonts/Open%20Sans%20Regular/0-255.pbf');
    assert.notStrictEqual(glyphRes.status, 200, 'glyphs locais nao devem existir');
  });

  it('deve responder 200 em /vendor/maplibre/maplibre-gl.js', async () => {
    const res = await fetchPath('/vendor/maplibre/maplibre-gl.js');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('maplibregl'), 'JS deve conter maplibregl');
    assert.strictEqual(res.headers['cache-control'], 'public, max-age=31536000, immutable');
  });

  it('deve responder 200 em /pages/centro/centro-runtime.js (proxy route)', async () => {
    const res = await fetchPath('/pages/centro/centro-runtime.js');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('function bootstrap'), 'runtime deve conter bootstrap');
    assert.ok(res.body.includes('function initMap'), 'runtime deve conter initMap');
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });

  it('deve responder 200 em /app/styles/a11y.css', async () => {
    const res = await fetchPath('/app/styles/a11y.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('var(--color-accent)'), 'a11y deve usar token accent');
    assert.ok(res.body.includes('prefers-reduced-motion'), 'a11y deve ter reduced-motion');
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });

  it('deve responder 200 em /app/styles/tokens.css', async () => {
    const res = await fetchPath('/app/styles/tokens.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('--color-brand'), 'tokens deve conter --color-brand');
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });

  it('deve responder 200 em /pages/centro/styles/centro-chrome.css', async () => {
    const res = await fetchPath('/pages/centro/styles/centro-chrome.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('.hamburger-nav'), 'chrome css deve conter hamburger');
  });

  it('deve responder 200 em /pages/centro/styles/narrative-nav.css', async () => {
    const res = await fetchPath('/pages/centro/styles/narrative-nav.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('.narrative-nav'), 'narrative-nav css deve existir');
  });

  it('deve responder 200 em modulos CSS do centro', async () => {
    const modules = [
      'layout.css',
      'sidebar.css',
      'feature-inspector.css',
      'profile-card.css',
      'jesuit-frame.css',
      'map-popups.css',
      'responsive.css',
    ];
    for (const file of modules) {
      const res = await fetchPath(`/pages/centro/styles/${file}`);
      assert.strictEqual(res.status, 200, `${file} deve responder 200`);
    }
    const layout = await fetchPath('/pages/centro/styles/layout.css');
    assert.ok(layout.body.includes('#map'), 'layout.css deve conter #map');
  });

  it('deve responder 200 em /centro/data/catalog/layers.json', async () => {
    const res = await fetchPath('/centro/data/catalog/layers.json');
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.ok(data.layers && data.layers.length > 0, 'Catalog deve conter layers');
  });

  it('deve responder 200 em /centro/data/catalog/groups.json', async () => {
    const res = await fetchPath('/centro/data/catalog/groups.json');
    assert.strictEqual(res.status, 200);
    const groups = JSON.parse(res.body);
    assert.ok(Array.isArray(groups) && groups.length > 0, 'Groups deve conter grupos');
  });

  it('deve responder 200 em /pages/centro/centro-sidebar.css (proxy route)', async () => {
    const res = await fetchPath('/pages/centro/centro-sidebar.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes("@import url('styles/layout.css')"), 'agregador deve importar layout');
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });

  it('deve responder 200 em pistas JSON + imagens', async () => {
    const res1 = await fetchPath('/centro/assets/pistas/rua-sao-bento-pistas.json');
    assert.strictEqual(res1.status, 200);
    const items = JSON.parse(res1.body);
    assert.ok(Array.isArray(items) && items.length === 4, 'Deve ter 4 pistas');

    const res2 = await fetchPath('/centro/assets/pistas/rua-sao-bento-1862.jpg');
    assert.strictEqual(res2.status, 200);
  });

  it('deve responder 200 via proxy /app/config/theme.js', async () => {
    const res = await fetchPath('/app/config/theme.js');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('MAPA_SP_THEME'), 'theme.js deve conter MAPA_SP_THEME');
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });

  it('headers de cache: somente /vendor/ recebe immutable; assets do projeto sao no-cache', async () => {
    const vendor = await fetchPath('/vendor/maplibre/maplibre-gl.js');
    assert.strictEqual(vendor.status, 200);
    assert.match(
      vendor.headers['cache-control'] || '',
      /immutable/,
      'vendor third-party precisa ser immutable'
    );

    const projectPaths = [
      '/centro/index.html',
      '/pages/centro/centro-runtime.js',
      '/app/styles/tokens.css',
      '/centro/data/catalog/layers.json',
      '/centro/assets/icons/icon-memoria.svg',
    ];
    for (const path of projectPaths) {
      const res = await fetchPath(path);
      const cc = res.headers['cache-control'] || '';
      assert.ok(
        !cc.includes('immutable'),
        `${path} NUNCA pode ser immutable (cache imortal causou o bug "Access blocked")`
      );
      assert.match(
        cc,
        /no-cache/,
        `${path} precisa revalidar a cada request (no-cache)`
      );
    }
  });

  it('deve responder 200 em cada geojson referenciado pelo catalogo layers.json', async () => {
    const res = await fetchPath('/centro/data/catalog/layers.json');
    assert.strictEqual(res.status, 200);
    const catalog = JSON.parse(res.body);
    const layers = catalog.layers || [];

    for (const ly of layers) {
      assert.ok(ly.file, ly.id + ' sem campo file');
      const geoPath = '/centro/' + ly.file.replace(/^\//, '');
      const geo = await fetchPath(geoPath);
      assert.strictEqual(geo.status, 200, geoPath + ' (layer ' + ly.id + ') deve retornar 200');
    }
  });

  it('deve responder 200 em geojson e icones SVG dos POIs', async () => {
    const paths = [
      '/centro/data/context/centro_memoria_paulistana__point.geojson',
      '/centro/data/context/centro_acervo_tombado__point.geojson',
      '/centro/data/context/centro_bem_arqueologico__point.geojson',
      '/centro/data/context/centro_monumentos__point.geojson',
      '/centro/assets/icons/icon-memoria.svg',
      '/centro/assets/icons/icon-acervo.svg',
      '/centro/assets/icons/icon-arqueologia.svg',
      '/centro/assets/icons/icon-monumentos.svg',
      '/centro/assets/icons/icon-pista.svg',
      '/centro/assets/icons/icon-droplets.svg',
    ];

    for (const path of paths) {
      const res = await fetchPath(path);
      assert.strictEqual(res.status, 200, path + ' deve retornar 200');
    }
  });
});
