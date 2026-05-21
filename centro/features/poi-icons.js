/**
 * POI Icons — ícones SVG para camadas de interesse: busca, memória, acervo, arqueologia, monumentos
 */
(function () {
  "use strict";

  var POI_TURISTICO_LAYERS = Object.freeze({
    idle: "poi-turistico-idle",
    hover: "poi-turistico-hover",
    hitbox: "poi-turistico-hitbox",
  });

  var MEMORIA_PAULISTANA_LAYERS = Object.freeze({
    sourceId: "memoria-paulistana-source",
    iconLayerId: "memoria-paulistana-icon",
    hitboxLayerId: "memoria-paulistana-hitbox",
  });

  var ACERVO_TOMBADO_LAYERS = Object.freeze({
    sourceId: "acervo-tombado-source",
    iconLayerId: "acervo-tombado-icon",
    hitboxLayerId: "acervo-tombado-hitbox",
  });

  var BEM_ARQUEOLOGICO_LAYERS = Object.freeze({
    sourceId: "bem-arqueologico-source",
    iconLayerId: "bem-arqueologico-icon",
    hitboxLayerId: "bem-arqueologico-hitbox",
  });

  var MONUMENTOS_LAYERS = Object.freeze({
    sourceId: "monumentos-source",
    iconLayerId: "monumentos-icon",
    hitboxLayerId: "monumentos-hitbox",
  });

  var POI_INTERACTION_LAYER_IDS = Object.freeze([
    "poi-turistico-hitbox",
    "poi-turistico-idle",
    "poi-turistico-hover",
    "memoria-paulistana-hitbox",
    "memoria-paulistana-icon",
    "acervo-tombado-hitbox",
    "acervo-tombado-icon",
    "bem-arqueologico-hitbox",
    "bem-arqueologico-icon",
    "monumentos-hitbox",
    "monumentos-icon",
    "rsb-pistas-hitbox",
    "rsb-pistas-icon",
    "rsb-pistas-outline",
  ]);

  // ── Exports ────────────────────────────────────────────────────────────
  window.CENTRO = window.CENTRO || {};
  window.CENTRO.poiIcons = {
    POI_TURISTICO_LAYERS: POI_TURISTICO_LAYERS,
    MEMORIA_PAULISTANA_LAYERS: MEMORIA_PAULISTANA_LAYERS,
    ACERVO_TOMBADO_LAYERS: ACERVO_TOMBADO_LAYERS,
    BEM_ARQUEOLOGICO_LAYERS: BEM_ARQUEOLOGICO_LAYERS,
    MONUMENTOS_LAYERS: MONUMENTOS_LAYERS,
    POI_INTERACTION_LAYER_IDS: POI_INTERACTION_LAYER_IDS,
  };
})();
