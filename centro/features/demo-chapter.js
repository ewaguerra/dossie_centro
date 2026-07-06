/**
 * Capítulo demo livro-jogo — Demonão e Titília (progresso + senhas narrativas).
 */
(function () {
  "use strict";

  var CHAPTER_URL = "/centro/data/demo/demonao-titilia-chapter.json";
  var STORAGE_KEY = "centro_demo_demonao_progress";
  var REVEAL_ALL_MARKERS_KEY = "centro_demo_reveal_all_markers";
  var CLUES_STORAGE_KEY = "protocolo13_caderno_clues";

  var chapterPromise = null;
  var chapterCache = null;

  function normalizeSecret(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function loadChapter() {
    if (chapterCache) return Promise.resolve(chapterCache);
    if (chapterPromise) return chapterPromise;
    chapterPromise = fetch(CHAPTER_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("Capítulo demo indisponível");
        return res.json();
      })
      .then(function (data) {
        chapterCache = data;
        return data;
      });
    return chapterPromise;
  }

  function getProgress() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { stepIndex: 0, completed: false };
      var parsed = JSON.parse(raw);
      return {
        stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
        completed: !!parsed.completed,
      };
    } catch (_e) {
      return { stepIndex: 0, completed: false };
    }
  }

  function saveProgress(progress) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      }
    } catch (_e) {
      /* ignora */
    }
    dispatchProgressEvent();
  }

  function dispatchProgressEvent() {
    try {
      document.dispatchEvent(new CustomEvent("centro:demo-progress-changed"));
    } catch (_e) {
      /* ignora */
    }
  }

  function dispatchRevealEvent() {
    try {
      document.dispatchEvent(new CustomEvent("centro:demo-markers-reveal-changed"));
    } catch (_e) {
      /* ignora */
    }
  }

  function registerClue(clueId) {
    if (!clueId) return;
    try {
      if (!window.localStorage) return;
      var raw = window.localStorage.getItem(CLUES_STORAGE_KEY);
      var list = [];
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed.slice();
      }
      if (list.indexOf(clueId) === -1) list.push(clueId);
      window.localStorage.setItem(CLUES_STORAGE_KEY, JSON.stringify(list));
    } catch (_e) {
      /* ignora */
    }
  }

  function getSteps() {
    return chapterCache && Array.isArray(chapterCache.steps) ? chapterCache.steps : [];
  }

  function getCurrentStepIndex() {
    var progress = getProgress();
    if (progress.completed) return getSteps().length;
    return Math.min(progress.stepIndex, Math.max(0, getSteps().length - 1));
  }

  function getCurrentStep() {
    var steps = getSteps();
    var idx = getCurrentStepIndex();
    if (progressIsComplete()) return null;
    return steps[idx] || null;
  }

  function progressIsComplete() {
    return getProgress().completed;
  }

  function isStepUnlocked(index) {
    var progress = getProgress();
    if (progress.completed) return true;
    return index <= progress.stepIndex;
  }

  function stepMarkerIds(step) {
    if (!step) return [];
    var ids = [];
    if (step.markerId) ids.push(step.markerId);
    if (Array.isArray(step.markerIds)) {
      for (var j = 0; j < step.markerIds.length; j++) {
        if (ids.indexOf(step.markerIds[j]) === -1) ids.push(step.markerIds[j]);
      }
    }
    return ids;
  }

  function isRevealAllMarkers() {
    try {
      return window.localStorage && window.localStorage.getItem(REVEAL_ALL_MARKERS_KEY) === "1";
    } catch (_e) {
      return false;
    }
  }

  function setRevealAllMarkers(reveal) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(REVEAL_ALL_MARKERS_KEY, reveal ? "1" : "0");
      }
    } catch (_e) {
      /* ignora */
    }
    dispatchRevealEvent();
  }

  function isMarkerVisible(markerId) {
    if (!markerId) return false;
    if (isRevealAllMarkers()) return true;
    var steps = getSteps();
    if (!steps.length) return false;
    var progress = getProgress();
    for (var i = 0; i < steps.length; i++) {
      var ids = stepMarkerIds(steps[i]);
      if (ids.indexOf(markerId) === -1) continue;
      // Marcador aparece só depois de decodificar o passo (pista descoberta).
      if (i < progress.stepIndex) return true;
      if (progress.completed) return true;
    }
    return false;
  }

  function passwordsMatch(step, input) {
    if (!step || !Array.isArray(step.passwords)) return false;
    var normalized = normalizeSecret(input);
    if (!normalized) return false;
    for (var i = 0; i < step.passwords.length; i++) {
      if (normalizeSecret(step.passwords[i]) === normalized) return true;
    }
    return false;
  }

  function submitPassword(input) {
    var step = getCurrentStep();
    if (!step) return { ok: false, reason: "complete" };
    if (!passwordsMatch(step, input)) return { ok: false, reason: "wrong" };
    registerClue(step.clueId);
    var steps = getSteps();
    var nextIndex = getProgress().stepIndex + 1;
    if (nextIndex >= steps.length) {
      saveProgress({ stepIndex: steps.length, completed: true });
      return { ok: true, advanced: true, completed: true, step: step };
    }
    saveProgress({ stepIndex: nextIndex, completed: false });
    return { ok: true, advanced: true, completed: false, step: step };
  }

  function resetProgress() {
    try {
      if (window.localStorage) window.localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {
      /* ignora */
    }
    dispatchProgressEvent();
  }

  function getStepStatus(index) {
    var progress = getProgress();
    if (progress.completed) return "completed";
    if (index < progress.stepIndex) return "completed";
    if (index === progress.stepIndex) return "active";
    return "locked";
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.demoChapter = {
    loadChapter: loadChapter,
    getProgress: getProgress,
    getSteps: getSteps,
    getCurrentStep: getCurrentStep,
    getCurrentStepIndex: getCurrentStepIndex,
    getStepStatus: getStepStatus,
    isStepUnlocked: isStepUnlocked,
    isMarkerVisible: isMarkerVisible,
    isRevealAllMarkers: isRevealAllMarkers,
    setRevealAllMarkers: setRevealAllMarkers,
    submitPassword: submitPassword,
    resetProgress: resetProgress,
    progressIsComplete: progressIsComplete,
    normalizeSecret: normalizeSecret,
  };
})();
