# Plano de Correção — projeto_centro

## Ordem executada

1. **Fase 0 — baseline e segurança**: hardening de cache/control headers no `server.py`.
2. **Fase 1 — quick wins**: correção de estrutura HTML inválida.
3. **Fase 2 — POI layers**: eliminação de lógica duplicada legada em `centro-main.js`.
4. **Fase 5 — pendências rio/animação/contraste**: remoção de código morto em `pistas.js` e `rio-animado.js`.
5. **Fase 4 — Lucide**: remoção de runtime Lucide e troca por SVG inline.
6. **Fase 3 — extração JS inline**: criação de `centro/centro-runtime.js` e limpeza do `centro/index.html`.
7. **Auditoria final CAPRI**: atualização das docs em `docs/capri/` e registro deste plano.

## Restrições respeitadas

- Sem CDN.
- Sem framework adicional.
- Sem bundler.
- Runtime offline preservado.
- Testes executados após cada fase com status de aprovação.

## Resultado final resumido

- Críticos abertos: `0` (com base nos itens técnicos listados).
- Testes: `25/25` passando.
- HTML principal válido.
- Runtime JS não-inline.
- Lucide removido do runtime e das dependências.
- Dependências e vendor de Three.js removidos.

## Fase 1.7 — deduplicação de Three.js (validação final)

- Estado atual do workspace: não existe `vendor/three/` e não existe `vendor/app/vendor/three/`.
- Busca de referências (`vendor/three` e `vendor/app/vendor/three`): nenhum match fora de `node_modules`.
- Validação de assets offline via `server.py`: `200` para `/centro/index.html`, `/osm-style.json`, `/vendor/maplibre/maplibre-gl.js` e `/vendor/maplibre/maplibre-gl.css`.
- Testes: `npm test` passando (`23/23` nesta execução).
- Economia em disco nesta fase: `0 B` incremental, pois a duplicação de Three.js já estava eliminada antes desta execução.

## Fase 2 — POI layers (validação final)

- Duplicação de `addPOILayer` já eliminada: implementação única em `centro/centro-runtime.js` (Bloco A legado removido com extração do inline e remoção de `centro-main.js`).
- `centro/index.html` não contém JS inline; carrega `centro-runtime.js` + `poi-icons.js`.
- Idempotência ativa via `ensureSource`, `ensureLayer`, `ensureImage` e `bindLayerEventOnce`.
- Correção aplicada: caminhos dos ícones SVG alinhados aos arquivos reais (`icon-memoria.svg`, `icon-acervo.svg`, `icon-arqueologia.svg`, `icon-monumentos.svg`).
- `grep function addPOILayer`: 1 ocorrência.
- Testes: `npm test` passando (`24/24`) após cobertura de assets POI.
- Smoke visual (Playwright + screenshot): 4 ícones POI visíveis no mapa; `duplicateErrorCount: 0`; assets POI sem 404.
- Labels POI: `osm-style.json` passou a declarar `glyphs`; runtime usa `styleSupportsTextLabels` + `text-font` — console limpo de erros `text-field requires glyphs`.

## Fase 5 — rio/animação/contraste (validação final)

- Requisito explícito de animação de rio: **não encontrado** (README, ADR-0001, CAPRI, test-matrix).
- Hidrografia ativa via catálogo estático (`05_hidrografia_rios__line`); animação de fluxo **fora do escopo**.
- `rioAnimationFrame` / `rioAnimationStart`: ausentes no codebase.
- `rio-animado.js`: removidos `RIO_FLOW_DASHES`, `animationMs` e camadas flow/arrow; módulo documentado; **não carregado** em `centro/index.html`.
- `pistas.js`: removida função `clamp` não utilizada.
- `requestAnimationFrame`: ausente em `centro/` (vendor/landing/arquivista mantêm usos próprios).
- Contraste WCAG: avaliação básica em `docs/capri/wcag-contrast-notes.md` (pendências registradas, sem claim de conformidade total).
- `prefers-reduced-motion`: regra adicionada para animações `.as-codigo-erro--shake` e `.as-recompensa--revelada`.
- Testes: `npm test` passando após fase.

## Fase 4 — Lucide (validação final)

- Bundle Lucide (~584 KB) **não carregado**; `vendor/lucide/` ausente; `package.json` sem dependência Lucide.
- Ícones da navegação narrativa substituídos por **SVG inline** em `centro/index.html`:
  - `target` → OP:TRIÂNGULO (círculos concêntricos)
  - `landmark` → OP:SÉ (edifício)
  - `river` → OP:ANHANGABAÚ (ondas)
  - `compass` → OP:GERAL (rosa dos ventos)
- Acessibilidade: ícones decorativos com `aria-hidden="true"`; botões OP com `aria-label` descritivo.
- Comentários legados “Lucide” atualizados em `map-icons.js`, `arquivista/js/script.js`, `arquivista/css/utility.css`.
- Economia estimada: **~584 KB** de JS (bundle Lucide) → **~2 KB** de markup SVG inline (4 ícones + toggles).
- `grep -Ri lucide .` (fora de docs/plano): **0** referências runtime.
- Testes: `npm test` passando após fase.

## Fase 3 — extração JS inline (validação final)

- **Arquivo canônico:** `centro/centro-runtime.js` (equivalente ao `centro-app.js` do plano; padrão já adotado no projeto).
- `centro/index.html`: **108 linhas**, majoritariamente declarativo; **0 blocos `<script>` inline**.
- Scripts externos carregados com **`defer`**; ordem preservada (vendor → app → features → runtime).
- Lógica movida para runtime (IIFE):
  - inicialização (`bootstrap`, `DOMContentLoaded`);
  - mapa (`initMap`, controles);
  - POI layers (`addPOILayer`);
  - sidebar/camadas (`loadSidebarData`, `addLayerToMap`);
  - UI (`setupHamburgerMenu`, `setupToast`, teclado);
  - lazy loading (`setupLazyImageObserver`);
  - navegação (`centroNavigate`, `centroGoTo` expostos no `window`).
- `onclick` em botões OP mantido intencionalmente (fora do escopo desta fase, reduz risco).
- HTTP: `/pages/centro/centro-runtime.js` → **200**.
- Testes: `npm test` passando após cobertura Fase 3.

## Fase 3.3 — handlers inline → event listeners

- Removidos `onclick` de `#sidebar-toggle` e dos 4 botões `#narrative-nav .nav-btn`.
- Botões OP usam `data-nav-lng|lat|zoom|pitch`; listeners em `setupNarrativeNav()`.
- `#sidebar-toggle` → `setupSidebarToggle()` + `toggleSidebar()` interno (sem `window.toggleSidebar`).
- Inspector dinâmico e toast close: `addEventListener` em vez de `onclick` em markup gerado.
- `window.centroNavigate` / `window.centroGoTo` mantidos como API pública.
- `grep` em `centro/`: **0** handlers inline (`onclick|onmouseover|onmouseout|onchange|onsubmit`).
- Testes: `npm test` passando após Fase 3.3.

## Pendências pós-auditoria (fechamento 2026-05-21)

- **Baseline formal:** `docs/capri/baseline-fase0.md`
- **Offline parcial:** `docs/capri/offline-scope.md`
- **Smoke manual:** `docs/capri/smoke-centro.md` (WebGL requer browser real)
- **WCAG:** dívida aceita em `docs/capri/wcag-contrast-notes.md`
- **Arquivista:** MapLibre migrado para `/vendor/maplibre/*` (sem unpkg)
- **test-full.html:** marcado `DEV ONLY`; produção = `centro/index.html`
- **BANNER_SITE.png 404:** removido; banner usa gradiente CSS
- **Smoke parcial:** `node scripts/smoke-centro.mjs` (12 assets 200, 0 erros JS)
