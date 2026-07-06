/**
 * POI Icons — camadas symbol para património, turismo e interacção
 */
(function () {
  "use strict";

  var POI_TURISTICO_LAYER_FILE =
    "data/geojson/special/pois/centro_pois_turisticos__point.geojson";

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

  var LINHA_TEMPO_LAYER_FILE =
    "data/geojson/special/timeline/centro_linha_tempo__point.geojson";

  var LINHA_TEMPO_THREAD_LAYER_FILE =
    "data/geojson/special/timeline/centro_linha_tempo__line.geojson";

  var LINHA_TEMPO_LAYERS = Object.freeze({
    sourceId: "linha-tempo-source",
    iconLayerId: "linha-tempo-icon",
    hitboxLayerId: "linha-tempo-hitbox",
    threadSourceId: "linha-tempo-thread-source",
    threadLayerId: "linha-tempo-thread-line",
  });

  var POI_INTERACTION_LAYER_IDS = Object.freeze([
    "poi-turistico-icon",
    "memoria-paulistana-icon",
    "acervo-tombado-icon",
    "bem-arqueologico-icon",
    "monumentos-icon",
    "linha-tempo-icon",
    "rsb-pistas-icon",
  ]);

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.poiIcons = {
    POI_TURISTICO_LAYER_FILE: POI_TURISTICO_LAYER_FILE,
    POI_TURISTICO_LAYERS: POI_TURISTICO_LAYERS,
    MEMORIA_PAULISTANA_LAYERS: MEMORIA_PAULISTANA_LAYERS,
    ACERVO_TOMBADO_LAYERS: ACERVO_TOMBADO_LAYERS,
    BEM_ARQUEOLOGICO_LAYERS: BEM_ARQUEOLOGICO_LAYERS,
    MONUMENTOS_LAYERS: MONUMENTOS_LAYERS,
    LINHA_TEMPO_LAYER_FILE: LINHA_TEMPO_LAYER_FILE,
    LINHA_TEMPO_THREAD_LAYER_FILE: LINHA_TEMPO_THREAD_LAYER_FILE,
    LINHA_TEMPO_LAYERS: LINHA_TEMPO_LAYERS,
    POI_INTERACTION_LAYER_IDS: POI_INTERACTION_LAYER_IDS,
  };
})();
