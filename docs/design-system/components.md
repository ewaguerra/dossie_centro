# Componentes-base

Fonte: `vendor/app/styles/components.css`

## `.btn`

Botão base mono, borda neutra. Modificadores:

| Classe | Uso |
|---|---|
| `.btn--icon` | 40×40, hamburger / ícone |
| `.btn--ghost` | Fundo escuro, borda `--color-accent-strong` (Centro) |
| `.btn--nav` | Botões da narrative-nav (Centro) |

Exemplo (Centro):

```html
<button class="nav-btn btn btn--nav" type="button">MAPA</button>
```

## `.nav-retorno`

Barra fixa inferior para navegação entre módulos. Links com `.nav-retorno-link`.

- Marca: borda âmbar, primeiro link destacado
- Override `.linux-desktop`: verde terminal (Arquivista)

HTML típico:

```html
<nav class="nav-retorno" aria-label="Navegação entre módulos">
  <a href="/landing/" class="nav-retorno-link">← PROTOCOLO</a>
  <a href="/arquivo-morto/" class="nav-retorno-link">ARQUIVO MORTO</a>
</nav>
```

## `.badge`

Selo pequeno uppercase (ex.: CONFIDENCIAL).

## O que ainda não é componente

Cards, popups, inputs e inspector do Centro permanecem no CSS monolítico `centro-sidebar.css` — candidatos a extração futura (jesuit-frame, profile-card, inspector).
