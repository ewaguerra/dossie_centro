/**
 * Runtime principal da página Centro.
 * Extraído de scripts inline para manter HTML válido e facilitar manutenção.
 */
(function () {
  "use strict";

  var map = null;
  var activeLayers = new Set();

  function setupHamburgerMenu() {
    var btn = document.getElementById("hamburger-btn");
    var dd = document.getElementById("hamburger-dropdown");
    if (!btn || !dd) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      dd.style.display = dd.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", function () {
      dd.style.display = "none";
    });
    dd.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  function ensureSource(mapInstance, id, sourceConfig) {
    if (!mapInstance.getSource(id)) {
      mapInstance.addSource(id, sourceConfig);
    }
  }

  function ensureLayer(mapInstance, layerConfig) {
    if (!mapInstance.getLayer(layerConfig.id)) {
      mapInstance.addLayer(layerConfig);
    }
  }

  function styleSupportsTextLabels(mapInstance) {
    var style = mapInstance.getStyle && mapInstance.getStyle();
    return !!(style && style.glyphs);
  }

  function bindLayerEventOnce(mapInstance, eventName, layerId, handler) {
    mapInstance.__centroPoiHandlers = mapInstance.__centroPoiHandlers || {};
    var handlerKey = eventName + ":" + layerId;
    if (mapInstance.__centroPoiHandlers[handlerKey]) return;
    mapInstance.on(eventName, layerId, handler);
    mapInstance.__centroPoiHandlers[handlerKey] = handler;
  }

  function loadImageElement(url) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  async function ensureImage(mapInstance, imageId, imagePath) {
    if (mapInstance.hasImage(imageId)) return;
    var image = await loadImageElement(imagePath);
    mapInstance.addImage(imageId, image);
  }

  async function addPOILayer(mapInstance, cfg) {
    var sourceId = cfg.sourceId;
    var iconLayerId = cfg.iconLayerId;
    var labelLayerId = cfg.labelLayerId;
    var imageId = cfg.imageId;
    var dataPath = cfg.dataPath;
    var titleProp = cfg.titleProp;
    var descProp = cfg.descProp;
    var addrProp = cfg.addrProp;
    var iconPath = cfg.iconPath;

    ensureSource(mapInstance, sourceId, { type: "geojson", data: dataPath });
    await ensureImage(mapInstance, imageId, iconPath);

    ensureLayer(mapInstance, {
      id: iconLayerId,
      type: "symbol",
      source: sourceId,
      layout: {
        "icon-image": imageId,
        "icon-size": 0.7,
        "icon-allow-overlap": true,
      },
    });

    if (titleProp && styleSupportsTextLabels(mapInstance)) {
      ensureLayer(mapInstance, {
        id: labelLayerId,
        type: "symbol",
        source: sourceId,
        layout: {
          "text-field": ["get", titleProp],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 10,
          "text-offset": [0, 2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#fff",
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1,
        },
      });
    }

    bindLayerEventOnce(mapInstance, "click", iconLayerId, function (e) {
      var properties = (e.features && e.features[0] && e.features[0].properties) || {};
      var name = titleProp ? properties[titleProp] || "POI" : "POI";
      var secondary = descProp
        ? properties[descProp] || ""
        : addrProp
          ? properties[addrProp] || ""
          : "";
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML("<b>" + name + "</b><br><small>" + secondary + "</small>")
        .addTo(mapInstance);
    });

    bindLayerEventOnce(mapInstance, "mouseenter", iconLayerId, function () {
      mapInstance.getCanvas().style.cursor = "pointer";
    });
    bindLayerEventOnce(mapInstance, "mouseleave", iconLayerId, function () {
      mapInstance.getCanvas().style.cursor = "";
    });
  }

  function showInspector(feature) {
    var panel = document.getElementById("inspector");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "inspector";
      panel.className = "card card--inspector card--static debug-inspector";
      document.body.appendChild(panel);
    }
    var props = feature.properties || {};
    panel.innerHTML = "";
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "debug-inspector__close btn btn--bare btn--icon-sm";
    closeBtn.setAttribute("aria-label", "Fechar inspector de debug");
    closeBtn.textContent = "\u00d7";
    closeBtn.addEventListener("click", function () {
      panel.remove();
    });
    var body = document.createElement("pre");
    body.className = "debug-inspector__body";
    body.textContent = JSON.stringify(props, null, 2);
    panel.appendChild(closeBtn);
    panel.appendChild(body);
  }

  function initMap() {
    map = new maplibregl.Map({
      container: "map",
      style: "/osm-style.json",
      center: [-46.6361, -23.5505],
      zoom: 14,
      hash: true,
      maxBounds: [[-46.67, -23.59], [-46.58, -23.52]],
      minZoom: 13,
      maxZoom: 17,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl(), "bottom-left");

    map.on("load", async function () {
      console.log("[CENTRO] Mapa carregado com layout original");

      var poi = window.CENTRO && window.CENTRO.poiIcons;
      if (poi) {
        var poiConfigs = [
          { id: "memoria-paulistana", iconFile: "icon-memoria", file: "centro_memoria_paulistana__point", sourceId: poi.MEMORIA_PAULISTANA_LAYERS.sourceId, iconLayerId: poi.MEMORIA_PAULISTANA_LAYERS.iconLayerId, titleProp: "nm_titulo_placa", descProp: "dc_enunciado_placa", addrProp: "nm_endereco_placa" },
          { id: "acervo-tombado", iconFile: "icon-acervo", file: "centro_acervo_tombado__point", sourceId: poi.ACERVO_TOMBADO_LAYERS.sourceId, iconLayerId: poi.ACERVO_TOMBADO_LAYERS.iconLayerId, titleProp: "nm_acervo" },
          { id: "bem-arqueologico", iconFile: "icon-arqueologia", file: "centro_bem_arqueologico__point", sourceId: poi.BEM_ARQUEOLOGICO_LAYERS.sourceId, iconLayerId: poi.BEM_ARQUEOLOGICO_LAYERS.iconLayerId },
          { id: "monumentos", iconFile: "icon-monumentos", file: "centro_monumentos__point", sourceId: poi.MONUMENTOS_LAYERS.sourceId, iconLayerId: poi.MONUMENTOS_LAYERS.iconLayerId, titleProp: "nm_obra" },
        ];
        for (var poiIndex = 0; poiIndex < poiConfigs.length; poiIndex++) {
          var poiCfg = poiConfigs[poiIndex];
          try {
            await addPOILayer(map, {
              sourceId: poiCfg.sourceId,
              iconLayerId: poiCfg.iconLayerId,
              labelLayerId: poiCfg.id + "-label",
              imageId: poiCfg.id + "-pin",
              dataPath: "/centro/data/context/" + poiCfg.file + ".geojson",
              iconPath: "/centro/assets/icons/" + poiCfg.iconFile + ".svg",
              titleProp: poiCfg.titleProp,
              descProp: poiCfg.descProp,
              addrProp: poiCfg.addrProp,
            });
          } catch (e) {
            console.warn("[CENTRO] Erro POI layer", poiCfg.iconLayerId, e.message);
            if (typeof window.centroToast === "function") {
              window.centroToast("Erro ao carregar camada POI: " + poiCfg.iconLayerId, "warn");
            }
          }
        }
        console.log("[CENTRO] 4 POI layers adicionados (fluxo único)");
      } else {
        console.warn("[CENTRO] CENTRO.poiIcons nao disponivel — POI layers ignorados");
      }

      fetch("/centro/assets/pistas/rua-sao-bento-pistas.json")
        .then(function (r) {
          return r.json();
        })
        .then(function (items) {
          var pistaMarkers = [];
          items.forEach(function (item) {
            if (!item.lngLat || !Array.isArray(item.lngLat) || item.lngLat.length < 2) return;
            var popupHtml =
              "<div class=\"pista-popup\" style=\"font-family:sans-serif;max-width:260px;\">" +
              "<h3 style=\"margin:0 0 6px;font-size:14px;\">" + item.title + "</h3>" +
              (item.description ? "<p style=\"margin:0 0 8px;font-size:12px;color:#555;\">" + item.description + "</p>" : "") +
              "<img src=\"/centro/" + item.image + "\" alt=\"" + item.title + "\" style=\"width:100%;border-radius:4px;\" />" +
              (item.sourceUrl
                ? "<p style=\"margin:4px 0 0;font-size:10px;color:#999;\">Fonte: <a href=\"" + item.sourceUrl + "\" target=\"_blank\" rel=\"noopener\" style=\"color:#666;\">" + item.sourceUrl.replace(/^https?:\/\//, "").substring(0, 40) + "…</a></p>"
                : "") +
              "</div>";
            var marker = new maplibregl.Marker({ color: "#c0392b" })
              .setLngLat(item.lngLat)
              .setPopup(new maplibregl.Popup({ offset: 25, maxWidth: "300px" }).setHTML(popupHtml))
              .addTo(map);
            pistaMarkers.push(marker);
          });
          console.log("[CENTRO] " + pistaMarkers.length + " markers de pistas adicionados");
        })
        .catch(function (e) {
          console.warn("[CENTRO] Erro ao carregar pistas:", e);
        });

      map.on("click", function (e) {
        var features = map.queryRenderedFeatures(e.point);
        if (!features || features.length === 0) return;
        showInspector(features[0]);
      });

      var closeBtn = document.getElementById("sidebar-close-btn");
      var openBtn = document.getElementById("sidebar-open-btn");
      var panel = document.querySelector(".sidebar");
      if (closeBtn && panel) {
        closeBtn.addEventListener("click", function () {
          panel.classList.add("sidebar--collapsed");
          if (openBtn) openBtn.hidden = false;
        });
      }
      if (openBtn && panel) {
        openBtn.addEventListener("click", function () {
          panel.classList.remove("sidebar--collapsed");
          openBtn.hidden = true;
        });
      }
    });
  }

  function flyToLocation(lng, lat, zoom, pitch) {
    if (!map) return;
    map.flyTo({
      center: [lng, lat],
      zoom: zoom || 15,
      pitch: pitch || 0,
      duration: 2000,
    });
  }

  window.centroNavigate = flyToLocation;

  window.CENTRO_POIS = {
    triangulo: { center: [-46.635, -23.545], zoom: 16, pitch: 40, label: "Triângulo Histórico" },
    se: { center: [-46.6335, -23.5505], zoom: 17, pitch: 60, label: "Praça da Sé" },
    anhangabau: { center: [-46.6345, -23.5485], zoom: 16, pitch: 30, label: "Vale do Anhangabaú" },
    ruaSaobento: { center: [-46.6355, -23.5452], zoom: 16, pitch: 20, label: "Rua São Bento" },
    mosteiro: { center: [-46.6345, -23.544], zoom: 17, pitch: 45, label: "Mosteiro São Bento" },
    overview: { center: [-46.6365, -23.547], zoom: 14.5, pitch: 0, label: "Visão Geral" },
  };

  window.centroGoTo = function (id) {
    var poi = window.CENTRO_POIS && window.CENTRO_POIS[id];
    if (!poi || !map) return;
    map.flyTo({
      center: poi.center,
      zoom: poi.zoom,
      pitch: poi.pitch || 0,
      duration: 2000,
    });
  };

  function loadSidebarData() {
    var statusEl = document.getElementById("sidebar-status");
    var panel = document.getElementById("layers-panel");
    if (!panel) return;

    fetch("/centro/data/catalog/layers.json")
      .then(function (layersResp) {
        return Promise.all([layersResp.json(), fetch("/centro/data/catalog/groups.json").then(function (groupsResp) { return groupsResp.json(); })]);
      })
      .then(function (payload) {
        var layers = payload[0];
        var groups = payload[1];
        if (statusEl) statusEl.style.display = "none";
        var groupsList = Array.isArray(groups) ? groups : groups.groups || [];
        var layersList = layers.layers || [];
        var html = "";

        for (var g = 0; g < groupsList.length; g++) {
          var group = groupsList[g];
          var groupLayers = layersList.filter(function (l) {
            return l.group === group.id;
          });
          if (groupLayers.length === 0) continue;

          html += "<details class=\"group\" open>";
          html += "<summary>" + (group.title || group.id) + " <span style=\"color:#555;font-weight:normal;\">(" + groupLayers.length + ")</span></summary>";
          for (var i = 0; i < groupLayers.length; i++) {
            var ly = groupLayers[i];
            html += "<label class=\"layer-row\">";
            html += "<input type=\"checkbox\" " + (ly.visible !== false ? "checked" : "") + " data-layer-id=\"" + ly.id + "\">";
            html += " <span>" + (ly.title || ly.id) + "</span>";
            if (ly.feature_count !== undefined) html += " <span class=\"layer-meta\">" + ly.feature_count + " feats</span>";
            html += "</label>";
          }
          html += "</details>";
        }

        panel.innerHTML = html || "<p style=\"color:#888;\">Nenhuma camada disponível</p>";
        console.log("[CENTRO] Sidebar carregada:", groupsList.length, "grupos,", layersList.length, "camadas");
      })
      .catch(function (e) {
        console.error("[CENTRO] Erro ao carregar sidebar:", e);
        if (statusEl) statusEl.textContent = "Erro ao carregar dados: " + e.message;
        if (typeof window.centroToast === "function") {
          window.centroToast("Erro ao carregar camadas: " + e.message, "error");
        }
      });
  }

  function addLayerToMap(cfg) {
    if (!map || !map.getSource) return;
    var sid = cfg.id + "-src";
    var geom = cfg.geom || "polygon";
    if (map.getSource(sid)) return;

    var filePath = cfg.file || "";
    var dataUrl = "/centro/data/processed/" + filePath.replace(/^.*processed\//, "");

    try {
      map.addSource(sid, { type: "geojson", data: dataUrl });
      var paint = (cfg.style && cfg.style.paint) || {};
      var color = paint["fill-color"] || (cfg.style && cfg.style.color) || "#3388ff";

      if (geom === "polygon" || geom === "fill") {
        map.addLayer({
          id: cfg.id + "-fill",
          type: "fill",
          source: sid,
          paint: { "fill-color": color, "fill-opacity": 0.25 },
        });
      } else if (geom === "point") {
        map.addLayer({
          id: cfg.id,
          type: "circle",
          source: sid,
          paint: { "circle-radius": 6, "circle-color": color },
        });
      } else if (geom === "line") {
        map.addLayer({
          id: cfg.id,
          type: "line",
          source: sid,
          paint: { "line-color": color, "line-width": 2 },
        });
      }

      activeLayers.add(cfg.id);
    } catch (e) {
      console.warn("[CENTRO] Erro ao adicionar camada", cfg.id, e);
      if (typeof window.centroToast === "function") {
        window.centroToast("Erro ao carregar camada: " + cfg.id, "warn");
      }
    }
  }

  function removeLayerFromMap(id) {
    if (!map || !map.getLayer) return;
    var fill = id + "-fill";
    if (map.getLayer(fill)) map.removeLayer(fill);
    if (map.getLayer(id)) map.removeLayer(id);
    var src = id + "-src";
    if (map.getSource(src)) map.removeSource(src);
    activeLayers.delete(id);
  }

  function bindLayerCheckboxesWhenReady() {
    var attempts = 0;
    var checkInterval = setInterval(function () {
      attempts += 1;
      if (document.querySelector(".layer-row input")) {
        clearInterval(checkInterval);
        document.querySelectorAll(".layer-row input[type=\"checkbox\"]").forEach(function (cb) {
          cb.addEventListener("change", function () {
            var lid = this.dataset.layerId;
            if (!lid) return;
            fetch("/centro/data/catalog/layers.json")
              .then(function (r) {
                return r.json();
              })
              .then(function (data) {
                var cfg = data.layers.find(function (l) {
                  return l.id === lid;
                });
                if (!cfg) return;
                if (cb.checked) addLayerToMap(cfg);
                else removeLayerFromMap(lid);
              });
          });
        });
        document
          .querySelectorAll(".layer-row input[type=\"checkbox\"]:checked")
          .forEach(function (cb) {
            cb.dispatchEvent(new Event("change"));
          });
      }
      if (attempts > 50) clearInterval(checkInterval);
    }, 100);
  }

  function setupLazyImageObserver() {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeName === "IMG" && !n.loading) {
            n.setAttribute("loading", "lazy");
          }
          if (n.querySelectorAll) {
            n.querySelectorAll("img:not([loading])").forEach(function (img) {
              img.setAttribute("loading", "lazy");
            });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("[CENTRO] Lazy loading observer ativo");
  }

  function setupToast() {
    var toastEl = null;
    var msgEl = null;

    function hideToast() {
      if (toastEl) toastEl.classList.add("is-hidden");
    }

    window.centroToast = function (msg, type) {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.id = "centro-toast";
        toastEl.className = "toast is-hidden";
        toastEl.setAttribute("role", "status");
        toastEl.setAttribute("aria-live", "polite");

        msgEl = document.createElement("span");
        msgEl.className = "toast__message";

        var closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "toast__close";
        closeBtn.setAttribute("aria-label", "Fechar");
        closeBtn.textContent = "\u00d7";
        closeBtn.addEventListener("click", hideToast);

        toastEl.appendChild(msgEl);
        toastEl.appendChild(closeBtn);
        document.body.appendChild(toastEl);
      }

      msgEl.textContent = msg;
      toastEl.classList.toggle("toast--warn", type === "warn");
      toastEl.classList.remove("is-hidden");

      if (window.centroToastTimer) clearTimeout(window.centroToastTimer);
      window.centroToastTimer = setTimeout(hideToast, 4000);
    };
    console.log("[CENTRO] Toast system ready");
  }

  function toggleSidebar() {
    var sb = document.getElementById("panel");
    var btn = document.getElementById("sidebar-toggle");
    if (!sb || !btn) return;
    sb.classList.toggle("collapsed");
    btn.classList.toggle("open");
    btn.innerHTML = sb.classList.contains("collapsed")
      ? "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>"
      : "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"15 18 9 12 15 6\"/></svg>";
  }

  function setupSidebarToggle() {
    var btn = document.getElementById("sidebar-toggle");
    if (btn) {
      btn.addEventListener("click", toggleSidebar);
    }
  }

  function setupNarrativeNav() {
    document.querySelectorAll("#narrative-nav .nav-btn[data-nav-lng]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        flyToLocation(
          parseFloat(btn.dataset.navLng),
          parseFloat(btn.dataset.navLat),
          parseFloat(btn.dataset.navZoom),
          parseFloat(btn.dataset.navPitch)
        );
      });
    });
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function (e) {
      if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey) {
        toggleSidebar();
      }
    });
  }

  function bootstrap() {
    setupHamburgerMenu();
    setupSidebarToggle();
    setupNarrativeNav();
    setupToast();
    setupLazyImageObserver();
    setupKeyboardShortcuts();
    loadSidebarData();
    bindLayerCheckboxesWhenReady();
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
