/**
 * Carregador lazy das missões alma-01 … alma-13.
 * Injeta <script> sob demanda para reduzir round-trips no boot.
 */
(function () {
  "use strict";

  var SCRIPT_BASE = "/pages/centro/missions/";
  /** @type {Record<string, Promise<void>>} */
  var loadPromises = Object.create(null);
  /** @type {Record<string, boolean>} */
  var loadedIds = Object.create(null);

  function scriptUrlFor(id) {
    return SCRIPT_BASE + id + "/index.js";
  }

  function ensureMissionLoaded(id) {
    if (!id || typeof id !== "string") {
      return Promise.reject(new Error("ensureMissionLoaded: id obrigatório"));
    }
    if (loadedIds[id]) {
      return Promise.resolve();
    }
    if (loadPromises[id]) {
      return loadPromises[id];
    }

    var url = scriptUrlFor(id);
    loadPromises[id] = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = url;
      script.defer = true;
      script.onload = function () {
        loadedIds[id] = true;
        resolve();
      };
      script.onerror = function () {
        delete loadPromises[id];
        reject(new Error("Falha ao carregar missão " + id + " (" + url + ")"));
      };
      document.head.appendChild(script);
    });

    return loadPromises[id];
  }

  function isMissionLoaded(id) {
    return !!loadedIds[id];
  }

  function preloadMissions(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return Promise.resolve();
    }
    return Promise.all(ids.map(function (id) {
      return ensureMissionLoaded(id).catch(function (err) {
        console.warn("[CENTRO]", err.message);
      });
    }));
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missionLoader = {
    ensureMissionLoaded: ensureMissionLoaded,
    isMissionLoaded: isMissionLoaded,
    preloadMissions: preloadMissions,
    scriptUrlFor: scriptUrlFor,
  };
})();
