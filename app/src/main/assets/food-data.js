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
    n: { kcal: num(nu["energy-kcal_100g"]), fat: num(nu.fat_100g), sat: num(nu["saturated-fat_100g"]), sug: num(nu.sugars_100g), salt: num(nu.salt_100g), fib: num(nu.fiber_100g), prot: num(nu.proteins_100g) },
    add: r.additives_tags || [], all: r.allergens_tags || [], tr: r.traces_tags || [], ana: r.ingredients_analysis_tags || [],
    lab: r.labels_tags || [], ori: r.origins_tags || [], pack: r.packaging_tags || [],
    ing: (r.ingredients_text_fr || "").slice(0, 1500), img: r.image_front_small_url || ""
  };
  p.drink = R.isDrink(p) ? 1 : 0;
  p.rg = rankGroup(p.cats, RANK_FOOD);
  return p;
}
function normBeauty(r) {
  const p = {
    type: "beauty", code: String(r.code), name: (r.product_name_fr || r.product_name || "").trim(), brand: (r.brands || "").split(",")[0].trim(),
    qty: r.quantity || "", cats: r.categories_tags || [], lab: r.labels_tags || [],
    inci: (r.ingredients_text || (r.ingredients_tags || []).map(t => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).join(", ")).slice(0, 3000),
    img: r.image_front_small_url || ""
  };
  p.rg = rankGroup(p.cats, RANK_BEAUTY);
  return p;
}
/* Ligne d'index compacte (recherche, classements, alternatives) */
function indexRow(p) {
  if (p.type === "beauty") return { c: p.code, n: p.name, b: p.brand, r: p.rg, k: p.cats[p.cats.length - 1] || "", s: R.scoreCosmetic(p).score };
  return { c: p.code, n: p.name, b: p.brand, r: p.rg, k: p.cats[p.cats.length - 1] || "", g: p.g2, ns: p.ns, s: p.nss, nv: p.nova, e: p.eco, o: R.isOrganic(p) ? 1 : 0,
    a: p.add.map(a => a.replace(/^en:/, "")), f: [p.n.fat, p.n.sat, p.n.sug, p.n.salt], d: p.drink, hi: p.ing ? 1 : 0,
    an: (p.ana || []).filter(x => /vegan|vegetarian|palm/.test(x)).map(x => x.replace(/^en:/, "")), al: (p.all || []).map(x => x.replace(/^en:/, "")) };
}
// Reconstitue un produit minimal depuis une ligne d'index, pour le noter
function rowAsProduct(r) {
  return { type: "food", code: r.c, name: r.n, brand: r.b, rg: r.r, ns: r.ns, nss: r.s, nova: r.nv, eco: r.e, lab: r.o ? ["en:organic"] : [],
    add: r.a || [], n: { fat: r.f && r.f[0], sat: r.f && r.f[1], sug: r.f && r.f[2], salt: r.f && r.f[3] }, drink: r.d, ing: r.hi ? "x" : "",
    ana: (r.an || []).map(x => "en:" + x), all: (r.al || []).map(x => "en:" + x) };
}

/* ---------- Base hors ligne (fichiers dans l'APK) ---------- */
const cache = { shard: {}, index: {} };
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }
function shardOf(code) { return code.slice(-2).padStart(2, "0"); }
async function localProduct(code, type) {
  const key = type + shardOf(code);
  try { if (!cache.shard[key]) cache.shard[key] = await getJSON("data/" + type + "/" + shardOf(code) + ".json"); } catch (e) { cache.shard[key] = {}; }
  const p = cache.shard[key][code];
  return p ? { ...p, type } : null;
}
async function loadIndex(type) {
  if (!cache.index[type]) { try { cache.index[type] = await getJSON("data/" + type + "/index.json"); } catch (e) { cache.index[type] = []; } }
  return cache.index[type];
}

/* ---------- En ligne (si réseau) ---------- */
const FOOD_FIELDS = "code,product_name_fr,product_name,generic_name_fr,brands,quantity,categories_tags,pnns_groups_1,pnns_groups_2,nutriscore_grade,nutriscore_score,nova_group,ecoscore_grade,ecoscore_score,environmental_score_grade,environmental_score_score,nutriments,additives_tags,allergens_tags,traces_tags,ingredients_analysis_tags,labels_tags,origins_tags,packaging_tags,ingredients_text_fr,image_front_small_url";
const BEAUTY_FIELDS = "code,product_name,product_name_fr,brands,quantity,categories_tags,ingredients_tags,ingredients_text,labels_tags,image_front_small_url";
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
async function findProduct(code) {
  code = String(code).trim();
  const variants = [code, code.padStart(13, "0"), code.replace(/^0+/, "")];
  for (const c of variants) { const p = await localProduct(c, "food"); if (p) return p; }
  for (const c of variants) { const p = await localProduct(c, "beauty"); if (p) return p; }
  const s = seenGet(); for (const c of variants) if (s[c]) return s[c];
  const p = await onlineProduct(code);
  if (p) seenPut(p);
  return p;
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

root.FoodData = { RANK_FOOD, RANK_BEAUTY, rankGroup, normFood, normBeauty, indexRow, rowAsProduct, findProduct, localProduct, loadIndex, onlineSearch, searchLocal, seenPut, shardOf, norm };
})(typeof window !== "undefined" ? window : globalThis);
