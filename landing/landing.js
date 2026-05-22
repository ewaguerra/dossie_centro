/* ═══════════════════════════════════════════════════════
   ANHANGABAÚ: O ARQUIVO DOS SOTERRADOS — Landing JS
   ReactBits-inspired effects: Glitch Text, Letter Glitch,
   Scroll Reveal, Counter Animation, Spotlight Card,
   Typewriter
═══════════════════════════════════════════════════════ */

/* ── PORTAL DE ACESSO ────────────────────────────────── */
(function initPortal() {
  const portal  = document.getElementById('portal-acesso');
  const input   = document.getElementById('portal-senha');
  const btn     = document.getElementById('portal-btn');
  const erroMsg = document.getElementById('portal-erro');
  const elevImg = document.getElementById('portal-elevador-img');
  if (!portal || !input || !btn) return;

  const SENHA = 'apoio';

  function tentar() {
    const val = input.value.trim().toLowerCase();
    if (val === SENHA) {
      /* troca imagem para elevador aberto */
      elevImg.onerror = null;
      elevImg.src = '/landing/assets/ELEVADOR_ABERTO.png';
      elevImg.style.transition = 'opacity 0.4s';
      erroMsg.textContent = '';

      setTimeout(() => {
        portal.classList.add('saindo');
        portal.addEventListener('transitionend', () => {
          portal.remove();
        }, { once: true });
      }, 600);
    } else {
      erroMsg.textContent = 'ACESSO NEGADO — código inválido';
      erroMsg.classList.remove('glitch');
      void erroMsg.offsetWidth; /* reflow para reiniciar animação */
      erroMsg.classList.add('glitch');
      input.value = '';
      input.focus();
    }
  }

  btn.addEventListener('click', tentar);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tentar(); });
})();

/* ══════════════════════════════════════════════════════
   13 ALMAS — PARALLAX + FLUID DISTORTION ENGINE

   Efeito fluido: SVG feTurbulence + feDisplacementMap
   - feTurbulence gera ruído Perlin animado (seed muda via JS)
   - feDisplacementMap desloca pixels da imagem pelo ruído
   - Resultado: chamas/fumaça ondulando organicamente

   Parallax: mousemove + scroll → translate CSS por frame
   Cada alma tem seed, frequência e escala únicos — sem
   duas almas com o mesmo padrão de distorção.
══════════════════════════════════════════════════════ */
(function initAlmasParallax() {
  const stageBack  = document.getElementById('almas-back');
  const stageFront = document.getElementById('almas-front');
  if (!stageBack || !stageFront) return;

  /* ── Imagens por tipo ──────────────────────────────── */
  const IMG = {
    fire:   '/landing/assets/ALMA_NIVEL_2.PNG',
    shadow: '/landing/assets/ALMA_PNG.png',
    ether:  '/landing/assets/ALMA_FINAL_PNG.png',
  };

  /* ── Configuração de distorção por tipo ────────────── */
  const FLUID = {
    //          baseFreqX  baseFreqY  octaves  scale   seedSpeed
    fire:   { bfx: 0.015, bfy: 0.055, oct: 3,  sc: 28, ss: 0.8 },
    shadow: { bfx: 0.010, bfy: 0.035, oct: 2,  sc: 18, ss: 0.4 },
    ether:  { bfx: 0.020, bfy: 0.070, oct: 4,  sc: 32, ss: 1.1 },
  };

  /* ── 13 almas — front:true fica na frente do banner ── */
  const SOULS = [
    // ── FAR — bordas, atrás ──────────────────────────────
    { left:  4, top: 12, size:  60, layer:'far',  type:'shadow', rd:0.3, fd:0.0, front:false },
    { left: 90, top:  8, size:  52, layer:'far',  type:'shadow', rd:0.8, fd:2.1, front:false },
    { left:  7, top: 75, size:  64, layer:'far',  type:'ether',  rd:1.0, fd:1.3, front:false },
    { left: 88, top: 78, size:  56, layer:'far',  type:'ether',  rd:1.4, fd:3.5, front:false },
    { left: 50, top:  3, size:  48, layer:'far',  type:'shadow', rd:1.7, fd:4.2, front:false },

    // ── MID — dois flancos atrás, dois cruzando na frente ─
    { left: 13, top: 28, size:  96, layer:'mid',  type:'fire',   rd:0.5, fd:1.8, front:false },
    { left: 77, top: 24, size:  88, layer:'mid',  type:'fire',   rd:0.7, fd:0.9, front:false },
    { left: 17, top: 60, size:  80, layer:'mid',  type:'shadow', rd:1.1, fd:2.7, front:true  },
    { left: 73, top: 58, size:  92, layer:'mid',  type:'fire',   rd:1.3, fd:1.5, front:true  },
    { left: 41, top: 76, size:  76, layer:'mid',  type:'ether',  rd:1.6, fd:3.0, front:false },

    // ── NEAR — todas na frente, atravessam o banner ──────
    { left:  1, top: 40, size: 130, layer:'near', type:'fire',   rd:0.2, fd:0.5, front:true  },
    { left: 81, top: 43, size: 118, layer:'near', type:'fire',   rd:0.4, fd:2.3, front:true  },
    { left: 45, top: 80, size: 108, layer:'near', type:'shadow', rd:0.9, fd:1.1, front:true  },
  ];

  const SPEED = { far: 0.014, mid: 0.038, near: 0.075 };

  /* ── Glow CSS por tipo — aplicado no WRAPPER, não na img
     Separar do filter SVG evita conflito de stacking context  */
  const GLOW_WRAP = {
    fire:   'drop-shadow(0 0 10px rgba(255,20,0,0.90)) drop-shadow(0 0 28px rgba(200,0,0,0.60)) drop-shadow(0 0 55px rgba(140,0,0,0.35))',
    shadow: 'drop-shadow(0 0 12px rgba(140,0,0,0.55)) drop-shadow(0 0 32px rgba(90,0,0,0.35))',
    ether:  'drop-shadow(0 0 14px rgba(255,70,50,0.50)) drop-shadow(0 0 36px rgba(200,10,0,0.30))',
  };

  /* ── ALPHA por camada ──────────────────────────────── */
  const ALPHA = { far: 0.28, mid: 0.45, near: 0.62 };

  /* ── SVG namespace ──────────────────────────────────── */
  const NS  = 'http://www.w3.org/2000/svg';
  const XNS = 'http://www.w3.org/1999/xlink';

  /* ── Cria SVG defs global com filtros únicos ─────────
     Um <filter> por alma para seeds independentes         */
  const svgDefs = document.createElementNS(NS, 'svg');
  svgDefs.setAttribute('width', '0');
  svgDefs.setAttribute('height', '0');
  svgDefs.style.cssText = 'position:absolute;overflow:hidden;pointer-events:none';
  const defs = document.createElementNS(NS, 'defs');
  svgDefs.appendChild(defs);
  document.body.insertBefore(svgDefs, document.body.firstChild);

  /* ── Build cada alma ────────────────────────────────── */
  const almaData = SOULS.map((s, i) => {
    const cfg      = FLUID[s.type];
    const filterId = `alma-fluid-${i}`;

    /* ── Filtro SVG ─────────────────────────────────────
       chain: feTurbulence → feDisplacementMap → feColorMatrix
       Tudo dentro do SVG filter, sem misturar CSS filters  */
    const filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-25%');
    filter.setAttribute('y', '-25%');
    filter.setAttribute('width', '150%');
    filter.setAttribute('height', '150%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    /* ruído Perlin — seed animado pelo RAF loop */
    const turb = document.createElementNS(NS, 'feTurbulence');
    turb.setAttribute('type', 'fractalNoise');
    turb.setAttribute('baseFrequency', `${cfg.bfx} ${cfg.bfy}`);
    turb.setAttribute('numOctaves', cfg.oct);
    turb.setAttribute('seed', Math.floor(Math.random() * 200));
    turb.setAttribute('stitchTiles', 'noStitch');
    turb.setAttribute('result', 'noise');

    /* deslocamento de pixels pelo ruído */
    const disp = document.createElementNS(NS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'noise');
    disp.setAttribute('scale', cfg.sc);
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'G');
    disp.setAttribute('result', 'displaced');

    filter.appendChild(turb);
    filter.appendChild(disp);
    defs.appendChild(filter);

    /* ── Wrapper: glow via CSS filter (separado do SVG) ─ */
    const wrap = document.createElement('div');
    wrap.className = `alma alma-${s.type} alma-${s.layer}`;
    wrap.style.cssText = [
      `left:${s.left}%`,
      `top:${s.top}%`,
      `width:${s.size}px`,
      `height:${s.size}px`,
      `--float-delay:${s.fd}s`,
      `opacity:0`,
      `filter:${GLOW_WRAP[s.type]}`,   /* glow no wrapper */
    ].join(';');
    wrap.dataset.speed = SPEED[s.layer];

    /* ── Img: só o filtro SVG de distorção + blend ─────── */
    const img = document.createElement('img');
    img.src      = IMG[s.type];
    img.alt      = '';
    img.draggable = false;
    img.style.cssText = [
      'width:100%',
      'height:100%',
      'object-fit:contain',
      'display:block',
      `filter:url(#${filterId})`,    /* apenas o SVG fluid */
      'mix-blend-mode:screen',
    ].join(';');

    wrap.appendChild(img);
    (s.front ? stageFront : stageBack).appendChild(wrap);

    return { wrap, turb, seed: Math.random() * 500, seedSpeed: cfg.ss };
  });

  /* ── Fade-in escalonado após carregamento ────────────── */
  almaData.forEach(({ wrap }, i) => {
    setTimeout(() => {
      wrap.style.transition = 'opacity 1.4s ease';
      wrap.style.opacity    = ALPHA[SOULS[i].layer];
    }, SOULS[i].rd * 1000 + 400);
  });

  /* ── Parallax state ──────────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let scrollY = 0;
  let heroRect = stageBack.getBoundingClientRect();

  window.addEventListener('resize', () => {
    heroRect = stageBack.getBoundingClientRect();
  });

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - heroRect.left - heroRect.width  / 2) / heroRect.width;
    mouseY = (e.clientY - heroRect.top  - heroRect.height / 2) / heroRect.height;
  });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  /* ── RAF loop: parallax + seed animation ─────────────── */
  let last = 0;
  function render(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05); // delta segundos, cap 50ms
    last = ts;

    almaData.forEach(({ wrap, turb, seedSpeed }, idx) => {
      /* parallax */
      const spd   = parseFloat(wrap.dataset.speed);
      const maxPx = 80 * spd / SPEED.near;
      const tx = mouseX * maxPx * 160;
      const ty = mouseY * maxPx *  80 + scrollY * spd * 0.55;
      wrap.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`;

      /* seed incremental — anima o feTurbulence suavemente */
      almaData[idx].seed += dt * seedSpeed;
      turb.setAttribute('seed', almaData[idx].seed.toFixed(3));
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();


/* ── CANVAS LETTER GLITCH BACKGROUND ────────────────── */
(function initLetterGlitch() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const chars = 'SOTERRADOANHANGABÁUARQUIVISTÁRIOCONCRETOESPECTROSSÃOPAULORIOSTIBIRISARABUÇUMOOCAGUARAPIRANGA1554196419741985202619720000ΑΛΦΑ';
  let cols, rows, grid, animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / 18);
    rows = Math.ceil(canvas.height / 18);
    grid = Array.from({ length: cols * rows }, () => ({
      char: chars[Math.floor(Math.random() * chars.length)],
      opacity: Math.random(),
      speed: 0.003 + Math.random() * 0.008,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Courier New';

    for (let i = 0; i < grid.length; i++) {
      const cell = grid[i];
      cell.opacity += cell.speed;
      if (cell.opacity >= 1) {
        cell.opacity = 0;
        cell.char = chars[Math.floor(Math.random() * chars.length)];
      }
      const x = (i % cols) * 18;
      const y = Math.floor(i / cols) * 18;
      const alpha = Math.sin(cell.opacity * Math.PI);
      ctx.fillStyle = `rgba(245,158,11,${alpha})`;
      ctx.fillText(cell.char, x, y);
    }
    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); draw(); });
  resize();
  draw();
})();


/* ── SPOTLIGHT CARD MOUSE TRACKING ──────────────────── */
document.querySelectorAll('.modulo-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--y', `${e.clientY - rect.top}px`);
  });
});

/* ── TIER CARD SPOTLIGHT ─────────────────────────────── */
document.querySelectorAll('.tier-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--tx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--ty', `${e.clientY - rect.top}px`);
  });
});

/* ── IN-VIEW: tier cards + pilares ── */
(function initInView() {
  const targets = document.querySelectorAll('.tier-card, .pat-pilar');
  if (!targets.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.classList.contains('tier-card')
          ? Array.from(targets).indexOf(entry.target) * 80
          : 0;
        setTimeout(() => entry.target.classList.add('in-view'), delay);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => obs.observe(el));
})();


/* ── COUNTER ANIMATION ───────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const step = 16;
  const totalSteps = duration / step;
  let current = 0;
  const increment = target / totalSteps;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString('pt-BR');
  }, step);
}

/* hero stats + dado-float: ambos usam animateCounter */
const statNums = document.querySelectorAll('.stat-num[data-target], .dado-float[data-target]');
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNums.forEach(el => statsObserver.observe(el));


/* ── SCROLL REVEAL ───────────────────────────────────── */
const revealEls = document.querySelectorAll(
  '.modulo-card, .tech-card, .step, .dado-bloco, .sobre-grid > *, .jornada-steps > .step, .midia-card'
);

revealEls.forEach(el => el.classList.add('scroll-reveal'));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Staggered delay
      setTimeout(() => {
        entry.target.classList.add('revealed');
      }, (i % 6) * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));


/* ── TYPEWRITER EFFECT ───────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;

  const lines = [
    'Não olhe para o céu.',
    'Eles querem que você olhe para cima.',
    'Mas a verdade está embaixo.',
    'Sob o concreto.',
    'Sob o asfalto.',
    'Sob os alicerces da metrópole.',
    'Os rios ainda correm.',
    'As almas ainda resistem.',
    '— O Arquivista'
  ];

  let lineIdx = 0, charIdx = 0, typing = true;
  const fullText = lines.join('\n');
  let displayed = '';

  function tick() {
    if (typing) {
      if (charIdx < fullText.length) {
        displayed += fullText[charIdx];
        charIdx++;
        el.textContent = displayed;
        setTimeout(tick, charIdx === fullText.length ? 0 : 38 + Math.random() * 30);
      }
      // done — just hold
    }
  }

  // Start after 1.5s delay
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      setTimeout(tick, 600);
      observer.disconnect();
    }
  }, { threshold: 0.3 });

  observer.observe(el);
})();


/* ── HERO EYEBROW GLITCH TEXT ────────────────────────── */
(function initGlitchText() {
  const el = document.querySelector('.hero-eyebrow[data-glitch]');
  if (!el) return;

  const original = el.dataset.glitch;
  const glitchChars = '!<>-_\\/[]{}—=+*^?#@%$ΩΛΨΞ';

  function glitch() {
    let result = '';
    let glitching = false;

    for (let i = 0; i < original.length; i++) {
      if (Math.random() < 0.07) {
        result += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        glitching = true;
      } else {
        result += original[i];
      }
    }

    el.textContent = result;

    if (glitching) {
      setTimeout(() => { el.textContent = original; }, 80);
    }

    setTimeout(glitch, 2000 + Math.random() * 3000);
  }

  setTimeout(glitch, 1200);
})();


/* ── BANNER GLITCH ON HOVER ──────────────────────────── */
(function initBannerGlitch() {
  const banner = document.getElementById('hero-banner');
  if (!banner) return;

  banner.addEventListener('mouseenter', () => {
    let count = 0;
    const interval = setInterval(() => {
      const shift = (Math.random() - 0.5) * 6;
      const skew  = (Math.random() - 0.5) * 2;
      banner.style.transform = `translateY(0) skewX(${skew}deg) translateX(${shift}px)`;
      count++;
      if (count > 5) {
        clearInterval(interval);
        banner.style.transform = '';
      }
    }, 60);
  });
})();


/* ── PARTÍCULAS DE POEIRA NO HERO ────────────────────── */
(function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  const count = 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    p.style.cssText = [
      `left:${Math.random() * 100}%`,
      `top:${20 + Math.random() * 60}%`,
      `--dur:${4 + Math.random() * 6}s`,
      `--delay:${Math.random() * 6}s`,
      `--op:${0.2 + Math.random() * 0.5}`,
      `width:${1 + Math.random() * 2}px`,
      `height:${1 + Math.random() * 2}px`,
    ].join(';');
    container.appendChild(p);
  }
})();


/* ── GLITCH WORD — scroll trigger + periodic shake ──── */
(function initGlitchWords() {
  const words = document.querySelectorAll('.glitch-word');
  if (!words.length) return;

  const glitchChars = '!<>_\\/[]{}—=+*^?#@%$ΩΛΨΞ█▓▒';

  words.forEach(el => {
    const original = el.dataset.glitch || el.textContent;

    function triggerGlitch() {
      let count = 0;
      const interval = setInterval(() => {
        let glitched = '';
        for (let i = 0; i < original.length; i++) {
          glitched += Math.random() < 0.15
            ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
            : original[i];
        }
        el.textContent = glitched;
        count++;
        if (count > 4) {
          clearInterval(interval);
          el.textContent = original;
        }
      }, 55);
    }

    /* disparo periódico */
    function scheduleNext() {
      setTimeout(() => {
        triggerGlitch();
        scheduleNext();
      }, 4000 + Math.random() * 5000);
    }

    /* aguarda estar visível para iniciar */
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(scheduleNext, 800);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
  });
})();


/* ── NAV ACTIVE STATE ON SCROLL ──────────────────────── */
(function initNavScroll() {
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 80
      ? 'rgba(4,7,15,0.97)'
      : 'rgba(4,7,15,0.85)';
  });
})();


/* ── PROTOCOLO 13 — fase ARG (localStorage) ─────────── */
(function initProtocoloPhase() {
  const KEY = 'protocolo13_phase';
  const MAX = 13;
  try {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, '1');
    const phase = Math.min(MAX, Math.max(1, parseInt(localStorage.getItem(KEY), 10) || 1));
    const badge = document.getElementById('protocolo-phase-badge');
    if (badge) badge.textContent = 'Fase ' + phase + ' de ' + MAX + ' (activa)';
  } catch (_e) {
    // localStorage indisponível
  }
})();

/* ── SMOOTH SCROLL ───────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


