/**
 * Utilitários de normalização e match de nomes de ruas — browser.
 */
(function () {
  "use strict";

  function normalizeStreetName(value) {
    if (!value || typeof value !== "string") return "";
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  }

  function getFeatureStreetName(feature) {
    var props = feature && feature.properties;
    if (!props) return "";
    return (
      normalizeStreetName(props.logradouro) ||
      normalizeStreetName(props.name) ||
      normalizeStreetName(props.nome) ||
      normalizeStreetName(props.name_atual) ||
      ""
    );
  }

  function splitAltNames(value) {
    if (!value || typeof value !== "string") return [];
    return value
      .split(/[;,]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function namesDiffer(a, b) {
    if (!a || !b) return false;
    return normalizeStreetName(a) !== normalizeStreetName(b);
  }

  function buildLabelHistorico(historic) {
    if (!historic) return "";
    var label = typeof historic === "string" ? historic : historic.nome;
    if (!label) return "";
    var era = historic.era ? String(historic.era) : "";
    if (era) return label + " (" + era + ")";
    return label;
  }

  var MAJOR_HIGHWAYS = {
    primary: 1,
    primary_link: 1,
    secondary: 1,
    secondary_link: 1,
    tertiary: 1,
    tertiary_link: 1,
    trunk: 1,
    trunk_link: 1,
    motorway: 1,
    motorway_link: 1,
  };

  var STREETS_LAYER_FILE = "data/geojson/heavy/15_osm_ruas__line.geojson";
  var STREET_NAMES_LAYER_FILE =
    "data/geojson/special/streets/centro_ruas_nomes__line.geojson";

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.streetNameUtils = {
    normalizeStreetName: normalizeStreetName,
    getFeatureStreetName: getFeatureStreetName,
    splitAltNames: splitAltNames,
    namesDiffer: namesDiffer,
    buildLabelHistorico: buildLabelHistorico,
    MAJOR_HIGHWAYS: MAJOR_HIGHWAYS,
    STREETS_LAYER_FILE: STREETS_LAYER_FILE,
    STREET_NAMES_LAYER_FILE: STREET_NAMES_LAYER_FILE,
  };
})();
