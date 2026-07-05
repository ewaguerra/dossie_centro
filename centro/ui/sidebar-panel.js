/**
 * Render DOM da sidebar de camadas — createElement/textContent apenas.
 */
(function () {
  "use strict";

  var SIDEBAR_SECTIONS = [
    {
      id: "centro_historico",
      title: "Centro Histórico",
      intro: "Polígonos, eixos e camadas processadas do dossiê.",
      groupIds: [
        "02_macroareas_e_eixos",
        "16_regioes_sp",
        "08_hidrografia",
        "03_zoneamento",
        "17_risco_hidrologico",
        "turismo_patrimonio",
        "geotecnica",
      ],
      defaultOpen: true,
    },
    {
      id: "arquivo_soterrados",
      title: "Arquivo dos Soterrados",
      intro: "Missões ARG e camadas de superfície soterrada.",
      groupIds: ["arquivo_soterrado"],
      defaultOpen: true,
    },
    {
      id: "contexto_urbano",
      title: "Contexto Urbano (OSM)",
      intro: "Malha urbana e hidrologia de contexto. Camadas pesadas carregam ao activar.",
      groupIds: ["urbano_contexto"],
      defaultOpen: false,
      heavySubgroup: true,
    },
  ];

  function isHeavyLayer(ly) {
    return ly && ly.weightClass === "heavy";
  }

  function renderLayerRow(ly, opts) {
    var resolveSidebarLockState = opts.resolveSidebarLockState;
    var getLayerRowClass = opts.getLayerRowClass;
    var getLockMessage = opts.getLockMessage;
    var getMinPhaseLabel = opts.getMinPhaseLabel;

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
            ? " (bloqueada — Requer pista no Caderno)"
            : " (bloqueada — Disponível na fase ARG)";
      cb.setAttribute("aria-label", (ly.title || ly.id) + lockHint);
    } else if (ly.visible !== false) {
      cb.checked = true;
    }

    var span = document.createElement("span");
    span.textContent = ly.title || ly.id;

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" "));
    label.appendChild(span);

    if (isHeavyLayer(ly) && !locked) {
      var heavyBadge = document.createElement("span");
      heavyBadge.className = "layer-badge layer-badge--heavy";
      heavyBadge.textContent = "PESADO";
      heavyBadge.title = "Carrega ao activar";
      label.appendChild(heavyBadge);
    }

    if (locked) {
      var lockWrap = document.createElement("span");
      lockWrap.className = "layer-lock-wrap";

      var lockIcon = document.createElement("span");
      lockIcon.className = clueLocked
        ? "layer-lock layer-lock--clue"
        : "layer-lock layer-lock--phase";
      lockIcon.setAttribute("aria-hidden", "true");
      lockIcon.textContent = clueLocked ? "Caderno" : "Fase";

      var lockMeta = document.createElement("span");
      lockMeta.className = "layer-meta layer-meta--lock";
      lockMeta.textContent =
        typeof getLockMessage === "function"
          ? getLockMessage(lockState, "sidebar-meta")
          : phaseLocked && typeof getMinPhaseLabel === "function"
            ? "Disponível na Fase " + getMinPhaseLabel(ly.id)
            : "bloqueada";

      lockWrap.appendChild(lockIcon);
      lockWrap.appendChild(lockMeta);

      if (clueLocked) {
        var archiveLink = document.createElement("a");
        archiveLink.className = "layer-lock-link";
        archiveLink.href = "/arquivo-morto/";
        archiveLink.textContent = "Arquivo Morto";
        archiveLink.setAttribute("data-surface-link", "arquivo-morto");
        lockWrap.appendChild(archiveLink);
      }

      label.appendChild(lockWrap);
    } else if (ly.feature_count !== undefined) {
      var meta = document.createElement("span");
      meta.className = "layer-meta";
      meta.textContent = ly.feature_count + " feats";
      label.appendChild(meta);
    }

    return label;
  }

  function renderGroupDetails(group, groupLayers, opts, detailsOpen) {
    var details = document.createElement("details");
    details.className = "group";
    details.open = detailsOpen !== false;

    var summary = document.createElement("summary");
    summary.textContent = (group.title || group.id) + " ";
    var count = document.createElement("span");
    count.className = "group__count";
    count.textContent = "(" + groupLayers.length + ")";
    summary.appendChild(count);
    details.appendChild(summary);

    for (var i = 0; i < groupLayers.length; i++) {
      details.appendChild(renderLayerRow(groupLayers[i], opts));
    }
    return details;
  }

  function renderHeavySubgroup(heavyLayers, opts) {
    var heavyDetails = document.createElement("details");
    heavyDetails.className = "group group--heavy";
    heavyDetails.open = false;

    var heavySummary = document.createElement("summary");
    heavySummary.textContent = "PESADO ";
    var heavyCount = document.createElement("span");
    heavyCount.className = "group__count";
    heavyCount.textContent = "(" + heavyLayers.length + ")";
    heavySummary.appendChild(heavyCount);
    var heavyHint = document.createElement("span");
    heavyHint.className = "group__heavy-hint";
    heavyHint.textContent = " — carrega ao activar";
    heavySummary.appendChild(heavyHint);
    heavyDetails.appendChild(heavySummary);

    for (var h = 0; h < heavyLayers.length; h++) {
      heavyDetails.appendChild(renderLayerRow(heavyLayers[h], opts));
    }
    return heavyDetails;
  }

  function renderSidebarPanel(opts) {
    var panel = opts.panel;
    var groupsList = opts.groups;
    var layersList = opts.layers;
    if (!panel || !groupsList || !layersList) return;

    panel.innerHTML = "";
    var hasAny = false;
    var groupById = {};
    for (var gi = 0; gi < groupsList.length; gi++) {
      groupById[groupsList[gi].id] = groupsList[gi];
    }

    for (var s = 0; s < SIDEBAR_SECTIONS.length; s++) {
      var section = SIDEBAR_SECTIONS[s];
      var sectionLayers = [];
      for (var gid = 0; gid < section.groupIds.length; gid++) {
        var groupId = section.groupIds[gid];
        var matched = layersList.filter(function (l) {
          return l.group === groupId;
        });
        sectionLayers = sectionLayers.concat(matched);
      }
      if (sectionLayers.length === 0) continue;
      hasAny = true;

      var sectionDetails = document.createElement("details");
      sectionDetails.className = "sidebar-section";
      if (!section.defaultOpen) {
        sectionDetails.classList.add("sidebar-section--collapsed");
      }
      sectionDetails.open = section.defaultOpen !== false;

      var sectionSummary = document.createElement("summary");
      sectionSummary.className = "sidebar-section__summary";
      sectionSummary.textContent = section.title;
      sectionDetails.appendChild(sectionSummary);

      if (section.intro) {
        var sectionIntro = document.createElement("p");
        sectionIntro.className = "sidebar-section__intro";
        sectionIntro.textContent = section.intro;
        sectionDetails.appendChild(sectionIntro);
      }

      var sectionBody = document.createElement("div");
      sectionBody.className = "sidebar-section__body";

      for (var g = 0; g < section.groupIds.length; g++) {
        var group = groupById[section.groupIds[g]];
        if (!group) continue;
        var groupLayers = layersList.filter(function (l) {
          return l.group === group.id;
        });
        if (groupLayers.length === 0) continue;

        if (section.heavySubgroup) {
          var heavyLayers = groupLayers.filter(isHeavyLayer);
          var lightLayers = groupLayers.filter(function (l) {
            return !isHeavyLayer(l);
          });
          if (lightLayers.length > 0) {
            sectionBody.appendChild(renderGroupDetails(group, lightLayers, opts, true));
          }
          if (heavyLayers.length > 0) {
            sectionBody.appendChild(renderHeavySubgroup(heavyLayers, opts));
          }
        } else {
          sectionBody.appendChild(renderGroupDetails(group, groupLayers, opts, true));
        }
      }

      sectionDetails.appendChild(sectionBody);
      panel.appendChild(sectionDetails);
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
  window.CENTRO.ui.SIDEBAR_SECTIONS = SIDEBAR_SECTIONS;
})();
