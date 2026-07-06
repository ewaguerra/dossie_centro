/**
 * Pistas históricas — Rua São Bento
 */
(function () {
  "use strict";

  var U = window.CENTRO && window.CENTRO.utils;

  var PISTAS_RUA_SAO_BENTO_POI = Object.freeze({
    sourceId: "rsb-pistas-source",
    hitboxLayerId: "rsb-pistas-hitbox",
    fillLayerId: "rsb-pistas-fill",
    iconLayerId: "rsb-pistas-icon",
    outlineLayerId: "rsb-pistas-outline",
    geojsonPath: "assets/pistas/rua-sao-bento-pistas.json",
  });

  var RSB_POI_LAYERS = Object.freeze({
    hitbox: "rsb-pistas-hitbox",
    fill: "rsb-pistas-fill",
    icon: "rsb-pistas-icon",
    outline: "rsb-pistas-outline",
  });

  var ruaSaoBentoPistasPromise = null;

  function normalizeText(value) {
    if (!value || typeof value !== "string") return "";
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function isRuaSaoBentoFeature(feature) {
    if (!feature || !feature.properties) return false;
    var props = feature.properties;
    var pistaMatch = props.tags && typeof props.tags === "string" && props.tags.includes("pista_rua_sao_bento");
    if (pistaMatch) return true;
    var name = normalizeText(props.name || props.nome || props.title || "");
    var slug = normalizeText(props.slug || props.id || "");
    return (
      name.includes("sao bento") ||
      name.includes("são bento") ||
      slug.includes("sao-bento") ||
      slug.includes("pista")
    );
  }

  function loadRuaSaoBentoPistas() {
    if (!ruaSaoBentoPistasPromise) {
      ruaSaoBentoPistasPromise = U.fetchCentroJson(
        "assets/pistas/rua-sao-bento-pistas.json"
      );
    }
    return ruaSaoBentoPistasPromise;
  }

  function createRuaSaoBentoPistasProfileCard(items, properties) {
    var POPUP = window.MAPA_SP_POPUP;
    if (!POPUP) return "<p>Erro: POPUP não disponível</p>";
    var mainProps = {};
    if (properties) {
      mainProps.title = properties.name || properties.title || "Pista Histórica";
      mainProps.description = properties.description || "";
    }
    if (typeof POPUP.renderFeaturePopup !== 'function') {
      console.warn('[CENTRO] POPUP.renderFeaturePopup nao disponivel — renderizando fallback');
      var fallbackHtml = '<div style="padding:8px;font-family:sans-serif;">' +
        '<h3 style="margin:0 0 6px;">' + (mainProps.title || 'Pista') + '</h3>' +
        (mainProps.description ? '<p style="font-size:12px;color:#555;">' + mainProps.description + '</p>' : '') +
        '</div>';
      return fallbackHtml;
    }
    return POPUP.renderFeaturePopup(
      { properties: mainProps },
      { extraCards: items }
    );
  }

  // ── Exports ────────────────────────────────────────────────────────────
  var PISTAS_RSB_STORAGE_KEY = "centroPistasRsbVisible";
  var pistasGetMap = null;

  function isPistasRsbUnlocked() {
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.isFeaturePhaseUnlocked === "function") {
      return ph.isFeaturePhaseUnlocked("pistas-rsb");
    }
    return true;
  }

  function getPistasRsbLockLabel() {
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.formatPhaseLockLabel === "function" && typeof ph.getMinPhaseForFeature === "function") {
      return ph.formatPhaseLockLabel(ph.getMinPhaseForFeature("pistas-rsb"));
    }
    return "";
  }

  function syncPistasRsbToggleUI(toggle, getMap) {
    var unlocked = isPistasRsbUnlocked();
    var row = toggle.closest(".sidebar-pistas-toggle") || toggle.closest("label");
    toggle.disabled = !unlocked;
    if (row) row.classList.toggle("layer-row--phase-locked", !unlocked);

    var lockMeta = row && row.querySelector(".sidebar-pistas-toggle__phase-lock");
    if (!unlocked && row) {
      if (!lockMeta) {
        lockMeta = document.createElement("span");
        lockMeta.className = "layer-meta layer-meta--lock sidebar-pistas-toggle__phase-lock";
        row.appendChild(lockMeta);
      }
      lockMeta.textContent = getPistasRsbLockLabel();
      toggle.checked = false;
      setPistasRsbVisibility(getMap(), false);
    } else if (lockMeta) {
      lockMeta.remove();
    }
  }

  function setPistasRsbVisibility(map, visible) {
    if (!map) return;
    var layerIds = [
      RSB_POI_LAYERS.hitbox,
      RSB_POI_LAYERS.fill,
      RSB_POI_LAYERS.icon,
      RSB_POI_LAYERS.outline,
    ];
    var visibility = visible ? "visible" : "none";
    for (var i = 0; i < layerIds.length; i++) {
      if (map.getLayer(layerIds[i])) {
        map.setLayoutProperty(layerIds[i], "visibility", visibility);
      }
    }
  }

  function syncPhaseGate() {
    var toggle = document.getElementById("centro-pistas-rsb-toggle");
    if (!toggle || typeof pistasGetMap !== "function") return;
    syncPistasRsbToggleUI(toggle, pistasGetMap);
    if (isPistasRsbUnlocked() && toggle.checked) {
      setPistasRsbVisibility(pistasGetMap(), true);
    }
  }

  function readPistasRsbVisibleFromStorage() {
    try {
      if (window.localStorage) {
        return window.localStorage.getItem(PISTAS_RSB_STORAGE_KEY) === "1";
      }
    } catch (_e) {
      // ignora
    }
    return false;
  }

  function restoreFromStorage(map) {
    var mapRef = map;
    if (!mapRef && typeof pistasGetMap === "function") mapRef = pistasGetMap();
    if (!mapRef) return;

    var toggle = document.getElementById("centro-pistas-rsb-toggle");
    var visible = readPistasRsbVisibleFromStorage() && isPistasRsbUnlocked();
    if (toggle) {
      toggle.checked = visible;
      syncPistasRsbToggleUI(toggle, function () {
        return mapRef;
      });
    }
    setPistasRsbVisibility(mapRef, visible);
  }

  function setupPistasRsbToggle(getMap) {
    var toggle = document.getElementById("centro-pistas-rsb-toggle");
    if (!toggle || typeof getMap !== "function") return;
    pistasGetMap = getMap;

    var visible = readPistasRsbVisibleFromStorage();
    if (!isPistasRsbUnlocked()) visible = false;
    toggle.checked = visible;
    syncPistasRsbToggleUI(toggle, getMap);
    setPistasRsbVisibility(getMap(), visible);

    toggle.addEventListener("change", function () {
      if (!isPistasRsbUnlocked()) {
        toggle.checked = false;
        setPistasRsbVisibility(getMap(), false);
        if (typeof window.centroToast === "function") {
          window.centroToast(
            "Pistas bloqueadas. " + (getPistasRsbLockLabel() || "Avance uma fase no Protocolo."),
            "warn"
          );
        }
        return;
      }
      var next = toggle.checked;
      setPistasRsbVisibility(getMap(), next);
      try {
        if (window.localStorage) {
          window.localStorage.setItem(PISTAS_RSB_STORAGE_KEY, next ? "1" : "0");
        }
      } catch (_e) {
        // ignora
      }
    });
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.pistas = {
    CONFIG: PISTAS_RUA_SAO_BENTO_POI,
    POI_LAYERS: RSB_POI_LAYERS,
    PISTAS_RSB_STORAGE_KEY: PISTAS_RSB_STORAGE_KEY,
    loadRuaSaoBentoPistas: loadRuaSaoBentoPistas,
    isRuaSaoBentoFeature: isRuaSaoBentoFeature,
    normalizeText: normalizeText,
    createRuaSaoBentoPistasProfileCard: createRuaSaoBentoPistasProfileCard,
    setPistasRsbVisibility: setPistasRsbVisibility,
    restoreFromStorage: restoreFromStorage,
    setupPistasRsbToggle: setupPistasRsbToggle,
    syncPhaseGate: syncPhaseGate,
    isPistasRsbUnlocked: isPistasRsbUnlocked,
  };
})();
