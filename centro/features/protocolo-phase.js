/**
 * Fases ARG — protocolo13_phase + phase-gates.json (13 Almas / 13 Fases).
 */
(function () {
  "use strict";

  var PHASE_STORAGE_KEY = "protocolo13_phase";
  var MAX_PHASE = 13;
  var gatesPromise = null;
  var gatesData = null;

  function loadPhaseGates() {
    if (!gatesPromise) {
      gatesPromise = fetch("/centro/data/catalog/phase-gates.json")
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (data) {
          gatesData = data || {
            defaultMinPhase: 1,
            layerMinPhase: {},
            themeMinPhase: {},
            featureMinPhase: {},
            clueCountAdvance: [],
          };
          if (data && data.maxPhase) MAX_PHASE = data.maxPhase;
          return gatesData;
        })
        .catch(function () {
          gatesData = {
            defaultMinPhase: 1,
            layerMinPhase: {},
            themeMinPhase: {},
            featureMinPhase: {},
            clueCountAdvance: [],
          };
          return gatesData;
        });
    }
    return gatesPromise;
  }

  function getPhase() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(PHASE_STORAGE_KEY);
      var n = parseInt(raw, 10);
      if (!isFinite(n) || n < 1) return 1;
      return Math.min(MAX_PHASE, n);
    } catch (_e) {
      return 1;
    }
  }

  function setPhase(n) {
    try {
      var v = Math.max(1, Math.min(MAX_PHASE, parseInt(n, 10) || 1));
      window.localStorage.setItem(PHASE_STORAGE_KEY, String(v));
      updatePhaseBadge(v);
      dispatchArgStateChanged();
      return v;
    } catch (_e) {
      return 1;
    }
  }

  function ensureDefaultPhase() {
    try {
      if (!window.localStorage.getItem(PHASE_STORAGE_KEY)) {
        window.localStorage.setItem(PHASE_STORAGE_KEY, "1");
      }
    } catch (_e) {
      // ignora
    }
  }

  function arePhaseGatesReady() {
    return gatesData !== null;
  }

  function dispatchArgStateChanged() {
    try {
      document.dispatchEvent(new CustomEvent("centro:arg-state-changed"));
    } catch (_e) {
      // ignora
    }
  }

  function resolveMinPhase(map, id) {
    if (!gatesData) return MAX_PHASE;
    if (map && map[id] != null) return map[id];
    return gatesData.defaultMinPhase || 1;
  }

  function getMinPhaseForLayer(layerId) {
    return resolveMinPhase(gatesData && gatesData.layerMinPhase, layerId);
  }

  function getMinPhaseForTheme(themeId) {
    return resolveMinPhase(gatesData && gatesData.themeMinPhase, themeId);
  }

  function getMinPhaseForFeature(featureId) {
    return resolveMinPhase(gatesData && gatesData.featureMinPhase, featureId);
  }

  function isPhaseAtLeast(minPhase) {
    if (!gatesData) return false;
    return getPhase() >= (minPhase != null ? minPhase : 1);
  }

  function isLayerPhaseUnlocked(layerId) {
    var mm = window.CENTRO && window.CENTRO.masterMode;
    if (mm && typeof mm.isActive === "function" && mm.isActive()) return true;
    return isPhaseAtLeast(getMinPhaseForLayer(layerId));
  }

  function isThemePhaseUnlocked(themeId) {
    var mm = window.CENTRO && window.CENTRO.masterMode;
    if (mm && typeof mm.isActive === "function" && mm.isActive()) return true;
    return isPhaseAtLeast(getMinPhaseForTheme(themeId));
  }

  function isFeaturePhaseUnlocked(featureId) {
    var mm = window.CENTRO && window.CENTRO.masterMode;
    if (mm && typeof mm.isActive === "function" && mm.isActive()) return true;
    return isPhaseAtLeast(getMinPhaseForFeature(featureId));
  }

  function getSoul(phaseNum) {
    var p = phaseNum != null ? phaseNum : getPhase();
    if (gatesData && Array.isArray(gatesData.souls)) {
      for (var i = 0; i < gatesData.souls.length; i++) {
        if (gatesData.souls[i].phase === p) return gatesData.souls[i];
      }
    }
    var id = "alma-" + String(p).padStart(2, "0");
    return {
      phase: p,
      id: id,
      title: getPhaseTitle(p),
      kicker: "Alma " + String(p).padStart(2, "0"),
    };
  }

  function getPhaseTitle(phaseNum) {
    var p = phaseNum != null ? phaseNum : getPhase();
    if (gatesData && gatesData.phaseTitles && gatesData.phaseTitles[String(p)]) {
      return gatesData.phaseTitles[String(p)];
    }
    return "Fase " + p;
  }

  function formatPhaseLockLabel(minPhase) {
    var soul = getSoul(minPhase);
    return "Alma " + String(minPhase).padStart(2, "0") + " — " + soul.title;
  }

  function computePhaseFromClueCount(count) {
    var phase = 1;
    if (!gatesData || !gatesData.clueCountAdvance) return phase;
    var rules = gatesData.clueCountAdvance.slice().sort(function (a, b) {
      return a.minClues - b.minClues;
    });
    for (var i = 0; i < rules.length; i++) {
      if (count >= rules[i].minClues) phase = Math.max(phase, rules[i].phase);
    }
    return Math.min(MAX_PHASE, phase);
  }

  function maybeAdvancePhaseFromClues() {
    var lu = window.CENTRO && window.CENTRO.layerUnlocks;
    if (!lu || typeof lu.getCollectedClueIds !== "function") return getPhase();
    var count = lu.getCollectedClueIds().size;
    var target = computePhaseFromClueCount(count);
    var current = getPhase();
    if (target > current) return setPhase(target);
    return current;
  }

  function applyPhaseFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      var phase = params.get("phase");
      if (!phase) return getPhase();
      return setPhase(phase);
    } catch (_e) {
      return getPhase();
    }
  }

  function updatePhaseBadge(phaseNum) {
    var p = phaseNum != null ? phaseNum : getPhase();
    var soul = getSoul(p);
    var el = document.getElementById("centro-phase-badge");
    if (el) {
      el.textContent =
        "Alma " +
        String(p).padStart(2, "0") +
        " · Fase " +
        p +
        "/" +
        MAX_PHASE +
        " — " +
        soul.title;
    }
    var landing = document.getElementById("protocolo-phase-badge");
    if (landing) {
      landing.textContent = "Fase " + p + " de " + MAX_PHASE + " (activa)";
    }
  }

  ensureDefaultPhase();
  loadPhaseGates().then(function () {
    applyPhaseFromQuery();
    maybeAdvancePhaseFromClues();
    updatePhaseBadge();
    dispatchArgStateChanged();
  });

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.protocoloPhase = {
    PHASE_STORAGE_KEY: PHASE_STORAGE_KEY,
    MAX_PHASE: MAX_PHASE,
    getPhase: getPhase,
    setPhase: setPhase,
    ensureDefaultPhase: ensureDefaultPhase,
    loadPhaseGates: loadPhaseGates,
    arePhaseGatesReady: arePhaseGatesReady,
    getMinPhaseForLayer: getMinPhaseForLayer,
    getMinPhaseForTheme: getMinPhaseForTheme,
    getMinPhaseForFeature: getMinPhaseForFeature,
    isPhaseAtLeast: isPhaseAtLeast,
    isLayerPhaseUnlocked: isLayerPhaseUnlocked,
    isThemePhaseUnlocked: isThemePhaseUnlocked,
    isFeaturePhaseUnlocked: isFeaturePhaseUnlocked,
    getSoul: getSoul,
    getPhaseTitle: getPhaseTitle,
    formatPhaseLockLabel: formatPhaseLockLabel,
    maybeAdvancePhaseFromClues: maybeAdvancePhaseFromClues,
    applyPhaseFromQuery: applyPhaseFromQuery,
    updatePhaseBadge: updatePhaseBadge,
  };
})();
