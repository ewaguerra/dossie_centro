/**
 * Evidence card chrome — React Bits port (vanilla JS):
 * SpotlightCard, GlareHover, FadeContent, ShinyText, SplitText, ElectricBorder.
 *
 * @see https://github.com/DavidHDev/react-bits
 */
(function () {
  "use strict";

  var TEXT_SCALE_KEY = "centroEvidenceTextScale";
  var TEXT_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.45];
  var TEXT_SCALE_DEFAULT = 1;

  function readTextScale() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(TEXT_SCALE_KEY);
      if (raw == null) return TEXT_SCALE_DEFAULT;
      var value = parseFloat(raw);
      if (TEXT_SCALE_STEPS.indexOf(value) === -1) return TEXT_SCALE_DEFAULT;
      return value;
    } catch (_e) {
      return TEXT_SCALE_DEFAULT;
    }
  }

  function writeTextScale(value) {
    try {
      if (window.localStorage) window.localStorage.setItem(TEXT_SCALE_KEY, String(value));
    } catch (_e) {
      // ignora
    }
  }

  function applyTextScale(cardEl, scale) {
    if (!cardEl) return;
    cardEl.style.setProperty("--evidence-text-scale", String(scale));
    cardEl.dataset.textScale = String(scale);
  }

  function attachTextScaleToolbar(cardEl) {
    if (!cardEl || cardEl.querySelector(".evidence-card__text-tools")) return;

    var scale = readTextScale();
    applyTextScale(cardEl, scale);

    var toolbar = document.createElement("div");
    toolbar.className = "evidence-card__text-tools";
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", "Tamanho do texto");

    var label = document.createElement("span");
    label.className = "evidence-card__text-tools-label";
    label.textContent = "Texto";
    toolbar.appendChild(label);

    function makeBtn(text, delta, title) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "evidence-card__text-btn";
      btn.textContent = text;
      btn.title = title;
      btn.setAttribute("aria-label", title);
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var current = readTextScale();
        var idx = TEXT_SCALE_STEPS.indexOf(current);
        if (idx === -1) idx = TEXT_SCALE_STEPS.indexOf(TEXT_SCALE_DEFAULT);
        var next = idx + delta;
        if (next < 0 || next >= TEXT_SCALE_STEPS.length) return;
        var newScale = TEXT_SCALE_STEPS[next];
        writeTextScale(newScale);
        applyTextScale(cardEl, newScale);
        document.querySelectorAll(".evidence-card[data-text-scale]").forEach(function (node) {
          applyTextScale(node, newScale);
        });
      });
      return btn;
    }

    toolbar.appendChild(makeBtn("A−", -1, "Diminuir texto"));
    toolbar.appendChild(makeBtn("A+", 1, "Aumentar texto"));
    cardEl.insertBefore(toolbar, cardEl.firstChild);
  }

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function onPointerMove(cardEl, event) {
    var rect = cardEl.getBoundingClientRect();
    cardEl.style.setProperty("--mouse-x", event.clientX - rect.left + "px");
    cardEl.style.setProperty("--mouse-y", event.clientY - rect.top + "px");
  }

  /**
   * SplitText-lite: revela título palavra a palavra (ou char se curto).
   */
  function splitTextReveal(element, options) {
    if (!element || element.dataset.splitDone === "1" || prefersReducedMotion()) {
      return element;
    }

    options = options || {};
    var text = element.textContent;
    if (!text || !text.trim()) return element;

    element.dataset.splitDone = "1";
    element.textContent = "";

    var mode = options.mode || (text.length > 42 ? "words" : "chars");
    var parts = mode === "words" ? text.split(/(\s+)/) : Array.from(text);
    var idx = 0;

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (!part) continue;

      if (mode === "words" && /^\s+$/.test(part)) {
        element.appendChild(document.createTextNode(part));
        continue;
      }

      var span = document.createElement("span");
      span.className = options.charClass || "evidence-card__title-char";
      span.textContent = part;
      span.style.setProperty("--char-i", String(idx));
      idx += 1;
      element.appendChild(span);
    }

    return element;
  }

  function decorateEvidenceCardContent(cardEl) {
    if (!cardEl) return;

    var title = cardEl.querySelector(".evidence-card__title");
    if (title) {
      splitTextReveal(title, { charClass: "evidence-card__title-char" });
    }

    var quote = cardEl.querySelector(".evidence-card__quote");
    if (quote && !prefersReducedMotion()) {
      quote.classList.add("evidence-card__quote--blur-in");
    }
  }

  /**
   * Activa spotlight, glare, entrada suave e micro-animações de texto.
   */
  function enhanceEvidenceCard(cardEl, options) {
    if (!cardEl || cardEl.dataset.evidenceEnhanced === "1") return cardEl;

    options = options || {};
    cardEl.dataset.evidenceEnhanced = "1";
    cardEl.classList.add("evidence-card");

    if (options.variant === "sidebar") {
      cardEl.classList.add("evidence-card--sidebar");
    }

    if (options.spotlightColor) {
      cardEl.style.setProperty("--spotlight-color", options.spotlightColor);
    }

    if (!cardEl.querySelector(".evidence-card__spotlight")) {
      var spotlight = document.createElement("div");
      spotlight.className = "evidence-card__spotlight";
      spotlight.setAttribute("aria-hidden", "true");
      cardEl.insertBefore(spotlight, cardEl.firstChild);
    }

    attachTextScaleToolbar(cardEl);

    if (!cardEl.querySelector(".evidence-card__glare")) {
      var glare = document.createElement("div");
      glare.className = "evidence-card__glare";
      glare.setAttribute("aria-hidden", "true");
      var anchor = cardEl.querySelector(".evidence-card__spotlight");
      if (anchor && anchor.nextSibling) {
        cardEl.insertBefore(glare, anchor.nextSibling);
      } else {
        cardEl.appendChild(glare);
      }
    }

    if (!prefersReducedMotion()) {
      cardEl.addEventListener("pointermove", onPointerMove);
      cardEl.addEventListener(
        "pointerleave",
        function () {
          cardEl.style.setProperty("--mouse-x", "50%");
          cardEl.style.setProperty("--mouse-y", "35%");
        },
        { passive: true }
      );
    }

    cardEl.classList.add("evidence-card--enter");
    requestAnimationFrame(function () {
      cardEl.classList.add("evidence-card--visible");
      decorateEvidenceCardContent(cardEl);
    });

    return cardEl;
  }

  function applyElectricBorder(cardEl, color) {
    if (!cardEl || cardEl.classList.contains("electric-border")) return cardEl;
    cardEl.classList.add("electric-border");
    if (color) cardEl.style.setProperty("--electric-color", color);
    return cardEl;
  }

  function enhanceSidebarVizCards(root) {
    root = root || document;
    var cards = root.querySelectorAll(".sidebar-viz-card:not([data-viz-enhanced])");

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      card.dataset.vizEnhanced = "1";

      var isMission = card.classList.contains("sidebar-viz-card--mission");
      if (isMission) {
        applyElectricBorder(card, "rgba(245, 158, 11, 0.85)");
      }

      enhanceEvidenceCard(card, {
        variant: "sidebar",
        spotlightColor: isMission ? "rgba(245, 158, 11, 0.14)" : "rgba(217, 119, 6, 0.1)",
      });

      var title = card.querySelector(".sidebar-viz-card__title");
      if (title) {
        splitTextReveal(title, {
          charClass: "evidence-card__title-char",
          mode: "words",
        });
      }
    }
  }

  function teardownEvidenceCard(cardEl) {
    if (!cardEl) return;
    cardEl.removeEventListener("pointermove", onPointerMove);
    delete cardEl.dataset.evidenceEnhanced;
  }

  /** Propaga --card-accent do card para o wrapper MapLibre (border-top). */
  function syncMapPopupTheme(popup, cardEl) {
    if (!popup || !cardEl) return;

    function apply() {
      var root = popup.getElement && popup.getElement();
      if (!root) return;
      root.classList.add("evidence-popup");

      var content = root.querySelector(".maplibregl-popup-content");
      if (!content) return;

      var accent = cardEl.style.getPropertyValue("--card-accent");
      if (accent) content.style.setProperty("--card-accent", accent);

      var quoteAccent = cardEl.style.getPropertyValue("--quote-accent");
      if (quoteAccent) content.style.setProperty("--quote-accent", quoteAccent);

      var textScale = cardEl.style.getPropertyValue("--evidence-text-scale");
      if (textScale) content.style.setProperty("--evidence-text-scale", textScale);

      var themeClass = null;
      var classes = cardEl.classList;
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].indexOf("evidence-card--theme-") === 0) {
          themeClass = classes[i];
          break;
        }
      }
      if (themeClass) {
        content.classList.add(themeClass);
        root.classList.add(themeClass);
      }

      var closeBtn = root.querySelector(".maplibregl-popup-close-button");
      if (closeBtn) {
        closeBtn.setAttribute("aria-label", "Fechar evidência");
        closeBtn.setAttribute("title", "Fechar");
      }
    }

    if (typeof popup.once === "function") {
      popup.once("open", apply);
    }
    apply();
  }

  function initEvidenceChrome() {
    enhanceSidebarVizCards(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEvidenceChrome);
  } else {
    initEvidenceChrome();
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.enhanceEvidenceCard = enhanceEvidenceCard;
  window.CENTRO.ui.teardownEvidenceCard = teardownEvidenceCard;
  window.CENTRO.ui.splitTextReveal = splitTextReveal;
  window.CENTRO.ui.enhanceSidebarVizCards = enhanceSidebarVizCards;
  window.CENTRO.ui.applyElectricBorder = applyElectricBorder;
  window.CENTRO.ui.syncMapPopupTheme = syncMapPopupTheme;
})();
