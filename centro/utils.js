/**
 * Centro — módulo de utilidades compartilhadas
 * URL resolver, fetch, debug helpers, validação de dependências
 */
(function () {
  "use strict";

  // ── Validação de dependências ──────────────────────────────────────────
  function validateDependencies() {
    const deps = {
      MAPA_SP_HTML: window.MAPA_SP_HTML,
      MAPA_SP_POPUP: window.MAPA_SP_POPUP,
      MAPA_SP_CARD: window.MAPA_SP_CARD,
    };
    const missing = Object.entries(deps)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length > 0) {
      console.error("[CENTRO] Dependências ausentes:", missing.join(", "));
      document.body.innerHTML =
        '<p style="padding:2em;font-family:sans-serif;color:red;">' +
        "Erro: dependências do mapa não carregaram. Verifique o console.</p>";
      return false;
    }
    return true;
  }

  // ── URL resolver ───────────────────────────────────────────────────────
  function getCentroBaseUrl() {
    const script = document.querySelector('script[src$="centro-runtime.js"]');
    if (script && script.src) {
      return new URL("./", script.src);
    }
    return new URL("./pages/centro/", window.location.origin + "/");
  }

  const CENTRO_BASE_URL = getCentroBaseUrl();

  function centroAssetUrl(path) {
    const cleanPath = String(path || "").replace(/^\.?\//, "");
    return new URL(cleanPath, CENTRO_BASE_URL).toString();
  }

  async function fetchCentroJson(path) {
    const url = centroAssetUrl(path);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        "Falha ao carregar " + path + ": " + response.status + " " + url
      );
    }
    return response.json();
  }

  // ── Constantes ─────────────────────────────────────────────────────────
  const CENTRO_COLOR = "#f59e0b";

  const CENTRO_BBOX = [
    -46.64856399115046, -23.569, -46.61152799134523, -23.539,
  ];
  const CENTRO_MAX_BOUNDS = [
    [-46.67, -23.59],
    [-46.58, -23.52],
  ];
  const MIN_ZOOM = 13;
  const MAX_ZOOM = 17;
  const CENTRO_CENTER = [-46.6361, -23.5505];
  const CENTRO_ZOOM_FALLBACK = 14;

  // ── Bbox helpers ────────────────────────────────────────────────────
  function isValidBbox(bbox) {
    return (
      Array.isArray(bbox) &&
      bbox.length === 4 &&
      bbox.every(function (v) { return typeof v === "number" && isFinite(v); })
    );
  }

  function bboxToBounds(bbox) {
    if (!isValidBbox(bbox)) return null;
    return [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ];
  }

  function bboxCenter(bbox) {
    if (!isValidBbox(bbox)) return null;
    return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
        timer = null;
      }, delay);
    };
  }

  // ── Haversine ───────────────────────────────────────────────────────
  function metersBetweenLngLat(a, b) {
    var R = 6371000;
    var toRad = function (d) { return (d * Math.PI) / 180; };
    var lat1 = toRad(a[1]);
    var lat2 = toRad(b[1]);
    var dLat = lat2 - lat1;
    var dLon = toRad(b[0] - a[0]);
    var s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  // ── Exports ────────────────────────────────────────────────────────────
  window.CENTRO = window.CENTRO || {};
  window.CENTRO.utils = {
    validateDependencies: validateDependencies,
    centroAssetUrl: centroAssetUrl,
    fetchCentroJson: fetchCentroJson,
    CENTRO_COLOR: CENTRO_COLOR,
    CENTRO_BBOX: CENTRO_BBOX,
    CENTRO_MAX_BOUNDS: CENTRO_MAX_BOUNDS,
    MIN_ZOOM: MIN_ZOOM,
    MAX_ZOOM: MAX_ZOOM,
    CENTRO_CENTER: CENTRO_CENTER,
    CENTRO_ZOOM_FALLBACK: CENTRO_ZOOM_FALLBACK,
    isValidBbox: isValidBbox,
    bboxToBounds: bboxToBounds,
    bboxCenter: bboxCenter,
    debounce: debounce,
    metersBetweenLngLat: metersBetweenLngLat,
  };
})();
