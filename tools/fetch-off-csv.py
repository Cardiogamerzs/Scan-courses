"""Extrait de l'export CSV complet d'Open Food Facts / Open Beauty Facts les produits vendus
en France les plus scannés, au format JSON Lines attendu par tools/build-db.mjs.

Usage : python3 tools/fetch-off-csv.py <dossier de sortie> [nb aliments] [nb cosmétiques]
L'export (~1 Go compressé) est lu en flux, sans être stocké.
"""
import csv, gzip, heapq, io, json, os, sys, urllib.request

out = sys.argv[1] if len(sys.argv) > 1 else "offdata"
FOOD_MAX = int(sys.argv[2]) if len(sys.argv) > 2 else 50000
BEAUTY_MAX = int(sys.argv[3]) if len(sys.argv) > 3 else 8000
os.makedirs(out, exist_ok=True)
csv.field_size_limit(sys.maxsize)
UA = {"User-Agent": "ScanCourses/2.0 (application personnelle, github.com/Cardiogamerzs/Scan-courses)"}

def rows(urls):
    for url in urls:
        try:
            resp = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120)
        except Exception as e:
            print("indisponible :", url, e); continue
        stream = gzip.GzipFile(fileobj=resp) if url.endswith(".gz") else resp
        text = io.TextIOWrapper(stream, encoding="utf-8", errors="replace", newline="")
        yield from csv.DictReader(text, delimiter="\t", quoting=csv.QUOTE_NONE)
        return
    raise SystemExit("Aucun export accessible")

def tags(v):
    return [t for t in (v or "").split(",") if t]

def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None

def top(urls, keep, limit):
    heap, n = [], 0
    for r in rows(urls):
        n += 1
        if n % 500000 == 0: print(n, "lignes lues")
        if "en:france" not in (r.get("countries_tags") or ""): continue
        if not r.get("code") or not (r.get("product_name") or "").strip(): continue
        scans = num(r.get("unique_scans_n")) or 0
        item = (scans, r["code"], keep(r))
        if len(heap) < limit: heapq.heappush(heap, item)
        elif scans > heap[0][0]: heapq.heapreplace(heap, item)
    print(n, "lignes lues au total")
    return [x[2] for x in sorted(heap, reverse=True)]

NUTS = ["energy-kcal_100g", "fat_100g", "saturated-fat_100g", "sugars_100g", "salt_100g", "fiber_100g", "proteins_100g"]
def food(r):
    return {
        "code": r["code"], "product_name": r.get("product_name", ""), "generic_name_fr": r.get("generic_name", ""),
        "brands": r.get("brands", ""), "quantity": r.get("quantity", ""), "categories_tags": tags(r.get("categories_tags")),
        "pnns_groups_1": r.get("pnns_groups_1", ""), "pnns_groups_2": r.get("pnns_groups_2", ""),
        "nutriscore_grade": r.get("nutriscore_grade", ""), "nutriscore_score": num(r.get("nutriscore_score")),
        "nova_group": r.get("nova_group", ""),
        "environmental_score_grade": r.get("environmental_score_grade") or r.get("ecoscore_grade") or "",
        "environmental_score_score": num(r.get("environmental_score_score") or r.get("ecoscore_score")),
        "nutriments": {k: num(r.get(k)) for k in NUTS if num(r.get(k)) is not None},
        "additives_tags": tags(r.get("additives_tags")), "allergens_tags": tags(r.get("allergens_tags") or r.get("allergens")),
        "traces_tags": tags(r.get("traces_tags")), "ingredients_analysis_tags": tags(r.get("ingredients_analysis_tags")),
        "labels_tags": tags(r.get("labels_tags")), "origins_tags": tags(r.get("origins_tags")), "packaging_tags": tags(r.get("packaging_tags")),
        "ingredients_text_fr": (r.get("ingredients_text") or "")[:1500], "image_front_small_url": r.get("image_small_url", ""),
    }
def beauty(r):
    return {
        "code": r["code"], "product_name": r.get("product_name", ""), "brands": r.get("brands", ""), "quantity": r.get("quantity", ""),
        "categories_tags": tags(r.get("categories_tags")), "labels_tags": tags(r.get("labels_tags")),
        "ingredients_text": (r.get("ingredients_text") or "")[:3000], "image_front_small_url": r.get("image_small_url", ""),
    }

def write(name, items):
    with open(os.path.join(out, name), "w", encoding="utf-8") as f:
        for it in items: f.write(json.dumps(it, ensure_ascii=False) + "\n")
    print(name, ":", len(items), "produits")

f = top(["https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"], food, FOOD_MAX)
write("food.jsonl", f)
b = top(["https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv.gz",
         "https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv"], beauty, BEAUTY_MAX)
write("beauty.jsonl", b)
if len(f) < 1000: raise SystemExit("Trop peu de produits alimentaires")
