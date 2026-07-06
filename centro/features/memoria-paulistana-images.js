/**
 * Manifest de imagens Wikipedia para placas da Memória Paulistana.
 */
(function () {
  "use strict";

  var MANIFEST_URL = "/centro/data/catalog/memoria-paulistana-images.json";
  var cache = null;
  var loadPromise = null;

  function load() {
    if (cache) return Promise.resolve(cache);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(MANIFEST_URL)
      .then(function (res) {
        return res.ok ? res.json() : {};
      })
      .then(function (data) {
        cache = data && typeof data === "object" ? data : {};
        return cache;
      })
      .catch(function () {
        cache = {};
        return cache;
      });
    return loadPromise;
  }

  function lookup(identificador) {
    if (!cache || identificador == null || identificador === "") return null;
    return cache[String(identificador)] || null;
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.memoriaPaulistanaImages = {
    load: load,
    lookup: lookup,
  };
})();
