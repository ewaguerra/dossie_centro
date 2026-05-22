(function () {
  "use strict";

  let CLUES = {}; // Carregado via fetch
  const REQUIRED_CLUES = [
    "peso-fundacao",
    "aresta-fria",
    "aurora-maloca",
    "agua-calada"
  ];

  // Chave canónica ARG — lida pelo Centro para desbloquear camadas (AGENT.md §3.4).
  const CADERNO_STORAGE_KEY = "protocolo13_caderno_clues";

  const state = {
    collectedClues: new Set(),
    activeFilter: 'all',
    searchQuery: ''
  };

  // ── Caderno — persistência localStorage ─────────────────────────────
  function loadCollectedCluesFromStorage() {
    try {
      const raw = localStorage.getItem(CADERNO_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      parsed.forEach(function (id) {
        if (typeof id === "string" && CLUES[id]) {
          state.collectedClues.add(id);
        }
      });
    } catch (_err) {
      // localStorage indisponível ou JSON inválido — ignora.
    }
  }

  function persistCollectedClues() {
    try {
      localStorage.setItem(
        CADERNO_STORAGE_KEY,
        JSON.stringify(Array.from(state.collectedClues))
      );
    } catch (_err) {
      // localStorage indisponível — ignora.
    }
  }

  function applyCollectedClueUi() {
    state.collectedClues.forEach(function (clueId) {
      document.querySelectorAll('[data-clue-id="' + clueId + '"]').forEach(function (node) {
        node.classList.add("is-collected");
        node.setAttribute("aria-pressed", "true");
      });
    });
  }

  // ── Carregamento de Dados ─────────────────────────────────────────────
  async function loadClues() {
    try {
      const response = await fetch('data/pistas.json');
      const data = await response.json();
      CLUES = data.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
      loadCollectedCluesFromStorage();
      applyCollectedClueUi();
      renderClueLedger();
      updateClueConclusion();
    } catch (err) {
      console.error("Erro ao carregar pistas:", err);
    }
  }


  // ── Data dinâmica ────────────────────────────────────────────────────
  function applyDynamicPostDate() {
    const el = document.querySelector("[data-dynamic-date]");
    if (!el) return;

    const publishedAt = new Date(Date.now() - 60 * 1000);
    el.textContent = "Publicado há 1 minuto.";
    el.setAttribute("datetime", publishedAt.toISOString());
    el.title = publishedAt.toLocaleString("pt-BR");
  }

  // ── Palavras-pista ───────────────────────────────────────────────────
  function setupClueWords() {
    document.querySelectorAll("[data-clue-id]").forEach((el) => {
      el.addEventListener("click", () => collectClue(el));
    });
  }

  function collectClue(el) {
    const clueId = el.dataset.clueId;
    if (!clueId || !CLUES[clueId]) return;

    if (state.collectedClues.has(clueId)) return;

    state.collectedClues.add(clueId);

    document.querySelectorAll(`[data-clue-id="${clueId}"]`).forEach((node) => {
      node.classList.add("is-collected");
      node.setAttribute("aria-pressed", "true");
    });

    renderClueLedger();
    updateClueConclusion();
    persistCollectedClues();
  }

  function renderClueLedger() {
    const list = document.querySelector("[data-clue-list]");
    if (!list) return;

    if (!state.collectedClues.size) {
      list.innerHTML = '<li class="suma-pistas__empty">Nenhuma pista consolidada.</li>';
      return;
    }

    const filtered = [...state.collectedClues]
      .map(id => CLUES[id])
      .filter(clue => {
        const matchesFilter = state.activeFilter === 'all' || clue.categoria === state.activeFilter;
        const matchesSearch = clue.titulo.toLowerCase().includes(state.searchQuery) || 
                             clue.descricao.toLowerCase().includes(state.searchQuery);
        return matchesFilter && matchesSearch;
      });

    if (filtered.length === 0) {
      list.innerHTML = '<li class="suma-pistas__empty">Nenhum fragmento encontrado com este filtro.</li>';
      return;
    }

    list.innerHTML = filtered.map((clue) => {
      return [
        '<li class="suma-pistas__item fade-in is-visible">',
        `<strong class="suma-pistas__item-title">${clue.titulo} [${clue.categoria.toUpperCase()}]</strong>`,
        `<p class="suma-pistas__item-summary">${clue.descricao}</p>`,
        "</li>"
      ].join("\n");
    }).join("\n");
  }

  function setupFiltros() {
    const searchInput = document.getElementById('clue-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderClueLedger();
      });
    }

    document.querySelectorAll('.filtro-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeFilter = btn.dataset.filter;
        renderClueLedger();
      });
    });
  }


  function updateClueConclusion() {
    const conclusion = document.querySelector("[data-clue-conclusion]");
    if (!conclusion) return;

    const requiredCount = REQUIRED_CLUES.filter((id) => state.collectedClues.has(id)).length;

    if (requiredCount >= 4 && requiredCount < REQUIRED_CLUES.length) {
      conclusion.hidden = false;
      conclusion.innerHTML = [
        '<h3 class="conclusao-titulo">A soma começa a ranger.</h3>',
        "<p>Quase. A direção não é uma torre. É uma linha no chão.</p>"
      ].join("\n");
      return;
    }

    if (requiredCount === REQUIRED_CLUES.length) {
      conclusion.hidden = false;
      conclusion.innerHTML = [
        '<h3 class="conclusao-titulo">A instrução não era um código fechado. Era um método.</h3>',
        "<ol>",
        "<li>Ignore o alto.</li>",
        "<li>Desça para as fundações.</li>",
        "<li>Siga a água calada.</li>",
        "<li>Vá ao comércio velho.</li>",
        '<li>Procure a rua chamada de <strong>Aresta Fria</strong>.</li>',
        "</ol>",
        "<p>Abra o MapLibre e pesquise pela rua nomeada no texto como Aresta Fria.</p>",
        '<p class="conclusao-final-discreta">Releia o trecho que nomeia a Aresta Fria.</p>',
        '<a href="/centro/" class="mapa-link">Abrir MapLibre</a>'
      ].join("\n");

      conclusion.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ── YouTube Anexo — Aurora 1951 ──────────────────────────────────────

  // Diagnóstico confirmado: yjjnl1ksG-0 retorna status ERROR via embedded player API
  // (error 152-18 = embedding desabilitado pelo dono do vídeo).
  // Isso não é fixável por código: CSP, enablejsapi, referrer policy não são a causa.
  // Mitigação: src limpo (sem enablejsapi), youtube-nocookie.com, fallback link visível.

  const YOUTUBE_EMBED_HOST = "https://www.youtube-nocookie.com";

  function debugYoutubeAnexo(...args) {
    if (window.__YOUTUBE_ANEXO_DEBUG__ === true) {
      console.warn("[YOUTUBE_ANEXO]", ...args);
    }
  }

  function getYoutubeEmbedSrc(startSeconds, host) {
    const h = host || YOUTUBE_EMBED_HOST;
    const videoId = "yjjnl1ksG-0";
    const params = new URLSearchParams({
      start: String(Math.max(0, Number(startSeconds) || 0)),
      rel: "0",
      playsinline: "1"
    });
    return `${h}/embed/${videoId}?${params.toString()}`;
  }

  function setupYoutubeAnexo() {
    const wrapper = document.querySelector("[data-youtube-anexo]");
    if (!wrapper) return;

    const frame = wrapper.querySelector("[data-youtube-frame]");
    if (!frame) return;

    const defaultStart = Number(frame.dataset.youtubeDefaultStart || 140);

    // Atualiza src inicial via JS para garantir host e params corretos
    const initialSrc = getYoutubeEmbedSrc(defaultStart);
    debugYoutubeAnexo("src inicial", initialSrc, "origin:", window.location.origin);
    frame.src = initialSrc;

    wrapper.querySelectorAll("[data-youtube-start]").forEach((button) => {
      button.addEventListener("click", () => {
        const startSeconds = Number(button.dataset.youtubeStart || 0);
        setYoutubeStart(frame, startSeconds);
        contaminateYoutubeAnexo(wrapper);
      });
    });

    const loopButton = wrapper.querySelector("[data-youtube-loop-fragment]");
    if (loopButton) {
      loopButton.addEventListener("click", () => {
        setYoutubeStart(frame, defaultStart);
        contaminateYoutubeAnexo(wrapper);
        flashArgamassa(wrapper);
      });
    }
  }

  function setYoutubeStart(frame, startSeconds) {
    const src = getYoutubeEmbedSrc(startSeconds);
    debugYoutubeAnexo("src atualizado", src, "start:", startSeconds);
    frame.src = src;
  }

  function contaminateYoutubeAnexo(wrapper) {
    wrapper.classList.add("is-contaminated");
    document.body.classList.add("youtube-anexo-contaminado");

    window.setTimeout(() => {
      document.body.classList.remove("youtube-anexo-contaminado");
      wrapper.classList.remove("is-contaminated"); // BUG-01: sem isso a animação roda infinitamente
    }, 2400);
  }

  function flashArgamassa(wrapper) {
    wrapper.classList.add("is-argamassa-visible");

    window.setTimeout(() => {
      wrapper.classList.remove("is-argamassa-visible");
    }, 900);
  }

  // ── Rotas verticais (desvio semântico) ───────────────────────────────
  function setupRotasVerticais() {
    document.querySelectorAll(".arquivo-palavra[data-rota]").forEach((btn) => {
      btn.addEventListener("click", handleRotaVerticalButtonClick);
    });

    // OPT-06: querySelectorAll cobre múltiplos links futuros
    document.querySelectorAll("a.arquivo-link[data-rota]").forEach((link) => {
      link.addEventListener("click", handleRotaVerticalLinkClick);
    });
  }

  function handleRotaVerticalButtonClick(event) {
    const btn = event.currentTarget;
    btn.classList.add("is-rota-vertical-flash");
    document.body.classList.add("arquivo-rota-vertical-ativa");

    setTimeout(() => {
      btn.classList.remove("is-rota-vertical-flash");
      document.body.classList.remove("arquivo-rota-vertical-ativa"); // BUG-02: remover após flash
    }, 1800);
  }

  function handleRotaVerticalLinkClick(event) {
    event.preventDefault();
    const link = event.currentTarget;
    link.classList.add("is-rota-vertical-flash");
    document.body.classList.add("arquivo-rota-vertical-ativa");

    setTimeout(() => {
      link.classList.remove("is-rota-vertical-flash");
      document.body.classList.remove("arquivo-rota-vertical-ativa"); // BUG-02
    }, 1800);
  }

  // ── Glitch no final da rolagem ────────────────────────────────────────
  function setupEndOfPostGlitch() {
    let triggered = false;

    window.addEventListener("scroll", () => {
      if (triggered) return;

      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

      if (!nearBottom) return;

      triggered = true;
      document.body.classList.add("arquivo-glitch");

      setTimeout(() => {
        document.body.classList.remove("arquivo-glitch");
      }, 2000);
    }, { passive: true });
  }

  // ── Scroll Animations ────────────────────────────────────────────────
  function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // ── Init ──────────────────────────────────────────────────────────────
  async function initArquivoMorto() {
    await loadClues();
    applyDynamicPostDate();
    setupClueWords();
    setupFiltros();
    setupRotasVerticais();
    setupYoutubeAnexo();
    setupEndOfPostGlitch();
    setupScrollAnimations();
  }

  document.addEventListener("DOMContentLoaded", initArquivoMorto);
})();
