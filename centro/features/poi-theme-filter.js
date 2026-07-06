/**
 * Filtro temático POI (#poi-legend-grid) — respeita themeMinPhase (13 Almas).
 * Sub-filtros por época (ou tipologia no turismo) com halo colorido no mapa.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "centroPoiThemeFilter";
  var OPEN_STORAGE_KEY = "centroPoiLegendOpen";
  var STATE_VERSION = 2;

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

  function getThemes() {
    var icons = window.MAPA_SP_ICONS;
    if (!icons || typeof icons.getThemeFilters !== "function") return [];
    return icons.getThemeFilters();
  }

  function defaultSubsForTheme(theme) {
    var subs = {};
    var list = theme.subFilters || [];
    for (var i = 0; i < list.length; i++) subs[list[i].id] = true;
    return subs;
  }

  function buildDefaultState(themes) {
    var state = { _v: STATE_VERSION };
    for (var i = 0; i < themes.length; i++) {
      var theme = themes[i];
      state[theme.id] = {
        on: true,
        subs: defaultSubsForTheme(theme),
      };
    }
    return state;
  }

  function migrateLegacyState(parsed, themes) {
    var state = buildDefaultState(themes);
    for (var i = 0; i < themes.length; i++) {
      var theme = themes[i];
      if (typeof parsed[theme.id] === "boolean") {
        state[theme.id].on = parsed[theme.id];
      }
    }
    return state;
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
      var themes = getThemes();
      var state = buildDefaultState(themes);
      var mm = window.CENTRO && window.CENTRO.masterMode;
      if (mm && typeof mm.isActive === "function" && mm.isActive()) {
        return state;
      }
      try {
        var raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return state;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return state;
        if (parsed._v === STATE_VERSION) {
          for (var i = 0; i < themes.length; i++) {
            var theme = themes[i];
            var entry = parsed[theme.id];
            if (!entry || typeof entry !== "object") continue;
            if (typeof entry.on === "boolean") state[theme.id].on = entry.on;
            if (entry.subs && typeof entry.subs === "object") {
              var subIds = Object.keys(state[theme.id].subs);
              for (var j = 0; j < subIds.length; j++) {
                var subId = subIds[j];
                if (typeof entry.subs[subId] === "boolean") {
                  state[theme.id].subs[subId] = entry.subs[subId];
                }
              }
            }
          }
          return state;
        }
        return migrateLegacyState(parsed, themes);
      } catch (_e) {
        return state;
      }
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

    function enabledSubIds(theme, themeState) {
      var ids = [];
      var subs = (themeState && themeState.subs) || {};
      var list = theme.subFilters || [];
      for (var i = 0; i < list.length; i++) {
        var subId = list[i].id;
        if (subs[subId] !== false) ids.push(subId);
      }
      return ids;
    }

    function buildLayerFilter(theme, enabledIds) {
      if (!theme.subProperty || !enabledIds.length) return null;
      var total = (theme.subFilters || []).length;
      if (enabledIds.length >= total) return null;
      return ["in", ["get", theme.subProperty], ["literal", enabledIds]];
    }

    function setThemeVisibility(theme, visible, filter) {
      var map = getMap();
      if (!map || !theme || !theme.layerIds) return;
      var visibility = visible ? "visible" : "none";
      for (var i = 0; i < theme.layerIds.length; i++) {
        var layerId = theme.layerIds[i];
        if (!map.getLayer(layerId)) continue;
        map.setLayoutProperty(layerId, "visibility", visibility);
        if (visible && filter) {
          map.setFilter(layerId, filter);
        } else if (visible) {
          map.setFilter(layerId, null);
        }
      }
    }

    function syncThemeRowUI(group, theme, state) {
      var row = group.querySelector(".poi-legend__item--theme");
      var toggle = row && row.querySelector(".poi-legend__toggle");
      if (!row || !toggle) return;

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
        state[theme.id].on = false;
        row.classList.add("poi-legend__item--off");
      } else if (lockMeta) {
        lockMeta.remove();
      }

      var subsPanel = group.querySelector(".poi-legend__subs");
      if (subsPanel) {
        subsPanel.hidden = !phaseOk || !toggle.checked;
        subsPanel.classList.toggle("poi-legend__subs--disabled", !phaseOk || !toggle.checked);
        var subToggles = subsPanel.querySelectorAll(".poi-legend__sub-toggle");
        for (var i = 0; i < subToggles.length; i++) {
          subToggles[i].disabled = !phaseOk || !toggle.checked;
        }
      }
    }

    function applyAll() {
      var themes = getThemes();
      var state = loadState();
      for (var i = 0; i < themes.length; i++) {
        var theme = themes[i];
        var themeState = state[theme.id] || { on: true, subs: {} };
        var phaseOk = isThemeUnlocked(theme.id);
        var userWants = themeState.on !== false;
        var visible = phaseOk && userWants;
        var enabledIds = enabledSubIds(theme, themeState);
        var filter = visible ? buildLayerFilter(theme, enabledIds) : null;
        setThemeVisibility(theme, visible, filter);
      }
    }

    function syncPhaseGate() {
      var grid = document.getElementById("poi-legend-grid");
      var themes = getThemes();
      if (!grid) {
        applyAll();
        return;
      }
      var state = loadState();
      for (var i = 0; i < themes.length; i++) {
        var theme = themes[i];
        var group = grid.querySelector('.poi-legend__group[data-theme-id="' + theme.id + '"]');
        if (!group) continue;
        syncThemeRowUI(group, theme, state);
      }
      saveState(state);
      applyAll();
    }

    function createSubRow(theme, sub, themeState, onSubChange) {
      var subRow = document.createElement("label");
      subRow.className = "poi-legend__sub-item";
      subRow.dataset.subId = sub.id;

      var subToggle = document.createElement("input");
      subToggle.type = "checkbox";
      subToggle.className = "poi-legend__sub-toggle";
      subToggle.checked = themeState.subs[sub.id] !== false;
      subToggle.setAttribute(
        "aria-label",
        (theme.label || theme.id) + " — " + (sub.label || sub.id)
      );

      var swatch = document.createElement("span");
      swatch.className = "poi-legend__sub-swatch";
      swatch.style.backgroundColor = sub.color || "#78716c";
      swatch.setAttribute("aria-hidden", "true");

      var subLabel = document.createElement("span");
      subLabel.className = "poi-legend__sub-label";
      subLabel.textContent = sub.shortLabel || sub.label || sub.id;

      subRow.classList.toggle("poi-legend__sub-item--off", !subToggle.checked);
      subRow.appendChild(subToggle);
      subRow.appendChild(swatch);
      subRow.appendChild(subLabel);

      subToggle.addEventListener("change", function () {
        themeState.subs[sub.id] = subToggle.checked;
        subRow.classList.toggle("poi-legend__sub-item--off", !subToggle.checked);
        onSubChange();
      });

      return subRow;
    }

    function setup() {
      setupCollapsible();
      var grid = document.getElementById("poi-legend-grid");
      if (!grid) return;

      grid.innerHTML = "";
      var state = loadState();
      var themes = getThemes();

      for (var i = 0; i < themes.length; i++) {
        (function (theme) {
          if (!state[theme.id]) {
            state[theme.id] = { on: true, subs: defaultSubsForTheme(theme) };
          }

          var group = document.createElement("div");
          group.className = "poi-legend__group";
          group.dataset.themeId = theme.id;

          var row = document.createElement("label");
          row.className = "poi-legend__item poi-legend__item--theme";
          row.dataset.themeId = theme.id;

          var toggle = document.createElement("input");
          toggle.type = "checkbox";
          toggle.className = "poi-legend__toggle";
          toggle.checked = state[theme.id].on !== false;
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

          group.appendChild(row);

          var subs = theme.subFilters || [];
          if (subs.length) {
            var subsPanel = document.createElement("div");
            subsPanel.className = "poi-legend__subs";
            subsPanel.setAttribute(
              "role",
              "group"
            );
            var subsKind = theme.subFilterKind === "typology" ? "tipologia" : "época";
            subsPanel.setAttribute(
              "aria-label",
              theme.label + " — sub-filtros por " + subsKind
            );

            var subsKicker = document.createElement("p");
            subsKicker.className = "poi-legend__subs-kicker";
            subsKicker.textContent =
              theme.subFilterKind === "typology" ? "Tipologia" : "Época histórica";
            subsPanel.appendChild(subsKicker);

            var subsList = document.createElement("div");
            subsList.className = "poi-legend__subs-list";

            for (var s = 0; s < subs.length; s++) {
              subsList.appendChild(
                createSubRow(theme, subs[s], state[theme.id], function () {
                  saveState(state);
                  ctx.mapReadyPromise.then(applyAll);
                })
              );
            }

            subsPanel.appendChild(subsList);
            group.appendChild(subsPanel);
          }

          syncThemeRowUI(group, theme, state);

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
            state[theme.id].on = toggle.checked;
            row.classList.toggle("poi-legend__item--off", !toggle.checked);
            syncThemeRowUI(group, theme, state);
            saveState(state);
            ctx.mapReadyPromise.then(applyAll);
          });

          grid.appendChild(group);
        })(themes[i]);
      }

      saveState(state);
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
