(function () {
  function tryParseJson(value) {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();

    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return value;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  function hasPopupValue(value) {
    if (value === null || value === undefined || value === "") {
      return false;
    }

    if (Array.isArray(value) && value.length === 0) {
      return false;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  const valueApi = {
    tryParseJson,
    hasPopupValue
  };

  window.MAPA_SP_VALUE = valueApi;
})();
