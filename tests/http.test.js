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
    assert.strictEqual(res.headers['cache-control'], 'no-cache');
  });

  it('deve responder 200 em /osm-style.json', async () => {
    const res = await fetchPath('/osm-style.json');
    assert.strictEqual(res.status, 200);
    const style = JSON.parse(res.body);
    assert.ok(style.sources && style.sources.osm, 'Style deve conter source osm');
    assert.ok(style.glyphs, 'Style deve conter glyphs para labels POI');
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
    assert.strictEqual(res.headers['cache-control'], 'public, max-age=3600');
  });

  it('deve responder 200 em /app/styles/a11y.css', async () => {
    const res = await fetchPath('/app/styles/a11y.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('var(--color-accent)'), 'a11y deve usar token accent');
    assert.ok(res.body.includes('prefers-reduced-motion'), 'a11y deve ter reduced-motion');
    assert.strictEqual(res.headers['cache-control'], 'public, max-age=3600');
  });

  it('deve responder 200 em /app/styles/tokens.css', async () => {
    const res = await fetchPath('/app/styles/tokens.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('--color-brand'), 'tokens deve conter --color-brand');
    assert.strictEqual(res.headers['cache-control'], 'public, max-age=3600');
  });

  it('deve responder 200 em /pages/centro/styles/centro-chrome.css', async () => {
    const res = await fetchPath('/pages/centro/styles/centro-chrome.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('.narrative-nav'), 'chrome css deve conter narrative-nav');
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
    assert.ok(res.body.includes('#map'), 'CSS deve conter regra #map');
    assert.strictEqual(res.headers['cache-control'], 'public, max-age=3600');
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
    assert.strictEqual(res.headers['cache-control'], 'public, max-age=3600');
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
    ];

    for (const path of paths) {
      const res = await fetchPath(path);
      assert.strictEqual(res.status, 200, path + ' deve retornar 200');
    }
  });
});
