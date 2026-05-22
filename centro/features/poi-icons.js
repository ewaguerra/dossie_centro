/**
 * POI Icons — camadas symbol para património, turismo e interacção
 */
(function () {
  "use strict";

  var POI_TURISTICO_LAYERS = Object.freeze({
    sourceId: "poi-turistico-source",
    iconLayerId: "poi-turistico-icon",
    hitboxLayerId: "poi-turistico-hitbox",
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
    "poi-turistico-icon",
    "memoria-paulistana-icon",
    "acervo-tombado-icon",
    "bem-arqueologico-icon",
    "monumentos-icon",
    "rsb-pistas-icon",
  ]);

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
