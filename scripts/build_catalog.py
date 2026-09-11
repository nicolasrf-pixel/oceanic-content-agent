#!/usr/bin/env python3
"""Regenera data/catalog/master-catalog.json y data/catalog/oceanic-catalog.json
a partir de data/brands/master-inventory.json y data/models/<brand_id>/*.json.

No hace ninguna investigación nueva: es puramente una reorganización /
enriquecimiento derivado de los datos ya verificados. Ejecutar desde la
raíz del repositorio:

    python3 scripts/build_catalog.py

master-catalog.json  -> todos los modelos (marca -> categoría -> familia -> modelo).
oceanic-catalog.json -> subconjunto con oceanic_evidence == true.

El dashboard en dashboard/ lee ambos archivos directamente; no hace falta
tocar nada ahí después de regenerar.
"""
import json, glob
from collections import defaultdict

CATEGORY_LABELS = {
    "motor": "Motor",
    "sail": "Vela",
    "power_catamaran": "Catamarán a Motor",
    "sail_catamaran": "Catamarán a Vela",
    "dinghy": "Dinghy",
    "one_design": "One Design",
    "UNKNOWN": "Sin categoría confirmada",
}

BRAND_ORDER = ["axopar", "beneteau-sail", "beneteau-power", "lagoon", "solaris", "aquila",
               "xo-boats", "saffier", "vx-one", "skeeta", "switch"]

brands_data = json.load(open("data/brands/master-inventory.json"))["brands"]
brand_by_id = {b["brand_id"]: b for b in brands_data}

models_by_brand = defaultdict(list)
for fname in sorted(glob.glob("data/models/*/*.json")):
    brand = fname.split("/")[2]
    d = json.load(open(fname))
    models_by_brand[brand].append(d)


def best_oceanic_source(m):
    for s in m.get("sources", []):
        if s.get("level") == 2 and s.get("verification_state") == "CONFIRMED":
            return s
    for s in m.get("sources", []):
        if s.get("level") == 2:
            return s
    return None


def status_bucket(lifecycle_status):
    if lifecycle_status == "DISCONTINUED":
        return "historical"
    if lifecycle_status == "UNCONFIRMED":
        return "unconfirmed"
    return "current"  # CURRENT, NEW, ANNOUNCED


def review_reasons(m):
    reasons = []
    if m.get("discrepancies"):
        reasons.append("unresolved_discrepancy")
    if m.get("confidence_level") == "LOW":
        reasons.append("low_confidence")
    if len(m.get("sources", [])) <= 1:
        reasons.append("single_source")
    if m.get("lifecycle_status") == "UNCONFIRMED":
        reasons.append("unconfirmed_lifecycle")
    return reasons


def build_model_node(m, brand_id, brand_name):
    oceanic_src = best_oceanic_source(m)
    oceanic_evidence = bool(m.get("oceanic_url")) or oceanic_src is not None
    reasons = review_reasons(m)
    return {
        "model_id": m["model_id"],
        "model_name": m["model_name"],
        "family": m.get("family", "(sin familia)"),
        "category": m.get("category", "UNKNOWN"),
        "category_label": CATEGORY_LABELS.get(m.get("category", "UNKNOWN"), m.get("category")),
        "brand_id": brand_id,
        "brand_name": brand_name,
        "lifecycle_status": m["lifecycle_status"],
        "status_bucket": status_bucket(m["lifecycle_status"]),
        "confidence_level": m["confidence_level"],
        "variants": [
            {"variant_name": v.get("variant_name"), "description": v.get("description"),
             "confidence_level": v.get("confidence_level")}
            for v in (m.get("variants") or [])
        ],
        "manufacturer_url": m.get("manufacturer_url"),
        "oceanic_url": m.get("oceanic_url"),
        "oceanic_evidence": oceanic_evidence,
        "oceanic_source": (
            {"url": oceanic_src["url"], "verification_state": oceanic_src["verification_state"]}
            if oceanic_src else
            ({"url": m["oceanic_url"], "verification_state": "UNCONFIRMED"} if m.get("oceanic_url") else None)
        ),
        "sources": [
            {"url": s["url"], "level": s["level"], "level_label": s["level_label"],
             "verification_state": s["verification_state"], "retrieved_at": s["retrieved_at"],
             "notes": s.get("notes", "")}
            for s in m.get("sources", [])
        ],
        "discrepancies": m.get("discrepancies") or [],
        "notes": m.get("notes", ""),
        "verified_at": m.get("verified_at"),
        "last_updated": m.get("last_updated"),
        "status_pipeline": m.get("status_pipeline"),
        "specifications": m.get("specifications") or {},
        "requires_review": len(reasons) > 0,
        "review_reasons": reasons,
        "source_file": f"data/models/{brand_id}/{m['model_id']}.json",
    }


def build_tree(filter_fn=None):
    brands_out = []
    total = 0
    for brand_id in BRAND_ORDER:
        b = brand_by_id[brand_id]
        raw_models = models_by_brand.get(brand_id, [])
        nodes = [build_model_node(m, brand_id, b["commercial_name"]) for m in raw_models]
        if filter_fn:
            nodes = [n for n in nodes if filter_fn(n)]
        if not nodes:
            continue

        by_cat = defaultdict(lambda: defaultdict(list))
        for n in nodes:
            by_cat[n["category"]][n["family"]].append(n)

        categories_out = []
        for cat in sorted(by_cat.keys()):
            fam_dict = by_cat[cat]
            families_out = []
            for fam in sorted(fam_dict.keys()):
                fam_models = sorted(fam_dict[fam], key=lambda x: x["model_id"])
                families_out.append({"family": fam, "models": fam_models})
            categories_out.append({
                "category": cat,
                "category_label": CATEGORY_LABELS.get(cat, cat),
                "families": families_out,
            })

        brands_out.append({
            "brand_id": brand_id,
            "official_name": b["official_name"],
            "commercial_name": b["commercial_name"],
            "manufacturer_url": b.get("manufacturer_url"),
            "portfolio_status": b["portfolio_status"],
            "total_models": len(nodes),
            "categories": categories_out,
        })
        total += len(nodes)
    return brands_out, total


# --- master catalog: all 141 models, published by manufacturers ---
master_brands, master_total = build_tree(filter_fn=None)
master_catalog = {
    "catalog_meta": {
        "name": "Repositorio de barcos publicados por las representadas en sus sitios oficiales",
        "generated_at": "2026-09-11",
        "generated_by": "oceanic-content-agent",
        "description": (
            "Repositorio organizado Marca -> Categoria -> Familia -> Modelo, construido a "
            "partir del inventario ya verificado en data/models/ (no es una nueva "
            "investigacion; cada modelo referencia su archivo fuente en source_file). "
            "manufacturer_url es la pagina del sitio oficial del fabricante que respalda el "
            "modelo. oceanic_evidence indica si ademas hay prueba de que Oceanic Chile "
            "representa especificamente ese modelo (no solo la marca); su ausencia NO "
            "significa que el barco no exista, solo que falta esa prueba puntual -- ver "
            "AUDITORIA del 2026-09-10/11 en el historial del proyecto. requires_review es "
            "un flag derivado (ver review_reasons) = discrepancia sin resolver, confianza "
            "LOW, una sola fuente registrada, o lifecycle_status UNCONFIRMED."
        ),
        "excluded": "Oceanic Power (marca propia, no representada) -- ver CLAUDE.md 2.4.",
        "source_of_truth": "manufacturer_url de cada modelo (sitio oficial del fabricante).",
        "total_brands": len(master_brands),
        "total_models": master_total,
    },
    "brands": master_brands,
}

# --- oceanic catalog: subset with oceanic_evidence == True ---
oceanic_brands, oceanic_total = build_tree(filter_fn=lambda n: n["oceanic_evidence"])
oceanic_catalog = {
    "catalog_meta": {
        "name": "Modelos con evidencia de representación específica por Oceanic Chile",
        "generated_at": "2026-09-11",
        "generated_by": "oceanic-content-agent",
        "description": (
            "Subconjunto de master-catalog.json: solo modelos donde oceanic_evidence es "
            "true (existe oceanic_url propio y/o una fuente de sources[] con level=2). "
            "Es un derivado programatico de data/models/, no una investigacion nueva ni "
            "una lista editada a mano."
        ),
        "derived_from": "data/catalog/master-catalog.json",
        "total_brands": len(oceanic_brands),
        "total_models": oceanic_total,
    },
    "brands": oceanic_brands,
}

with open("data/catalog/master-catalog.json", "w") as f:
    json.dump(master_catalog, f, ensure_ascii=False, indent=2)
    f.write("\n")

with open("data/catalog/oceanic-catalog.json", "w") as f:
    json.dump(oceanic_catalog, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"master-catalog.json: {len(master_brands)} marcas, {master_total} modelos")
print(f"oceanic-catalog.json: {len(oceanic_brands)} marcas, {oceanic_total} modelos")

# quick stats for sanity
all_nodes = []
for b in master_brands:
    for c in b["categories"]:
        for fam in c["families"]:
            all_nodes.extend(fam["models"])

from collections import Counter
print("status_bucket:", Counter(n["status_bucket"] for n in all_nodes))
print("requires_review True:", sum(1 for n in all_nodes if n["requires_review"]))
print("oceanic_evidence True:", sum(1 for n in all_nodes if n["oceanic_evidence"]))
reason_counter = Counter()
for n in all_nodes:
    for r in n["review_reasons"]:
        reason_counter[r] += 1
print("review reasons breakdown:", dict(reason_counter))
