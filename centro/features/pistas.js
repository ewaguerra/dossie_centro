/**
 * Pistas históricas — Rua São Bento
 */
(function () {
  "use strict";

  var U = window.CENTRO && window.CENTRO.utils;

  var PISTAS_RUA_SAO_BENTO_POI = Object.freeze({
    sourceId: "rsb-pistas-source",
    hitboxLayerId: "rsb-pistas-hitbox",
    fillLayerId: "rsb-pistas-fill",
    iconLayerId: "rsb-pistas-icon",
    outlineLayerId: "rsb-pistas-outline",
    geojsonPath: "assets/pistas/rua-sao-bento-pistas.json",
  });

  var RSB_POI_LAYERS = Object.freeze({
    hitbox: "rsb-pistas-hitbox",
    fill: "rsb-pistas-fill",
    icon: "rsb-pistas-icon",
    outline: "rsb-pistas-outline",
  });

  var ruaSaoBentoPistasPromise = null;

  function normalizeText(value) {
    if (!value || typeof value !== "string") return "";
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function isRuaSaoBentoFeature(feature) {
    if (!feature || !feature.properties) return false;
    var props = feature.properties;
    var pistaMatch = props.tags && typeof props.tags === "string" && props.tags.includes("pista_rua_sao_bento");
    if (pistaMatch) return true;
    var name = normalizeText(props.name || props.nome || props.title || "");
    var slug = normalizeText(props.slug || props.id || "");
    return (
      name.includes("sao bento") ||
      name.includes("são bento") ||
      slug.includes("sao-bento") ||
      slug.includes("pista")
    );
  }

  function loadRuaSaoBentoPistas() {
    if (!ruaSaoBentoPistasPromise) {
      ruaSaoBentoPistasPromise = U.fetchCentroJson(
        "assets/pistas/rua-sao-bento-pistas.json"
      );
    }
    return ruaSaoBentoPistasPromise;
  }

  function createRuaSaoBentoPistasProfileCard(items, properties) {
    var POPUP = window.MAPA_SP_POPUP;
    if (!POPUP) return "<p>Erro: POPUP não disponível</p>";
    var mainProps = {};
    if (properties) {
      mainProps.title = properties.name || properties.title || "Pista Histórica";
      mainProps.description = properties.description || "";
    }
    if (typeof POPUP.renderFeaturePopup !== 'function') {
      console.warn('[CENTRO] POPUP.renderFeaturePopup nao disponivel — renderizando fallback');
      var fallbackHtml = '<div style="padding:8px;font-family:sans-serif;">' +
        '<h3 style="margin:0 0 6px;">' + (mainProps.title || 'Pista') + '</h3>' +
        (mainProps.description ? '<p style="font-size:12px;color:#555;">' + mainProps.description + '</p>' : '') +
        '</div>';
      return fallbackHtml;
    }
    return POPUP.renderFeaturePopup(
      { properties: mainProps },
      { extraCards: items }
    );
  }

  // ── Exports ────────────────────────────────────────────────────────────
  window.CENTRO = window.CENTRO || {};
  window.CENTRO.pistas = {
    CONFIG: PISTAS_RUA_SAO_BENTO_POI,
    POI_LAYERS: RSB_POI_LAYERS,
    loadRuaSaoBentoPistas: loadRuaSaoBentoPistas,
    isRuaSaoBentoFeature: isRuaSaoBentoFeature,
    normalizeText: normalizeText,
    createRuaSaoBentoPistasProfileCard: createRuaSaoBentoPistasProfileCard,
  };
})();
