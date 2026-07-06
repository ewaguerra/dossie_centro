/**
 * Endurece expressões do estilo liberty para MapLibre GL JS 5:
 * comparações numéricas com ["get", …] recebem coalesce para evitar null nos tiles.
 */
const COMPARE_OPS = new Set(["==", "!=", "<", "<=", ">", ">="]);
const HEIGHT_PROPS = new Set(["render_height", "render_min_height"]);

function isGetExpr(expr) {
  return Array.isArray(expr) && expr[0] === "get" && typeof expr[1] === "string";
}

function coalesceDefault(op, literal, propName) {
  if (HEIGHT_PROPS.has(propName)) {
    return propName === "render_min_height" ? 0 : 6;
  }
  if (op === ">" || op === ">=") return 0;
  if (op === "<" || op === "<=") return 999999;
  return 0;
}

function hardenExpr(expr) {
  if (!Array.isArray(expr)) return expr;

  const op = expr[0];
  if (COMPARE_OPS.has(op) && expr.length >= 3) {
    const out = [op];
    for (let i = 1; i < expr.length; i++) {
      let arg = expr[i];
      if (isGetExpr(arg)) {
        const other = i === 1 ? expr[2] : expr[1];
        const lit = typeof other === "number" ? other : undefined;
        arg = ["coalesce", arg, coalesceDefault(op, lit, arg[1])];
      } else if (Array.isArray(arg)) {
        arg = hardenExpr(arg);
      }
      out.push(arg);
    }
    return out;
  }

  if (isGetExpr(expr) && HEIGHT_PROPS.has(expr[1])) {
    return ["coalesce", expr, coalesceDefault(null, null, expr[1])];
  }

  return expr.map((v) => (Array.isArray(v) ? hardenExpr(v) : v));
}

export function hardenBasemapStyle(style) {
  if (!style || !Array.isArray(style.layers)) return style;
  for (const layer of style.layers) {
    if (layer.filter) layer.filter = hardenExpr(layer.filter);
    if (layer.paint) {
      for (const key of Object.keys(layer.paint)) {
        layer.paint[key] = hardenExpr(layer.paint[key]);
      }
    }
    if (layer.layout) {
      for (const key of Object.keys(layer.layout)) {
        const val = layer.layout[key];
        if (Array.isArray(val)) layer.layout[key] = hardenExpr(val);
      }
    }
  }
  return style;
}
