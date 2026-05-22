# Tipografia — decisão Fira Code

> **Data:** 2026-05-22 · **Decisão:** opção **A** — `--font-mono` offline

## Problema

`Fira Code` era referenciada no Centro e no arquivista (`style.css` via Google Fonts), mas **não havia** `@font-face` local nem ficheiro `.woff2` no repositório. O browser fazia fallback silencioso para monospace genérico.

## Decisão

| Opção | Escolha | Motivo |
|---|---|---|
| A) `--font-mono` do sistema | **Sim** | Offline-first, zero build, previsível |
| B) Auto-hospedar Fira Code | Não | Nenhum `.woff2`/`.woff` encontrado no repo |

## Tokens canônicos (`tokens.css`)

```css
--font-mono: 'Courier New', Courier, monospace;
--font-code: var(--font-mono);  /* alias histórico */
--font-serif: Georgia, 'Times New Roman', serif;
--font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

## Onde aplicar

| Módulo | Estado |
|---|---|
| Centro `centro-sidebar.css` | `var(--font-mono)` / `var(--font-code)` |
| Centro `centro-chrome.css` | `var(--font-mono)` |
| Arquivista `utility.css` `.font-mono` | `var(--font-mono)` |
| Arquivista `style.css` | CDN removido (ficheiro órfão) |
| Landing / arquivo-morto | `--font-mono` local ou global |

## Proibido

- Google Fonts / CDN para Fira Code ou Inter
- Referência a `Fira Code` em CSS/JS de runtime sem `@font-face` local

## Validação

```bash
grep -R "Fira Code" . --include='*.css' --include='*.js' --include='*.html'
grep -R "fonts.googleapis" .
npm test
```

Network: nenhum pedido externo de fonte ao abrir as 4 páginas principais.

## Reavaliação futura

Se forem adicionados ficheiros em `vendor/app/fonts/FiraCode*.woff2`:

1. Criar `@font-face` em `vendor/app/styles/fonts.css`
2. Atualizar `--font-mono` para `'Fira Code', 'Courier New', monospace`
3. Carregar `fonts.css` após `tokens.css`
