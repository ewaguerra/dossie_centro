/**
 * Raio investigativo — spotlight forense no mapa + tilt ProfileCard (pistas).
 * Coordenadas relativas ao container #map (pan/zoom/resize correctos).
 */
(function () {
  "use strict";

  var RAY_ID = "centro-investigation-ray";
  var PROFILE_SELECTOR = ".pc-card-wrapper.pistas-profile-card-bits";

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function shouldShowRay() {
    if (prefersReducedMotion()) return false;
    if (document.body.classList.contains("centro-access-locked")) return false;
    if (document.body.classList.contains("subterranean-active")) return false;
    return true;
  }

  function wireProfileCard(card) {
    if (!card || card.dataset.centroProfileCardWired === "1") return;
    card.dataset.centroProfileCardWired = "1";

    function onMove(e) {
      var rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var px = (x / rect.width) * 100;
      var py = (y / rect.height) * 100;
      var fromCenter =
        Math.hypot(x - rect.width / 2, y - rect.height / 2) /
        (Math.hypot(rect.width, rect.height) / 2);
      card.style.setProperty("--pointer-x", px + "%");
      card.style.setProperty("--pointer-y", py + "%");
      card.style.setProperty("--pointer-from-center", String(Math.min(1, fromCenter)));
      card.style.setProperty("--pointer-from-top", String(y / rect.height));
      card.style.setProperty("--pointer-from-left", String(x / rect.width));
      card.style.setProperty("--background-x", px + "%");
      card.style.setProperty("--background-y", py + "%");
      card.style.setProperty("--rotate-x", ((y / rect.height - 0.5) * -10).toFixed(2) + "deg");
      card.style.setProperty("--rotate-y", ((x / rect.width - 0.5) * 10).toFixed(2) + "deg");
      card.style.setProperty("--card-opacity", "1");
      card.classList.add("active");
    }

    function onLeave() {
      card.classList.remove("active");
      card.style.setProperty("--card-opacity", "0");
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
    }

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
  }

  function scanProfileCards(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches(PROFILE_SELECTOR)) wireProfileCard(root);
    if (!root.querySelectorAll) return;
    var nodes = root.querySelectorAll(PROFILE_SELECTOR);
    for (var i = 0; i < nodes.length; i++) wireProfileCard(nodes[i]);
  }

  function create(getMap) {
    var rayEl = null;
    var listening = false;
    var rafId = null;
    var pending = null;
    var profileObserver = null;

    function mapContainer() {
      var map = typeof getMap === "function" ? getMap() : null;
      if (map && map.getContainer) return map.getContainer();
      return document.getElementById("map");
    }

    function ensureRayElement(container) {
      if (!rayEl) {
        rayEl = document.createElement("div");
        rayEl.id = RAY_ID;
        rayEl.className = "centro-investigation-ray";
        rayEl.setAttribute("aria-hidden", "true");
        rayEl.hidden = true;
      }
      if (container && rayEl.parentElement !== container) {
        container.appendChild(rayEl);
      }
      return rayEl;
    }

    function paintRay(point) {
      if (!rayEl || !point) return;
      rayEl.style.setProperty("--ray-x", point.x + "px");
      rayEl.style.setProperty("--ray-y", point.y + "px");
      rayEl.hidden = false;
    }

    function flushRay() {
      rafId = null;
      if (!shouldShowRay()) {
        if (rayEl) rayEl.hidden = true;
        pending = null;
        return;
      }
      if (!pending) {
        if (rayEl) rayEl.hidden = true;
        return;
      }
      paintRay(pending);
      pending = null;
    }

    function scheduleRay(clientX, clientY) {
      var container = mapContainer();
      if (!container) return;

      ensureRayElement(container);

      if (!shouldShowRay()) {
        rayEl.hidden = true;
        return;
      }

      var rect = container.getBoundingClientRect();
      var x = clientX - rect.left;
      var y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pending = null;
        if (rayEl) rayEl.hidden = true;
        return;
      }

      pending = { x: x, y: y };
      if (!rafId) {
        rafId = window.requestAnimationFrame(flushRay);
      }
    }

    function onPointerMove(e) {
      scheduleRay(e.clientX, e.clientY);
    }

    function attachToMapContainer() {
      var container = mapContainer();
      if (!container) return false;
      ensureRayElement(container);
      if (!listening) {
        document.addEventListener("pointermove", onPointerMove, { passive: true });
        listening = true;
      }
      return true;
    }

    function setupProfileCardObserver() {
      if (profileObserver) return;
      scanProfileCards(document);
      profileObserver = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            if (added[j].nodeType === 1) scanProfileCards(added[j]);
          }
        }
      });
      profileObserver.observe(document.body, { childList: true, subtree: true });
    }

    function syncVisibility() {
      if (!shouldShowRay() && rayEl) rayEl.hidden = true;
    }

    function install() {
      if (prefersReducedMotion()) return;
      attachToMapContainer();
      setupProfileCardObserver();
      document.addEventListener("centro:arg-state-changed", syncVisibility);
      if (!document.body.dataset.centroRayBodyObs) {
        document.body.dataset.centroRayBodyObs = "1";
        new MutationObserver(syncVisibility).observe(document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    }

    return {
      install: install,
      attachToMapContainer: attachToMapContainer,
      wireProfileCard: wireProfileCard,
      scanProfileCards: scanProfileCards,
      syncVisibility: syncVisibility,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.investigationRay = { create: create };
})();
