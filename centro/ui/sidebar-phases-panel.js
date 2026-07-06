/**
 * Tab 13 Fases — lista as 13 Almas do ARG (phase-gates.json).
 */
(function () {
  "use strict";

  var GUIDE_PHASE = 7;
  var GUIDE_ALMA_ID = "alma-07";

  function getPhaseStatus(phaseNum, currentPhase) {
    if (phaseNum < currentPhase) return "completed";
    if (phaseNum === currentPhase) return "active";
    return "locked";
  }

  function getStatusLabel(status) {
    if (status === "active") return "Activa";
    if (status === "completed") return "Concluída";
    return "Bloqueada";
  }

  function canOpenSubterraneanGuide(currentPhase) {
    return currentPhase >= GUIDE_PHASE;
  }

  function openSubterraneanGuideForRow(row, currentPhase) {
    if (!row || row.dataset.almaId !== GUIDE_ALMA_ID) return;
    if (!canOpenSubterraneanGuide(currentPhase != null ? currentPhase : 1)) return;
    var open =
      window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.openSubterraneanGuide;
    if (typeof open === "function") open();
  }

  function wirePhasesPanelInteraction(panel) {
    if (!panel || panel.dataset.centroPhasesWired === "1") return;
    panel.dataset.centroPhasesWired = "1";

    panel.addEventListener("click", function (e) {
      var row = e.target.closest(".phase-row--guide");
      if (!row || row.dataset.almaId !== GUIDE_ALMA_ID) return;
      var ph = window.CENTRO && window.CENTRO.protocoloPhase;
      var currentPhase =
        ph && typeof ph.getPhase === "function" ? ph.getPhase() : 1;
      openSubterraneanGuideForRow(row, currentPhase);
    });

    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var row = e.target.closest(".phase-row--guide");
      if (!row || row.dataset.almaId !== GUIDE_ALMA_ID) return;
      e.preventDefault();
      var ph = window.CENTRO && window.CENTRO.protocoloPhase;
      var currentPhase =
        ph && typeof ph.getPhase === "function" ? ph.getPhase() : 1;
      openSubterraneanGuideForRow(row, currentPhase);
    });
  }

  function renderPhasesPanel(opts) {
    opts = opts || {};
    var panel = opts.panel;
    if (!panel) return;

    var getPhase =
      typeof opts.getPhase === "function"
        ? opts.getPhase
        : function () {
            return 1;
          };
    var getSoul =
      typeof opts.getSoul === "function"
        ? opts.getSoul
        : function (n) {
            return { phase: n, id: "alma-" + String(n).padStart(2, "0"), title: "Fase " + n, kicker: "" };
          };
    var maxPhase = opts.maxPhase != null ? opts.maxPhase : 13;
    var currentPhase = getPhase();
    var getPhaseMeta =
      typeof opts.getPhaseMeta === "function"
        ? opts.getPhaseMeta
        : function () {
            return "";
          };

    panel.innerHTML = "";

    for (var p = 1; p <= maxPhase; p++) {
      var soul = getSoul(p);
      var status = getPhaseStatus(p, currentPhase);
      var almaNum = String(p).padStart(2, "0");

      var row = document.createElement("article");
      row.className = "phase-row phase-row--" + status;
      row.setAttribute("role", "listitem");
      row.dataset.phase = String(p);
      row.dataset.almaId = soul.id || "alma-" + almaNum;

      if (
        p === GUIDE_PHASE &&
        currentPhase >= GUIDE_PHASE &&
        (soul.id || "alma-" + almaNum) === GUIDE_ALMA_ID
      ) {
        row.classList.add("phase-row--guide");
        row.setAttribute("tabindex", "0");
        row.setAttribute(
          "aria-label",
          (soul.title || "Rasgue o Asfalto") +
            " — Alma 07, Fase 7 — abrir guia da missão"
        );
      }

      var head = document.createElement("div");
      head.className = "phase-row__head";

      var num = document.createElement("span");
      num.className = "phase-row__num";
      num.textContent = almaNum;
      num.setAttribute("aria-hidden", "true");

      var titles = document.createElement("div");
      titles.className = "phase-row__titles";

      var kicker = document.createElement("span");
      kicker.className = "phase-row__kicker";
      kicker.textContent = soul.kicker || "Alma " + almaNum;

      var title = document.createElement("h3");
      title.className = "phase-row__title";
      title.textContent = soul.title || "Fase " + p;

      titles.appendChild(kicker);
      titles.appendChild(title);

      var badge = document.createElement("span");
      badge.className = "phase-row__status phase-row__status--" + status;
      badge.textContent = getStatusLabel(status);

      head.appendChild(num);
      head.appendChild(titles);
      head.appendChild(badge);

      var meta = document.createElement("p");
      meta.className = "phase-row__meta";
      var phaseMeta = getPhaseMeta(p);
      meta.textContent = phaseMeta || "Fase " + p + " de " + maxPhase;

      row.appendChild(head);
      row.appendChild(meta);
      panel.appendChild(row);
    }

    wirePhasesPanelInteraction(panel);
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.renderPhasesPanel = renderPhasesPanel;
  window.CENTRO.ui.wirePhasesPanelInteraction = wirePhasesPanelInteraction;
})();
