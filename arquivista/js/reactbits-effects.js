/**
 * REACTBITS EFFECTS — Vanilla JS Port
 * Anhangabaú: O Arquivo dos Soterrados
 *
 * Três efeitos inspirados em reactbits.dev, portados para Vanilla JS puro.
 * Nenhuma dependência externa. Zero React.
 *
 * Uso via data-attributes no HTML:
 *   data-scramble         → ScrambleText (on mouseenter)
 *   data-glitch           → GlitchText   (automático + on-demand)
 *   data-decrypt          → DecryptedText (on-demand via API)
 */

/* ═══════════════════════════════════════════════════════════════════════
   1. SCRAMBLE TEXT
   Algoritmo: revela texto char-a-char da esquerda para direita,
   mantendo posições ainda não reveladas como ruído aleatório.
   Inspirado em: reactbits.dev/text-animations/scramble-text
════════════════════════════════════════════════════════════════════════ */
class ScrambleText {
  constructor(element, options = {}) {
    this.el = element;
    this.original = element.dataset.scramble || element.textContent;
    this.charset = options.charset || '!<>-_\\/[]{}—=+*^?#@%$ΩΛΨΞ█▓▒░';
    this.speed = options.speed || 40;         // ms por frame
    this.revealSpeed = options.revealSpeed || 3; // chars revelados por frame
    this._frame = 0;
    this._raf = null;
    this._bound = this._start.bind(this);

    element.addEventListener('mouseenter', this._bound);
    // Acessibilidade: preserva o texto real
    element.setAttribute('aria-label', this.original);
  }

  _start() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._frame = 0;
    this._tick();
  }

  _tick() {
    const total = this.original.length;
    const revealed = Math.min(this._frame * this.revealSpeed, total);

    let output = '';
    for (let i = 0; i < total; i++) {
      if (i < revealed) {
        output += this.original[i];
      } else if (this.original[i] === ' ') {
        output += ' ';
      } else {
        output += this.charset[Math.floor(Math.random() * this.charset.length)];
      }
    }

    this.el.textContent = output;
    this._frame++;

    if (revealed < total) {
      this._raf = setTimeout(() => this._tick(), this.speed);
    } else {
      this.el.textContent = this.original;
    }
  }

  /** API pública: inicia o efeito programaticamente */
  play() { this._start(); }

  destroy() {
    this.el.removeEventListener('mouseenter', this._bound);
    if (this._raf) clearTimeout(this._raf);
    this.el.textContent = this.original;
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   2. DECRYPTED TEXT
   Algoritmo: revela texto progressivamente de forma assíncrona.
   Posições não reveladas pulsam com chars de ruído.
   Usável como Promise para integrar no terminal.
   Inspirado em: reactbits.dev/text-animations/decrypted-text
════════════════════════════════════════════════════════════════════════ */
class DecryptedText {
  constructor(options = {}) {
    this.charset = options.charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!?█▓▒░';
    this.revealDelay = options.revealDelay || 18;   // ms entre reveals
    this.noiseFrames = options.noiseFrames || 3;     // frames de ruído por char
    this.maxLength = options.maxLength || 80;        // trunca strings longas
  }

  /**
   * Anima o texto de um elemento DOM e retorna Promise quando completo.
   * @param {HTMLElement} el - elemento alvo
   * @param {string} text - texto a revelar
   * @returns {Promise}
   */
  animate(el, text) {
    const str = text.length > this.maxLength ? text : text;
    const total = str.length;
    let revealed = 0;
    let noiseCount = 0;

    return new Promise((resolve) => {
      const tick = () => {
        let output = '';
        for (let i = 0; i < total; i++) {
          if (i < revealed) {
            output += str[i];
          } else if (str[i] === ' ' || str[i] === '\n') {
            output += str[i];
          } else {
            output += this.charset[Math.floor(Math.random() * this.charset.length)];
          }
        }

        el.textContent = output;
        noiseCount++;

        if (noiseCount >= this.noiseFrames) {
          noiseCount = 0;
          revealed++;
        }

        if (revealed <= total) {
          setTimeout(tick, this.revealDelay);
        } else {
          el.textContent = str;
          resolve();
        }
      };

      tick();
    });
  }

  /**
   * Versão mais simples: anima string e retorna string revelada linha-a-linha.
   * Usada internamente pelo terminal de Operation 13 Almas.
   * @param {string} text
   * @param {Function} onUpdate — callback(currentStr) a cada frame
   * @returns {Promise}
   */
  animateString(text, onUpdate) {
    const total = text.length;
    let revealed = 0;
    let noiseCount = 0;

    return new Promise((resolve) => {
      const tick = () => {
        let output = '';
        for (let i = 0; i < total; i++) {
          if (i < revealed) {
            output += text[i];
          } else if (text[i] === ' ' || text[i] === '│' || text[i] === '┌' || text[i] === '└' || text[i] === '─') {
            output += text[i]; // preserva chars de box-drawing
          } else {
            output += this.charset[Math.floor(Math.random() * this.charset.length)];
          }
        }

        if (onUpdate) onUpdate(output);
        noiseCount++;

        if (noiseCount >= this.noiseFrames) {
          noiseCount = 0;
          revealed++;
        }

        if (revealed <= total) {
          setTimeout(tick, this.revealDelay);
        } else {
          if (onUpdate) onUpdate(text);
          resolve();
        }
      };

      tick();
    });
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   3. GLITCH TEXT
   Algoritmo: insere perturbações visuais periódicas no texto via
   CSS class com clip-path e translateX em pseudo-elementos.
   Inspirado em: reactbits.dev/text-animations/glitch-text
════════════════════════════════════════════════════════════════════════ */
class GlitchText {
  constructor(element, options = {}) {
    this.el = element;
    this.original = element.dataset.glitch || element.textContent;
    this.minInterval = options.minInterval || 3000;  // ms mínimo entre glitches
    this.maxInterval = options.maxInterval || 8000;  // ms máximo entre glitches
    this.glitchDuration = options.glitchDuration || 300; // ms do glitch
    this.charset = options.charset || '!<>-_\\/[]{}—=+*^?#@%$ΩΛΨΞ';
    this._timer = null;

    // Wrap em span para o efeito funcionar com pseudo-elementos
    this._wrapElement();
    this._schedule();
  }

  _wrapElement() {
    this.el.classList.add('rb-glitch');
    this.el.setAttribute('data-text', this.original);
    this.el.setAttribute('aria-label', this.original);
  }

  _schedule() {
    const delay = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    this._timer = setTimeout(() => {
      this._trigger();
      this._schedule();
    }, delay);
  }

  _trigger() {
    this.el.classList.add('rb-glitching');

    // Perturbação de chars durante o glitch
    const steps = 6;
    let step = 0;
    const interval = setInterval(() => {
      let out = '';
      for (let i = 0; i < this.original.length; i++) {
        if (Math.random() < 0.12) {
          out += this.charset[Math.floor(Math.random() * this.charset.length)];
        } else {
          out += this.original[i];
        }
      }
      // Atualiza o data-text para o pseudo-elemento ::before pegar
      this.el.setAttribute('data-text', out);

      step++;
      if (step >= steps) {
        clearInterval(interval);
        this.el.setAttribute('data-text', this.original);
        this.el.classList.remove('rb-glitching');
      }
    }, this.glitchDuration / steps);
  }

  /** Dispara um glitch imediatamente (API pública) */
  trigger() { this._trigger(); }

  destroy() {
    if (this._timer) clearTimeout(this._timer);
    this.el.classList.remove('rb-glitch', 'rb-glitching');
    this.el.removeAttribute('data-text');
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   AUTO-INICIALIZADOR
   Lê data-attributes do DOM e instancia os efeitos automaticamente.
════════════════════════════════════════════════════════════════════════ */
const ReactBitsEffects = {
  instances: {
    scramble: [],
    glitch: [],
    decrypt: new DecryptedText(),
  },

  init() {
    // ScrambleText: elementos com [data-scramble]
    document.querySelectorAll('[data-scramble]').forEach(el => {
      const instance = new ScrambleText(el);
      this.instances.scramble.push(instance);
    });

    // GlitchText: elementos com [data-glitch]
    document.querySelectorAll('[data-glitch]').forEach(el => {
      const instance = new GlitchText(el);
      this.instances.glitch.push(instance);
    });

    console.log(
      `%c[ReactBits] ${this.instances.scramble.length} ScrambleText + ${this.instances.glitch.length} GlitchText inicializados.`,
      'color:#00ff41;font-family:monospace'
    );
  },

  /**
   * Anima um elemento com DecryptedText.
   * @param {HTMLElement} el
   * @param {string} text
   * @returns {Promise}
   */
  decrypt(el, text) {
    return this.instances.decrypt.animate(el, text);
  },

  /**
   * Anima uma string via callback (para terminal).
   * @param {string} text
   * @param {Function} onUpdate
   * @returns {Promise}
   */
  decryptString(text, onUpdate) {
    return this.instances.decrypt.animateString(text, onUpdate);
  },

  /**
   * Dispara glitch em todos os elementos [data-glitch]
   */
  triggerAllGlitches() {
    this.instances.glitch.forEach(g => g.trigger());
  }
};

// Expõe globalmente
window.ReactBitsEffects = ReactBitsEffects;
window.ScrambleText = ScrambleText;
window.DecryptedText = DecryptedText;
window.GlitchText = GlitchText;

// Auto-init quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ReactBitsEffects.init());
} else {
  ReactBitsEffects.init();
}
