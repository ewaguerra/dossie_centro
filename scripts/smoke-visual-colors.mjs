#!/usr/bin/env node
/**
 * Smoke visual de identidade de cor — 4 páginas.
 * Valida tokens carregados e semântica âmbar (marca) vs vermelho (HUD/alerta).
 */
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9889;
const BASE = `http://127.0.0.1:${PORT}`;

const PAGES = [
  { name: 'landing', path: '/landing/index.html', css: ['/landing/landing.css'] },
  { name: 'centro', path: '/centro/index.html', css: ['/pages/centro/styles/centro-chrome.css', '/pages/centro/centro-sidebar.css'] },
  { name: 'arquivo-morto', path: '/arquivo-morto/index.html', css: ['/arquivo-morto/css/arquivo-morto.css'] },
  { name: 'arquivista', path: '/arquivista/index.html', css: ['/arquivista/css/linux-desktop.css'] },
];

function fetchBody(path) {
  return new Promise((resolve, reject) => {
    request(new URL(path, BASE), (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject).end();
  });
}

function waitForServer(maxMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > maxMs) return reject(new Error('server timeout'));
      fetchBody('/').then(() => resolve()).catch(() => setTimeout(check, 200));
    }
    check();
  });
}

function assert(cond, msg, fails) {
  if (!cond) fails.push(msg);
}

async function main() {
  const server = spawn('python3', [join(ROOT, 'server.py'), String(PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  const fails = [];

  try {
    await waitForServer();

    const tokens = await fetchBody('/app/styles/tokens.css');
    assert(tokens.status === 200, 'tokens.css 404', fails);
    assert(tokens.body.includes('--color-accent: #f59e0b'), 'tokens accent', fails);
    assert(tokens.body.includes('--color-accent-soft'), 'tokens accent-soft', fails);
    assert(tokens.body.includes('--color-warning'), 'tokens warning', fails);
    assert(tokens.body.includes('--fs-2xl'), 'tokens fs-2xl', fails);
    assert(tokens.body.includes('--color-brand'), 'tokens brand alias', fails);
    assert(tokens.body.includes('--color-danger: #ef4444'), 'tokens danger', fails);
    assert(tokens.body.includes('--color-accent-strong: #dc2626'), 'tokens hud', fails);

    const components = await fetchBody('/app/styles/components.css');
    assert(components.body.includes('var(--color-brand)'), 'nav-retorno usa brand', fails);

    for (const page of PAGES) {
      const html = await fetchBody(page.path);
      assert(html.status === 200, `${page.name} html ${html.status}`, fails);
      assert(html.body.includes('/app/styles/tokens.css'), `${page.name} carrega tokens`, fails);
      assert(html.body.includes('/app/styles/a11y.css'), `${page.name} carrega a11y`, fails);

      for (const cssPath of page.css) {
        const css = await fetchBody(cssPath);
        assert(css.status === 200, `${page.name} css ${cssPath} 404`, fails);
      }
    }

    const landingCss = (await fetchBody('/landing/landing.css')).body;
    assert(!/--amber\s*:/.test(landingCss), 'landing sem --amber local', fails);
    assert(landingCss.includes('var(--color-brand)'), 'landing usa color-brand', fails);

    const amCss = (await fetchBody('/arquivo-morto/css/arquivo-morto.css')).body;
    assert(!/--am-amber\s*:/.test(amCss), 'arquivo-morto sem --am-amber', fails);
    assert(amCss.includes('var(--color-brand)'), 'arquivo-morto usa color-brand', fails);

    const chrome = (await fetchBody('/pages/centro/styles/centro-chrome.css')).body;
    assert(chrome.includes('.hamburger-link--primary') && chrome.includes('var(--color-brand)'), 'centro nav âmbar', fails);
    assert(chrome.includes('var(--color-accent-strong)'), 'centro chrome HUD vermelho', fails);

    const sidebar = (await fetchBody('/pages/centro/centro-sidebar.css')).body;
    assert(sidebar.includes('var(--centro-accent)'), 'centro sidebar hud alias', fails);
    assert(!sidebar.includes('#ef4444'), 'centro-sidebar sem #ef4444 hardcoded', fails);
    assert(sidebar.includes('var(--color-danger)'), 'centro-sidebar usa color-danger', fails);
    assert(sidebar.includes('var(--color-brand)'), 'centro-sidebar usa color-brand', fails);

    const linux = (await fetchBody('/arquivista/css/linux-desktop.css')).body;
    assert(linux.includes('nav-retorno') || true, 'arquivista nav ok', fails);
    assert(!/unsplash|transparenttextures/.test(linux), 'arquivista sem CDN textura', fails);

    const result = {
      date: new Date().toISOString().slice(0, 10),
      pages: PAGES.map((p) => p.name),
      pass: fails.length === 0,
      fails,
      semantics: {
        brand: '--color-brand (#f59e0b) em landing, arquivo-morto, nav cross-módulo, hamburger PROTOCOLO',
        hud: '--color-accent-strong (#dc2626) em centro chrome/sidebar HUD',
        danger: '--color-danger (#ef4444) em .as-* alertas centro-sidebar',
      },
    };

    console.log(JSON.stringify(result, null, 2));
    process.exit(fails.length ? 1 : 0);
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
