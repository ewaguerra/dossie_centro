/**
 * Alma 07 — Rasgue o Asfalto (Fase 7)
 * Missão narrativa: visão subterrânea, 13 esferas, avanço para Fase 8.
 */
(function () {
  "use strict";

  var ID = "alma-07";
  var PHASE = 7;
  var NEXT_PHASE = 8;

  function getSub() {
    return window.CENTRO && window.CENTRO.subterraneanCutaway;
  }

  function getPhaseApi() {
    return window.CENTRO && window.CENTRO.protocoloPhase;
  }

  function countSoulsFound() {
    var sub = getSub();
    if (sub && typeof sub.countSoulsFound === "function") return sub.countSoulsFound();
    return 0;
  }

  function countGeoFound() {
    var sub = getSub();
    if (sub && typeof sub.countGeoFound === "function") return sub.countGeoFound();
    return 0;
  }

  function soulTarget() {
    var sub = getSub();
    return sub && sub.SOUL_COUNT ? sub.SOUL_COUNT : 13;
  }

  function geoTarget() {
    var sub = getSub();
    return sub && sub.GEO_COUNT ? sub.GEO_COUNT : 5;
  }

  function isGateOpen() {
    var sub = getSub();
    return sub && typeof sub.isUnlocked === "function" ? sub.isUnlocked() : false;
  }

  function isViewActive() {
    var sub = getSub();
    if (sub && typeof sub.isViewEnabled === "function") return sub.isViewEnabled();
    try {
      return (
        window.localStorage &&
        window.localStorage.getItem("centroSubterraneanEnabled") === "1"
      );
    } catch (_e) {
      return false;
    }
  }

  function buildMissions() {
    var souls = countSoulsFound();
    var geo = countGeoFound();
    var soulMax = soulTarget();
    var geoMax = geoTarget();

    return [
      {
        id: "gate",
        title: "Reunir pistas e desbloquear o subsolo",
        complete: isGateOpen(),
      },
      {
        id: "toggle",
        title: "Ativar visão subterrânea na sidebar",
        complete: isViewActive(),
      },
      {
        id: "souls",
        title: "Encontrar as 13 esferas do corte",
        complete: souls >= soulMax,
        progress: souls + "/" + soulMax,
      },
      {
        id: "geo",
        title: "Registrar evidências geológicas",
        complete: geo >= geoMax,
        progress: geo + "/" + geoMax,
      },
    ];
  }

  function isComplete() {
    return countSoulsFound() >= soulTarget();
  }

  function getProgressLabel() {
    if (!isGateOpen()) return "Missão bloqueada — fase 7 e 3 pistas do subsolo.";
    var souls = countSoulsFound();
    var max = soulTarget();
    if (isComplete()) return "Missão concluída — 13/13 esferas do subsolo.";
    return "Missão em curso — " + souls + "/" + max + " esferas do subsolo.";
  }

  function tryAdvancePhase() {
    if (!isComplete()) return false;
    var ph = getPhaseApi();
    if (!ph || typeof ph.getPhase !== "function" || typeof ph.setPhase !== "function") {
      return false;
    }
    if (ph.getPhase() >= NEXT_PHASE) return false;
    ph.setPhase(NEXT_PHASE);
    if (typeof window.centroToast === "function") {
      window.centroToast(
        "Protocolo 13 — Fase 7 concluída. Alma 08 — Setores interditos desbloqueada.",
        "warn"
      );
    }
    return true;
  }

  function create(ctx) {
    ctx = ctx || {};
    var instance = {
      id: ID,
      phase: PHASE,
      title: "Rasgue o Asfalto",
      kicker: "Sétima Alma",
      missions: [],
      isComplete: isComplete,
      getProgressLabel: getProgressLabel,
      refreshMissions: function () {
        instance.missions = buildMissions();
        return instance.missions;
      },
      onActivate: function () {
        instance.refreshMissions();
      },
      onResync: function () {
        instance.refreshMissions();
        tryAdvancePhase();
      },
      tryAdvancePhase: tryAdvancePhase,
    };
    instance.refreshMissions();
    return instance;
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.missions = window.CENTRO.missions || {};
  window.CENTRO.missions[ID] = { create: create, phase: PHASE };
})();
