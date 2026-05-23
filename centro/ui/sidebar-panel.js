/**
 * Render DOM da sidebar de camadas — createElement/textContent apenas.
 */
(function () {
  "use strict";

  function renderSidebarPanel(opts) {
    var panel = opts.panel;
    var groupsList = opts.groups;
    var layersList = opts.layers;
    var resolveSidebarLockState = opts.resolveSidebarLockState;
    var getLayerRowClass = opts.getLayerRowClass;
    var getLockMessage = opts.getLockMessage;
    var getMinPhaseLabel = opts.getMinPhaseLabel;

    if (!panel || !groupsList || !layersList) return;

    panel.innerHTML = "";
    var hasAny = false;

    for (var g = 0; g < groupsList.length; g++) {
      var group = groupsList[g];
      var groupLayers = layersList.filter(function (l) {
        return l.group === group.id;
      });
      if (groupLayers.length === 0) continue;
      hasAny = true;

      var details = document.createElement("details");
      details.className = "group";
      details.open = true;

      var summary = document.createElement("summary");
      summary.textContent = (group.title || group.id) + " ";
      var count = document.createElement("span");
      count.className = "group__count";
      count.textContent = "(" + groupLayers.length + ")";
      summary.appendChild(count);
      details.appendChild(summary);

      for (var i = 0; i < groupLayers.length; i++) {
        var ly = groupLayers[i];
        var lockState =
          typeof resolveSidebarLockState === "function"
            ? resolveSidebarLockState(ly.id)
            : { locked: false, clueLocked: false, phaseLocked: false };
        var locked = lockState.locked;
        var clueLocked = lockState.clueLocked;
        var phaseLocked = lockState.phaseLocked;
        var label = document.createElement("label");
        label.className =
          typeof getLayerRowClass === "function" ? getLayerRowClass(lockState) : "layer-row";

        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.dataset.layerId = ly.id;
        if (locked) {
          cb.disabled = true;
          cb.checked = false;
          var lockHint =
            typeof getLockMessage === "function"
              ? getLockMessage(lockState, "sidebar-hint")
              : clueLocked
                ? " (bloqueada — registre pistas no Caderno)"
                : " (bloqueada — avance de fase no ARG)";
          cb.setAttribute("aria-label", (ly.title || ly.id) + lockHint);
        } else if (ly.visible !== false) {
          cb.checked = true;
        }

        var span = document.createElement("span");
        span.textContent = ly.title || ly.id;

        label.appendChild(cb);
        label.appendChild(document.createTextNode(" "));
        label.appendChild(span);

        if (locked) {
          var lockMeta = document.createElement("span");
          lockMeta.className = "layer-meta layer-meta--lock";
          lockMeta.textContent =
            typeof getLockMessage === "function"
              ? getLockMessage(lockState, "sidebar-meta")
              : phaseLocked && typeof getMinPhaseLabel === "function"
                ? "fase " + getMinPhaseLabel(ly.id)
                : phaseLocked
                  ? "bloqueada"
                  : "bloqueada";
          label.appendChild(lockMeta);
        } else if (ly.feature_count !== undefined) {
          var meta = document.createElement("span");
          meta.className = "layer-meta";
          meta.textContent = ly.feature_count + " feats";
          label.appendChild(meta);
        }
        details.appendChild(label);
      }
      panel.appendChild(details);
    }

    if (!hasAny) {
      var empty = document.createElement("p");
      empty.className = "sidebar-empty";
      empty.textContent = "Nenhuma camada disponível";
      panel.appendChild(empty);
    }
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.renderSidebarPanel = renderSidebarPanel;
})();
