/**
 * Lazy loading de imagens injectadas dinamicamente (popups, etc.).
 */
(function () {
  "use strict";

  function setupLazyImageObserver() {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeName === "IMG" && !n.loading) {
            n.setAttribute("loading", "lazy");
          }
          if (n.querySelectorAll) {
            n.querySelectorAll("img:not([loading])").forEach(function (img) {
              img.setAttribute("loading", "lazy");
            });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("[CENTRO] Lazy loading observer ativo");
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.setupLazyImageObserver = setupLazyImageObserver;
})();
