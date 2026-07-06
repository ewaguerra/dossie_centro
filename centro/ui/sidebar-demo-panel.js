/**
 * Tab Demo — capítulo livro-jogo Demonão e Titília.
 */
(function () {
  "use strict";

  function getDemoApi() {
    return window.CENTRO && window.CENTRO.demoChapter;
  }

  function flyToStep(step, flyToFn) {
    if (!step || !step.flyTo || typeof flyToFn !== "function") return;
    flyToFn(step.flyTo.lng, step.flyTo.lat, step.flyTo.zoom, step.flyTo.pitch || 0);
  }

  function clearElement(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function appendParagraph(parent, className, text) {
    if (!text) return;
    var p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    parent.appendChild(p);
  }

  function renderActiveCard(panel, chapter, step, flyToFn, mapInstance) {
    var existing = panel.querySelector(".demo-active-card");
    if (existing) existing.remove();

    var demo = getDemoApi();
    if (!demo) return;

    if (demo.progressIsComplete()) {
      var done = document.createElement("article");
      done.className = "demo-active-card demo-active-card--complete";
      var doneTitle = document.createElement("h3");
      doneTitle.className = "demo-active-card__title";
      doneTitle.textContent = "Capítulo concluído";
      done.appendChild(doneTitle);
      appendParagraph(
        done,
        "demo-active-card__body",
        "Demonão, Titília e Tebas mandam lembranças. A placa honesta ficou no arquivo — não no bronze."
      );
      var resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "btn btn--subtle demo-reset-btn";
      resetBtn.textContent = "Reiniciar capítulo";
      resetBtn.addEventListener("click", function () {
        demo.resetProgress();
        renderDemoPanel({ panel: panel, flyTo: flyToFn, map: mapInstance });
      });
      done.appendChild(resetBtn);
      panel.insertBefore(done, panel.firstChild);
      return;
    }

    if (!step) return;

    var card = document.createElement("article");
    card.className = "demo-active-card";

    var kicker = document.createElement("span");
    kicker.className = "demo-active-card__kicker";
    kicker.textContent = (step.chapter || "Demo") + " · " + (step.kicker || "");
    card.appendChild(kicker);

    var title = document.createElement("h3");
    title.className = "demo-active-card__title";
    title.textContent = step.title || chapter.title;
    card.appendChild(title);

    appendParagraph(card, "demo-active-card__body", step.body);

    var hint = document.createElement("p");
    hint.className = "demo-active-card__hint";
    var hintLabel = document.createElement("span");
    hintLabel.className = "demo-active-card__hint-label";
    hintLabel.textContent = "Pista: ";
    hint.appendChild(hintLabel);
    hint.appendChild(document.createTextNode(step.hint || ""));
    card.appendChild(hint);

    var form = document.createElement("form");
    form.className = "demo-password-form";
    form.setAttribute("autocomplete", "off");

    var label = document.createElement("label");
    label.className = "demo-password-form__label";
    label.setAttribute("for", "demo-password-input");
    label.textContent = "Senha narrativa";
    form.appendChild(label);

    var input = document.createElement("input");
    input.id = "demo-password-input";
    input.className = "demo-password-form__input";
    input.type = "text";
    input.name = "demo-password";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("aria-describedby", "demo-password-error");
    form.appendChild(input);

    var err = document.createElement("p");
    err.id = "demo-password-error";
    err.className = "demo-password-form__error";
    err.hidden = true;
    err.setAttribute("role", "alert");
    form.appendChild(err);

    var actions = document.createElement("div");
    actions.className = "demo-active-card__actions";

    var mapBtn = document.createElement("button");
    mapBtn.type = "button";
    mapBtn.className = "btn btn--ghost demo-map-btn";
    mapBtn.textContent = "Ir ao mapa";
    mapBtn.addEventListener("click", function () {
      flyToStep(step, flyToFn);
    });
    actions.appendChild(mapBtn);

    var submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn btn--primary demo-submit-btn";
    submit.textContent = "Decifrar";
    actions.appendChild(submit);

    form.appendChild(actions);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      var result = demo.submitPassword(input.value);
      if (!result.ok) {
        err.textContent =
          result.reason === "complete"
            ? "Capítulo já concluído."
            : "Senha incorreta — releia o trecho ou a pista do dossiê.";
        err.hidden = false;
        input.focus();
        return;
      }
      input.value = "";
      if (typeof window.centroToast === "function") {
        window.centroToast(
          result.completed ? "Epílogo decifrado — capítulo demo concluído." : "Passo decifrado.",
          "ok"
        );
      }
      renderDemoPanel({ panel: panel, flyTo: flyToFn, map: mapInstance });
      refreshDemoMarkers(mapInstance);
    });

    card.appendChild(form);
    panel.insertBefore(card, panel.querySelector(".demo-steps-list"));
  }

  function renderStepList(panel, chapter) {
    var list = panel.querySelector(".demo-steps-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "demo-steps-list";
      list.setAttribute("role", "list");
      list.setAttribute("aria-label", "Passos do capítulo demo");
      panel.appendChild(list);
    }
    clearElement(list);

    var demo = getDemoApi();
    if (!demo) return;

    var steps = chapter.steps || [];
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      var status = demo.getStepStatus(i);

      var row = document.createElement("article");
      row.className = "demo-step-row demo-step-row--" + status;
      row.setAttribute("role", "listitem");
      row.dataset.stepIndex = String(i);

      var head = document.createElement("div");
      head.className = "demo-step-row__head";

      var num = document.createElement("span");
      num.className = "demo-step-row__num";
      num.textContent = String(i + 1).padStart(2, "0");
      num.setAttribute("aria-hidden", "true");
      head.appendChild(num);

      var titles = document.createElement("div");
      titles.className = "demo-step-row__titles";

      var rowTitle = document.createElement("span");
      rowTitle.className = "demo-step-row__title";
      rowTitle.textContent = step.title || "Passo";
      titles.appendChild(rowTitle);

      if (step.chapter) {
        var chap = document.createElement("span");
        chap.className = "demo-step-row__chapter";
        chap.textContent = step.chapter;
        titles.appendChild(chap);
      }

      head.appendChild(titles);

      var badge = document.createElement("span");
      badge.className = "demo-step-row__badge";
      if (status === "active") badge.textContent = "Em curso";
      else if (status === "completed") badge.textContent = "Decifrado";
      else badge.textContent = "—";
      head.appendChild(badge);

      row.appendChild(head);
      list.appendChild(row);
    }
  }

  function refreshDemoMarkers(mapInstance) {
    var markers = window.CENTRO && window.CENTRO.demoMarkers;
    var map =
      mapInstance ||
      panelOpts.map ||
      (markers && typeof markers.getMapRef === "function" ? markers.getMapRef() : null);
    if (map && markers && typeof markers.refreshSourceData === "function") {
      markers.refreshSourceData(map);
    }
  }

  function getDemoTabRoot() {
    return document.getElementById("sidebar-panel-demo");
  }

  function wireMarkersToggle(mapInstance) {
    var tabRoot = getDemoTabRoot();
    if (!tabRoot) return;

    var markers = window.CENTRO && window.CENTRO.demoMarkers;
    var demo = getDemoApi();
    if (!markers) return;

    var toggle = tabRoot.querySelector("#centro-demo-markers-toggle");
    if (toggle) {
      if (toggle.dataset.centroDemoWired !== "1") {
        toggle.dataset.centroDemoWired = "1";
        toggle.addEventListener("change", function () {
          var map =
            mapInstance ||
            panelOpts.map ||
            (typeof markers.getMapRef === "function" ? markers.getMapRef() : null);
          markers.setMarkersVisible(map, toggle.checked);
        });
      }
      toggle.checked = markers.isVisiblePref();
    }

    var revealToggle = tabRoot.querySelector("#centro-demo-reveal-all-toggle");
    if (revealToggle && demo) {
      if (revealToggle.dataset.centroDemoRevealWired !== "1") {
        revealToggle.dataset.centroDemoRevealWired = "1";
        revealToggle.addEventListener("change", function () {
          demo.setRevealAllMarkers(revealToggle.checked);
          refreshDemoMarkers(mapInstance);
        });
      }
      revealToggle.checked = demo.isRevealAllMarkers();
    }
  }

  function renderDemoPanel(opts) {
    opts = opts || {};
    var panel = opts.panel || document.getElementById("demo-panel");
    if (!panel) return;

    var demo = getDemoApi();
    if (!demo) {
      panel.textContent = "Módulo demo indisponível.";
      return;
    }

    demo.loadChapter().then(function (chapter) {
      var flyToFn = typeof opts.flyTo === "function" ? opts.flyTo : null;
      var mapInstance = opts.map || null;
      var step = demo.getCurrentStep();

      var header = panel.querySelector(".demo-chapter-header");
      if (!header) {
        header = document.createElement("header");
        header.className = "demo-chapter-header";
        panel.insertBefore(header, panel.firstChild);
      }
      clearElement(header);

      var h2 = document.createElement("h2");
      h2.className = "demo-chapter-header__title";
      h2.textContent = chapter.title || "Demo";
      header.appendChild(h2);

      appendParagraph(header, "demo-chapter-header__subtitle", chapter.subtitle);
      appendParagraph(header, "demo-chapter-header__tagline", chapter.tagline);

      renderActiveCard(panel, chapter, step, flyToFn, mapInstance);
      renderStepList(panel, chapter);
      wireMarkersToggle(mapInstance);
    });
  }

  var panelOpts = {};
  var installWired = false;

  function install(opts) {
    panelOpts = opts || {};
    renderDemoPanel(panelOpts);
    wireMarkersToggle(panelOpts.map);

    if (!installWired) {
      installWired = true;
      document.addEventListener("centro:demo-progress-changed", function () {
        renderDemoPanel(panelOpts);
      });
    }

    try {
      if (/[?&]demo=1\b/.test(window.location.search)) {
        var tab = document.getElementById("sidebar-tab-demo");
        if (tab) tab.click();
      }
      if (/[?&]demo=all-markers\b/.test(window.location.search)) {
        var demo = getDemoApi();
        if (demo) {
          demo.setRevealAllMarkers(true);
          refreshDemoMarkers(panelOpts.map);
        }
        var tabAll = document.getElementById("sidebar-tab-demo");
        if (tabAll) tabAll.click();
      }
    } catch (_e) {
      /* ignora */
    }
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.renderDemoPanel = renderDemoPanel;
  window.CENTRO.ui.installDemoPanel = install;
})();
