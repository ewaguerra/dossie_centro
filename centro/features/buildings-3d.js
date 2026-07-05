/**
 * Maquete 3D — fill-extrusion OpenFreeMap (layer building-3d).
 */
(function () {
  "use strict";

  var LAYER_ID = "building-3d";
  var STORAGE_KEY = "centroBuildings3D";

  function create(ctx) {
    var getMap = ctx.getMap;

    function isPhaseUnlocked() {
      var ph = window.CENTRO && window.CENTRO.protocoloPhase;
      if (ph && typeof ph.isFeaturePhaseUnlocked === "function") {
        return ph.isFeaturePhaseUnlocked("buildings-3d");
      }
      return true;
    }

    function getPhaseLockLabel() {
      var ph = window.CENTRO && window.CENTRO.protocoloPhase;
      if (ph && typeof ph.formatPhaseLockLabel === "function" && typeof ph.getMinPhaseForFeature === "function") {
        return ph.formatPhaseLockLabel(ph.getMinPhaseForFeature("buildings-3d"));
      }
      return "";
    }

    function syncPhaseGateCard() {
      var cb = document.getElementById("centro-buildings-3d-toggle");
      var card = cb && cb.closest(".sidebar-viz-card");
      var unlocked = isPhaseUnlocked();
      if (cb) cb.disabled = !unlocked;
      if (card) {
        card.classList.toggle("sidebar-viz-card--phase-locked", !unlocked);
        var meta = card.querySelector(".sidebar-viz-card__phase-lock");
        if (!unlocked) {
          if (!meta) {
            meta = document.createElement("p");
            meta.className = "sidebar-viz-card__phase-lock";
            card.appendChild(meta);
          }
          meta.textContent = getPhaseLockLabel();
        } else if (meta) {
          meta.remove();
        }
      }
    }

    function getInitialEnabled() {
      try {
        var stored = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
        if (stored === "1") return true;
        if (stored === "0") return false;
      } catch (_e) {
        // ignora
      }
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return false;
      }
      return true;
    }

    function renderLegend() {
      var grid = document.getElementById("buildings-legend-grid");
      var theme = window.MAPA_SP_THEME;
      if (!grid || !theme || !theme.buildings3D) return;

      grid.innerHTML = "";
      var order =
        typeof theme.getBuildings3DHeightBandOrder === "function"
          ? theme.getBuildings3DHeightBandOrder()
          : ["ground", "low", "medium", "tall", "tower", "skyscraper"];
      var labels =
        typeof theme.getBuildings3DHeightBandLabels === "function"
          ? theme.getBuildings3DHeightBandLabels()
          : {};

      for (var i = 0; i < order.length; i++) {
        var key = order[i];
        var band = theme.buildings3D.heightBands[key];
        if (!band) continue;
        var item = document.createElement("div");
        item.className = "buildings-legend__item";
        var swatch = document.createElement("span");
        swatch.className = "buildings-legend__swatch";
        swatch.style.backgroundColor = band.color;
        swatch.setAttribute("aria-hidden", "true");
        var label = document.createElement("span");
        label.className = "buildings-legend__label";
        label.textContent = labels[key] || key;
        item.appendChild(swatch);
        item.appendChild(label);
        grid.appendChild(item);
      }
    }

    function updateLegendVisibility(visible) {
      var legend = document.getElementById("buildings-legend");
      if (legend) legend.hidden = !visible;
    }

    function syncToggleUI(enabled) {
      var cb = document.getElementById("centro-buildings-3d-toggle");
      if (cb) cb.checked = !!enabled;
      updateLegendVisibility(!!enabled);
    }

    function setEnabled(enabled, options) {
      options = options || {};
      if (enabled && !isPhaseUnlocked()) {
        if (!options.silent && typeof window.centroToast === "function") {
          window.centroToast(
            "Maquete 3D bloqueada. " + (getPhaseLockLabel() || "Avance de fase no ARG."),
            "warn"
          );
        }
        syncToggleUI(false);
        return false;
      }
      var map = getMap();
      if (!map || !map.getLayer || !map.getLayer(LAYER_ID)) {
        if (!options.silent) {
          console.warn("[CENTRO] Camada", LAYER_ID, "indisponível no estilo atual");
        }
        return false;
      }

      var theme = window.MAPA_SP_THEME;
      if (enabled && theme && typeof theme.getBuildings3DExtrusionPaint === "function") {
        var paint = theme.getBuildings3DExtrusionPaint();
        var paintKeys = Object.keys(paint);
        for (var p = 0; p < paintKeys.length; p++) {
          map.setPaintProperty(LAYER_ID, paintKeys[p], paint[paintKeys[p]]);
        }
        if (typeof theme.getBuildings3DFilter === "function") {
          map.setFilter(LAYER_ID, theme.getBuildings3DFilter());
        }
        map.setLayoutProperty(LAYER_ID, "visibility", "visible");
      } else {
        map.setLayoutProperty(LAYER_ID, "visibility", "none");
      }

      if (options.persist !== false) {
        try {
          if (window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
          }
        } catch (_e) {
          // ignora
        }
      }
      return true;
    }

    function initState() {
      syncPhaseGateCard();
      var enabled = getInitialEnabled() && isPhaseUnlocked();
      var ok = setEnabled(enabled, { persist: false, silent: true });
      if (!ok && enabled) enabled = false;
      syncToggleUI(enabled);
    }

    function syncPhaseGate() {
      syncPhaseGateCard();
      if (!isPhaseUnlocked()) {
        ctx.mapReadyPromise.then(function () {
          setEnabled(false, { persist: false, silent: true });
          syncToggleUI(false);
        });
        return;
      }
    }

    function setupToggle() {
      var cb = document.getElementById("centro-buildings-3d-toggle");
      if (!cb) return;
      renderLegend();
      syncPhaseGateCard();
      cb.addEventListener("change", function () {
        ctx.mapReadyPromise.then(function () {
          var wantOn = cb.checked;
          if (wantOn && !isPhaseUnlocked()) {
            cb.checked = false;
            updateLegendVisibility(false);
            if (typeof window.centroToast === "function") {
              window.centroToast(
                "Maquete 3D bloqueada. " + (getPhaseLockLabel() || "Avance de fase no ARG."),
                "warn"
              );
            }
            return;
          }
          var ok = setEnabled(wantOn);
          if (!ok && wantOn) {
            cb.checked = false;
            updateLegendVisibility(false);
            if (typeof window.centroToast === "function") {
              window.centroToast("Maquete 3D indisponível neste estilo.", "warn");
            }
            return;
          }
          updateLegendVisibility(wantOn);
        });
      });
    }

    return {
      LAYER_ID: LAYER_ID,
      STORAGE_KEY: STORAGE_KEY,
      getInitialEnabled: getInitialEnabled,
      setEnabled: setEnabled,
      initState: initState,
      setupToggle: setupToggle,
      syncToggleUI: syncToggleUI,
      syncPhaseGate: syncPhaseGate,
      isPhaseUnlocked: isPhaseUnlocked,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.buildings3D = { create: create };
})();
