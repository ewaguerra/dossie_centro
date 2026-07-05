/**
 * Links para outras superfícies do ARG (Landing, Arquivo Morto, Arquivista).
 * Defaults: subpaths no mesmo domínio (deploy monodomínio).
 * Override: window.CENTRO_SURFACE_LINKS ou /config/surface-links.json
 */
(function initCentroSurfaceLinks() {
  "use strict";

  var DEFAULTS = {
    landing: "/landing/",
    "arquivo-morto": "/arquivo-morto/",
    arquivista: "/arquivista/",
  };

  function apply(overrides) {
    var links = Object.assign(
      {},
      DEFAULTS,
      window.CENTRO_SURFACE_LINKS || {},
      overrides || {}
    );
    document.querySelectorAll("[data-surface-link]").forEach(function (el) {
      var key = el.getAttribute("data-surface-link");
      if (links[key]) el.setAttribute("href", links[key]);
    });
  }

  apply();

  // Em deploy monodomínio, /config/surface-links.json define URLs finais.
  // Neste repo só o Centro existe — links default apontam para rotas 404 locais
  // até override via window.CENTRO_SURFACE_LINKS ou JSON de deploy.
  fetch("/config/surface-links.json", { cache: "no-store" })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (cfg) {
      if (cfg) apply(cfg);
    })
    .catch(function () {});
})();
