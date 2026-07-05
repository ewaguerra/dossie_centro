(function () {
  function normalizePath(value) {
    return String(value || "")
      .replaceAll("\\", "/")
      .replace(/^\.?\//, "")
      .replace(/^\/+/, "");
  }

  function getOsmTimestamps(freshness) {
    const timestamps = [];

    if (freshness.source?.overpass_metadata?.timestamp_osm_base) {
      timestamps.push(freshness.source.overpass_metadata.timestamp_osm_base);
    }

    for (const item of freshness.osmRelated || []) {
      const timestamp = item.overpass_metadata?.timestamp_osm_base;

      if (timestamp) {
        timestamps.push(timestamp);
      }
    }

    return [...new Set(timestamps)].sort();
  }

  function collectDateLikeFields(freshness) {
    const output = {};

    for (const item of [
      freshness.processed,
      freshness.source,
      ...(freshness.osmRelated || [])
    ]) {
      if (!item?.date_like_fields) {
        continue;
      }

      for (const [key, value] of Object.entries(item.date_like_fields)) {
        output[key] = value;
      }
    }

    return output;
  }

  const freshnessApi = {
    normalizePath,
    getOsmTimestamps,
    collectDateLikeFields
  };

  window.MAPA_SP_FRESHNESS = freshnessApi;
})();
