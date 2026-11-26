// Données produits : normalisation Open Food Facts / Open Beauty Facts, base hors ligne, recherche en ligne.
(function (root) {
"use strict";
const R = root.FoodRules;

/* Groupes des classements : id → [catégories Open Food Facts reconnues] */
const RANK_FOOD = [
  ["rusks", "Biscottes", ["en:rusks", "en:toasts"]],
  ["spreads", "Pâtes à tartiner", ["en:sweet-spreads", "en:hazelnut-spreads", "en:cocoa-and-hazelnuts-spreads", "en:chocolate-spreads"]],
  ["jams", "Confitures", ["en:jams", "en:fruit-jams", "en:berry-jams", "en:red-fruit-jams"]],
  ["fruityog", "Yaourts aux fruits", ["en:fruit-yogurts"]],
  ["plantyog", "Yaourts végétaux", ["en:plant-based-yogurts", "en:non-dairy-yogurts", "en:soy-yogurts", "en:fermented-plant-based-desserts"]],
  ["icecream", "Glaces", ["en:ice-creams", "en:ice-cream-tubs", "en:frozen-desserts"]],
  ["ketchup", "Ketchups", ["en:ketchup", "en:tomato-ketchup"]],
  ["aperitif", "Biscuits apéritifs", ["en:appetizers", "en:salty-snacks", "en:crackers"]],
  ["chips", "Chips", ["en:chips-and-fries", "en:crisps", "en:potato-crisps"]],
  ["cereals", "Céréales du petit-déjeuner", ["en:breakfast-cereals"]],
  ["muesli", "Mueslis", ["en:mueslis"]],
  ["biscuits", "Biscuits et gâteaux", ["en:biscuits", "en:biscuits-and-cakes", "en:cookies"]],
  ["chocolate", "Chocolats", ["en:chocolates", "en:dark-chocolates", "en:milk-chocolates"]],
  ["bread", "Pains de mie", ["en:sliced-breads", "en:white-sandwich-bread", "en:breads"]],
  ["sodas", "Sodas", ["en:sodas", "en:colas", "en:carbonated-drinks"]],
  ["juices", "Jus de fruits", ["en:fruit-juices", "en:orange-juices", "en:juices-and-nectars"]],
  ["plantmilk", "Boissons végétales", ["en:plant-based-milks", "en:milk-substitutes"]],
  ["cheese", "Fromages", ["en:cheeses"]],
  ["ham", "Jambons", ["en:hams", "en:white-hams", "en:cooked-hams"]],
  ["pizza", "Pizzas", ["en:pizzas"]],
  ["meals", "Plats préparés", ["en:meals", "en:prepared-meals"]],
  ["pasta", "Pâtes", ["en:pastas", "en:dry-pastas"]],
  ["sauces", "Sauces", ["en:sauces", "en:pasta-sauces", "en:tomato-sauces"]],
  ["compotes", "Compotes", ["en:compotes", "en:applesauces"]],
  ["oils", "Huiles", ["en:vegetable-oils", "en:olive-oils"]],
  ["soups", "Soupes", ["en:soups"]]
];
const RANK_BEAUTY = [
  ["toothpaste", "Dentifrices", ["en:toothpastes"]],
  ["deodorant", "Déodorants", ["en:deodorants", "en:antiperspirants"]],
  ["showergel", "Gels douche", ["en:shower-gels", "en:body-washes"]],
  ["shampoo", "Shampoings", ["en:shampoos"]],
  ["conditioner", "Après-shampoings", ["en:conditioners", "en:hair-conditioners"]],
  ["bodycream", "Crèmes & laits corps", ["en:body-creams", "en:body-lotions", "en:body-milks", "en:moisturizers"]],
  ["daycream", "Crèmes de jour", ["en:day-creams", "en:face-creams"]],
  ["nightcream", "Crèmes de nuit", ["en:night-creams"]],
  ["cleanser", "Nettoyants et démaquillants", ["en:make-up-removers", "en:facial-cleansers", "en:micellar-waters"]],
  ["facemask", "Masques visage", ["en:face-masks", "en:facial-masks"]],
  ["scrub", "Gommages visage", ["en:face-scrubs", "en:exfoliants"]],
  ["lipbalm", "Baumes à lèvres", ["en:lip-balms"]],
  ["hairmask", "Masques et soins cheveux", ["en:hair-masks", "en:hair-care"]],
  ["sunscreen", "Protections solaires", ["en:sunscreens", "en:sun-protection"]],
  ["aftersun", "Après-soleil", ["en:after-sun"]],
  ["soap", "Savons", ["en:soaps", "en:solid-soaps"]]
];
function rankGroup(cats, list) {
  // le groupe le plus spécifique : on parcourt les catégories de la plus précise à la plus générale
  for (let i = (cats || []).length - 1; i >= 0; i--) for (const [id, , tags] of list) if (tags.includes(cats[i])) return id;
  return null;
}

/* ---------- Enseignes (magasins) ----------
   Repérées dans le champ « magasins » d'Open Food Facts et dans les marques distributeurs */
const STORES = [
  ["auchan", "Auchan", "gen", "#e2001a", /auchan|(^|[^a-z])mmm!?([^a-z]|$)|pouce/],
  ["carrefour", "Carrefour", "gen", "#1e5bc6", /carrefour|reflets de france|(^|[^a-z])simpl([^a-z]|$)/],
  ["casino", "Casino", "gen", "#d6001c", /casino|geant casino|terre et saveur|le petit marche/],
  ["cora", "Cora", "gen", "#c8102e", /(^|[^a-z])cora([^a-z]|$)/],
  ["leclerc", "E.Leclerc", "gen", "#0066b3", /leclerc|marque repere|(^|[^a-z])eco\+|nos regions ont du talent|bio village/],
  ["franprix", "Franprix", "gen", "#f36f21", /franprix/],
  ["intermarche", "Intermarché", "gen", "#e30613", /intermarche|paturages|chabrior|top budget|monique ranou|saint eloi|itineraire des saveurs|capitaine cook|fiorini|paquito/],
  ["leaderprice", "Leader Price", "disc", "#e30613", /leader price/],
  ["match", "Match", "gen", "#e2001a", /supermarche match|(^|[^a-z])match([^a-z]|$)/],
  ["monoprix", "Monoprix", "gen", "#d4002a", /monoprix|monop/],
  ["u", "Système U", "gen", "#0072bc", /systeme u|super u|hyper u|magasins u|u express|(^|[^a-z])u bio|(^|[^a-z])u saveurs|bien vu|(^|,)\s*u\s*(,|$)/],
  ["spar", "Spar", "gen", "#00843d", /(^|[^a-z])spar([^a-z]|$)|vival/],
  ["lidl", "Lidl", "disc", "#0050aa", /lidl|milbona|(^|[^a-z])cien([^a-z]|$)|chef select|crownfield|saint alby|pilos|solevita|freeway|envia|favorina|italiamo|alesto|gelatelli/],
  ["aldi", "Aldi", "disc", "#00205b", /aldi|le gaulois aldi/],
  ["netto", "Netto", "disc", "#ffd200", /netto/],
  ["grandfrais", "Grand Frais", "spec", "#7ab929", /grand frais/],
  ["picard", "Picard", "spec", "#0a3d91", /picard/],
  ["thiriet", "Thiriet", "spec", "#d6001c", /thiriet/],
  ["biocoop", "Biocoop", "bio", "#6aa834", /biocoop/],
  ["naturalia", "Naturalia", "bio", "#79b51c", /naturalia/],
  ["lavieclaire", "La Vie Claire", "bio", "#0e7c3a", /la vie claire/],
  ["biocbon", "Bio c' Bon", "bio", "#2f8f3a", /bio c.? ?bon/],
  ["eauvive", "L'Eau Vive", "bio", "#2b8cc4", /l.?eau vive/]
];
function stripAcc(x) { return String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " "); }
function storeKeys(text) {
  const x = stripAcc(text); if (!x.trim()) return [];
  return STORES.filter(s => s[4].test(x)).map(s => s[0]);
}

/* Normalisation d'un produit Open Food Facts brut */
function num(v) { const n = parseFloat(v); return isNaN(n) ? null : Math.round(n * 100) / 100; }
function normFood(r) {
  const nu = r.nutriments || {};
  const p = {
    type: "food", code: String(r.code), name: (r.product_name_fr || r.product_name || r.generic_name_fr || "").trim(), brand: (r.brands || "").split(",")[0].trim(),
    qty: r.quantity || "", cats: r.categories_tags || [], g1: r.pnns_groups_1 || "", g2: r.pnns_groups_2 || "",
    ns: (r.nutriscore_grade || "").toLowerCase().replace(/[^a-e]/g, "") || null, nss: r.nutriscore_score != null ? num(r.nutriscore_score) : null,
    nova: r.nova_group ? parseInt(r.nova_group, 10) : null,
    eco: ((r.environmental_score_grade || r.ecoscore_grade || "") + "").toLowerCase().replace(/[^a-f]/g, "") || null,
    ecos: num(r.environmental_score_score ?? r.ecoscore_score),
    n: { kcal: num(nu["energy-kcal_100g"]), fat: num(nu.fat_100g), sat: num(nu["saturated-fat_100g"]), sug: num(nu.sugars_100g), salt: num(nu.salt_100g), fib: num(nu.fiber_100g), prot: num(nu.proteins_100g),
      fv: num(nu["fruits-vegetables-nuts_100g"] ?? nu["fruits-vegetables-nuts-estimate_100g"] ?? nu["fruits-vegetables-legumes-estimate-from-ingredients_100g"] ?? nu["fruits-vegetables-nuts-estimate-from-ingredients_100g"]) },
    add: r.additives_tags || [], all: r.allergens_tags || [], tr: r.traces_tags || [], ana: r.ingredients_analysis_tags || [],
    lab: r.labels_tags || [], ori: r.origins_tags || [], pack: r.packaging_tags || [],
    ing: (r.ingredients_text_fr || r.ingredients_text || r.ingredients_text_en || "").slice(0, 1500), img: r.image_front_small_url || "",
    st: storeKeys((r.stores || "") + "," + (r.stores_tags || []).join(",") + "," + (r.brands || ""))
  };
  p.drink = R.isDrink(p) ? 1 : 0;
  p.rg = rankGroup(p.cats, RANK_FOOD);
  return p;
}
function normBeauty(r) {
  const p = {
    type: "beauty", code: String(r.code), name: (r.product_name_fr || r.product_name || "").trim(), brand: (r.brands || "").split(",")[0].trim(),
    qty: r.quantity || "", cats: r.categories_tags || [], lab: r.labels_tags || [],
    inci: (r.ingredients_text || r.ingredients_text_fr || r.ingredients_text_en || (r.ingredients_tags || []).map(t => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).join(", ")).slice(0, 3000),
    img: r.image_front_small_url || ""
  };
  p.rg = rankGroup(p.cats, RANK_BEAUTY);
  return p;
}
/* Ligne d'index compacte (recherche, classements, alternatives) */
function indexRow(p) {
  if (p.type === "beauty") return { c: p.code, n: p.name, b: p.brand, r: p.rg, k: p.cats[p.cats.length - 1] || "", s: R.scoreCosmetic(p).score };
  return { c: p.code, n: p.name, b: p.brand, r: p.rg, k: p.cats[p.cats.length - 1] || "", k2: p.cats[p.cats.length - 2] || "", g: p.g2, ns: p.ns, s: p.nss, nv: p.nova, e: p.eco, o: R.isOrganic(p) ? 1 : 0,
    a: p.add.map(a => a.replace(/^en:/, "")), f: [p.n.fat, p.n.sat, p.n.sug, p.n.salt], d: p.drink, hi: p.ing ? 1 : 0,
    an: (p.ana || []).filter(x => /vegan|vegetarian|palm/.test(x)).map(x => x.replace(/^en:/, "")), al: (p.all || []).map(x => x.replace(/^en:/, "")), st: (p.st || []).length ? p.st : undefined };
}
// Reconstitue un produit minimal depuis une ligne d'index, pour le noter
function rowAsProduct(r) {
  return { type: "food", code: r.c, name: r.n, brand: r.b, rg: r.r, ns: r.ns, nss: r.s, nova: r.nv, eco: r.e, lab: r.o ? ["en:organic"] : [],
    add: r.a || [], n: { fat: r.f && r.f[0], sat: r.f && r.f[1], sug: r.f && r.f[2], salt: r.f && r.f[3] }, drink: r.d, ing: r.hi ? "x" : "",
    ana: (r.an || []).map(x => "en:" + x), all: (r.al || []).map(x => "en:" + x), st: r.st || [] };
}

/* ---------- Base hors ligne (fichiers dans l'APK) ---------- */
const cache = { shard: {}, index: {} };
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }
// La base est compactée (tools/pack-db.mjs) : fichiers .jgz (JSON gzip) + dictionnaire d'étiquettes tags.json.gz
async function getData(url) {
  if (typeof DecompressionStream === "function") {
    try {
      const r = await fetch(url.replace(/\.json$/, ".jgz")); // extension .jgz : sinon l'outil Android décompresse les .gz
      if (r.ok) return await new Response(r.body.pipeThrough(new DecompressionStream("gzip"))).json();
    } catch (e) {}
  }
  return getJSON(url); // base non compactée (développement)
}
const SHARD_TAGS = ["cats", "add", "all", "tr", "ana", "lab", "ori", "pack", "st"];
function loadTags(type) {
  if (!cache.tags) cache.tags = {};
  if (!cache.tags[type]) cache.tags[type] = getData("data/" + type + "/tags.json").catch(() => null);
  return cache.tags[type];
}
const untag = (dict, v) => typeof v === "number" ? dict[v] : v;
function shardOf(code) { return code.slice(-2).padStart(2, "0"); }
async function localProduct(code, type) {
  const key = type + shardOf(code);
  try { if (!cache.shard[key]) cache.shard[key] = await getData("data/" + type + "/" + shardOf(code) + ".json"); } catch (e) { cache.shard[key] = {}; }
  const p = cache.shard[key][code];
  if (!p) return null;
  const q = { ...p, code, type };
  const dict = await loadTags(type);
  if (dict) for (const k of SHARD_TAGS) if (Array.isArray(q[k])) q[k] = q[k].map(v => untag(dict, v));
  return q;
}
async function loadIndex(type) {
  if (!cache.index[type]) {
    try {
      const [rows, dict] = await Promise.all([getData("data/" + type + "/index.json"), loadTags(type)]);
      if (dict) for (const r of rows) {
        for (const k of ["k", "k2", "g"]) r[k] = r[k] == null ? "" : untag(dict, r[k]);
        for (const k of ["a", "an", "al", "st"]) r[k] = (r[k] || []).map(v => untag(dict, v));
      }
      cache.index[type] = rows;
    } catch (e) { cache.index[type] = []; }
  }
  return cache.index[type];
}

/* ---------- En ligne (si réseau) ---------- */
const FOOD_FIELDS = "code,product_name_fr,product_name,generic_name_fr,brands,quantity,categories_tags,pnns_groups_1,pnns_groups_2,nutriscore_grade,nutriscore_score,nova_group,ecoscore_grade,ecoscore_score,environmental_score_grade,environmental_score_score,nutriments,additives_tags,allergens_tags,traces_tags,ingredients_analysis_tags,labels_tags,origins_tags,packaging_tags,ingredients_text_fr,ingredients_text,ingredients_text_en,image_front_small_url";
const BEAUTY_FIELDS = "code,product_name,product_name_fr,brands,quantity,categories_tags,ingredients_tags,ingredients_text,ingredients_text_fr,ingredients_text_en,labels_tags,image_front_small_url";
async function withTimeout(url, ms) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); }
}
async function onlineProduct(code) {
  try {
    const j = await withTimeout("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?fields=" + FOOD_FIELDS, 8000);
    if (j && j.status === 1 && j.product) return normFood({ ...j.product, code });
  } catch (e) {}
  try {
    const j = await withTimeout("https://world.openbeautyfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?fields=" + BEAUTY_FIELDS, 8000);
    if (j && j.status === 1 && j.product) return normBeauty({ ...j.product, code });
  } catch (e) {}
  return null;
}
/* Animaux : Open Pet Food Facts (croquettes, pâtées) */
const PET_CATS = /en:(pet-food|cat-food|dog-food|cats-food|dogs-food)|chats?|chiens?/;
function normPet(r) {
  const nu = r.nutriments || {}, cats = r.categories_tags || [];
  const text = (cats.join(" ") + " " + (r.product_name || "")).toLowerCase();
  return {
    type: "pet", code: String(r.code), name: (r.product_name_fr || r.product_name || "").trim(), brand: (r.brands || "").split(",")[0].trim(), qty: r.quantity || "",
    cats, img: r.image_front_small_url || "", add: r.additives_tags || [],
    ing: (r.ingredients_text_fr || r.ingredients_text || r.ingredients_text_en || "").slice(0, 2000),
    n: { prot: num(nu.proteins_100g), fat: num(nu.fat_100g), fib: num(nu.fiber_100g), ash: num(nu.ash_100g) },
    animal: /cat|chat/.test(text) ? "cat" : /dog|chien/.test(text) ? "dog" : "pet"
  };
}
async function petOnline(code) {
  try {
    const j = await withTimeout("https://world.openpetfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json", 8000);
    if (j && j.status === 1 && j.product) return normPet({ ...j.product, code });
  } catch (e) {}
  return null;
}
async function onlineSearch(q) {
  try {
    const j = await withTimeout("https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&json=1&page_size=30&search_terms=" + encodeURIComponent(q) + "&fields=" + FOOD_FIELDS, 10000);
    return (j.products || []).filter(p => p.code).map(normFood);
  } catch (e) { return null; }
}

/* ---------- Recherche d'un produit (hors ligne d'abord) ---------- */
const SEEN_KEY = "sc-food-seen";
function seenGet() { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch (e) { return {}; } }
function seenPut(p) { try { const s = seenGet(); s[p.code] = p; const keys = Object.keys(s); if (keys.length > 400) delete s[keys[0]]; localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) {} }
/* Cosmétiques rangés par erreur dans la base alimentaire : on les reconnaît et on les traite comme des cosmétiques */
const NONFOOD_CATS = /^en:(non-food-products|cosmetics|body-milks?|hygiene|beauty|shower-gels?|shampoos?|soaps?|deodorants?|toothpastes?|body-care|skin-care|hair-care|make-up|perfumes?)/;
const NONFOOD_NAME = /\b(lait (corporel|pour le corps|hydratant|demaquillant|solaire|apres[- ]soleil)|creme (hydratante|de jour|de nuit|mains|pour les mains|visage|corps|solaire|anti)|gel douche|douche|shampo|apres[- ]shampo|savon|deodorant|anti[- ]transpirant|dentifrice|bain de bouche|lotion|baume (a levres|corps|levres)|serum|demaquillant|eau micellaire|eau de (toilette|parfum)|maquillage|mascara|rouge a levres|vernis|after[- ]?shave|mousse a raser|huile (seche|de massage|corps|cheveux|demaquillante)|masque (visage|cheveux)|gommage|exfoliant|creme de douche|body (lotion|milk|wash)|shower gel|shampoo|conditioner|toothpaste|deodorant)\b/;
function looksNonFood(p) {
  if (p.type !== "food") return false;
  const n = p.n || {}, noNutri = [n.kcal, n.fat, n.sug, n.salt, n.prot].every(v => v == null) && !p.ns;
  if ((p.cats || []).some(c => NONFOOD_CATS.test(c))) return true;
  if (!noNutri) return false;
  if (NONFOOD_NAME.test(norm(p.name + " " + (p.cats || []).join(" ")))) return true;
  // Liste d'ingrédients au format INCI (Aqua, Parfum, CI 14700…) : c'est un cosmétique
  const inci = new Set((norm(p.ing).match(INCI_MARK) || []).map(x => x.replace(/\s+\d+$/, "")));
  return inci.size >= 2;
}
const INCI_MARK = /\b(aqua|parfum|fragrance|dimethicone|cetearyl alcohol|cetyl alcohol|stearyl alcohol|ci \d{5}|sodium laureth|sodium lauryl|glyceryl stearate|phenoxyethanol|tocopheryl acetate|linalool|limonene|hexyl cinnamal|carbomer|cocamidopropyl|butyrospermum|ethylhexylglycerin|disodium edta|tetrasodium edta|polysorbate|peg-\d+)\b/g;
// L'inverse : un « cosmétique » qui est en fait un aliment (catégories alimentaires)
const FOOD_CATS = /^en:(plant-based-foods|beverages|dairies|snacks|meats|breakfasts|sweet-snacks|biscuits|cereals|groceries|condiments|sauces|spreads|desserts|fruits|vegetables|frozen-foods|meals|fishes|seafood|cheeses|chocolates|confectioneries|waters|juices|baby-foods)/;
function looksFood(p) { return p.type === "beauty" && (p.cats || []).some(c => FOOD_CATS.test(c)) && !(p.cats || []).some(c => NONFOOD_CATS.test(c)); }
function asBeauty(p) {
  return { type: "beauty", code: p.code, name: p.name, brand: p.brand, qty: p.qty || "", cats: p.cats || [], lab: p.lab || [], inci: p.ing || "", img: p.img || "", fromFood: true, rg: rankGroup(p.cats || [], RANK_BEAUTY) };
}
/* Composition saisie ou photographiée par l'utilisateur (gardée sur le téléphone) */
const INCI_KEY = "sc-inci";
function userInci() { try { return JSON.parse(localStorage.getItem(INCI_KEY)) || {}; } catch (e) { return {}; } }
function setUserInci(code, text, name) { const m = userInci(); if (text) m[code] = { t: text, n: name || "" }; else delete m[code]; try { localStorage.setItem(INCI_KEY, JSON.stringify(m)); } catch (e) {} }
function finish(p, code) {
  if (!p) {
    const u = userInci()[code];
    return u ? { type: "beauty", code, name: u.n || "", brand: "", qty: "", cats: [], lab: [], inci: u.t, img: "", userInci: true } : null;
  }
  if (looksNonFood(p)) p = asBeauty(p);
  if (p.type === "beauty") { const u = userInci()[p.code] || userInci()[code]; if (u) p = { ...p, inci: u.t, userInci: true }; }
  return p;
}
async function foodOnline(code) {
  try {
    const j = await withTimeout("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?fields=" + FOOD_FIELDS, 8000);
    if (j && j.status === 1 && j.product) return normFood({ ...j.product, code });
  } catch (e) {}
  return null;
}
async function beautyOnline(code) {
  try {
    const j = await withTimeout("https://world.openbeautyfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?fields=" + BEAUTY_FIELDS, 8000);
    if (j && j.status === 1 && j.product) return normBeauty({ ...j.product, code });
  } catch (e) {}
  return null;
}
async function findProduct(code) {
  code = String(code).trim();
  const variants = [code, code.padStart(13, "0"), code.replace(/^0+/, "")];
  let p = null;
  for (const c of variants) { p = await localProduct(c, "food"); if (p) break; }
  if (!p) for (const c of variants) { p = await localProduct(c, "beauty"); if (p) break; }
  if (!p) { const s = seenGet(); for (const c of variants) if (s[c]) { p = s[c]; break; } }
  if (!p) { p = await onlineProduct(code); if (p) seenPut(p); }
  // Un « aliment » qui est en fait un cosmétique : on cherche d'abord sa vraie fiche dans Open Beauty Facts
  if (p && looksNonFood(p)) { const b = await beautyOnline(code); if (b && b.inci) { seenPut(b); p = b; } }
  // Cosmétique sans composition dans la base du téléphone : on regarde si la fiche en ligne en a une (autre langue)
  if (p && p.type === "beauty" && !p.inci && !p.fromFood) { const b = await beautyOnline(code); if (b && b.inci) { seenPut(b); p = b; } }
  if (p && looksFood(p)) { const f = await foodOnline(code); if (f && !looksNonFood(f)) { seenPut(f); p = f; } }
  // Nourriture pour animaux
  if (p && p.type === "food" && (p.cats || []).some(c => /pet-food|cat-food|dog-food/.test(c))) { const q = await petOnline(code); p = q || Object.assign(normPet({ code, product_name: p.name, brands: p.brand, categories_tags: p.cats, ingredients_text: p.ing, image_front_small_url: p.img }), {}); }
  if (!p) { p = await petOnline(code); if (p) seenPut(p); }
  if (p && p.type === "pet") return p;
  return finish(p, code);
}
function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
async function searchLocal(q, limit = 60) {
  const words = norm(q).split(/\s+/).filter(Boolean); if (!words.length) return [];
  const out = [];
  for (const type of ["food", "beauty"]) {
    const idx = await loadIndex(type);
    for (const r of idx) {
      const hay = norm(r.n + " " + r.b);
      if (words.every(w => hay.includes(w)) || r.c === q.trim()) { out.push({ ...r, type }); if (out.length >= limit) return out; }
    }
  }
  return out;
}

root.FoodData = { normPet, petOnline, STORES, storeKeys, setUserInci, userInci, looksNonFood, looksFood, asBeauty, RANK_FOOD, RANK_BEAUTY, rankGroup, normFood, normBeauty, indexRow, rowAsProduct, findProduct, localProduct, loadIndex, onlineSearch, searchLocal, seenPut, shardOf, norm };
})(typeof window !== "undefined" ? window : globalThis);
