/**
 * Triângulo Histórico — overlay urbano com as três ruas fundadoras
 */
(function () {
  "use strict";

  var TRIANGULO_HISTORICO = Object.freeze({
    sourceId: "centro-triangulo-historico-source",
    fillLayerId: "centro-triangulo-historico-fill",
    outlineLayerId: "centro-triangulo-historico-outline",
    label: "Triângulo Histórico",
    streetNames: ["Rua São Bento", "Rua Quinze de Novembro", "Rua Direita"],
    fillColor: "#000000",
    fillOpacity: 0.28,
    outlineColor: "#000000",
    outlineWidth: 3,
  });

  var TRIANGULO_HISTORICO_FALLBACK_POLYGON = {
    type: "Feature",
    properties: {
      name: "Triângulo Histórico",
      source: "fallback-calibrated",
      streets: ["Rua São Bento", "Rua Quinze de Novembro", "Rua Direita"],
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-46.6358, -23.5457],
          [-46.63335, -23.5483],
          [-46.63515, -23.5503],
          [-46.6358, -23.5457],
        ],
      ],
    },
  };

  var trianguloHistoricoGeojsonPromise = null;

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
      ""
    );
  }

  function isTargetHistoricStreet(feature) {
    var street = getFeatureStreetName(feature);
    if (!street) return false;
    return TRIANGULO_HISTORICO.streetNames.some(function (name) {
      return normalizeStreetName(name) === street;
    });
  }

  function classifyHistoricStreetName(feature) {
    var street = getFeatureStreetName(feature);
    if (!street) return null;
    for (var i = 0; i < TRIANGULO_HISTORICO.streetNames.length; i++) {
      if (normalizeStreetName(TRIANGULO_HISTORICO.streetNames[i]) === street) {
        return TRIANGULO_HISTORICO.streetNames[i];
      }
    }
    return null;
  }

  function collectLineCoordinates(geometry, out, maxPoints) {
    out = out || [];
    if (!geometry) return out;
    if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
      var coords = geometry.coordinates;
      var step = Math.max(1, Math.floor(coords.length / maxPoints));
      for (var i = 0; i < coords.length && out.length < maxPoints; i += step) {
        out.push(coords[i]);
      }
    } else if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) {
      for (var j = 0; j < geometry.coordinates.length; j++) {
        collectLineCoordinates(
          { type: "LineString", coordinates: geometry.coordinates[j] },
          out,
          maxPoints
        );
      }
    } else if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
      for (var k = 0; k < geometry.geometries.length; k++) {
        collectLineCoordinates(geometry.geometries[k], out, maxPoints);
      }
    }
    return out;
  }

  function computeCentroid(points) {
    if (!points || points.length === 0) return null;
    var sumLon = 0,
      sumLat = 0;
    for (var i = 0; i < points.length; i++) {
      sumLon += points[i][0];
      sumLat += points[i][1];
    }
    return [sumLon / points.length, sumLat / points.length];
  }

  function downsamplePoints(points, maxPoints) {
    if (!points || points.length <= maxPoints) return points || [];
    var step = points.length / maxPoints;
    var result = [];
    for (var i = 0; i < maxPoints; i++) {
      var idx = Math.floor(i * step);
      if (idx < points.length) result.push(points[idx]);
    }
    return result;
  }

  function dist2(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return dx * dx + dy * dy;
  }

  function closestMidpoint(pointsA, pointsB) {
    var bestDist = Infinity;
    var best = null;
    var limit = Math.min(pointsA.length, 100);
    for (var ai = 0; ai < limit; ai++) {
      var a = pointsA[ai];
      for (var bj = 0; bj < pointsB.length; bj++) {
        var d = dist2(a, pointsB[bj]);
        if (d < bestDist) {
          bestDist = d;
          best = [(a[0] + pointsB[bj][0]) / 2, (a[1] + pointsB[bj][1]) / 2];
        }
      }
    }
    return best;
  }

  function triangleArea(a, b, c) {
    return Math.abs(
      (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])) / 2
    );
  }

  function buildTrianguloFromStreetFeatures(features) {
    if (!features || features.length < 3) return TRIANGULO_HISTORICO_FALLBACK_POLYGON;

    var groups = {};
    for (var i = 0; i < features.length; i++) {
      var name = classifyHistoricStreetName(features[i]);
      if (name) {
        if (!groups[name]) groups[name] = [];
        groups[name].push(features[i]);
      }
    }

    var streetNames = Object.keys(groups);
    if (streetNames.length < 3) return TRIANGULO_HISTORICO_FALLBACK_POLYGON;

    var centroids = [];
    for (var s = 0; s < streetNames.length; s++) {
      var feats = groups[streetNames[s]];
      var pts = [];
      for (var f = 0; f < feats.length; f++) {
        collectLineCoordinates(feats[f].geometry, pts, 50);
      }
      var c = computeCentroid(pts);
      if (c) centroids.push({ name: streetNames[s], centroid: c, points: pts });
    }

    if (centroids.length < 3) return TRIANGULO_HISTORICO_FALLBACK_POLYGON;

    var bestArea = -1;
    var bestTriple = null;
    for (var ai2 = 0; ai2 < centroids.length; ai2++) {
      for (var bi = ai2 + 1; bi < centroids.length; bi++) {
        for (var ci = bi + 1; ci < centroids.length; ci++) {
          var area = triangleArea(
            centroids[ai2].centroid,
            centroids[bi].centroid,
            centroids[ci].centroid
          );
          if (area > bestArea) {
            bestArea = area;
            bestTriple = [centroids[ai2], centroids[bi], centroids[ci]];
          }
        }
      }
    }

    if (!bestTriple) return TRIANGULO_HISTORICO_FALLBACK_POLYGON;

    var midpoints = [];
    for (var m = 0; m < 3; m++) {
      var next = (m + 1) % 3;
      var mp = closestMidpoint(bestTriple[m].points, bestTriple[next].points);
      if (mp) midpoints.push(mp);
    }

    if (midpoints.length < 3) return TRIANGULO_HISTORICO_FALLBACK_POLYGON;

    midpoints.push(midpoints[0]);
    return {
      type: "Feature",
      properties: {
        name: "Triângulo Histórico",
        source: "derived-from-street-centerlines",
        streets: TRIANGULO_HISTORICO.streetNames,
      },
      geometry: { type: "Polygon", coordinates: [midpoints] },
    };
  }

  async function buildTrianguloHistoricoGeojson() {
    if (trianguloHistoricoGeojsonPromise) return trianguloHistoricoGeojsonPromise;

    trianguloHistoricoGeojsonPromise = (async function () {
      try {
        var poi = window.CENTRO && window.CENTRO.poiIcons;
        var layerFile =
          (poi && poi.POI_TURISTICO_LAYER_FILE) ||
          "data/geojson/special/pois/centro_pois_turisticos__point.geojson";
        var fetchLayer =
          window.CENTRO &&
          window.CENTRO.map &&
          window.CENTRO.map.fetchLayerGeojson;
        var data =
          typeof fetchLayer === "function"
            ? await fetchLayer(layerFile)
            : null;
        var features = (data && data.features) || [];
        var streetFeats = features.filter(isTargetHistoricStreet);
        if (streetFeats.length >= 3) {
          return buildTrianguloFromStreetFeatures(streetFeats);
        }
      } catch (_e) {
        // fallback silencioso
      }
      return TRIANGULO_HISTORICO_FALLBACK_POLYGON;
    })();

    return trianguloHistoricoGeojsonPromise;
  }

  // ── Exports ────────────────────────────────────────────────────────────
  window.CENTRO = window.CENTRO || {};
  window.CENTRO.trianguloHistorico = {
    CONFIG: TRIANGULO_HISTORICO,
    buildTrianguloHistoricoGeojson: buildTrianguloHistoricoGeojson,
  };
})();
