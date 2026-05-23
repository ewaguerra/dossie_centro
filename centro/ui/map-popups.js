/**
 * Factories DOM para popups MapLibre (POI e pistas).
 * Valores vêm de GeoJSON — textContent evita XSS via setHTML.
 */
(function () {
  "use strict";

  function createPoiPopupNode(name, secondary) {
    var root = document.createElement("div");
    root.className = "poi-popup";
    var title = document.createElement("b");
    title.textContent = name || "POI";
    root.appendChild(title);
    if (secondary) {
      root.appendChild(document.createElement("br"));
      var small = document.createElement("small");
      small.textContent = secondary;
      root.appendChild(small);
    }
    return root;
  }

  function createPistaPopupNode(item) {
    var root = document.createElement("div");
    root.className = "pista-popup";

    var h3 = document.createElement("h3");
    h3.className = "pista-popup__title";
    h3.textContent = item.title || "Pista";
    root.appendChild(h3);

    if (item.description) {
      var p = document.createElement("p");
      p.className = "pista-popup__desc";
      p.textContent = item.description;
      root.appendChild(p);
    }

    if (item.image) {
      var img = document.createElement("img");
      img.className = "pista-popup__img";
      img.alt = item.title || "";
      img.loading = "lazy";
      img.src = "/centro/" + String(item.image).replace(/^\.?\//, "");
      root.appendChild(img);
    }

    if (item.sourceUrl) {
      var pSrc = document.createElement("p");
      pSrc.className = "pista-popup__source";
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

    return root;
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.createPoiPopupNode = createPoiPopupNode;
  window.CENTRO.ui.createPistaPopupNode = createPistaPopupNode;
})();
