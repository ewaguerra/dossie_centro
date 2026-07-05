#!/usr/bin/env python3
"""
Dev-only: copia GeoJSON de mapa_sp_salto → projeto_centro (output versionado aqui).

O browser NUNCA lê o salto; após correr este script, commitar os ficheiros em centro/data/.
Recorte: 16_regiao_centro__polygon (OSM); bbox do mapa (ZEIS-2).
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from shapely.geometry import box, mapping, shape
    from shapely.ops import unary_union
except ImportError:
    print("ERROR: pip install shapely", file=sys.stderr)
    sys.exit(1)

REPO = Path(__file__).resolve().parent.parent
SALTO = Path("/home/tati_3pontos/Documentos/Projetos/mapa_sp_salto")
CLIP_POLY = REPO / "centro/data/processed/16_regiao_centro__polygon.geojson"
CONTEXT_WIRED = REPO / "centro/data/catalog/context-wired.json"
CONTEXT_LAYERS = REPO / "centro/data/catalog/context-layers.json"
CONTEXT_BUILD_REPORT = REPO / "centro/data/reports/build/context_build_report.json"

# Viewport do mapa (CENTRO_MAX_BOUNDS) — ZEIS-2 não intersecta 16_regiao_centro__polygon.
CENTRO_MAP_BBOX = (-46.67, -23.59, -46.58, -23.52)

JOBS = [
    {
        "id": "04a_zeis2__polygon",
        "src": SALTO / "data/processed/03_zoneamento/04a_zeis2__polygon.geojson",
        "dst": REPO / "centro/data/processed/04a_zeis2__polygon.geojson",
        "geom_filter": ("Polygon", "MultiPolygon"),
        "clip_mode": "bbox",
        "bbox": CENTRO_MAP_BBOX,
    },
    {
        "id": "15_osm_ruas__line",
        "src": SALTO / "data/osm/processed/15_osm_ruas__line.geojson",
        "dst": REPO / "centro/data/geojson/heavy/15_osm_ruas__line.geojson",
        "geom_filter": ("LineString", "MultiLineString"),
    },
    {
        "id": "15_osm_enderecos__point",
        "src": SALTO / "data/osm/processed/15_osm_enderecos__point.geojson",
        "dst": REPO / "centro/data/geojson/heavy/15_osm_enderecos__point.geojson",
        "geom_filter": ("Point", "MultiPoint"),
    },
]


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


def geom_to_features(geom, props):
    """Expand intersection result into one or more GeoJSON features."""
    if geom.is_empty:
        return []
    gtype = geom.geom_type
    if gtype == "GeometryCollection":
        out = []
        for g in geom.geoms:
            out.extend(geom_to_features(g, props))
        return out
    return [{"type": "Feature", "geometry": mapping(geom), "properties": dict(props)}]


def clip_feature_collection(fc, clip_geom, allowed_types, clip_mode="intersect"):
    out = []
    for feat in fc.get("features", []):
        g = feat.get("geometry")
        if not g:
            continue
        try:
            geom = shape(g)
            if geom.geom_type not in allowed_types and geom.geom_type != "GeometryCollection":
                continue
            if clip_mode == "bbox":
                if not clip_geom.intersects(geom):
                    continue
                clipped = geom
            else:
                if not clip_geom.intersects(geom):
                    continue
                try:
                    clipped = geom.intersection(clip_geom)
                except Exception:
                    clipped = geom.buffer(0).intersection(clip_geom)
                if clipped.is_empty:
                    continue
            out.extend(geom_to_features(clipped, feat.get("properties", {})))
        except Exception as e:
            print(f"  WARN skip feature: {e}")
    return {"type": "FeatureCollection", "features": out}


def update_context_catalog(layer_id: str, dst: Path, n: int):
    doc = load_json(CONTEXT_LAYERS)
    for ly in doc.get("layers", []):
        if ly.get("id") == layer_id:
            ly["feature_count"] = n
            ly["file_size_bytes"] = dst.stat().st_size
            break
    save_json(CONTEXT_LAYERS, doc)


def update_context_wired():
    wired = load_json(CONTEXT_WIRED)
    ids = list(wired.get("layerIds", []))
    prepend = ["15_osm_ruas__line", "15_osm_enderecos__point"]
    for lid in reversed(prepend):
        if lid not in ids:
            ids.insert(0, lid)
    wired["layerIds"] = ids
    wired["description"] = (
        "Camadas context com GeoJSON no disco. Inclui OSM ruas/endereços (clipped) "
        "e demais context wired. Exclui centro_pois_turisticos (addPOILayer)."
    )
    save_json(CONTEXT_WIRED, wired, compact=True)


def update_build_report(results):
    save_json(
        CONTEXT_BUILD_REPORT,
        {
            "strategy": "sync-geojson-from-salto",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_repo": str(SALTO),
            "context_layers": results,
            "errors": [],
        },
    )


def main():
    if not SALTO.is_dir():
        print(f"ERROR: mapa_sp_salto não encontrado: {SALTO}")
        return 1

    clip_geom = load_clip_geom()
    print(f"Clip: {CLIP_POLY.relative_to(REPO)} ({clip_geom.geom_type})")

    report = []
    for job in JOBS:
        src, dst = job["src"], job["dst"]
        lid = job["id"]
        if not src.exists():
            print(f"ERROR: ausente no salto: {src}")
            return 1

        print(f"\n[{lid}]")
        print(f"  src: {src}")
        fc = load_json(src)
        print(f"  features origem: {len(fc.get('features', []))}")

        clip_mode = job.get("clip_mode", "intersect")
        if clip_mode == "bbox":
            clip_target = box(*job["bbox"])
        else:
            clip_target = clip_geom
        clipped = clip_feature_collection(
            fc, clip_target, job["geom_filter"], clip_mode=clip_mode
        )
        n = len(clipped["features"])
        save_json(dst, clipped, compact=(lid.startswith("15_osm")))
        print(f"  dst: {dst.relative_to(REPO)} → {n} features ({dst.stat().st_size} bytes)")

        if lid.startswith("15_osm"):
            update_context_catalog(lid, dst, n)

        report.append({"id": lid, "features": n, "status": "clipped"})

    update_context_wired()
    update_build_report(report)
    print("\n[OK] context-wired.json atualizado (+ OSM ruas/endereços)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
