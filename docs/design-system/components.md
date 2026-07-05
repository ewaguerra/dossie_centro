# Componentes-base

Fonte: `vendor/app/styles/components.css`  
Pré-requisitos: `tokens.css` → `a11y.css` → `components.css`

Cada componente define estados **default**, **hover**, **active**, **disabled** (`:disabled` / `[aria-disabled="true"]`).  
**Foco** (`:focus-visible`) delegado a `a11y.css`.

---

## `.btn`

Botão base mono, borda neutra, touch-friendly quando combinado com modificadores de tamanho.

### Modificadores

| Classe | Cor / estilo | Quando usar |
|---|---|---|
| *(base)* | Neutro escuro | Ações secundárias genéricas |
| `.btn--primary` | Âmbar suave (`--color-brand-soft`) | CTAs genéricos, confirmação |
| `.btn--brand-solid` | Âmbar sólido + texto escuro | Hero landing, tier destaque, contacto |
| `.btn--brand-ghost` | Transparente + borda âmbar | Secundários marketing (landing) |
| `.btn--subtle` | Neutro discreto | Tier cards, ações secundárias |
| `.btn--block` | Largura total | CTAs em card footer |
| `.btn--ghost` | Vermelho HUD | Chrome forense Centro (hamburger) |
| `.btn--icon` | 40×40 px | Ícone único — abrir painel, menu |
| `.btn--icon-sm` | 28×28 px | Fechar inline (header sidebar) |
| `.btn--bare` | Transparente | Dismiss sem borda; hover vermelho HUD |
| `.btn--nav` | Neutro + hover vermelho | Botões OP:* da narrative-nav |

### Exemplo (Centro)

```html
<button class="nav-btn btn btn--nav" type="button" data-nav-lng="-46.63" data-nav-lat="-23.55">
  OP:TRIÂNGULO
</button>
<button class="hamburger-btn btn btn--ghost btn--icon" type="button" aria-expanded="false" aria-haspopup="true">
  ☰
</button>
<button id="sidebar-toggle" class="sidebar-open-btn btn btn--icon" type="button" hidden>
  <!-- ícone -->
</button>
<button class="sidebar-close-btn btn btn--bare btn--icon-sm" type="button" aria-label="Fechar painel">
  ✕
</button>
```

### Estados

- **Disabled:** `opacity: 0.45`, `pointer-events: none`
- **Focus:** outline âmbar global; vermelho HUD em `.has-jesuit-frame` para `.btn--ghost`, `.btn--bare`, `.nav-btn`

---

## `.input`

Campo de texto mono, largura total, fundo `--color-bg-elev-1`.

| Estado | Comportamento |
|---|---|
| hover | Borda `--color-text-muted` |
| active | Fundo `--color-bg-subtle` |
| disabled / read-only | Opacidade 0.55 |

```html
<label>
  <span class="sr-only">Buscar camada</span>
  <input class="input" type="search" placeholder="Filtrar…" />
</label>
```

Usar `--font-mono` implicitamente; placeholders em `--color-text-muted`.

---

## `.card`

Superfície agrupada. Variantes para contextos distintos:

| Classe | Aparência | Quando usar |
|---|---|---|
| `.card` | Escuro, borda neutra | Lista de itens, blocos genéricos |
| `.card--static` | Sem hover | Conteúdo informativo fixo |
| `.card--popup` | Escuro + borda vermelha | Tooltips MapLibre, popups no mapa |
| `.card--inspector` | Claro tipo dossiê | Feature inspector, POI detalhado |

```html
<article class="card card--popup">
  <h3>Título</h3>
  <p>Conteúdo do popup no mapa.</p>
</article>

<aside class="card card--inspector">
  <h2>Evidência</h2>
  <p>Texto legível sobre fundo claro.</p>
</aside>
```

**Drawer (Centro):** não é `.card` — usar `.sidebar` em `centro/styles/sidebar.css` (painel lateral colapsável).

**Modal:** não há `.modal` global. Padrões actuais:
- Hamburger dropdown (`.hamburger-dropdown` em `centro-chrome.css`)
- Janelas OS no Arquivista (`.linux-window`)
- Overlays locais com `z-index: var(--z-modal)`

---

## `.toast`

Feedback flutuante temporário. Posição fixa inferior, centrado.

| Elemento | Classe | Notas |
|---|---|---|
| Container | `.toast` | Fundo vermelho HUD; `--z-toast` |
| Aviso | `.toast.toast--warn` | Fundo `--color-confidential` (âmbar escuro) |
| Oculto | `[hidden]` ou `.is-hidden` | `opacity: 0` |
| Fechar | `.toast__close` | Botão × herda cor |

```html
<div class="toast" role="status" aria-live="polite">
  Camada carregada.
  <button type="button" class="toast__close" aria-label="Fechar">×</button>
</div>
```

### Runtime Centro (`centroToast`)

`centroToast(msg, type)` em `centro-runtime.js` usa classes `.toast`, `.toast--warn`, `.toast__close` de `components.css` — sem estilos inline de cor.

| Elemento | Classe |
|---|---|
| Container | `#centro-toast.toast` |
| Aviso | `.toast.toast--warn` |
| Oculto | `.toast.is-hidden` |
| Mensagem | `.toast__message` |
| Fechar | `.toast__close` |

Reposicionamento mobile: `centro/styles/responsive.css` (`#centro-toast`).

### Debug inspector (`showInspector`)

Click no mapa → painel JSON dev. Usa `.card.card--inspector.card--static.debug-inspector` + `.btn--bare` para fechar. Estilos em `centro/styles/feature-inspector.css`.

---

## `.empty-state`

Placeholder quando não há conteúdo. Borda tracejada, texto centrado mono.

```html
<div class="empty-state">
  <p class="empty-state__title">Sem resultados</p>
  <p>Nenhuma camada corresponde ao filtro.</p>
</div>
```

Hover escurece borda — útil como área clicável para “tentar novamente” (adicionar `button` ou `a` dentro se interactivo).

---

## `.nav-retorno`

Barra fixa inferior para navegação **entre módulos**. Touch target mínimo **44×44 px**.

| Elemento | Classe |
|---|---|
| Container | `.nav-retorno` |
| Link | `.nav-retorno__link` |
| Link principal (voltar) | `.nav-retorno__link--primary` ou `:first-child` |

### Temas (`data-theme` no `<nav>`)

| Valor | Módulo | Paleta |
|---|---|---|
| *(omitido / brand)* | arquivo-morto | Âmbar |
| `terminal` | arquivista | Verde `#00ff00` |
| `hud` | centro (referência) | Vermelho HUD + offset moldura |

```html
<nav class="nav-retorno" data-theme="brand" aria-label="Navegação entre módulos">
  <a href="/landing/" class="nav-retorno__link nav-retorno__link--primary">← PROTOCOLO</a>
  <a href="/centro/" class="nav-retorno__link">MAPA</a>
  <a href="/arquivo-morto/" class="nav-retorno__link">ARQUIVO</a>
</nav>
```

**Centro (produção):** usa hamburger + links internos, não `.nav-retorno` na página activa.

Responsive ≤480px: fonte e padding compactos — ver `components.css`.

---

## Outros componentes no ficheiro

| Classe | Uso |
|---|---|
| `.checkbox` | Checkbox nativo; `accent-color` vermelho HUD |
| `.skeleton` / `.skeleton--text` / `.skeleton--title` | Loading placeholder; shimmer desactivado com reduced-motion |
| `.badge` | Selo uppercase CONFIDENCIAL |

---

## Migração incremental

| Área | Estado |
|---|---|
| Botões Centro (nav, hamburger, sidebar) | ☑ usa `.btn` |
| Toast Centro | ☑ usa `.toast` via `centroToast()` |
| Inputs/checkboxes sidebar | CSS pronto; HTML local legado |
| Cards inspector/popup | CSS pronto; classes legadas em módulos Centro |
| nav-retorno | ☑ unificado em arquivo-morto e arquivista |

---

## Validação

```bash
npm test   # inclui asserts toast + nav-retorno
grep -R "components.css" landing centro arquivo-morto arquivista
```

Manual: Tab pelos botões/links; confirmar hover/active/disabled visíveis.
