(function () {
  function formatDatePtBr(value) {
    if (!value) return "";
    const str = String(value);
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return str;
  }

  function formatFieldValue(value, format) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    switch (format) {
      case "date_ptbr":
        return formatDatePtBr(value);
      case "meters":
        return `${Number(value).toLocaleString("pt-BR")} m`;
      case "distance_band":
        return String(value).replace(".", ",");
      default:
        return String(value);
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  const formatApi = {
    formatDatePtBr,
    formatFieldValue,
    normalizeText
  };

  window.MAPA_SP_FORMAT = formatApi;
})();
