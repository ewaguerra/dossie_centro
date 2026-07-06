/**
 * Registo central das missões — uma entrada por alma (alma-01 … alma-13).
 * Cada pasta `centro/missions/alma-NN/index.js` auto-regista em window.CENTRO.missions.
 */
(function () {
  "use strict";

  var ALMA_IDS = Object.freeze([
    "alma-01",
    "alma-02",
    "alma-03",
    "alma-04",
    "alma-05",
    "alma-06",
    "alma-07",
    "alma-08",
    "alma-09",
    "alma-10",
    "alma-11",
    "alma-12",
    "alma-13",
  ]);

  function get(id) {
    var missions = window.CENTRO && window.CENTRO.missions;
    if (!missions || !id) return null;
    return missions[id] || null;
  }

  function createSoul(id, ctx) {
    var mod = get(id);
    if (!mod || typeof mod.create !== "function") return null;
    return mod.create(ctx);
  }

  function forPhase(phase) {
    var n = parseInt(phase, 10);
    if (!isFinite(n) || n < 1 || n > ALMA_IDS.length) return null;
    return get("alma-" + String(n).padStart(2, "0"));
  }

  function listIds() {
    return ALMA_IDS.slice();
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missionsRegistry = {
    ids: ALMA_IDS,
    get: get,
    createSoul: createSoul,
    forPhase: forPhase,
    listIds: listIds,
  };
})();
