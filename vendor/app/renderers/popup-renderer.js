(function () {
  const FORMATTERS = window.MAPA_SP_FORMAT;
  const HTML_UTILS = window.MAPA_SP_HTML;
  const VALUE_UTILS = window.MAPA_SP_VALUE;

  if (!FORMATTERS || !HTML_UTILS || !VALUE_UTILS) {
    throw new Error("MAPA_SP_POPUP depende de formatters.js, html-utils.js e value-utils.js.");
  }

  const { formatFieldValue } = FORMATTERS;
  const { escapeHtml, isPlainObject } = HTML_UTILS;
  const { tryParseJson, hasPopupValue } = VALUE_UTILS;
  const EMPTY_FRESHNESS = { processed: null, source: null, osmRelated: [] };

  function getSafeContext(context) {
    const safe = context || {};
    return {
      baseMapKnowledge: safe.baseMapKnowledge || null,
      normalizeLayerKnowledge: typeof safe.normalizeLayerKnowledge === "function" ? safe.normalizeLayerKnowledge : (x) => x,
      getLayerKnowledge: typeof safe.getLayerKnowledge === "function" ? safe.getLayerKnowledge : () => null,
      getGroupKnowledge: typeof safe.getGroupKnowledge === "function" ? safe.getGroupKnowledge : () => null,
      getFieldKnowledge: typeof safe.getFieldKnowledge === "function" ? safe.getFieldKnowledge : () => null,
      getFreshnessForLayer: typeof safe.getFreshnessForLayer === "function" ? safe.getFreshnessForLayer : () => EMPTY_FRESHNESS,
      getOsmTimestamps: typeof safe.getOsmTimestamps === "function" ? safe.getOsmTimestamps : () => [],
      collectDateLikeFields: typeof safe.collectDateLikeFields === "function" ? safe.collectDateLikeFields : () => ({}),
      renderDateFieldsDetails: typeof safe.renderDateFieldsDetails === "function" ? safe.renderDateFieldsDetails : () => ""
    };
  }

  function buildConfiguredTitle(layer, properties, layerKnowledge) {
    if (layerKnowledge?.displayTitle) {
      const { template, formats } = layerKnowledge.displayTitle;
      let title = template;

      title = title.replace(/{([^}]+)}/g, (match, field) => {
        if (properties[field] !== undefined && properties[field] !== null && properties[field] !== "") {
          const format = formats && formats[field] ? formats[field] : "default";
          return formatFieldValue(properties[field], format);
        }
        return "—";
      });

      return title;
    }

    if (layerKnowledge?.title) return layerKnowledge.title;

    return (
      properties.name ||
      properties.nome ||
      properties.title ||
      properties.titulo ||
      layer.title
    );
  }

  function createPopupHtml(layer, properties, context) {
    const safeContext = getSafeContext(context);
    const normalized = normalizePopupProperties(properties);
    const layerKnowledge = safeContext.normalizeLayerKnowledge(safeContext.getLayerKnowledge(layer));
    const groupKnowledge = safeContext.getGroupKnowledge(layer);

    const title = buildConfiguredTitle(layer, normalized, layerKnowledge);

    const subtitle =
      normalized.objective ||
      normalized.objetivo ||
      layer.group_title ||
      layer.group ||
      "";

    const summaryRows = buildConfiguredSummary(layer, normalized, layerKnowledge);
    const technicalRows = buildTechnicalRows(normalized, layer, layerKnowledge, safeContext.getFieldKnowledge);
    const interpretationHtml = renderInterpretationSection(layerKnowledge, groupKnowledge);
    const baseMapHtml = renderBaseMapNote(safeContext.baseMapKnowledge);

    return `
      <div class="map-popup">
        <div class="map-popup-header">
          <div class="map-popup-title">${escapeHtml(title)}</div>
          ${subtitle
        ? `<div class="map-popup-subtitle">${escapeHtml(subtitle)}</div>`
        : ""
      }
        </div>

        ${renderDataFreshnessSection(layer, safeContext)}

        ${interpretationHtml}
        ${baseMapHtml}

        <div class="map-popup-section">
          <div class="map-popup-section-title">Resumo</div>
          ${summaryRows.length
        ? renderPopupTable(summaryRows)
        : `<div class="map-popup-empty">Sem resumo disponível.</div>`
      }
        </div>

        <div class="map-popup-section">
          <div class="map-popup-section-title">Campos técnicos</div>
          ${technicalRows.length
        ? renderPopupTable(technicalRows)
        : `<div class="map-popup-empty">Sem propriedades técnicas disponíveis.</div>`
      }
        </div>
      </div>
    `;
  }

  function normalizePopupProperties(properties) {
    const output = {};

    for (const [key, value] of Object.entries(properties || {})) {
      output[key] = tryParseJson(value);
    }

    return output;
  }

  function buildConfiguredSummary(layer, properties, layerKnowledge) {
    const rows = [];

    if (layerKnowledge?.summaryFields) {
      for (const sf of layerKnowledge.summaryFields) {
        if (hasPopupValue(properties[sf.field])) {
          const val = formatFieldValue(properties[sf.field], sf.format || "default");
          rows.push([sf.label, val]);
        }
      }
      return rows;
    }

    const defaultFields = [
      ["id", "ID"],
      ["name", "Nome"],
      ["nome", "Nome"],
      ["title", "Título"],
      ["titulo", "Título"],
      ["address", "Endereço"],
      ["endereco", "Endereço"],
      ["objective", "Objetivo"],
      ["objetivo", "Objetivo"],
      ["location_type", "Tipo de local"],
      ["type", "Tipo"],
      ["status", "Status"],
      ["gps_lat", "Latitude"],
      ["gps_long", "Longitude"],
      ["lat", "Latitude"],
      ["lng", "Longitude"],
      ["lon", "Longitude"]
    ];

    for (const [field, label] of defaultFields) {
      if (hasPopupValue(properties[field])) {
        rows.push([label, properties[field]]);
      }
    }

    return rows;
  }

  function buildTechnicalRows(properties, layer, layerKnowledge, getFieldKnowledge) {
    return Object.entries(properties)
      .filter(([_, value]) => hasPopupValue(value))
      .map(([key, value]) => {
        const fieldKnowledge = getFieldKnowledge(key, layer, layerKnowledge);

        return [key, value, fieldKnowledge];
      });
  }

  function renderPopupTable(rows) {
    return `
      <table class="map-popup-table">
        ${rows
        .map(
          ([key, value, fieldKnowledge]) => `
              <tr>
                <td class="map-popup-key">${escapeHtml(key)}</td>
                <td class="map-popup-value">
                  ${formatPopupValue(value)}
                  ${renderFieldMeaning(fieldKnowledge)}
                </td>
              </tr>
            `
        )
        .join("")}
      </table>
    `;
  }

  function renderInterpretationSection(layerKnowledge, groupKnowledge) {
    if (!layerKnowledge && !groupKnowledge) {
      return "";
    }

    const meaning =
      layerKnowledge?.what ||
      layerKnowledge?.meaning ||
      groupKnowledge?.what ||
      groupKnowledge?.meaning;
    const interpretation =
      layerKnowledge?.howToRead ||
      layerKnowledge?.interpretation ||
      groupKnowledge?.howToRead;
    const caution = layerKnowledge?.caution;
    const confidence = layerKnowledge?.confidence;
    const goodFor =
      layerKnowledge?.usefulFor ||
      layerKnowledge?.goodFor ||
      groupKnowledge?.helpsAnswer ||
      groupKnowledge?.questions ||
      [];
    const evidence = layerKnowledge?.evidence || [];

    return `
      <div class="map-popup-section map-popup-interpretation">
        <div class="map-popup-section-title">Leitura urbana</div>
        ${confidence ? renderInterpretationBadge(confidence) : ""}
        ${meaning ? renderInterpretationBlock("O que é", meaning) : ""}
        ${
          interpretation
            ? renderInterpretationBlock("Como interpretar", interpretation)
            : ""
        }
        ${goodFor.length ? renderInterpretationList("Ajuda a responder", goodFor) : ""}
        ${evidence.length ? renderInterpretationList("Evidencias no dado", evidence) : ""}
        ${caution ? renderInterpretationBlock("Atencao", caution) : ""}
      </div>
    `;
  }

  function renderInterpretationBadge(confidence) {
    const labels = {
      manual: "Curadoria manual",
      inferred: "Interpretação inferida",
      generated: "Interpretação gerada",
      pending: "Pendente de curadoria"
    };

    return `<div class="map-popup-confidence">${escapeHtml(labels[confidence] || confidence)}</div>`;
  }

  function renderInterpretationBlock(label, text) {
    return `
      <div class="map-popup-note">
        <div class="map-popup-note-label">${escapeHtml(label)}</div>
        <div>${escapeHtml(text)}</div>
      </div>
    `;
  }

  function renderInterpretationList(label, items) {
    return `
      <div class="map-popup-note">
        <div class="map-popup-note-label">${escapeHtml(label)}</div>
        <ul class="map-popup-list">
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function renderBaseMapNote(baseMap) {
    if (!baseMap) {
      return "";
    }

    return `
      <details class="map-popup-section map-popup-basemap">
        <summary class="map-popup-basemap-summary">ℹ️ ${escapeHtml(baseMap.title || "Mapa base")}</summary>
        <p>${escapeHtml(baseMap.explanation || "")}</p>
        ${baseMap.caution ? `<p class="map-popup-basemap-caution">${escapeHtml(baseMap.caution)}</p>` : ""}
      </details>
    `;
  }

  function renderFieldMeaning(fieldKnowledge) {
    if (!fieldKnowledge?.meaning && !fieldKnowledge?.label) {
      return "";
    }

    const text = fieldKnowledge.label
      ? `${fieldKnowledge.label}: ${fieldKnowledge.meaning || ""}`
      : fieldKnowledge.meaning;

    return `<div class="map-popup-field-meaning">${escapeHtml(text)}</div>`;
  }

  function formatPopupValue(value) {
    if (Array.isArray(value) || isPlainObject(value)) {
      return formatJsonValue(value);
    }

    const text = String(value);

    if (text.length > 140) {
      return `
        <details class="map-popup-details">
          <summary>Ver valor completo</summary>
          <pre class="map-popup-code">${escapeHtml(text)}</pre>
        </details>
      `;
    }

    return escapeHtml(text);
  }

  function formatJsonValue(value) {
    const json = JSON.stringify(value, null, 2);

    const shortLabel = getJsonShortLabel(value);

    return `
      <details class="map-popup-details">
        <summary>${escapeHtml(shortLabel)}</summary>
        <pre class="map-popup-code">${escapeHtml(json)}</pre>
      </details>
    `;
  }

  function getJsonShortLabel(value) {
    if (Array.isArray(value)) {
      if (value.length === 1 && isPlainObject(value[0])) {
        const item = value[0];
        const name = item.name || item.title || item.acronym || item.id;

        if (name) {
          return `Array[1] — ${String(name)}`;
        }
      }

      return `Array[${value.length}]`;
    }

    if (isPlainObject(value)) {
      const name = value.name || value.title || value.acronym || value.id;

      if (name) {
        return `Object — ${String(name)}`;
      }

      return `Object {${Object.keys(value).length} campos}`;
    }

    return "Ver JSON";
  }

  function renderDataFreshnessSection(layer, context) {
    const freshness = context.getFreshnessForLayer(layer);

    const rows = [];

    if (freshness.processed?.modified_at_local) {
      rows.push([
        "Processado localmente",
        freshness.processed.modified_at_local
      ]);
    }

    if (
      freshness.source?.modified_at_local &&
      freshness.source.file !== freshness.processed?.file
    ) {
      rows.push([
        "Arquivo de origem local",
        freshness.source.modified_at_local
      ]);
    }

    const osmTimestamps = context.getOsmTimestamps(freshness);

    if (osmTimestamps.length === 1) {
      rows.push([
        "Base OSM consultada",
        osmTimestamps[0]
      ]);
    }

    if (osmTimestamps.length > 1) {
      rows.push([
        "Base OSM consultada",
        `${osmTimestamps[0]} até ${osmTimestamps[osmTimestamps.length - 1]}`
      ]);
    }

    const dateFields = context.collectDateLikeFields(freshness);

    if (Object.keys(dateFields).length > 0) {
      rows.push([
        "Pistas de data no arquivo",
        { html: context.renderDateFieldsDetails(dateFields) }
      ]);
    } else {
      rows.push([
        "Data oficial no GeoJSON",
        "Não informada"
      ]);
    }

    rows.push([
      "Aviso",
      "A data local indica quando o arquivo foi salvo/processado neste projeto. Ela não prova a data oficial de produção do dado."
    ]);

    return `
      <div class="map-popup-section map-popup-freshness">
        <div class="map-popup-section-title">Frescor do dado</div>
        ${renderFreshnessTable(rows)}
      </div>
    `;
  }

  function formatFreshnessValue(value) {
    if (value == null) return "";
    if (typeof value === "object") {
      // Se houver tentativa de injetar HTML via backdoor .html, escapamos o conteúdo
      if (value.html) return escapeHtml(String(value.html));
      try {
        return escapeHtml(JSON.stringify(value));
      } catch (e) {
        return escapeHtml(String(value));
      }
    }
    return escapeHtml(String(value));
  }

  function renderFreshnessTable(rows) {
    return `
      <table class="map-popup-table">
        ${rows
          .map(([key, value]) => {
            const renderedValue = formatFreshnessValue(value);

            return `
              <tr>
                <td class="map-popup-key">${escapeHtml(key)}</td>
                <td class="map-popup-value">${renderedValue}</td>
              </tr>
            `;
          })
          .join("")}
      </table>
    `;
  }

  const popupApi = {
    createPopupHtml,
    buildConfiguredTitle,
    buildConfiguredSummary,
    buildTechnicalRows,
    renderPopupTable,
    renderInterpretationSection,
    renderBaseMapNote,
    renderFieldMeaning,
    formatPopupValue,
    formatJsonValue,
    getJsonShortLabel,
    renderDataFreshnessSection,
    formatFreshnessValue,
    normalizePopupProperties,
    createHtml: createPopupHtml
  };

  window.MAPA_SP_POPUP = popupApi;
})();
