#!/usr/bin/env node
/**
 * Smoke parcial do Centro — assets HTTP + console (Chrome headless com SwiftShader).
 * POIs visíveis e flyTo requerem browser interativo (ver docs/testing/smoke-centro.md).
 */
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnServer } from './lib/python-cmd.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9888;
const BASE = `http://127.0.0.1:${PORT}`;

const ASSET_PATHS = [
  '/centro/index.html',
  '/app/styles/tokens.css',
  '/app/styles/a11y.css',
  '/app/styles/components.css',
  '/pages/centro/styles/centro-vars.css',
  '/pages/centro/styles/centro-chrome.css',
  '/pages/centro/styles/layout.css',
  '/pages/centro/styles/sidebar.css',
  '/pages/centro/styles/narrative-nav.css',
  '/pages/centro/styles/feature-inspector.css',
  '/pages/centro/styles/profile-card.css',
  '/pages/centro/styles/jesuit-frame.css',
  '/pages/centro/styles/map-popups.css',
  '/pages/centro/styles/responsive.css',
  '/pages/centro/centro-sidebar.css',
  '/pages/centro/centro-runtime.js',
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
  '/centro/assets/pistas/rua-sao-bento-pistas.json',
];

function fetchStatus(path) {
  return new Promise((resolve, reject) => {
    request(new URL(path, BASE), (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    })
      .on('error', reject)
      .end();
  });
}

function waitForServer(maxMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      if (Date.now() - start > maxMs) return reject(new Error('server timeout'));
      fetchStatus('/centro/index.html')
        .then((s) => (s === 200 ? resolve() : setTimeout(poll, 200)))
        .catch(() => setTimeout(poll, 200));
    })();
  });
}

async function checkAssets() {
  const results = [];
  for (const path of ASSET_PATHS) {
    const status = await fetchStatus(path);
    results.push({ path, status, ok: status === 200 });
  }
  return results;
}

async function captureConsoleWithChrome() {
  const outDir = mkdtempSync(join(tmpdir(), 'centro-smoke-'));
  const logPath = join(outDir, 'chrome.log');
  const url = `${BASE}/centro/index.html`;

  return new Promise((resolve) => {
    const chrome = spawn(
      'google-chrome',
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--enable-logging=stderr',
        '--v=0',
        '--use-angle=swiftshader',
        '--enable-webgl',
        '--virtual-time-budget=12000',
        url,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );

    let stderr = '';
    chrome.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    chrome.on('close', () => {
      writeFileSync(logPath, stderr);
      const consoleErrors = stderr
        .split('\n')
        .filter((line) => /CONSOLE.*error/i.test(line) || /Uncaught/i.test(line))
        .filter((line) => !/WebGL|BindToCurrentSequence|sandbox/i.test(line));

      resolve({ logPath, consoleErrors, webglFailed: /WebGL|BindToCurrentSequence/i.test(stderr) });
    });

    setTimeout(() => {
      chrome.kill('SIGTERM');
    }, 15000);
  });
}

async function main() {
  const server = spawnServer(spawn, join(ROOT, 'server.py'), PORT, {
    cwd: ROOT,
    stdio: 'ignore',
  });

  try {
    await waitForServer();
    const assets = await checkAssets();
    const assetFails = assets.filter((a) => !a.ok);
    const chrome = await captureConsoleWithChrome();

    const report = {
      date: new Date().toISOString().slice(0, 10),
      assetsOk: assetFails.length === 0,
      assetFails,
      consoleJsErrors: chrome.consoleErrors.length,
      consoleSample: chrome.consoleErrors.slice(0, 5),
      webglHeadless: chrome.webglFailed ? 'failed' : 'ok',
      chromeLog: chrome.logPath,
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(assetFails.length === 0 && chrome.consoleErrors.length === 0 ? 0 : 1);
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
