/**
 * Overlay do Triângulo Histórico no map load e resync ARG (R2 — extraído de centro-runtime.js).
 */
(function () {
  "use strict";

  function create(ctx) {
    ctx = ctx || {};
    var ensureSource =
      typeof ctx.ensureSource === "function"
        ? ctx.ensureSource
        : function (mapInstance, id, sourceConfig) {
            var helper = window.CENTRO && window.CENTRO.map && window.CENTRO.map.ensureSource;
            return helper ? helper(mapInstance, id, sourceConfig) : false;
          };
    var ensureLayer =
      typeof ctx.ensureLayer === "function"
        ? ctx.ensureLayer
        : function (mapInstance, layerConfig, beforeId) {
            var helper = window.CENTRO && window.CENTRO.map && window.CENTRO.map.ensureLayer;
            return helper ? helper(mapInstance, layerConfig, beforeId) : false;
          };
    var getCatalogInsertBeforeId =
      typeof ctx.getCatalogInsertBeforeId === "function"
        ? ctx.getCatalogInsertBeforeId
        : function () {
            return undefined;
          };

    function isTrianguloPhaseUnlocked() {
      var ph = window.CENTRO && window.CENTRO.protocoloPhase;
      if (ph && typeof ph.isFeaturePhaseUnlocked === "function") {
        return ph.isFeaturePhaseUnlocked("triangulo-historico");
      }
      return true;
    }

    async function add(mapInstance) {
      if (!mapInstance) return;
      if (!isTrianguloPhaseUnlocked()) return;
      var th = window.CENTRO && window.CENTRO.trianguloHistorico;
      if (!th || typeof th.buildTrianguloHistoricoGeojson !== "function") return;
      var cfg = th.CONFIG;
      if (!cfg || mapInstance.getSource(cfg.sourceId)) return;

      try {
        var feature = await th.buildTrianguloHistoricoGeojson();
        var feat =
          feature && feature.type === "Feature"
            ? feature
            : {
                type: "Feature",
                properties: (feature && feature.properties) || { name: cfg.label },
                geometry: feature && feature.geometry,
              };
        ensureSource(mapInstance, cfg.sourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [feat] },
        });
        ensureLayer(
          mapInstance,
          {
            id: cfg.fillLayerId,
            type: "fill",
            source: cfg.sourceId,
            paint: {
              "fill-color": cfg.fillColor,
              "fill-opacity": cfg.fillOpacity,
            },
          },
          getCatalogInsertBeforeId()
        );
        ensureLayer(
          mapInstance,
          {
            id: cfg.outlineLayerId,
            type: "line",
            source: cfg.sourceId,
            paint: {
              "line-color": cfg.outlineColor,
              "line-width": cfg.outlineWidth,
            },
          },
          getCatalogInsertBeforeId()
        );
      } catch (e) {
        console.warn("[CENTRO] Triângulo histórico indisponível:", e);
      }
    }

    function remove(mapInstance) {
      if (!mapInstance) return;
      var th = window.CENTRO && window.CENTRO.trianguloHistorico;
      if (!th || !th.CONFIG) return;
      var cfg = th.CONFIG;
      try {
        if (mapInstance.getLayer(cfg.outlineLayerId)) mapInstance.removeLayer(cfg.outlineLayerId);
        if (mapInstance.getLayer(cfg.fillLayerId)) mapInstance.removeLayer(cfg.fillLayerId);
        if (mapInstance.getSource(cfg.sourceId)) mapInstance.removeSource(cfg.sourceId);
      } catch (e) {
        console.warn("[CENTRO] Triângulo histórico — erro ao remover:", e);
      }
    }

    async function sync(mapInstance) {
      if (!mapInstance) return;
      if (!isTrianguloPhaseUnlocked()) {
        remove(mapInstance);
        return;
      }
      await add(mapInstance);
    }

    return {
      add: add,
      remove: remove,
      sync: sync,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.trianguloOverlay = { create: create };
})();
