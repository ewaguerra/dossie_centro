/**
 * Orquestração da sidebar Território + 13 Almas (R3 — extraído de centro-runtime.js).
 */
(function () {
  "use strict";

  function create(ctx) {
    ctx = ctx || {};
    var catalogPromise = null;

    function getSidebarLayerStateHelper(name) {
      var mod = window.CENTRO && window.CENTRO.sidebarLayerState;
      return mod && typeof mod[name] === "function" ? mod[name] : null;
    }

    function loadCatalog() {
      if (!catalogPromise) {
        var loader = window.CENTRO && window.CENTRO.catalogLoad;
        if (!loader || typeof loader.loadCatalog !== "function") {
          catalogPromise = Promise.reject(new Error("CENTRO.catalogLoad indisponível"));
          return catalogPromise;
        }
        catalogPromise = loader.loadCatalog().then(function (data) {
          if (typeof ctx.onCatalogLoaded === "function") {
            ctx.onCatalogLoaded(data);
          }
          return {
            layers: data.layers,
            sidebarLayers: data.sidebarLayers || data.layers,
            groups: data.groups,
          };
        });
      }
      return catalogPromise;
    }

    function renderSidebarPanel(panel, groupsList, layersList) {
      var fn = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.renderSidebarPanel;
      if (typeof fn !== "function") {
        console.warn("[CENTRO] sidebar-panel.js ausente — renderSidebarPanel indisponível");
        return;
      }
      var rowClassFn = getSidebarLayerStateHelper("getLayerRowClass");
      var lockMsgFn = getSidebarLayerStateHelper("getLockMessage");
      fn({
        panel: panel,
        groups: groupsList,
        layers: layersList,
        resolveSidebarLockState:
          typeof ctx.resolveSidebarLockState === "function" ? ctx.resolveSidebarLockState : null,
        getLayerRowClass: typeof rowClassFn === "function" ? rowClassFn : null,
        getLockMessage: typeof lockMsgFn === "function" ? lockMsgFn : null,
        getMinPhaseLabel: typeof ctx.getMinPhaseLabel === "function" ? ctx.getMinPhaseLabel : null,
      });
    }

    function renderPhasesPanel() {
      var panel = document.getElementById("phases-panel");
      if (!panel) return;
      var fn = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.renderPhasesPanel;
      if (typeof fn !== "function") {
        console.warn("[CENTRO] sidebar-phases-panel.js ausente — renderPhasesPanel indisponível");
        return;
      }
      var phaseApi = window.CENTRO && window.CENTRO.protocoloPhase;
      fn({
        panel: panel,
        getPhase: phaseApi && typeof phaseApi.getPhase === "function" ? phaseApi.getPhase.bind(phaseApi) : null,
        getSoul: phaseApi && typeof phaseApi.getSoul === "function" ? phaseApi.getSoul.bind(phaseApi) : null,
        maxPhase: phaseApi && phaseApi.MAX_PHASE ? phaseApi.MAX_PHASE : 13,
        getPhaseMeta:
          window.CENTRO &&
          window.CENTRO.missionsOrchestrator &&
          typeof window.CENTRO.missionsOrchestrator.getPhaseMeta === "function"
            ? window.CENTRO.missionsOrchestrator.getPhaseMeta.bind(window.CENTRO.missionsOrchestrator)
            : null,
      });
    }

    function wireLayerCheckboxes(panel) {
      var fn = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.wireLayerCheckboxes;
      if (typeof fn !== "function") {
        console.warn("[CENTRO] sidebar-events.js ausente — wireLayerCheckboxes indisponível");
        return;
      }
      fn(panel, {
        hasCatalog:
          typeof ctx.hasCatalog === "function"
            ? ctx.hasCatalog
            : function () {
                return false;
              },
        getLayerConfig:
          typeof ctx.getLayerConfig === "function"
            ? ctx.getLayerConfig
            : function () {
                return null;
              },
        isLayerAccessible:
          typeof ctx.isLayerAccessible === "function" ? ctx.isLayerAccessible : function () {
            return true;
          },
        getLockToastMessage:
          typeof ctx.getLockToastMessage === "function" ? ctx.getLockToastMessage : function () {
            return "Camada bloqueada.";
          },
        whenMapReady:
          typeof ctx.whenMapReady === "function"
            ? ctx.whenMapReady
            : function (cb) {
                if (typeof cb === "function") cb();
              },
        addLayerToMap: typeof ctx.addLayerToMap === "function" ? ctx.addLayerToMap : function () {},
        removeLayerFromMap:
          typeof ctx.removeLayerFromMap === "function" ? ctx.removeLayerFromMap : function () {},
        toast: function (msg, level) {
          if (typeof window.centroToast === "function") {
            window.centroToast(msg, level);
          }
        },
      });
    }

    function load() {
      var statusEl = document.getElementById("sidebar-status");
      var panel = document.getElementById("layers-panel");
      if (!panel) return;

      var phaseApi = window.CENTRO && window.CENTRO.protocoloPhase;
      var gatesPromise =
        phaseApi && typeof phaseApi.loadPhaseGates === "function"
          ? phaseApi.loadPhaseGates()
          : Promise.resolve();

      Promise.all([loadCatalog(), gatesPromise])
        .then(function (results) {
          var data = results[0];
          if (phaseApi && typeof phaseApi.maybeAdvancePhaseFromClues === "function") {
            phaseApi.maybeAdvancePhaseFromClues();
          }
          if (statusEl) statusEl.style.display = "none";
          renderSidebarPanel(panel, data.groups, data.sidebarLayers || data.layers);
          wireLayerCheckboxes(panel);
          if (typeof ctx.whenMapReady === "function") {
            ctx.whenMapReady(function () {
              if (typeof window.CENTRO.scheduleBasemapOnlyBoot === "function") {
                window.CENTRO.scheduleBasemapOnlyBoot();
              } else if (typeof window.CENTRO.applyBasemapOnlyView === "function") {
                window.CENTRO.applyBasemapOnlyView();
              }
            });
          }
          if (phaseApi && typeof phaseApi.updatePhaseBadge === "function") {
            phaseApi.updatePhaseBadge();
          }
          renderPhasesPanel();
          var phaseNum = phaseApi && typeof phaseApi.getPhase === "function" ? phaseApi.getPhase() : 1;
          console.log(
            "[CENTRO] Sidebar carregada:",
            data.groups.length,
            "grupos,",
            (data.sidebarLayers || data.layers).length,
            "camadas (fase ARG",
            phaseNum,
            "/",
            phaseApi && phaseApi.MAX_PHASE ? phaseApi.MAX_PHASE : 13,
            ")"
          );
        })
        .catch(function (e) {
          console.error("[CENTRO] Erro ao carregar sidebar:", e);
          if (statusEl) statusEl.textContent = "Erro ao carregar dados: " + e.message;
          if (typeof window.centroToast === "function") {
            window.centroToast("Erro ao carregar camadas: " + e.message, "error");
          }
        });
    }

    return {
      load: load,
      loadCatalog: loadCatalog,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.sidebarOrchestrator = { create: create };
})();
