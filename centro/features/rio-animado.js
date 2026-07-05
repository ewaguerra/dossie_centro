/**
 * Rio — utilitários de hidrografia (geometria e seleção de trechos).
 *
 * Escopo atual: camada estática via catálogo (`05_hidrografia_rios__line` em layers.json).
 * Animação de fluxo (requestAnimationFrame, dash-offset, start/stop) está FORA DO ESCOPO
 * e não faz parte do runtime ativo em `centro-runtime.js`.
 */
(function () {
  "use strict";

  var U = window.CENTRO && window.CENTRO.utils;

  var RIO_HIDRO = Object.freeze({
    sourceId: "centro-rio-hidro-source",
    baseLayerId: "centro-rio-hidro-base",
    label: "Hidrografia",
    color: "#38bdf8",
    baseWidth: 5,
    opacity: 0.85,
  });

  function lineLengthMeters(geometry) {
    if (!geometry || geometry.type !== "LineString") return 0;
    var coords = geometry.coordinates;
    var total = 0;
    for (var i = 1; i < coords.length; i++) {
      total += U.metersBetweenLngLat(coords[i - 1], coords[i]);
    }
    return total;
  }

  function rioTrechoPriority(props) {
    if (!props) return 99;
    if (props.nm_tipo_trecho === "Rio Principal") return 0;
    if (props.nm_tipo_trecho === "Córrego") return 1;
    if (props.waterway === "river") return 0;
    if (props.waterway === "stream") return 2;
    return 5;
  }

  function normalizeRioName(name) {
    if (!name || typeof name !== "string") return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  }

  function pickRiosByGroup(featureCollection, maxRios) {
    maxRios = maxRios || 5;
    var features = (featureCollection && featureCollection.features) || [];
    var groups = {};
    for (var i = 0; i < features.length; i++) {
      var f = features[i];
      var props = f && f.properties;
      var name = normalizeRioName(props && (props.nome || props.name));
      if (!name) continue;
      if (!groups[name]) groups[name] = [];
      groups[name].push(f);
    }

    var entries = Object.keys(groups).map(function (k) {
      return { name: k, features: groups[k] };
    });
    entries.sort(function (a, b) {
      var maxA = 0,
        maxB = 0;
      for (var i2 = 0; i2 < a.features.length; i2++)
        maxA = Math.min(rioTrechoPriority(a.features[i2].properties), maxA);
      for (var j = 0; j < b.features.length; j++)
        maxB = Math.min(rioTrechoPriority(b.features[j].properties), maxB);
      return maxA - maxB;
    });

    var selected = entries.slice(0, maxRios);
    var result = [];
    for (var s = 0; s < selected.length; s++) {
      var merged = mergeLineFeaturesToMultiLineString(selected[s].features, {
        name: selected[s].name,
        lengthKm: 0,
        source: "merged-by-name",
      });
      if (merged && merged.geometry && merged.geometry.coordinates.length > 0) {
        if (merged.properties) {
          merged.properties.lengthKm = (
            lineLengthMeters(merged.geometry) / 1000
          ).toFixed(1);
        }
        result.push(merged);
      }
    }
    return { type: "FeatureCollection", features: result };
  }

  function pickLongestLineFeatures(featureCollection, maxFeatures) {
    maxFeatures = maxFeatures || 5;
    var features = (featureCollection && featureCollection.features) || [];
    var withLen = features
      .filter(function (f) { return f && f.geometry; })
      .map(function (f) {
        return { feature: f, length: lineLengthMeters(f.geometry) };
      });
    withLen.sort(function (a, b) { return b.length - a.length; });
    return {
      type: "FeatureCollection",
      features: withLen.slice(0, maxFeatures).map(function (x) { return x.feature; }),
    };
  }

  function mergeLineFeaturesToMultiLineString(features, props) {
    if (!features || features.length === 0) return null;
    var coords = [];
    for (var i = 0; i < features.length; i++) {
      var geom = features[i].geometry;
      if (!geom) continue;
      if (geom.type === "LineString" && geom.coordinates) {
        coords.push(geom.coordinates);
      } else if (geom.type === "MultiLineString" && geom.coordinates) {
        for (var j = 0; j < geom.coordinates.length; j++) {
          coords.push(geom.coordinates[j]);
        }
      }
    }
    if (coords.length === 0) return null;
    return {
      type: "Feature",
      properties: props || {},
      geometry: { type: "MultiLineString", coordinates: coords },
    };
  }

  function reverseLineStringCoordinates(line) {
    if (!line || !line.coordinates) return line;
    return {
      type: line.type,
      coordinates: line.coordinates.slice().reverse(),
    };
  }

  function maybeReverseRioGeojson(geojson, reverseFlow) {
    if (!reverseFlow || !geojson || !geojson.features) return geojson;
    return {
      type: "FeatureCollection",
      features: geojson.features.map(function (f) {
        if (!f || !f.geometry) return f;
        var newGeom = reverseLineStringCoordinates(f.geometry);
        return { type: "Feature", properties: f.properties, geometry: newGeom };
      }),
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.rioAnimado = {
    CONFIG: RIO_HIDRO,
    pickRiosByGroup: pickRiosByGroup,
    pickLongestLineFeatures: pickLongestLineFeatures,
    mergeLineFeaturesToMultiLineString: mergeLineFeaturesToMultiLineString,
    maybeReverseRioGeojson: maybeReverseRioGeojson,
    lineLengthMeters: lineLengthMeters,
  };
})();
