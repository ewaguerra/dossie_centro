(function () {
  function formatLayerType(type) {
    if (!type) return null;
    const map = {
      fill: "polígono",
      line: "linha",
      circle: "ponto",
      symbol: "símbolo",
      heatmap: "mapa de calor",
      raster: "raster",
      polygon: "polígono",
      point: "ponto",
      multipolygon: "polígono",
      multilinestring: "linha",
      multipoint: "ponto"
    };
    const key = String(type).toLowerCase();
    return map[key] || null;
  }

  function hasLayerBbox(layer) {
    return Array.isArray(layer.bbox) && layer.bbox.length === 4;
  }

  function buildLayerItemMetadata(layer) {
    if (!layer || typeof layer !== "object") return "";

    const parts = [];

    if (typeof layer.feature_count === "number") {
      const n = layer.feature_count;
      const formatted = n.toLocaleString("pt-BR");
      const label = n === 1 ? "feição" : "feições";
      parts.push(`${formatted} ${label}`);
    }

    if (typeof layer.file_size_bytes === "number" && layer.file_size_bytes > 0) {
      const formatBytes = window.MAPA_SP_HTML && window.MAPA_SP_HTML.formatBytes;
      if (typeof formatBytes === "function") {
        parts.push(formatBytes(layer.file_size_bytes));
      }
    }

    return parts.join(" · ");
  }

  window.MAPA_SP_CARD = {
    buildLayerItemMetadata,
    formatLayerType,
    hasLayerBbox
  };
})();
