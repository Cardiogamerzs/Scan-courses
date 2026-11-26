"""Complète la composition des produits alimentaires qui n'en ont pas dans l'export CSV.

L'export CSV d'Open Food Facts ne donne la liste d'ingrédients que dans la langue principale du produit :
un produit italien (Nutella B-ready…) dont la liste n'est remplie qu'en français y apparaît vide.
On relit donc la base complète d'Open Food Facts au format Parquet (toutes les langues), seulement
pour les produits concernés, et on remplit ingredients_text_fr (français > langue principale > anglais > autre),
plus additives_tags / ingredients_analysis_tags / allergens_tags s'ils manquent.

Usage : python3 tools/fill-ingredients.py offdata/food.jsonl
Ne fait jamais échouer la fabrication : en cas de souci, la base reste telle quelle.
"""
import json, os, sys, time

PATH = sys.argv[1] if len(sys.argv) > 1 else "offdata/food.jsonl"
PARQUET = "https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet"
PREF = ["fr", "main", "en", "it", "es", "de", "nl", "pt"]


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
        lang, text = (t.get("lang") or ""), (t.get("text") or "").strip()
        if text and len(text) > 3: by.setdefault(lang, text)
    for k in PREF:
        lang = main_lang if k == "main" else k
        if lang in by: return by[lang]
    return next(iter(by.values()), "")


def main():
    items = load()
    todo = missing(items)
    before = len(todo)
    print(f"Produits sans composition avant : {before} / {len(items)}")
    if not todo:
        return
    try:
        import duckdb
    except ImportError:
        print("duckdb absent"); return
    t0 = time.time()
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    cols = {r[0]: r[1] for r in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{PARQUET}')").fetchall()}
    print("Colonnes utiles :", {k: cols[k] for k in cols if k in ("code", "lang", "ingredients_text", "additives_tags", "ingredients_analysis_tags", "allergens_tags", "ingredients_tags")})
    if "code" not in cols or "ingredients_text" not in cols:
        print("Schéma inattendu, rien à faire"); return
    con.execute("CREATE TABLE want(code VARCHAR)")
    con.executemany("INSERT INTO want VALUES (?)", [(str(p["code"]),) for p in todo])
    extra = [c for c in ("lang", "additives_tags", "ingredients_analysis_tags", "allergens_tags", "ingredients_tags") if c in cols]
    sel = ", ".join(["f.code", "f.ingredients_text"] + ["f." + c for c in extra])
    rows = con.execute(f"SELECT {sel} FROM read_parquet('{PARQUET}') f JOIN want w ON f.code = w.code").fetchall()
    names = ["code", "ingredients_text"] + extra
    found = {}
    for r in rows:
        d = dict(zip(names, r))
        found[str(d["code"])] = d
    print(f"Lignes trouvées dans le Parquet : {len(found)} en {time.time() - t0:.0f} s")
    filled = 0
    for p in todo:
        d = found.get(str(p["code"]))
        if not d: continue
        it = d["ingredients_text"]
        if isinstance(it, str): text = it.strip()
        else: text = pick([x if isinstance(x, dict) else {"lang": x[0], "text": x[1]} for x in (it or [])], d.get("lang") or "")
        if not text and d.get("ingredients_tags"):
            tags = [t.split(":", 1)[-1].replace("-", " ") for t in d["ingredients_tags"] if t][:80]
            if len(tags) >= 2: text = ", ".join(tags)
        if text:
            p["ingredients_text_fr"] = text[:1500]; filled += 1
        for k in ("additives_tags", "ingredients_analysis_tags", "allergens_tags"):
            if not p.get(k) and d.get(k): p[k] = list(d[k])
    tmp = PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        for it in items: f.write(json.dumps(it, ensure_ascii=False) + "\n")
    os.replace(tmp, PATH)
    print(f"Compositions ajoutées : {filled}")
    print(f"Produits sans composition après : {before - filled} / {len(items)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("Complément des compositions impossible :", repr(e))
