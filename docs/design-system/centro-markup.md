# Centro — markup sem estilos inline

> **Status:** concluído · Commit `50c4e89` (*refactor(centro): extrair chrome e remover estilos inline*)

## Problema (auditoria pré-DS)

`centro/index.html` continha **23 atributos `style="..."`**, misturando apresentação com estrutura e dificultando manutenção do design system.

## Solução

Estilos movidos para classes CSS reutilizáveis, com tokens globais onde aplicável.

| Função visual | Classes HTML | CSS |
|---|---|---|
| Menu hamburger | `.hamburger-nav`, `.hamburger-btn`, `.hamburger-dropdown`, `.hamburger-link`, `.hamburger-link--primary` | `centro/styles/centro-chrome.css` |
| Header sidebar | `.sidebar-header--chrome`, `.sidebar-header__row`, `.sidebar-header__eyebrow--chrome`, etc. | `centro-chrome.css` |
| Fechar sidebar | `.sidebar-close-btn`, `.sidebar-close-btn--inline` | `centro-chrome.css` + `centro-sidebar.css` |
| Nav ops (OP:TRIÂNGULO…) | `.narrative-nav`, `.nav-btn`, `.btn`, `.btn--nav` | `centro-chrome.css` + `components.css` |
| Badge CONFIDENCIAL | `.badge` | `vendor/app/styles/components.css` |
| Inspector / mapa | `.feature-inspector`, `#map`, `.sidebar` | `centro-sidebar.css` (pré-existente) |

## Tokens usados (chrome)

- `--z-modal`, `--font-mono`, `--radius-sm`, `--radius-xs`, `--radius-md`
- `--color-brand` (link PROTOCOLO)
- `--color-accent-strong` (HUD hamburger, header)
- `--color-success-bright` (status EM ANÁLISE)

## Fora de escopo nesta etapa

- JavaScript inline → migrado para `centro-runtime.js` (commit separado CAPRI)
- Refatoração completa de `centro-sidebar.css` (~1764 linhas)

## Critérios de aceite

| Critério | Estado |
|---|---|
| `centro/index.html` sem `style="` | ☑ 0 ocorrências |
| Visual equivalente | ☑ (sem redesenho) |
| Tokens globais | ☑ em `centro-chrome.css` |
| Teste automatizado | ☑ `sanity.test.js` |

## Validação

```bash
grep -n 'style=' centro/index.html    # vazio
npm test                             # inclui teste "sem style inline"
```

Manual: sidebar abrir/fechar, hamburger, narrative-nav, mapa — `docs/capri/smoke-centro.md`.
