(function () {
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function formatBytes(bytes) {
    if (!bytes) return "tamanho desconhecido";
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  const htmlApi = {
    escapeHtml,
    isPlainObject,
    formatBytes
  };

  window.MAPA_SP_HTML = htmlApi;
})();
