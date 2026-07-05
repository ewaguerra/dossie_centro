/**
 * Carrega layers.json + context wired + groups + layer-unlocks.
 */
(function () {
  "use strict";

  function normalizeLayer(ly) {
    var out = Object.assign({}, ly);
    var geom = out.geom || out.geometry;
    if (!geom) {
      if (out.type === "fill") geom = "polygon";
      else if (out.type === "line") geom = "line";
      else if (out.type === "circle" || out.type === "symbol") geom = "point";
    }
    out.geom = geom;
    return out;
  }

  function loadCatalog() {
    return Promise.all([
      fetch("/centro/data/catalog/layers.json").then(function (r) {
        return r.json();
      }),
      fetch("/centro/data/catalog/groups.json").then(function (r) {
        return r.json();
      }),
      fetch("/centro/data/catalog/layer-unlocks.json").then(function (r) {
        return r.ok ? r.json() : { layers: {} };
      }),
      fetch("/centro/data/catalog/context-layers.json").then(function (r) {
        return r.ok ? r.json() : null;
      }),
      fetch("/centro/data/catalog/context-groups.json").then(function (r) {
        return r.ok ? r.json() : [];
      }),
      fetch("/centro/data/catalog/context-wired.json").then(function (r) {
        return r.ok ? r.json() : { layerIds: [] };
      }),
    ]).then(function (payload) {
      var layersDoc = payload[0];
      var groupsRaw = payload[1];
      var unlocks = payload[2];
      var contextDoc = payload[3];
      var contextGroups = payload[4];
      var wired = payload[5];

      var wiredSet = new Set((wired && wired.layerIds) || []);
      var processedList = ((layersDoc && layersDoc.layers) || []).map(normalizeLayer);
      var contextList = [];

      if (contextDoc && contextDoc.layers) {
        for (var i = 0; i < contextDoc.layers.length; i++) {
          var ly = contextDoc.layers[i];
          if (wiredSet.has(ly.id)) contextList.push(normalizeLayer(ly));
        }
      }

      var allLayers = processedList.concat(contextList);
      var allGroups = Array.isArray(groupsRaw)
        ? groupsRaw.slice()
        : (groupsRaw && groupsRaw.groups) || [];

      if (Array.isArray(contextGroups)) {
        for (var g = 0; g < contextGroups.length; g++) {
          var cg = contextGroups[g];
          var ctxIds = [];
          for (var j = 0; j < contextList.length; j++) {
            if (contextList[j].group === cg.id) ctxIds.push(contextList[j].id);
          }
          if (ctxIds.length > 0) {
            allGroups.push({
              id: cg.id,
              title: cg.title,
              color: "#64748b",
              layers: ctxIds,
            });
          }
        }
      }

      var catalogIndex = new Map();
      for (var k = 0; k < allLayers.length; k++) {
        catalogIndex.set(allLayers[k].id, allLayers[k]);
      }

      return {
        layers: allLayers,
        groups: allGroups,
        catalogIndex: catalogIndex,
        layerUnlockRules: (unlocks && unlocks.layers) || {},
        counts: {
          processed: processedList.length,
          context: contextList.length,
        },
      };
    });
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.catalogLoad = {
    loadCatalog: loadCatalog,
    normalizeLayer: normalizeLayer,
  };
})();
