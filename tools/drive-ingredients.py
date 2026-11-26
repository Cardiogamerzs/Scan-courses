"""Relève les listes d'ingrédients absentes d'Open Food Facts sur les pages produits publiques des drives.

Règles : robots.txt de chaque site respecté, une requête toutes les 3 s par site au plus,
un site est abandonné dès qu'il bloque (403, 429, captcha, page anti-robot) : pas de contournement.
On ne garde que la liste d'ingrédients, l'adresse de la page et la date.

Entrée : tools/drive-codes.json [{c, n, b}] ; sortie : drive-ingredients.json {code: {text, source, date, site}}
"""
import html, json, re, sys, time, urllib.parse, urllib.request, urllib.robotparser
from datetime import date

UA = "SoveeBot/1.0 (+https://github.com/Cardiogamerzs/Scan-courses ; listes d'ingrédients pour une appli gratuite)"
DELAY = 3.0
MAX_MIN = float(sys.argv[1]) if len(sys.argv) > 1 else 45

SITES = [
    # nom, page de recherche par code-barres, motif des liens vers une fiche produit
    ("carrefour", "https://www.carrefour.fr/s?q={ean}", r'href="(/p/[^"]*?{ean}[^"]*)"'),
    ("auchan", "https://www.auchan.fr/recherche?text={ean}", r'href="(/[^"]*/pr-C\d+[^"]*)"'),
    ("leclerc", "https://www.e.leclerc/recherche?q={ean}", r'href="(/fp/[^"]*?{ean}[^"]*)"'),
    ("intermarche", "https://www.intermarche.com/recherche/{ean}", r'href="(/produit/[^"]*?/{ean})"'),
    ("lidl", "https://www.lidl.fr/q/search?q={ean}", r'href="(/p/[^"]*)"'),
]
BLOCK = re.compile(r"captcha|datadome|cf-chl|challenge-platform|access denied|accès refusé|are you a robot|perimeterx|px-captcha", re.I)


class Site:
    def __init__(self, name, search, link):
        self.name, self.search, self.link = name, search, link
        self.base = re.match(r"https://[^/]+", search).group(0)
        self.last = 0.0
        self.dead = None
        self.stats = {"req": 0, "found": 0}
        self.rp = urllib.robotparser.RobotFileParser()
        try:
            self.rp.parse(self.get(self.base + "/robots.txt", check_robots=False, raw=True).splitlines())
        except Exception as e:
            self.dead = f"robots.txt illisible ({e})"

    def allowed(self, url):
        return self.rp.can_fetch(UA, url)

    def get(self, url, check_robots=True, raw=False):
        if check_robots and not self.allowed(url):
            raise PermissionError("interdit par robots.txt")
        wait = self.last + DELAY - time.time()
        if wait > 0: time.sleep(wait)
        self.last = time.time()
        self.stats["req"] += 1
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9", "Accept": "text/html,application/json"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read(3_000_000).decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 429, 503):
                self.dead = f"bloqué (HTTP {e.code}) sur {url}"
                raise
            if e.code == 404: return ""
            raise
        if not raw and BLOCK.search(body[:20000]) and "ingr" not in body.lower():
            self.dead = f"page anti-robot sur {url}"
            raise PermissionError(self.dead)
        return body


def clean(t):
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    t = t.replace("\\n", " ").replace("\\u00a0", " ").replace(" ", " ")
    return re.sub(r"\s+", " ", t).strip(" :.-")


def extract(page):
    """Liste d'ingrédients dans une fiche produit : données JSON de la page, sinon bloc « Ingrédients »."""
    for m in re.finditer(r'"ingr[ée]dients?(?:List|_text|Text|Statement)?"\s*:\s*"((?:[^"\\]|\\.){15,4000})"', page, re.I):
        t = clean(json.loads('"' + m.group(1) + '"') if "\\" in m.group(1) else m.group(1))
        if t.count(",") >= 1 or len(t.split()) >= 3: return t
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", page)
    text = re.sub(r"(?i)<(br|/p|/div|/li|/h\d|/dt|/dd|/tr)[^>]*>", "\n", text)
    lines = [clean(l) for l in re.sub(r"<[^>]+>", " ", text).split("\n")]
    lines = [l for l in lines if l]
    for i, l in enumerate(lines):
        m = re.match(r"(?i)^ingr[ée]dients?\s*:?\s*(.*)$", l)
        if not m: continue
        cand = m.group(1) or (lines[i + 1] if i + 1 < len(lines) else "")
        if len(cand) >= 10 and (cand.count(",") >= 1 or len(cand.split()) >= 3) and not re.match(r"(?i)^(et |allerg|valeurs)", cand):
            return cand[:3000]
    return ""


def main():
    codes = json.load(open("tools/drive-codes.json", encoding="utf-8"))
    sites = [Site(*s) for s in SITES]
    for s in sites: print(s.name, ":", s.dead or "robots.txt lu")
    out, t0, today = {}, time.time(), date.today().isoformat()
    for i, item in enumerate(codes):
        if time.time() - t0 > MAX_MIN * 60: print("temps écoulé"); break
        ean = item["c"]
        for s in sites:
            if s.dead: continue
            try:
                url = s.search.format(ean=ean)
                if not s.allowed(url): continue
                page = s.get(url)
                txt = extract(page) if ean in page else ""
                prod = url
                if not txt:
                    m = re.search(s.link.format(ean=ean), page)
                    if not m: continue
                    prod = urllib.parse.urljoin(s.base, html.unescape(m.group(1)))
                    if not s.allowed(prod): continue
                    page = s.get(prod)
                    if ean not in page: continue  # pas le bon produit
                    txt = extract(page)
                if txt:
                    out[ean] = {"text": txt, "source": prod, "date": today, "site": s.name, "product": item.get("n", "")}
                    s.stats["found"] += 1
                    break
            except Exception as e:
                if s.dead: print(s.name, "abandonné :", s.dead)
                else: print(s.name, ean, "erreur :", repr(e)[:120])
        if i % 25 == 0: print(i, "produits essayés,", len(out), "listes trouvées", {s.name: s.stats for s in sites})
    json.dump(out, open("drive-ingredients.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("BILAN :", len(out), "listes trouvées sur", len(codes), "produits")
    for s in sites: print(" ", s.name, s.stats, "·", s.dead or "ok")
    for k, v in list(out.items())[:8]: print(" ex.", k, v["site"], v["text"][:140])


if __name__ == "__main__":
    main()
