#!/usr/bin/env python3
"""
Dev-only: baixa quadras fiscais do GeoSampa WFS, recorta pelo contorno Centro
(16_regiao_centro__polygon) e grava GeoJSON versionado em centro/data/.

Runtime NUNCA chama WFS — commitar o output após correr:
  python scripts/sync-quadras-geosampa.py

Fonte: geoportal:quadra_fiscal
  https://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs
"""

from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    from shapely.geometry import mapping, shape
    from shapely.ops import unary_union
except ImportError:
    print("ERROR: pip install shapely", file=sys.stderr)
    sys.exit(1)

REPO = Path(__file__).resolve().parent.parent
CLIP_POLY = REPO / "centro/data/processed/16_regiao_centro__polygon.geojson"
RAW_OUT = REPO / "centro/data/raw/geosampa_quadras_fiscais_raw.geojson"
DST = REPO / "centro/data/geojson/heavy/centro_quadras_fiscais__polygon.geojson"
CONTEXT_LAYERS = REPO / "centro/data/catalog/context-layers.json"
CONTEXT_WIRED = REPO / "centro/data/catalog/context-wired.json"
PHASE_GATES = REPO / "centro/data/catalog/phase-gates.json"
BUILD_REPORT = REPO / "centro/data/reports/build/centro_quadras_fiscais_build_report.json"

WFS_BASE = "https://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs"
TYPE_NAME = "geoportal:quadra_fiscal"
LAYER_ID = "centro_quadras_fiscais__polygon"

# Bbox da união dos 8 distritos (pré-filtro WFS)
FETCH_BBOX = (-46.676, -23.579, -46.604, -23.517)


def load_json(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data, compact: bool = False):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if compact:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(data, f, ensure_ascii=False, indent=2)


def load_clip_geom():
    fc = load_json(CLIP_POLY)
    geoms = [shape(f["geometry"]) for f in fc.get("features", []) if f.get("geometry")]
    if not geoms:
        raise RuntimeError(f"Sem geometria em {CLIP_POLY}")
    return unary_union(geoms)


def fetch_wfs_bbox(bbox: tuple[float, float, float, float]) -> dict:
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeName": TYPE_NAME,
        "outputFormat": "application/json",
        "srsName": "EPSG:4326",
        "bbox": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]},EPSG:4326",
    }
    url = WFS_BASE + "?" + urllib.parse.urlencode(params)
    print(f"GET {url[:100]}...")
    with urllib.request.urlopen(url, timeout=300) as response:
        return json.loads(response.read().decode("utf-8"))


def geom_to_features(geom, props):
    if geom.is_empty:
        return []
    gtype = geom.geom_type
    if gtype == "GeometryCollection":
        out = []
        for g in geom.geoms:
            out.extend(geom_to_features(g, props))
        return out
    return [{"type": "Feature", "geometry": mapping(geom), "properties": dict(props)}]


def clip_to_centro(fc: dict, clip_geom) -> dict:
    out = []
    for feat in fc.get("features", []):
        g = feat.get("geometry")
        if not g:
            continue
        try:
            geom = shape(g)
            if not clip_geom.intersects(geom):
                continue
            clipped = geom.intersection(clip_geom)
            if clipped.is_empty:
                continue
            out.extend(geom_to_features(clipped, feat.get("properties", {})))
        except Exception as exc:
            print(f"  WARN skip: {exc}")
    return {"type": "FeatureCollection", "name": LAYER_ID, "features": out}


def sql_key(props: dict) -> str:
    setor = str(props.get("cd_setor_fiscal") or "").strip().zfill(3)
    quadra = str(props.get("cd_quadra_fiscal") or "").strip().zfill(3)
    sub = str(props.get("cd_subquadra_fiscal") or "").strip().zfill(3)
    return f"{setor}-{quadra}-{sub}"


def summarize(fc: dict) -> dict:
    setores = set()
    quadras_sq = set()
    subquadras = set()
    for feat in fc.get("features", []):
        p = feat.get("properties") or {}
        setor = str(p.get("cd_setor_fiscal") or "").strip()
        quadra = str(p.get("cd_quadra_fiscal") or "").strip()
        if setor:
            setores.add(setor.zfill(3))
        if setor and quadra:
            quadras_sq.add(f"{setor.zfill(3)}-{quadra.zfill(3)}")
        subquadras.add(sql_key(p))
    return {
        "polygons": len(fc.get("features", [])),
        "setores_fiscais_unicos": len(setores),
        "quadras_unicas_setor_quadra": len(quadras_sq),
        "subquadras_sql_unicas": len(subquadras),
    }


def upsert_context_layer(feature_count: int, file_size: int):
    doc = load_json(CONTEXT_LAYERS)
    entry = {
        "id": LAYER_ID,
        "title": "Quadras Fiscais (SQL)",
        "group": "urbano_contexto",
        "stackRole": "territory-fill",
        "coverage": "complete",
        "coverageCheck": "bbox-info",
        "coverageNote": "Polígonos cadastrais fiscais (setor/quadra/sub-quadra) recortados pelos 8 distritos do Centro.",
        "source": f"GeoSampa — {TYPE_NAME}",
        "source_url": WFS_BASE,
        "file": "data/geojson/heavy/centro_quadras_fiscais__polygon.geojson",
        "file_size_bytes": file_size,
        "feature_count": feature_count,
        "geometry": "polygon",
        "type": "fill",
        "minzoom": 14,
        "maxzoom": 22,
        "visible": False,
        "weightClass": "heavy",
        "loadPolicy": "manual",
        "style": {
            "paint": {
                "fill-color": "#94a3b8",
                "fill-opacity": 0.12,
                "fill-outline-color": "#64748b",
            }
        },
        "metadata": {
            "source": "PMSP / SF — cadastro fiscal",
            "generatedBy": "scripts/sync-quadras-geosampa.py",
        },
    }
    layers = doc.get("layers", [])
    replaced = False
    for i, ly in enumerate(layers):
        if ly.get("id") == LAYER_ID:
            layers[i] = entry
            replaced = True
            break
    if not replaced:
        insert_at = 0
        for i, ly in enumerate(layers):
            if ly.get("id") == "15_osm_enderecos__point":
                insert_at = i + 1
                break
        layers.insert(insert_at, entry)
    doc["layers"] = layers
    save_json(CONTEXT_LAYERS, doc)


def upsert_context_wired():
    wired = load_json(CONTEXT_WIRED)
    ids = list(wired.get("layerIds", []))
    if LAYER_ID not in ids:
        try:
            idx = ids.index("15_osm_enderecos__point")
            ids.insert(idx + 1, LAYER_ID)
        except ValueError:
            ids.append(LAYER_ID)
    wired["layerIds"] = ids
    save_json(CONTEXT_WIRED, wired, compact=True)


def upsert_phase_gate():
    doc = load_json(PHASE_GATES)
    doc.setdefault("layerMinPhase", {})[LAYER_ID] = 9
    save_json(PHASE_GATES, doc)


def main() -> int:
    if not CLIP_POLY.is_file():
        print(f"ERROR: clip ausente: {CLIP_POLY}", file=sys.stderr)
        return 1

    clip_geom = load_clip_geom()
    print(f"Clip: {CLIP_POLY.relative_to(REPO)} ({clip_geom.geom_type})")

    raw = fetch_wfs_bbox(FETCH_BBOX)
    raw_count = len(raw.get("features", []))
    print(f"WFS bbox raw: {raw_count} features")
    save_json(RAW_OUT, raw, compact=True)
    print(f"Raw: {RAW_OUT.relative_to(REPO)} ({RAW_OUT.stat().st_size} bytes)")

    clipped = clip_to_centro(raw, clip_geom)
    stats = summarize(clipped)
    save_json(DST, clipped, compact=True)
    size = DST.stat().st_size
    print(f"Clipped: {DST.relative_to(REPO)} -> {stats['polygons']} polygons ({size} bytes)")
    print("Stats:", json.dumps(stats, ensure_ascii=False))

    upsert_context_layer(stats["polygons"], size)
    upsert_context_wired()
    upsert_phase_gate()

    save_json(
        BUILD_REPORT,
        {
            "layer": LAYER_ID,
            "source": WFS_BASE,
            "typeName": TYPE_NAME,
            "fetch_bbox": list(FETCH_BBOX),
            "clip": str(CLIP_POLY.relative_to(REPO)),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "raw_features": raw_count,
            "clipped_features": stats["polygons"],
            "stats": stats,
            "output": str(DST.relative_to(REPO)),
        },
    )
    print(f"\n[OK] Catálogo atualizado ({LAYER_ID}, fase ARG 9)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
