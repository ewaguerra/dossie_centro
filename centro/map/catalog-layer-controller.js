/**
 * Catalog layer controller — add/remove GeoJSON layers na sidebar.
 * Deps injetadas pelo runtime; sem acesso a sidebar, ARG ou catálogo.
 */
(function () {
  "use strict";

  /**
   * Tenta criar symbol layer com ícone. Retorna true em sucesso, false para usar circle.
   * @param {object} cfg
   * @param {string} sid  sourceId
   * @param {object} deps
   * @returns {Promise<boolean>}
   */
  async function addPointLayerWithIcon(cfg, sid, deps) {
    var resolveLayerIcon = deps.resolveLayerIcon;
    var iconPath =
      typeof resolveLayerIcon === "function" ? resolveLayerIcon(cfg.id) : null;
    if (!iconPath) return false;

    var imageId = cfg.id + "-symbol";
    try {
      await deps.ensureImage(deps.map, imageId, iconPath);
    } catch (iconErr) {
      if (typeof deps.warn === "function") {
        deps.warn("[CENTRO] Icone indisponivel, fallback circle:", cfg.id, iconErr.message);
      }
      return false;
    }

    var haloPaint =
      typeof deps.getMapIconHaloPaint === "function" ? deps.getMapIconHaloPaint() : {};
    deps.ensureLayer(
      deps.map,
      deps.applyLayerZoomBounds(
        {
          id: cfg.id,
          type: "symbol",
          source: sid,
          layout: {
            "icon-image": imageId,
            "icon-size": 0.82,
            "icon-allow-overlap": true,
            "icon-anchor": "center",
          },
          paint: haloPaint,
        },
        cfg
      ),
      deps.getInsertBeforeId()
    );
    return true;
  }

  /**
   * Adiciona source GeoJSON + layer tipada para uma entrada do catálogo.
   * @param {object} cfg  entry do catálogo (layers.json)
   * @param {object} deps dependências injetadas
   */
  async function addCatalogLayerToMap(cfg, deps) {
    var map = deps.map;
    if (!map || !map.getSource) return;

    var sid = cfg.id + "-src";
    var geom = cfg.geom || cfg.geometry || "polygon";
    if (map.getSource(sid)) return;

    var dataUrl = deps.buildLayerDataUrl(cfg);

    try {
      deps.ensureSource(map, sid, { type: "geojson", data: dataUrl });

      var paint = (cfg.style && cfg.style.paint) || {};
      var color =
        paint["fill-color"] ||
        paint["circle-color"] ||
        (cfg.style && cfg.style.color) ||
        "#3388ff";

      if (geom === "polygon" || geom === "fill") {
        deps.ensureLayer(
          map,
          deps.applyLayerZoomBounds(
            {
              id: cfg.id + "-fill",
              type: "fill",
              source: sid,
              paint:
                Object.keys(paint).length > 0
                  ? paint
                  : { "fill-color": color, "fill-opacity": 0.25 },
            },
            cfg
          ),
          deps.getInsertBeforeId()
        );
      } else if (geom === "point") {
        var usedIcon = await addPointLayerWithIcon(cfg, sid, deps);
        if (!usedIcon) {
          deps.ensureLayer(
            map,
            deps.applyLayerZoomBounds(
              {
                id: cfg.id,
                type: "circle",
                source: sid,
                paint:
                  Object.keys(paint).length > 0
                    ? paint
                    : { "circle-radius": 6, "circle-color": color },
              },
              cfg
            ),
            deps.getInsertBeforeId()
          );
        }
      } else if (geom === "line") {
        deps.ensureLayer(
          map,
          deps.applyLayerZoomBounds(
            {
              id: cfg.id,
              type: "line",
              source: sid,
              paint:
                Object.keys(paint).length > 0
                  ? paint
                  : { "line-color": color, "line-width": 2 },
            },
            cfg
          ),
          deps.getInsertBeforeId()
        );

        var streetOverlay = window.CENTRO && window.CENTRO.streetLabelsOverlay;
        if (
          streetOverlay &&
          typeof streetOverlay.isBoundToOsmRuasLayer === "function" &&
          streetOverlay.isBoundToOsmRuasLayer(cfg.id) &&
          typeof streetOverlay.sync === "function"
        ) {
          await streetOverlay.sync(map, {
            enabled: true,
            deps: {
              ensureSource: deps.ensureSource,
              ensureLayer: deps.ensureLayer,
              getInsertBeforeId: deps.getInsertBeforeId,
            },
          });
        }
      }

      deps.activeLayers.add(cfg.id);
    } catch (e) {
      if (typeof deps.warn === "function") {
        deps.warn("[CENTRO] Erro ao adicionar camada", cfg.id, e);
      }
      if (typeof deps.toast === "function") {
        deps.toast("Erro ao carregar camada: " + cfg.id, "warn");
      }
    }
  }

  /**
   * Remove source + layers de uma entry do catálogo.
   * Não remove image (pré-existente, ver dívida técnica Gate 4.5E).
   * @param {string} layerId
   * @param {object} deps
   */
  function removeCatalogLayerFromMap(layerId, deps) {
    var map = deps.map;
    if (!map || !map.getLayer) return;

    var streetOverlay = window.CENTRO && window.CENTRO.streetLabelsOverlay;
    if (
      streetOverlay &&
      typeof streetOverlay.isBoundToOsmRuasLayer === "function" &&
      streetOverlay.isBoundToOsmRuasLayer(layerId) &&
      typeof streetOverlay.remove === "function"
    ) {
      streetOverlay.remove(map);
    }

    var fill = layerId + "-fill";
    if (map.getLayer(fill)) map.removeLayer(fill);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    var src = layerId + "-src";
    if (map.getSource(src)) map.removeSource(src);
    deps.activeLayers.delete(layerId);
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.addCatalogLayerToMap = addCatalogLayerToMap;
  window.CENTRO.map.removeCatalogLayerFromMap = removeCatalogLayerFromMap;
})();
