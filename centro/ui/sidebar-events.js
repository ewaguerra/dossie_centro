/**
 * Event wiring dos checkboxes da sidebar — deps injetadas pelo runtime.
 */
(function () {
  "use strict";

  function wireLayerCheckboxes(panel, deps) {
    if (!panel || !deps) return;

    var getLayerConfig = deps.getLayerConfig;
    var isLayerAccessible = deps.isLayerAccessible;
    var getLockToastMessage = deps.getLockToastMessage;
    var whenMapReady = deps.whenMapReady;
    var addLayerToMap = deps.addLayerToMap;
    var removeLayerFromMap = deps.removeLayerFromMap;
    var toast = deps.toast;
    var hasCatalog = deps.hasCatalog;

    var checkboxes = panel.querySelectorAll('input[type="checkbox"][data-layer-id]');
    checkboxes.forEach(function (cb) {
      cb.addEventListener("change", function () {
        var lid = cb.dataset.layerId;
        if (!lid) return;
        if (typeof hasCatalog === "function" && !hasCatalog()) return;
        if (typeof isLayerAccessible === "function" && !isLayerAccessible(lid)) {
          cb.checked = false;
          if (typeof toast === "function" && typeof getLockToastMessage === "function") {
            toast(getLockToastMessage(lid), "warn");
          }
          return;
        }
        var cfg = typeof getLayerConfig === "function" ? getLayerConfig(lid) : null;
        if (!cfg) return;
        if (typeof whenMapReady !== "function") return;
        whenMapReady(function () {
          if (cb.checked) {
            if (typeof addLayerToMap === "function") {
              var result = addLayerToMap(cfg);
              if (result && typeof result.catch === "function") {
                result.catch(function (err) {
                  console.warn("[CENTRO] Erro ao adicionar camada", lid, err);
                });
              }
            }
          } else if (typeof removeLayerFromMap === "function") {
            removeLayerFromMap(lid);
          }
        });
      });
    });

    if (typeof whenMapReady === "function") {
      whenMapReady(function () {
        panel
          .querySelectorAll('input[type="checkbox"][data-layer-id]:checked:not(:disabled)')
          .forEach(function (cb) {
            cb.dispatchEvent(new Event("change"));
          });
      });
    }
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.wireLayerCheckboxes = wireLayerCheckboxes;
})();
