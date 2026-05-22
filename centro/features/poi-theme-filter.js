/**
 * Filtro temático POI (#poi-legend-grid).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "centroPoiThemeFilter";

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

    function applyAll() {
      var icons = window.MAPA_SP_ICONS;
      if (!icons || typeof icons.getThemeFilters !== "function") return;
      var state = loadState();
      var themes = icons.getThemeFilters();
      for (var i = 0; i < themes.length; i++) {
        setVisibility(themes[i], state[themes[i].id] !== false);
      }
    }

    function setup() {
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

          toggle.addEventListener("change", function () {
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
      setup: setup,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.poiThemeFilter = { create: create };
})();
