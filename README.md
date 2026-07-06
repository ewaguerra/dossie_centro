# PROTOCOLO 13 ALMAS — Dossiê Centro (mapa)

Mapa interativo do centro de São Paulo — cartografia forense do ARG **Protocolo 13 Almas**.

Este repositório contém **só o mapa** (`/centro/`). Landing, Arquivo Morto e Arquivista vivem em outros repositórios privados.

**Repositório:** [github.com/ewaguerra/dossie_centro](https://github.com/ewaguerra/dossie_centro)

**Hospedagem:** o mapa será publicado na **[Vercel](https://vercel.com/)** (site estático, sem instalar nada no PC para jogar).

---

## Jogar online (recomendado — sem instalar nada)

Para **jogadores**: basta um navegador moderno (Chrome, Edge, Firefox ou Safari) e ligação à internet.

### Passo 1 — Abrir o link

Aceda ao mapa na Vercel (URL pública — **actualizar após o primeiro deploy**):

**https://[nome-do-projeto].vercel.app/centro/**

> Quando o deploy estiver feito, substitua `[nome-do-projeto]` pelo domínio real (ex.: `protocolo13-centro.vercel.app`). A raiz `/` redirecciona automaticamente para `/centro/`.

### Passo 2 — Introduzir a senha (só na 1.ª visita)

Aparece um ecrã escuro com um quadro pedindo a **chave de operador**.

| | |
|---|---|
| **Senha** | `joelma` |
| **Dica no ecrã** | «Dica: joelma» |

Clique em **Desbloquear mapa**. Nas visitas seguintes no mesmo browser, entra directo.

### Passo 3 — Explorar o mapa

| Acção | Como fazer |
|---|---|
| **Mover** | Arrastar com o rato ou dedo |
| **Zoom** | Roda do rato ou botões +/- |
| **Menu lateral** | Botão ☰ ou tecla **S** |
| **Camadas** | Separadores **Território**, **Evidências**, **Visualização**, **13 Almas** |

O basemap vem da internet (OpenFreeMap); não precisa de Python nem Node no seu computador.

### O que você vai ver (resumo visual)

1. **Ecrã de senha** — fundo escuro, painel central «Acesso ao dossiê cartográfico», campo de senha e botão «Desbloquear mapa».
2. **Mapa do Centro** — vista cartográfica de São Paulo com moldura narrativa; sidebar à direita (ou por cima no telemóvel).
3. **Sidebar** — quatro separadores: progresso das 13 Almas, camadas 3D/subsolo, território cartográfico e evidências/pistas.

> Capturas de ecrã oficiais podem ser guardadas em `docs/screenshots/` após o deploy na Vercel.

---

## Rodar no seu computador (opcional)

Para **desenvolver ou testar** localmente — **não é necessário para jogar online na Vercel**. Passo a passo:

---
### O que você vai precisar (só para rodar local)

| Programa | Para quê | Onde baixar |
|---|---|---|
| **Node.js** (versão 18 ou mais nova) | preparar os ficheiros do projeto | https://nodejs.org/ |
| **Python** (versão 3) | ligar o servidor local do mapa | https://www.python.org/ |

> **Windows:** na instalação do Python, marque a opção **“Add python to PATH”**.

---

### Passo 1 — Abrir a pasta do projeto

1. Descarregue ou clone este repositório.
2. Entre na pasta que contém o ficheiro `server.py`  
   (ex.: pasta `dossie_centro` após clonar o repo).

---

### Passo 2 — Abrir o terminal nessa pasta

**Windows**

1. Abra a pasta no Explorador de Ficheiros.
2. Clique na barra de endereço, escreva `cmd` ou `powershell` e prima Enter.  
   — ou clique com o botão direito na pasta e escolha **“Abrir no Terminal”**.

**Mac / Linux**

1. Abra o Terminal.
2. Escreva `cd ` (com espaço no fim) e arraste a pasta para a janela; prima Enter.

---

### Passo 3 — Instalar dependências (só na primeira vez)

No terminal, execute:

```bash
npm install
```

Aguarde terminar (pode demorar um ou dois minutos). Só precisa repetir isto se apagar a pasta `node_modules` ou mudar de máquina.

---

### Passo 4 — Ligar o servidor

No mesmo terminal:

```bash
python server.py
```

**Windows:** se `python` não funcionar, tente `py server.py`.

Deve aparecer algo como:

```
Serving HTTP on 127.0.0.1 port 8080 ...
```

**Deixe esta janela aberta** enquanto usa o mapa. Para parar o servidor, prima `Ctrl+C` no terminal.

---

### Passo 5 — Abrir o mapa no navegador

1. Abra o Chrome, Edge ou Firefox.
2. Na barra de endereço, escreva:

   **http://127.0.0.1:8080/centro/**

3. Prima Enter.

> Também pode ir a http://127.0.0.1:8080/ — o site redirecciona sozinho para o mapa.

---

### Passo 6 — Senha na primeira visita

Na **primeira vez** que abrir o mapa, aparece um ecrã escuro pedindo a **chave de operador**.

| | |
|---|---|
| **Senha** | `joelma` |
| **Dica no ecrã** | «Dica: joelma» |

Escreva a senha e clique em **Desbloquear mapa**. Nas visitas seguintes no mesmo navegador, o mapa abre directo (fica guardado no browser).

**Para ver o ecrã de senha outra vez:** abra as ferramentas do browser (F12) → separador **Application** (Chrome) ou **Armazenamento** (Firefox) → **Local Storage** → apague a chave `centroAccessGranted` → recarregue a página.

---

### Passo 7 — Usar o mapa (básico)

| Acção | Como fazer |
|---|---|
| **Mover o mapa** | Arrastar com o rato ou dedo (touch) |
| **Zoom** | Roda do rato ou botões +/- no canto |
| **Abrir o menu lateral** | Botão ☰ (hamburger) ou tecla **S** |
| **Ver camadas** | Separadores **Território**, **Evidências**, **Visualização**, **13 Almas** |
| **Ir a um ponto** | Botões de navegação narrativa (quando visíveis) |

O mapa precisa de **internet** na primeira carga (tiles do OpenFreeMap). Depois, parte do conteúdo fica em cache no browser.

---

### Problemas comuns

| Sintoma | O que fazer |
|---|---|
| «python não é reconhecido» | Reinstale o Python com **Add to PATH**, ou use `py server.py` no Windows |
| «npm não é reconhecido» | Instale o Node.js e **feche e reabra** o terminal |
| Página em branco ou erro | Confirme que o terminal ainda mostra o servidor a correr e que a URL é `/centro/` |
| Mapa antigo / estranho | F12 → Application → **Clear site data** → recarregar |
| Porta 8080 ocupada | Use outra porta: `python server.py 3000` e abra http://127.0.0.1:3000/centro/ |

---

## Resumo em 4 comandos (para quem já sabe usar terminal)

```bash
cd pasta-do-projeto
npm install          # só na 1.ª vez
python server.py
# abrir http://127.0.0.1:8080/centro/  — senha: joelma
```

---

## Para desenvolvedores

### Stack

| Camada | Tecnologia |
|---|---|
| Mapa | MapLibre GL JS ^5.0.0 (vendor self-host) |
| Basemap | OpenFreeMap vector tiles (gratuito, sem chave) |
| Ícones | Lucide via `lucide-static` → SVG em `centro/assets/icons/` |
| Servidor local | Python `http.server` (proxy) — dev |
| Hospedagem | [Vercel](https://vercel.com/) — produção (estático, `vercel.json`) |
| Testes | Node.js `node:test` |

### Comandos úteis

```bash
npm install
npm run sync:maplibre      # resync vendor MapLibre
npm run sync:lucide-icons  # regenerar ícones do mapa
python server.py           # porta default 8080
python server.py 3000      # porta alternativa
npm run ci                 # testes antes de push
npm run healthcheck:centro
```

Detalhes de CI: [docs/testing/ci-local.md](docs/testing/ci-local.md)

### Deploy na Vercel

O site é **estático** (HTML, JS, CSS, GeoJSON). A Vercel serve os ficheiros; o ficheiro [`vercel.json`](vercel.json) replica os rewrites do `server.py` local (`/pages/centro/` → `/centro/`, `/app/` → `/vendor/app/`, etc.).

**Passo a passo (1.ª vez):**

1. Conta em [vercel.com](https://vercel.com/) (GitHub/GitLab/Bitbucket).
2. **Add New Project** → importar este repositório.
3. Framework preset: **Other** (site estático na raiz).
4. Build command: `npm install` (já definido no `vercel.json`; corre o `postinstall` que sincroniza MapLibre/Three/ícones).
5. Output directory: deixar **vazio** ou `.` (raiz do repo).
6. Deploy → anotar a URL gerada (ex.: `https://protocolo13-centro.vercel.app`).
7. **Actualizar este README** — secção «Jogar online», link com a URL real.
8. (Opcional) Domínio customizado em **Project Settings → Domains**.

**Verificar após deploy:**

- `/` redirecciona para `/centro/`
- `/centro/` carrega o mapa e o gate de senha (`joelma`)
- DevTools → Network: `/pages/centro/…` e `/app/…` respondem 200 (rewrites activos)

**Nota:** `localStorage` é por domínio — progresso no `127.0.0.1` **não** copia para a URL da Vercel (comportamento esperado do ARG).

### Gate de acesso e bypass dev

- Senha narrativa: **`joelma`** (`centro/features/centro-access-gate.js`)
- Persistência: `localStorage.centroAccessGranted = "1"`
- Bypass: `?master=1` na URL (sem pedir senha)

### Links do menu hamburger (dev local)

Neste repo, `/landing/`, `/arquivo-morto/` e `/arquivista/` respondem **404**. Para apontar para URLs externas, use [`config/surface-links.local.example.json`](config/surface-links.local.example.json) ou:

```html
<script>
  window.CENTRO_SURFACE_LINKS = {
    landing: "https://landing.exemplo.com/",
    "arquivo-morto": "https://arquivo.exemplo.com/",
    arquivista: "https://arquivista.exemplo.com/"
  };
</script>
```

### Pistas e Fase 7 (visão subterrânea)

A pista `aresta-fria` desbloqueia a Fase 7 via Arquivo Morto ou deep-link `?clues=aresta-fria`. Bypass dev: `?master=1` ou `?phase=7&clues=agua-calada,aresta-fria,peso-fundacao`.

### Estrutura do projeto

```
projeto_centro/
├── centro/              # Mapa + sidebar + runtime
│   ├── index.html
│   ├── centro-runtime.js
│   ├── features/        # catalog-load, access-gate, layer-unlocks, …
│   ├── assets/          # Ícones SVG e pistas Rua São Bento
│   └── data/            # GeoJSON + catálogo de camadas
├── vendor/              # maplibre, three, design system
├── server.py            # Proxy + 404 em rotas removidas
├── scripts/             # sync vendors, healthcheck, smoke
└── tests/               # sanity + HTTP integration
```

### Funcionalidades

- 21 camadas wired na sidebar (10 processed + 11 context), 9 grupos
- 4 POI patrimoniais + POI turístico; 4 pistas Rua São Bento
- Desbloqueio por pistas (`layer-unlocks.json`) e gates de fase (`phase-gates.json`)
- Maquete 3D + visão subterrânea (Three.js vendor)
- Gate de senha na primeira visita (`centro-access-gate.js`)

### Ponte transmídia

O Centro consome pistas via `localStorage.protocolo13_caderno_clues`, query `?clues=` e `layer-unlocks.json`. **localStorage não atravessa domínios** — ver `dossie_arg_contracts`.

### Rotas do servidor

| Path | Comportamento |
|---|---|
| `/`, `/index.html` | Redirecciona para `/centro/` |
| `/centro/*`, `/pages/centro/*` | `./centro/*` |
| `/app/*` | `./vendor/app/*` |
| `/vendor/*` | `./vendor/*` |
| `/landing/`, `/arquivo-morto/`, `/arquivista/` | **404** (repos separados) |

### Basemap

Estilo em `centro/centro-runtime.js`:

```js
var BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
// alternativas: positron | bright | dark-matter
```

Histórico e cache: [`docs/offline-scope.md`](docs/offline-scope.md). Índice de docs: [`docs/README.md`](docs/README.md).

### Arquitetura (fluxo resumido)

```
1. index.html carrega scripts + CSS
2. accessGate.install() — senha na 1.ª visita
3. bootstrap() → sidebar, toggles, initMap()
4. map.on('load') → POIs, pistas, camadas do catálogo
5. Checkbox na sidebar → addLayerToMap / removeLayerFromMap
```

Documentação completa para agentes: [`AGENT.md`](AGENT.md).

---

## Licença

Projeto narrativo — PROTOCOLO 13 ALMAS.
