/**
 * Gate de primeira visita — senha narrativa antes de usar o mapa.
 * Senha em texto claro (teatro ARG); persistência em localStorage.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "centroAccessGranted";
  var PASSWORD = "joelma";

  function normalizeSecret(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isGranted() {
    try {
      return window.localStorage && window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_e) {
      return false;
    }
  }

  function shouldSkipGate() {
    if (isGranted()) return true;
    try {
      if (/[?&]master=1\b/.test(window.location.search)) return true;
    } catch (_e) {
      /* ignora */
    }
    return false;
  }

  function resetFreshMapPreferences() {
    try {
      if (!window.localStorage) return;
      window.localStorage.removeItem("centroPoiThemeFilter");
      window.localStorage.removeItem("centroPistasRsbVisible");
      window.localStorage.removeItem("centroBuildings3D");
      window.localStorage.removeItem("centroSubterraneanEnabled");
    } catch (_e) {
      /* ignora */
    }
  }

  function grantAccess() {
    try {
      if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, "1");
    } catch (_e) {
      /* ignora */
    }
    resetFreshMapPreferences();
  }

  function getElements() {
    return {
      gate: document.getElementById("centro-access-gate"),
      form: document.getElementById("centro-access-gate-form"),
      input: document.getElementById("centro-access-gate-input"),
      error: document.getElementById("centro-access-gate-error"),
    };
  }

  function setGateVisible(visible) {
    var els = getElements();
    if (!els.gate) return;
    els.gate.hidden = !visible;
    document.body.classList.toggle("centro-access-locked", visible);
    if (visible && els.input) {
      window.requestAnimationFrame(function () {
        els.input.focus();
      });
    }
  }

  function showError(message) {
    var els = getElements();
    if (!els.error) return;
    els.error.textContent = message || "Chave recusada.";
    els.error.hidden = false;
    if (els.gate) els.gate.classList.add("centro-access-gate--shake");
    window.setTimeout(function () {
      if (els.gate) els.gate.classList.remove("centro-access-gate--shake");
    }, 450);
  }

  function clearError() {
    var els = getElements();
    if (!els.error) return;
    els.error.hidden = true;
  }

  function wireForm(onSuccess) {
    var els = getElements();
    if (!els.form || els.form.dataset.centroAccessWired === "1") return;
    els.form.dataset.centroAccessWired = "1";

    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();
      var attempt = normalizeSecret(els.input && els.input.value);
      if (attempt !== normalizeSecret(PASSWORD)) {
        showError("Chave recusada. Verifique a dica abaixo.");
        return;
      }
      grantAccess();
      setGateVisible(false);
      if (typeof onSuccess === "function") onSuccess();
    });
  }

  function install(onUnlock) {
    if (shouldSkipGate()) {
      setGateVisible(false);
      if (typeof onUnlock === "function") onUnlock();
      return;
    }
    setGateVisible(true);
    wireForm(onUnlock);
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.accessGate = {
    STORAGE_KEY: STORAGE_KEY,
    PASSWORD: PASSWORD,
    isGranted: isGranted,
    shouldSkipGate: shouldSkipGate,
    grantAccess: grantAccess,
    resetFreshMapPreferences: resetFreshMapPreferences,
    install: install,
  };
})();
