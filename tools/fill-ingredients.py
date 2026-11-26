"""Complète la composition des produits alimentaires qui n'en ont pas dans l'export CSV.

Trois sources, dans cet ordre :
1. tools/ingredients-extra.json : listes relevées à la main sur les sites des marques (source + date pour chacune).
2. La base complète d'Open Food Facts au format Parquet (toutes les langues) pour le même code-barres.
3. Le même produit sous un autre code-barres (même marque, même nom) qui, lui, a sa liste dans Open Food Facts.

Chaque produit complété reçoit « ingredients_source » (affiché dans l'appli).
Usage : python3 tools/fill-ingredients.py offdata/food.jsonl   (OFF_PARQUET = chemin local du Parquet, sinon URL)
Ne fait jamais échouer la fabrication : en cas de souci, la base reste telle quelle.
"""
import json, os, re, sys, time, unicodedata

PATH = sys.argv[1] if len(sys.argv) > 1 else "offdata/food.jsonl"
PARQUET = os.environ.get("OFF_PARQUET") or "https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet"
EXTRA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ingredients-extra.json")
PREF = ["fr", "main", "en", "it", "es", "de", "nl", "pt"]
UNITS = re.compile(r"\b\d+([.,]\d+)?\s?(g|gr|kg|ml|cl|l|x|pcs?)\b")


def norm(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = UNITS.sub(" ", s)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


def brand_of(b):
    return norm((b or "").split(",")[0])


def load():
    with open(PATH, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def missing(items):
    return [p for p in items if not (p.get("ingredients_text_fr") or "").strip()]


def pick(texts, main_lang):
    """texts : liste de {lang, text}. Renvoie le meilleur texte non vide."""
    by = {}
    for t in texts or []:
        if not t: continue
        if not isinstance(t, dict): t = {"lang": t[0], "text": t[1]}
        lang, text = (t.get("lang") or ""), (t.get("text") or "").strip()
        if text and len(text) > 3: by.setdefault(lang, text)
    for k in PREF:
        lang = main_lang if k == "main" else k
        if lang in by: return by[lang]
    return next(iter(by.values()), "")


def text_of(d):
    it = d.get("ingredients_text")
    if isinstance(it, str): return it.strip()
    return pick(it or [], d.get("lang") or "")


def name_of(d):
    n = d.get("product_name")
    if isinstance(n, str): return n
    return pick(n or [], d.get("lang") or "")


def set_ing(p, text, src, d=None):
    p["ingredients_text_fr"] = text[:1500]
    p["ingredients_source"] = src
    if d:
        for k in ("additives_tags", "ingredients_analysis_tags", "allergens_tags"):
            if not p.get(k) and d.get(k): p[k] = list(d[k])


def main():
    items = load()
    todo = missing(items)
    before = len(todo)
    print(f"Produits sans composition avant : {before} / {len(items)}")
    if not todo: return
    stats = {"extra": 0, "same_code": 0, "same_product": 0}

    # 1. Listes relevées à la main
    try:
        extra = json.load(open(EXTRA, encoding="utf-8"))
    except Exception as e:
        extra = {}; print("ingredients-extra.json illisible :", e)
    for p in todo:
        e = extra.get(str(p["code"]))
        if e and e.get("text"):
            set_ing(p, e["text"], "site:" + e.get("source", "") + "|" + e.get("date", "")); stats["extra"] += 1
    todo = missing(items)

    try:
        import duckdb
    except ImportError:
        print("duckdb absent"); return save(items, before, stats)
    t0 = time.time()
    con = duckdb.connect()
    if PARQUET.startswith("http"):
        con.execute("INSTALL httpfs; LOAD httpfs; SET http_retries=8; SET http_retry_wait_ms=2000; SET http_retry_backoff=3; SET threads=2;")
    cols = {r[0]: r[1] for r in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{PARQUET}')").fetchall()}
    print("Colonnes :", {k: cols[k] for k in cols if k in ("code", "lang", "product_name", "brands", "unique_scans_n", "ingredients_text", "additives_tags")})
    if "code" not in cols or "ingredients_text" not in cols:
        print("Schéma inattendu"); return save(items, before, stats)
    extra_cols = [c for c in ("lang", "additives_tags", "ingredients_analysis_tags", "allergens_tags") if c in cols]

    # 2. Même code-barres, autres langues
    con.execute("CREATE TABLE want(code VARCHAR)")
    con.executemany("INSERT INTO want VALUES (?)", [(str(p["code"]),) for p in todo])
    names = ["code", "ingredients_text"] + extra_cols
    rows = con.execute(f"SELECT {', '.join('f.' + c for c in names)} FROM read_parquet('{PARQUET}') f JOIN want w ON f.code = w.code").fetchall()
    found = {str(r[0]): dict(zip(names, r)) for r in rows}
    for p in todo:
        d = found.get(str(p["code"]))
        t = d and text_of(d)
        if t: set_ing(p, t, "off", d); stats["same_code"] += 1
    print(f"Même code : {len(found)} fiches lues en {time.time() - t0:.0f} s, {stats['same_code']} avec une liste")
    todo = missing(items)

    # 3. Même produit (même marque, même nom) sous un autre code-barres
    if "product_name" in cols and "brands" in cols and todo:
        t0 = time.time()
        keys = {}
        for p in todo:
            b, n = brand_of(p.get("brands")), norm(p.get("product_name"))
            if b and len(n) >= 4: keys.setdefault((b, n), []).append(p)
        brands = sorted({b for b, _ in keys})
        con.execute("CREATE TABLE wb(b VARCHAR)")
        con.executemany("INSERT INTO wb VALUES (?)", [(b,) for b in brands])
        scans = "f.unique_scans_n" if "unique_scans_n" in cols else "0"
        q = f"""SELECT f.code, f.brands, f.product_name, f.ingredients_text, {scans} AS sc{''.join(', f.' + c for c in extra_cols)}
                FROM read_parquet('{PARQUET}') f
                WHERE len(f.ingredients_text) > 0
                  AND trim(regexp_replace(lower(strip_accents(split_part(f.brands, ',', 1))), '[^a-z0-9]+', ' ', 'g')) IN (SELECT b FROM wb)"""
        names2 = ["code", "brands", "product_name", "ingredients_text", "sc"] + extra_cols
        best = {}
        n_rows = 0
        for r in con.execute(q).fetchall():
            n_rows += 1
            d = dict(zip(names2, r))
            k = (brand_of(d["brands"]), norm(name_of(d)))
            if k not in keys: continue
            t = text_of(d)
            if not t: continue
            sc = d.get("sc") or 0
            if k not in best or sc > best[k][0]: best[k] = (sc, t, d)
        for k, ps in keys.items():
            if k not in best: continue
            _, t, d = best[k]
            for p in ps:
                set_ing(p, t, "same:" + str(d["code"]), d); stats["same_product"] += 1
        print(f"Même produit : {n_rows} fiches des mêmes marques lues en {time.time() - t0:.0f} s, {stats['same_product']} listes reprises")
    save(items, before, stats)


def save(items, before, stats):
    tmp = PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        for it in items: f.write(json.dumps(it, ensure_ascii=False) + "\n")
    os.replace(tmp, PATH)
    after = len(missing(items))
    print(f"Compositions ajoutées : {before - after} (sites des marques {stats['extra']}, même code {stats['same_code']}, même produit autre code {stats['same_product']})")
    print(f"Produits sans composition après : {after} / {len(items)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback; traceback.print_exc()
        print("Complément des compositions interrompu :", repr(e))
