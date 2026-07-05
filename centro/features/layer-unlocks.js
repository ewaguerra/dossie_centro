/**
 * Desbloqueio de camadas ← Caderno do Arquivista (localStorage + deep-link).
 */
(function () {
  "use strict";

  var CADERNO_STORAGE_KEY = "protocolo13_caderno_clues";

  function getCollectedClueIds() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(CADERNO_STORAGE_KEY);
      if (!raw) return new Set();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      var ids = new Set();
      for (var i = 0; i < parsed.length; i++) {
        if (typeof parsed[i] === "string") ids.add(parsed[i]);
      }
      return ids;
    } catch (_e) {
      return new Set();
    }
  }

  function isLayerUnlocked(layerId, layerUnlockRules) {
    if (!layerUnlockRules || !layerUnlockRules[layerId]) return true;
    var required = layerUnlockRules[layerId];
    var collected = getCollectedClueIds();
    for (var i = 0; i < required.length; i++) {
      if (!collected.has(required[i])) return false;
    }
    return true;
  }

  /** ?clues=id1,id2 — merge sem apagar pistas já colectadas. */
  function applyDeepLinkClues() {
    try {
      var params = new URLSearchParams(window.location.search);
      var clues = params.get("clues");
      if (!clues) return;
      var incoming = clues.split(",").map(function (s) {
        return s.trim();
      }).filter(Boolean);
      if (incoming.length === 0) return;
      var existing = [];
      var raw = window.localStorage && window.localStorage.getItem(CADERNO_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) existing = parsed;
      }
      var set = new Set(existing);
      var added = false;
      for (var i = 0; i < incoming.length; i++) {
        if (!set.has(incoming[i])) added = true;
        set.add(incoming[i]);
      }
      window.localStorage.setItem(
        CADERNO_STORAGE_KEY,
        JSON.stringify(Array.from(set))
      );
      if (added) {
        try {
          document.dispatchEvent(new CustomEvent("centro:arg-state-changed"));
        } catch (_e) {
          // ignora
        }
      }
    } catch (_e) {
      // localStorage indisponível — ignora.
    }
  }

  applyDeepLinkClues();

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.layerUnlocks = {
    CADERNO_STORAGE_KEY: CADERNO_STORAGE_KEY,
    getCollectedClueIds: getCollectedClueIds,
    isLayerUnlocked: isLayerUnlocked,
    applyDeepLinkClues: applyDeepLinkClues,
  };
})();
