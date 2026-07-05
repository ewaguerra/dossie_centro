/**
 * Tab 13 Fases — lista as 13 Almas do ARG (phase-gates.json).
 */
(function () {
  "use strict";

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
      meta.textContent = "Fase " + p + " de " + maxPhase;

      row.appendChild(head);
      row.appendChild(meta);
      panel.appendChild(row);
    }
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.renderPhasesPanel = renderPhasesPanel;
})();
