/**
 * Filtro temático POI (#poi-legend-grid) — respeita themeMinPhase (13 Almas).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "centroPoiThemeFilter";
  var OPEN_STORAGE_KEY = "centroPoiLegendOpen";

  function getProtocoloPhase() {
    return window.CENTRO && window.CENTRO.protocoloPhase;
  }

  function isThemeUnlocked(themeId) {
    var ph = getProtocoloPhase();
    if (ph && typeof ph.isThemePhaseUnlocked === "function") {
      return ph.isThemePhaseUnlocked(themeId);
    }
    return true;
  }

  function getThemeLockLabel(themeId) {
    var ph = getProtocoloPhase();
    if (
      ph &&
      typeof ph.formatPhaseLockLabel === "function" &&
      typeof ph.getMinPhaseForTheme === "function"
    ) {
      return ph.formatPhaseLockLabel(ph.getMinPhaseForTheme(themeId));
    }
    return "";
  }

  function setupCollapsible() {
    var details = document.getElementById("poi-legend-details");
    if (!details) return;

    try {
      var stored = window.localStorage && window.localStorage.getItem(OPEN_STORAGE_KEY);
      if (stored === "1") details.open = true;
      if (stored === "0") details.open = false;
    } catch (_e) {
      // ignora
    }

    details.addEventListener("toggle", function () {
      try {
        if (window.localStorage) {
          window.localStorage.setItem(OPEN_STORAGE_KEY, details.open ? "1" : "0");
        }
      } catch (_e) {
        // ignora
      }
    });
  }

  function create(ctx) {
    var getMap = ctx.getMap;

    function loadState() {
      var icons = window.MAPA_SP_ICONS;
      if (!icons || typeof icons.getThemeFilters !== "function") return {};
      var themes = icons.getThemeFilters();
      var state = {};
      for (var i = 0; i < themes.length; i++) state[themes[i].id] = true;
      try {
        var raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return state;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return state;
        for (var j = 0; j < themes.length; j++) {
          var themeId = themes[j].id;
          if (typeof parsed[themeId] === "boolean") state[themeId] = parsed[themeId];
        }
      } catch (_e) {
        // ignora
      }
      return state;
    }

    function saveState(state) {
      try {
        if (window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      } catch (_e) {
        // ignora
      }
    }

    function setVisibility(theme, visible) {
      var map = getMap();
      if (!map || !theme || !theme.layerIds) return;
      var visibility = visible ? "visible" : "none";
      for (var i = 0; i < theme.layerIds.length; i++) {
        var layerId = theme.layerIds[i];
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", visibility);
        }
      }
    }

    function syncThemeRowUI(row, toggle, theme, state) {
      var phaseOk = isThemeUnlocked(theme.id);
      row.classList.toggle("poi-legend__item--phase-locked", !phaseOk);
      toggle.disabled = !phaseOk;

      var lockMeta = row.querySelector(".poi-legend__phase-lock");
      if (!phaseOk) {
        if (!lockMeta) {
          lockMeta = document.createElement("span");
          lockMeta.className = "poi-legend__phase-lock";
          row.appendChild(lockMeta);
        }
        lockMeta.textContent = getThemeLockLabel(theme.id);
        toggle.checked = false;
        state[theme.id] = false;
        row.classList.add("poi-legend__item--off");
      } else if (lockMeta) {
        lockMeta.remove();
      }
    }

    function applyAll() {
      var icons = window.MAPA_SP_ICONS;
      if (!icons || typeof icons.getThemeFilters !== "function") return;
      var state = loadState();
      var themes = icons.getThemeFilters();
      for (var i = 0; i < themes.length; i++) {
        var theme = themes[i];
        var phaseOk = isThemeUnlocked(theme.id);
        var userWants = state[theme.id] !== false;
        setVisibility(theme, phaseOk && userWants);
      }
    }

    function syncPhaseGate() {
      var grid = document.getElementById("poi-legend-grid");
      var icons = window.MAPA_SP_ICONS;
      if (!grid || !icons || typeof icons.getThemeFilters !== "function") {
        applyAll();
        return;
      }
      var state = loadState();
      var themes = icons.getThemeFilters();
      for (var i = 0; i < themes.length; i++) {
        var theme = themes[i];
        var row = grid.querySelector('.poi-legend__item[data-theme-id="' + theme.id + '"]');
        if (!row) continue;
        var toggle = row.querySelector(".poi-legend__toggle");
        if (!toggle) continue;
        syncThemeRowUI(row, toggle, theme, state);
      }
      saveState(state);
      applyAll();
    }

    function setup() {
      setupCollapsible();
      var grid = document.getElementById("poi-legend-grid");
      var icons = window.MAPA_SP_ICONS;
      if (!grid || !icons || typeof icons.getThemeFilters !== "function") return;

      grid.innerHTML = "";
      var state = loadState();
      var themes = icons.getThemeFilters();

      for (var i = 0; i < themes.length; i++) {
        (function (theme) {
          var row = document.createElement("label");
          row.className = "poi-legend__item";
          row.dataset.themeId = theme.id;

          var toggle = document.createElement("input");
          toggle.type = "checkbox";
          toggle.className = "poi-legend__toggle";
          toggle.checked = state[theme.id] !== false;
          toggle.setAttribute("aria-label", theme.label);
          row.classList.toggle("poi-legend__item--off", !toggle.checked);

          if (theme.iconPath) {
            var img = document.createElement("img");
            img.className = "poi-legend__icon";
            img.src = theme.iconPath;
            img.alt = "";
            img.width = 22;
            img.height = 22;
            img.loading = "lazy";
            img.decoding = "async";
            row.appendChild(toggle);
            row.appendChild(img);
          } else {
            row.appendChild(toggle);
          }

          var label = document.createElement("span");
          label.className = "poi-legend__label";
          label.textContent = theme.label;
          row.appendChild(label);

          syncThemeRowUI(row, toggle, theme, state);

          toggle.addEventListener("change", function () {
            if (!isThemeUnlocked(theme.id)) {
              toggle.checked = false;
              row.classList.add("poi-legend__item--off");
              if (typeof window.centroToast === "function") {
                window.centroToast(
                  "Tema bloqueado. " + (getThemeLockLabel(theme.id) || "Avance de fase no ARG."),
                  "warn"
                );
              }
              return;
            }
            state[theme.id] = toggle.checked;
            row.classList.toggle("poi-legend__item--off", !toggle.checked);
            saveState(state);
            ctx.mapReadyPromise.then(function () {
              setVisibility(theme, toggle.checked);
            });
          });

          grid.appendChild(row);
        })(themes[i]);
      }
    }

    return {
      STORAGE_KEY: STORAGE_KEY,
      loadState: loadState,
      applyAll: applyAll,
      syncPhaseGate: syncPhaseGate,
      setup: setup,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.poiThemeFilter = { create: create };
})();
