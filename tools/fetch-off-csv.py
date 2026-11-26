"""Extrait de l'export CSV complet d'Open Food Facts / Open Beauty Facts les produits vendus
en France les plus scannés, au format JSON Lines attendu par tools/build-db.mjs.

Usage : python3 tools/fetch-off-csv.py <dossier de sortie> [nb aliments] [nb cosmétiques] [nb marques distributeurs en plus]
L'export (~1 Go compressé) est lu en flux, sans être stocké.
"""
import csv, gzip, heapq, io, json, os, re, sys, unicodedata, urllib.request

out = sys.argv[1] if len(sys.argv) > 1 else "offdata"
FOOD_MAX = int(sys.argv[2]) if len(sys.argv) > 2 else 50000
BEAUTY_MAX = int(sys.argv[3]) if len(sys.argv) > 3 else 8000
STORE_MAX = int(sys.argv[4]) if len(sys.argv) > 4 else 15000
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

# Marques des enseignes françaises (marques distributeurs), repérées dans le champ « brands »
STORE_BRANDS = re.compile(r"(?<![a-z])(" + "|".join([
    "carrefour", "reflets de france", "filiere qualite carrefour", "simpl", "carrefour bio", "carrefour classic", "carrefour extra", "carrefour sensation",
    "auchan", "mmm", "pouce", "auchan bio", "cosmia",
    "leclerc", "marque repere", "repere", "eco\\+", "nos regions ont du talent", "bio village", "jafaden", "chabrior", "pâturages", "paturages",
    "intermarche", "top budget", "monique ranou", "saint eloi", "fiorini", "paquito", "capitaine cook", "itinéraire des saveurs", "itineraire des saveurs", "elodie", "look", "pommette", "regaliennes", "netto",
    "u bio", "u saveurs", "bien vu", "systeme u", "système u", "magasins u", "marque u",
    "casino", "terre et saveur", "le petit marche", "le petit marché", "tous les jours", "leader price", "franprix", "monoprix", "monop", "spar", "vival",
    "lidl", "milbona", "cien", "deluxe", "chef select", "crownfield", "saint alby", "pilos", "solevita", "freeway", "envia", "favorina", "italiamo", "sondey", "alesto", "gelatelli", "lupilu",
    "aldi", "le gaulois", "ombra", "cora", "grand jury", "match", "picard", "thiriet", "g20", "colruyt", "bon prix", "dia",
]) + r")(?![a-z])")
def store_brand(r):
    b = (r.get("brands") or "").lower() + "," + (r.get("brands_tags") or "").replace("-", " ")
    b = "".join(c for c in unicodedata.normalize("NFD", b) if unicodedata.category(c) != "Mn")
    return bool(STORE_BRANDS.search(b))

def has_data(r):
    return bool((r.get("ingredients_text") or r.get("ingredients_text_fr") or "").strip() or num(r.get("energy-kcal_100g")) is not None or r.get("nutriscore_grade"))

def top(urls, keep, limit, extra=0, strict=False):
    """Les `limit` produits les plus scannés en France, plus jusqu'à `extra` produits de marques distributeurs."""
    heap, sb, n = [], [], 0
    for r in rows(urls):
        n += 1
        if n % 500000 == 0: print(n, "lignes lues")
        if "en:france" not in (r.get("countries_tags") or ""): continue
        if not r.get("code") or not (r.get("product_name") or "").strip(): continue
        if strict and not has_data(r): continue
        scans = num(r.get("unique_scans_n")) or 0
        item = (scans, r["code"], keep(r))
        if len(heap) < limit: heapq.heappush(heap, item)
        elif scans > heap[0][0]: heapq.heapreplace(heap, item)
        # réserve à part pour les marques distributeurs (on en garde le double, le top en reprendra une partie)
        if extra and store_brand(r):
            cap = limit + extra
            if len(sb) < cap: heapq.heappush(sb, item)
            elif scans > sb[0][0]: heapq.heapreplace(sb, item)
    print(n, "lignes lues au total")
    best = [x[2] for x in sorted(heap, reverse=True)]
    seen = {x["code"] for x in best}
    inside = sum(1 for x in sb if x[1] in seen)
    more = [x[2] for x in sorted(sb, reverse=True) if x[1] not in seen][:extra]
    if extra: print("marques distributeurs : déjà dans le top", inside, "· ajoutées", len(more))
    return best + more

NUTS = ["energy-kcal_100g", "fat_100g", "saturated-fat_100g", "sugars_100g", "salt_100g", "fiber_100g", "proteins_100g", "fruits-vegetables-nuts_100g", "fruits-vegetables-nuts-estimate_100g", "fruits-vegetables-nuts-estimate-from-ingredients_100g", "fruits-vegetables-legumes-estimate-from-ingredients_100g"]
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
        "ingredients_text_fr": (r.get("ingredients_text") or r.get("ingredients_text_fr") or r.get("ingredients_text_en") or "")[:1500], "image_front_small_url": r.get("image_small_url", ""),
    }
def beauty(r):
    return {
        "code": r["code"], "product_name": r.get("product_name", ""), "brands": r.get("brands", ""), "quantity": r.get("quantity", ""),
        "categories_tags": tags(r.get("categories_tags")), "labels_tags": tags(r.get("labels_tags")),
        "ingredients_text": (r.get("ingredients_text") or r.get("ingredients_text_fr") or r.get("ingredients_text_en") or "")[:3000],
        "ingredients_tags": tags(r.get("ingredients_tags"))[:120], "image_front_small_url": r.get("image_small_url", ""),
    }

def write(name, items):
    with open(os.path.join(out, name), "w", encoding="utf-8") as f:
        for it in items: f.write(json.dumps(it, ensure_ascii=False) + "\n")
    print(name, ":", len(items), "produits")

f = top(["https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"], food, FOOD_MAX, STORE_MAX, strict=True)
write("food.jsonl", f)
b = top(["https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv.gz",
         "https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv"], beauty, BEAUTY_MAX)
write("beauty.jsonl", b)
if len(f) < 1000: raise SystemExit("Trop peu de produits alimentaires")
