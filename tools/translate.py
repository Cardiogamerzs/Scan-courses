# Traduit en anglais les textes du contenu (tools/extract-strings.mjs) avec le modèle Helsinki-NLP/opus-mt-fr-en.
# Les traductions déjà faites sont gardées dans tools/tr-cache/en.json (cache GitHub Actions) : seuls les nouveaux textes sont traduits.
# Usage : python tools/translate.py strings.json app/src/main/assets/data/tr-en.jgz
import gzip, json, os, re, sys, time

src, out = sys.argv[1], sys.argv[2]
cache_path = "tools/tr-cache/en.json"
strings = json.load(open(src, encoding="utf-8"))
cache = json.load(open(cache_path, encoding="utf-8")) if os.path.exists(cache_path) else {}

# Émojis et symboles du début gardés tels quels
LEAD = re.compile(r"^([^0-9A-Za-zÀ-ÿ«\"'(]*)(.*)$", re.S)
def split(s):
    m = LEAD.match(s)
    return m.group(1), m.group(2).strip()

todo = sorted({split(s)[1] for s in strings if split(s)[1] and split(s)[1] not in cache}, key=len)
if out == "--count":
    print(len(todo)); sys.exit(0)
print(f"{len(strings)} textes, {len(todo)} à traduire", flush=True)
if todo:
    import torch
    from transformers import MarianMTModel, MarianTokenizer
    torch.set_num_threads(os.cpu_count() or 4)
    name = "Helsinki-NLP/opus-mt-fr-en"
    tok = MarianTokenizer.from_pretrained(name)
    model = MarianMTModel.from_pretrained(name).eval()
    t0, B = time.time(), 24
    for i in range(0, len(todo), B):
        batch = todo[i:i + B]
        enc = tok(batch, return_tensors="pt", padding=True, truncation=True, max_length=400)
        with torch.no_grad():
            gen = model.generate(**enc, num_beams=2, max_new_tokens=400)
        for s, e in zip(batch, tok.batch_decode(gen, skip_special_tokens=True)):
            cache[s] = e.strip()
        if i // B % 20 == 0:
            print(f"{i + len(batch)}/{len(todo)} ({time.time() - t0:.0f} s)", flush=True)
            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
            json.dump(cache, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    json.dump(cache, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)

# Petites corrections du vocabulaire de cuisine et des noms propres
FIX = [(r"\bSovea\b|\bSovée\b", "Sovée"), (r"\bc\. à soupe\b", "tbsp"), (r"\bc\. à café\b", "tsp"), (r"\bSA\b", "weeks"), (r"\bamenorrhea\b", "amenorrhoea")]
def fix(e):
    for a, b in FIX:
        e = re.sub(a, b, e)
    return e

d = {}
for s in strings:
    lead, core = split(s)
    if core in cache and cache[core]:
        e = fix(cache[core])
        if core[:1].isupper() and e[:1].islower():
            e = e[:1].upper() + e[1:]
        d[s] = (lead + e) if lead else e
os.makedirs(os.path.dirname(out), exist_ok=True)
with gzip.open(out, "wt", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
json.dump(d, open("tr-en-review.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"Dictionnaire : {len(d)} entrées → {out} ({os.path.getsize(out) // 1024} Ko)")
