# Breakpoints — referência transversal

Fonte canônica: `vendor/app/styles/tokens.css` (`--bp-sm` … `--bp-xl`)

> **Nota:** custom properties **não funcionam** dentro de `@media`. Use os valores literais abaixo e comente a referência ao token.

| Token | Valor | Uso típico |
|---|---|---|
| `--bp-sm` | **480px** | Phone estreito (375–480px) |
| `--bp-md` | **640px** | Phone / phablet |
| `--bp-lg` | **768px** | Tablet portrait |
| `--bp-xl` | **1024px** | Tablet landscape / desktop estreito |

## Mapa por módulo

| Módulo | Ficheiro | Breakpoints usados |
|---|---|---|
| Centro HUD | `centro/styles/responsive.css` | 768, 640, 480 |
| Centro flyTo | `centro/styles/narrative-nav.css` | 640, 480 |
| Nav cross-módulo | `vendor/app/styles/components.css` | 480 |
| Landing | `landing/landing.css` | 1024, 860*, 640, 480 |
| Arquivista OS | `arquivista/css/linux-desktop.css` | 768, 640, 480 |
| Arquivista explorer | `arquivista/css/utility.css` | 640 |

\*860px é legado landing (hero); não expandir para novos módulos.

## Centro — narrative-nav (flyTo)

**Problema:** `bottom: 16px` colocava a barra **dentro** da moldura jesuíta (28–48px), ocultando os botões OP:*.

**Correção:**
- `bottom: calc(var(--jesuit-frame-bottom) + var(--centro-sidebar-gap))`
- Scroll horizontal (`overflow-x: auto`) em telas estreitas
- `min-height: 44px` nos botões (640px)
- Sem `display: none` — funcionalidade sempre acessível

## Arquivista — limitações restantes

Experiência **desktop-first**; mobile é “degradada elegante”, não redesign completo.

| Viewport | Comportamento |
|---|---|
| ≤768px | Janelas limitadas à largura do ecrã; dock reduzido |
| ≤640px | Workspace switcher oculto; toolbar do explorador com wrap |
| ≤480px | Labels do dock ocultos (evita overflow horizontal) |

**Ainda não otimizado:** arrastar/redimensionar janelas em touch; layout GNOME completo em portrait.

## Validação manual

Viewports: **375px**, **480px**, **640px**, **768px**, desktop.

Centro:
1. Barra OP:* visível acima da moldura inferior
2. Scroll horizontal funciona com 4 botões
3. flyTo responde ao toque

Arquivista:
1. Sem scroll horizontal na página (body)
2. Login e modais cabem na largura
3. nav-retorno clicável

```bash
npm test   # inclui asserts de narrative-nav
```
