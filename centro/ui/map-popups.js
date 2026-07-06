/**
 * Factories DOM para popups MapLibre (POI e pistas).
 * Valores vêm de GeoJSON — textContent evita XSS via setHTML.
 *
 * Layout inspirado em React Bits ProfileCard / SpotlightCard (estrutura + hierarquia),
 * adaptado ao dossiê forense do Centro.
 */
(function () {
  "use strict";

  var THEME_EYEBROW = {
    "memoria-paulistana": "Memória Paulistana",
    "acervo-tombado": "Acervo Tombado",
    "bem-arqueologico": "Bem Arqueológico",
    monumentos: "Monumento",
    "poi-turistico": "Turismo",
    "linha-tempo": "Linha do tempo",
    pistas: "Pista Histórica",
  };

  var THEME_EYEBROW_SHORT = {
    "memoria-paulistana": "Memória",
    "acervo-tombado": "Acervo",
    "bem-arqueologico": "Arqueologia",
    monumentos: "Monumento",
    "poi-turistico": "Turismo",
  };

  function normalizeMeta(titleOrMeta, secondary) {
    if (typeof titleOrMeta === "object" && titleOrMeta !== null) {
      return titleOrMeta;
    }
    return {
      title: titleOrMeta || "POI",
      secondary: secondary || "",
    };
  }

  function getThemeColor(themeId) {
    var icons = window.MAPA_SP_ICONS;
    if (icons && icons.patrimonio && themeId && icons.patrimonio[themeId]) {
      return icons.patrimonio[themeId].color || "#d97706";
    }
    if (themeId === "pistas" && icons && icons.pistas) {
      return icons.pistas.color || "#2563eb";
    }
    return "#d97706";
  }

  function getEraBadge(eraId) {
    if (!eraId) return null;
    var classifier = window.CENTRO && window.CENTRO.poiEraClassifier;
    if (classifier && typeof classifier.getEraById === "function") {
      var era = classifier.getEraById(eraId);
      if (era) {
        return {
          label: era.shortLabel || era.label || eraId,
          color: era.color || "#78716c",
        };
      }
    }
    return { label: String(eraId), color: "#78716c" };
  }

  function appendBadge(header, label, color) {
    if (!label) return;
    var badge = document.createElement("span");
    badge.className = "evidence-card__badge";
    badge.textContent = label;
    if (color) badge.style.setProperty("--badge-color", color);
    header.appendChild(badge);
  }

  function createEvidenceHeader(themeId, eraId) {
    var header = document.createElement("header");
    header.className = "evidence-card__header";

    var eyebrow = document.createElement("span");
    eyebrow.className = "evidence-card__eyebrow";

    var shiny = document.createElement("span");
    shiny.className = "evidence-card__eyebrow-shiny";
    shiny.textContent = "Evidência";
    eyebrow.appendChild(shiny);

    var themeLabel = THEME_EYEBROW[themeId] || themeId || "Património";
    eyebrow.appendChild(document.createTextNode(" · " + themeLabel));
    header.appendChild(eyebrow);

    var era = getEraBadge(eraId);
    if (era) appendBadge(header, era.label, era.color);

    return header;
  }

  function createPoiPopupNode(titleOrMeta, secondary) {
    var meta = normalizeMeta(titleOrMeta, secondary);
    var themeId = meta.themeId || "";
    var themeColor = getThemeColor(themeId);

    var root = document.createElement("div");
    root.className = "poi-popup evidence-card evidence-card--poi";
    if (themeId) {
      root.classList.add("evidence-card--theme-" + themeId.replace(/[^a-z0-9-]/gi, ""));
    }
    root.style.setProperty("--card-accent", themeColor);
    root.style.setProperty("--spotlight-color", hexToRgba(themeColor, 0.22));

    var eraMeta = getEraBadge(meta.eraId);
    var quoteAccent = eraMeta && eraMeta.color ? eraMeta.color : themeColor;
    root.style.setProperty("--quote-accent", quoteAccent);

    root.appendChild(createEvidenceHeader(themeId, meta.eraId));

    var titleEl = document.createElement("h3");
    titleEl.className = "evidence-card__title poi-popup__title";
    titleEl.textContent = meta.title || "POI";
    root.appendChild(titleEl);

    if (meta.imageUrl) {
      var figure = document.createElement("figure");
      figure.className = "evidence-card__media";
      var img = document.createElement("img");
      img.className = "poi-popup__img evidence-card__img";
      img.alt = meta.title || "";
      img.loading = "lazy";
      img.src = meta.imageUrl;
      figure.appendChild(img);
      root.appendChild(figure);
    }

    var bodyText = meta.secondary || meta.address || "";
    if (bodyText) {
      var isQuote =
        themeId === "memoria-paulistana" ||
        (bodyText.length > 80 && !meta.secondary && meta.address);

      if (isQuote && meta.secondary) {
        var quote = document.createElement("blockquote");
        quote.className = "evidence-card__quote memoria-enunciado";
        quote.textContent = meta.secondary;
        root.appendChild(quote);
        if (meta.address) {
          var addr = document.createElement("p");
          addr.className = "evidence-card__meta poi-popup__meta";
          addr.textContent = meta.address;
          root.appendChild(addr);
        }
      } else {
        var body = document.createElement("p");
        body.className = isQuote
          ? "evidence-card__quote memoria-enunciado"
          : "evidence-card__body poi-popup__body";
        body.textContent = bodyText;
        root.appendChild(body);
      }
    }

    if (meta.secondary && meta.address && themeId !== "memoria-paulistana") {
      var metaLine = document.createElement("p");
      metaLine.className = "evidence-card__meta poi-popup__meta";
      metaLine.textContent = meta.address;
      root.appendChild(metaLine);
    }

    if (meta.wikiUrl) {
      var pWiki = document.createElement("p");
      pWiki.className = "poi-popup__source evidence-card__source";
      var wikiLabel = document.createElement("span");
      wikiLabel.textContent = "Fonte: ";
      pWiki.appendChild(wikiLabel);
      var wikiLink = document.createElement("a");
      wikiLink.href = meta.wikiUrl;
      wikiLink.target = "_blank";
      wikiLink.rel = "noopener";
      wikiLink.textContent = meta.wikiTitle || "Wikipedia";
      pWiki.appendChild(wikiLink);
      root.appendChild(pWiki);
    } else if (meta.imageCredit) {
      var pCredit = document.createElement("p");
      pCredit.className = "poi-popup__source evidence-card__source";
      pCredit.textContent = meta.imageCredit;
      root.appendChild(pCredit);
    }

    var enhance = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.enhanceEvidenceCard;
    if (typeof enhance === "function") {
      enhance(root, { spotlightColor: hexToRgba(themeColor, 0.2) });
    }

    return root;
  }

  function createTimelinePopupNode(meta) {
    meta = meta || {};
    var themeColor = getThemeColor("linha-tempo");
    var sourceThemeId = meta.sourceThemeId || "";
    var eraId = meta.eraId || "";

    var root = document.createElement("div");
    root.className =
      "poi-popup evidence-card evidence-card--timeline evidence-card--theme-linha-tempo";
    root.style.setProperty("--card-accent", themeColor);
    root.style.setProperty("--spotlight-color", hexToRgba(themeColor, 0.22));

    var eraMeta = getEraBadge(eraId);
    root.style.setProperty("--quote-accent", eraMeta && eraMeta.color ? eraMeta.color : themeColor);

    root.appendChild(createEvidenceHeader("linha-tempo", eraId));

    var titleEl = document.createElement("h3");
    titleEl.className = "evidence-card__title poi-popup__title";
    titleEl.textContent = meta.title || "Evidência";
    root.appendChild(titleEl);

    var streetLine = document.createElement("p");
    streetLine.className = "evidence-card__meta timeline-popup__street";
    var streetParts = [];
    if (meta.streetDisplay) streetParts.push(meta.streetDisplay);
    if (meta.sequence && meta.sequenceTotal) {
      streetParts.push("Marco " + meta.sequence + " de " + meta.sequenceTotal);
    }
    if (meta.yearRange && meta.sequenceTotal <= 1) streetParts.push(meta.yearRange);
    streetLine.textContent = streetParts.join(" · ");
    root.appendChild(streetLine);

    var head = document.createElement("div");
    head.className = "timeline-popup__head timeline-popup__head--single";

    if (meta.year != null && meta.year !== "") {
      var yearEl = document.createElement("span");
      yearEl.className = "timeline-popup__year";
      yearEl.textContent = String(meta.year);
      head.appendChild(yearEl);
    }

    if (sourceThemeId) {
      var themeBadge = document.createElement("span");
      themeBadge.className = "timeline-popup__theme";
      themeBadge.textContent =
        THEME_EYEBROW_SHORT[sourceThemeId] ||
        THEME_EYEBROW[sourceThemeId] ||
        sourceThemeId;
      head.appendChild(themeBadge);
    }

    if (eraMeta && eraMeta.label) {
      appendBadge(head, eraMeta.label, eraMeta.color);
    }

    root.appendChild(head);

    if (meta.detail) {
      var detail = document.createElement("p");
      detail.className = "evidence-card__body timeline-popup__detail";
      detail.textContent = meta.detail;
      root.appendChild(detail);
    }

    if (meta.address) {
      var addr = document.createElement("p");
      addr.className = "evidence-card__meta poi-popup__meta";
      addr.textContent = meta.address;
      root.appendChild(addr);
    }

    if (meta.threadHint) {
      var thread = document.createElement("p");
      thread.className = "timeline-popup__thread-hint evidence-card__meta";
      thread.textContent = meta.threadHint;
      root.appendChild(thread);
    }

    var enhance = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.enhanceEvidenceCard;
    if (typeof enhance === "function") {
      enhance(root, { spotlightColor: hexToRgba(themeColor, 0.2) });
    }

    return root;
  }

  function createPistaPopupNode(item) {
    var root = document.createElement("div");
    root.className = "pista-popup evidence-card evidence-card--pistas evidence-card--theme-pistas";
    root.style.setProperty("--card-accent", getThemeColor("pistas"));
    root.style.setProperty("--spotlight-color", "rgba(37, 99, 235, 0.18)");
    root.style.setProperty("--quote-accent", getThemeColor("pistas"));

    root.appendChild(createEvidenceHeader("pistas", ""));

    var h3 = document.createElement("h3");
    h3.className = "evidence-card__title pista-popup__title";
    h3.textContent = item.title || "Pista";
    root.appendChild(h3);

    if (item.description) {
      var p = document.createElement("p");
      p.className = "evidence-card__body pista-popup__desc";
      p.textContent = item.description;
      root.appendChild(p);
    }

    if (item.image) {
      var figure = document.createElement("figure");
      figure.className = "evidence-card__media";
      var img = document.createElement("img");
      img.className = "pista-popup__img evidence-card__img";
      img.alt = item.title || "";
      img.loading = "lazy";
      img.src = "/centro/" + String(item.image).replace(/^\.?\//, "");
      figure.appendChild(img);
      root.appendChild(figure);
    }

    if (item.sourceUrl) {
      var pSrc = document.createElement("p");
      pSrc.className = "pista-popup__source evidence-card__source";
      var label = document.createElement("span");
      label.textContent = "Fonte: ";
      pSrc.appendChild(label);

      var a = document.createElement("a");
      a.href = item.sourceUrl;
      a.target = "_blank";
      a.rel = "noopener";
      var clean = String(item.sourceUrl).replace(/^https?:\/\//, "").substring(0, 40);
      a.textContent = clean + "\u2026";
      pSrc.appendChild(a);
      root.appendChild(pSrc);
    }

    var enhance = window.CENTRO && window.CENTRO.ui && window.CENTRO.ui.enhanceEvidenceCard;
    if (typeof enhance === "function") {
      enhance(root, { spotlightColor: "rgba(37, 99, 235, 0.16)" });
    }

    return root;
  }

  function hexToRgba(hex, alpha) {
    if (!hex || typeof hex !== "string") return "rgba(217, 119, 6, " + (alpha || 0.2) + ")";
    var h = hex.replace("#", "").trim();
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (h.length !== 6 || !/^[0-9A-Fa-f]+$/.test(h)) {
      return "rgba(217, 119, 6, " + (alpha || 0.2) + ")";
    }
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + (alpha == null ? 0.2 : alpha) + ")";
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.createPoiPopupNode = createPoiPopupNode;
  window.CENTRO.ui.createTimelinePopupNode = createTimelinePopupNode;
  window.CENTRO.ui.createPistaPopupNode = createPistaPopupNode;
})();
