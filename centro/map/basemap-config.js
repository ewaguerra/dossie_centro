/**
 * Resolução do estilo basemap — liberty local + proxy /basemap/ em todos os ambientes.
 * Override: ?basemap=online | ?basemap=local
 */
(function () {
  "use strict";

  var BASEMAP_GROUND_COLOR = "#f8f4f0";
  var STYLE_ONLINE = "https://tiles.openfreemap.org/styles/liberty";
  var STYLE_LOCAL = "/centro/assets/basemap/liberty.json";

  var COMPARE_OPS = { "==": 1, "!=": 1, "<": 1, "<=": 1, ">": 1, ">=": 1 };
  var HEIGHT_PROPS = { render_height: 1, render_min_height: 1 };

  function resolveBasemapStyle() {
    try {
      var params = new URLSearchParams(window.location.search);
      var mode = (params.get("basemap") || "").toLowerCase();
      if (mode === "online") return STYLE_ONLINE;
      if (mode === "local" || mode === "proxied") return STYLE_LOCAL;
    } catch (_e) {
      // URLSearchParams indisponível — segue default local.
    }
    return STYLE_LOCAL;
  }

  function absolutizeBasemapUrl(path) {
    if (!path || typeof path !== "string") return path;
    if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) return path;
    if (path.charAt(0) === "/") return window.location.origin + path;
    return path;
  }

  function isGetExpr(expr) {
    return Array.isArray(expr) && expr[0] === "get" && typeof expr[1] === "string";
  }

  function coalesceDefault(op, literal, propName) {
    if (HEIGHT_PROPS[propName]) {
      return propName === "render_min_height" ? 0 : 6;
    }
    if (op === ">" || op === ">=") return 0;
    if (op === "<" || op === "<=") return 999999;
    return 0;
  }

  function hardenExpr(expr) {
    if (!Array.isArray(expr)) return expr;
    var op = expr[0];
    if (COMPARE_OPS[op] && expr.length >= 3) {
      var out = [op];
      for (var i = 1; i < expr.length; i++) {
        var arg = expr[i];
        if (isGetExpr(arg)) {
          var other = i === 1 ? expr[2] : expr[1];
          var lit = typeof other === "number" ? other : undefined;
          arg = ["coalesce", arg, coalesceDefault(op, lit, arg[1])];
        } else if (Array.isArray(arg)) {
          arg = hardenExpr(arg);
        }
        out.push(arg);
      }
      return out;
    }
    if (isGetExpr(expr) && HEIGHT_PROPS[expr[1]]) {
      return ["coalesce", expr, coalesceDefault(null, null, expr[1])];
    }
    return expr.map(function (v) {
      return Array.isArray(v) ? hardenExpr(v) : v;
    });
  }

  function hardenBasemapStyle(style) {
    if (!style || !Array.isArray(style.layers)) return style;
    for (var li = 0; li < style.layers.length; li++) {
      var layer = style.layers[li];
      if (layer.filter) layer.filter = hardenExpr(layer.filter);
      if (layer.paint) {
        var paintKeys = Object.keys(layer.paint);
        for (var pi = 0; pi < paintKeys.length; pi++) {
          layer.paint[paintKeys[pi]] = hardenExpr(layer.paint[paintKeys[pi]]);
        }
      }
      if (layer.layout) {
        var layoutKeys = Object.keys(layer.layout);
        for (var ui = 0; ui < layoutKeys.length; ui++) {
          var layoutVal = layer.layout[layoutKeys[ui]];
          if (Array.isArray(layoutVal)) {
            layer.layout[layoutKeys[ui]] = hardenExpr(layoutVal);
          }
        }
      }
    }
    return style;
  }

  function absolutizeStyleResourceUrls(style) {
    if (style.sprite) style.sprite = absolutizeBasemapUrl(style.sprite);
    if (style.glyphs) style.glyphs = absolutizeBasemapUrl(style.glyphs);
    var sources = style.sources;
    if (!sources) return style;
    Object.keys(sources).forEach(function (sourceId) {
      var src = sources[sourceId];
      if (!src) return;
      if (src.url) src.url = absolutizeBasemapUrl(src.url);
      if (Array.isArray(src.tiles)) {
        src.tiles = src.tiles.map(absolutizeBasemapUrl);
      }
    });
    return style;
  }

  function inlineTileJsonSources(style) {
    var sources = style.sources;
    if (!sources) return Promise.resolve(style);
    var jobs = Object.keys(sources).map(function (sourceId) {
      var src = sources[sourceId];
      if (!src || !src.url || Array.isArray(src.tiles)) return Promise.resolve();
      var tileJsonUrl = absolutizeBasemapUrl(src.url);
      return fetch(tileJsonUrl)
        .then(function (res) {
          if (!res.ok) throw new Error("TileJSON " + tileJsonUrl + " -> " + res.status);
          return res.json();
        })
        .then(function (tileJson) {
          delete src.url;
          Object.keys(tileJson).forEach(function (key) {
            if (key === "tiles" && Array.isArray(tileJson.tiles)) {
              src.tiles = tileJson.tiles.map(absolutizeBasemapUrl);
              return;
            }
            if (!(key in src)) src[key] = tileJson[key];
          });
        });
    });
    return Promise.all(jobs).then(function () {
      return style;
    });
  }

  function styleUsesProxiedPaths(style) {
    try {
      var raw = JSON.stringify(style);
      return raw.indexOf('"/basemap/') !== -1 || raw.indexOf('"/centro/assets/basemap/') !== -1;
    } catch (_e) {
      return false;
    }
  }

  function fetchStyleJson(styleRef) {
    var fetchUrl = styleRef.indexOf("http") === 0 ? styleRef : absolutizeBasemapUrl(styleRef);
    return fetch(fetchUrl).then(function (res) {
      if (!res.ok) throw new Error("Style " + styleRef + " -> " + res.status);
      return res.json();
    });
  }

  function finalizeStyle(style, styleRef) {
    var proxied = styleRef !== STYLE_ONLINE && styleUsesProxiedPaths(style);
    return inlineTileJsonSources(style).then(function (resolved) {
      if (proxied) absolutizeStyleResourceUrls(resolved);
      return hardenBasemapStyle(resolved);
    });
  }

  /**
   * Sempre retorna StyleSpecification preparado (online ou proxied):
   * TileJSON inline, URLs absolutas quando proxied, filtros endurecidos.
   */
  function prepareBasemapStyle() {
    var styleRef = resolveBasemapStyle();
    return fetchStyleJson(styleRef)
      .then(function (style) {
        return finalizeStyle(style, styleRef);
      })
      .catch(function (err) {
        console.warn("[CENTRO] Falha ao preparar basemap (" + styleRef + ") — fallback online:", err);
        if (styleRef === STYLE_ONLINE) {
          return STYLE_ONLINE;
        }
        return fetchStyleJson(STYLE_ONLINE).then(function (style) {
          return finalizeStyle(style, STYLE_ONLINE);
        });
      });
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.map = window.CENTRO.map || {};
  window.CENTRO.map.BASEMAP_GROUND_COLOR = BASEMAP_GROUND_COLOR;
  window.CENTRO.map.STYLE_ONLINE = STYLE_ONLINE;
  window.CENTRO.map.STYLE_LOCAL = STYLE_LOCAL;
  window.CENTRO.map.resolveBasemapStyle = resolveBasemapStyle;
  window.CENTRO.map.prepareBasemapStyle = prepareBasemapStyle;
  window.CENTRO.map.hardenBasemapStyle = hardenBasemapStyle;
  window.CENTRO.map.absolutizeBasemapUrl = absolutizeBasemapUrl;
})();
