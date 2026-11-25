// Règles santé du Scan alimentaire : additifs, nutriments, grossesse, bébés, régimes, cosmétiques, notes.
// Sources principales : classement du CIRC (monographies), avis EFSA et ANSES, Programme national nutrition santé (PNNS),
// seuils « feux tricolores » de l'étiquetage nutritionnel (UK FSA, repris par l'OMS Europe).
// Ce sont des repères d'information, pas un avis médical.
(function (root) {
"use strict";

/* ---------- Additifs alimentaires ----------
   risk : high (à éviter), mod (modéré), low (faible)
   tags : cancer1 / cancer2A / cancer2B (CIRC), ed (perturbateur endocrinien suspecté), child (effets sur l'attention des enfants),
          allergen, gut (microbiote / inflammation), heart (charge en phosphates…) */
const ADDITIVES = {
  "e102": { n: "Tartrazine", r: "mod", t: ["child", "allergen"] },
  "e104": { n: "Jaune de quinoléine", r: "mod", t: ["child"] },
  "e110": { n: "Jaune orangé S", r: "mod", t: ["child"] },
  "e120": { n: "Carmin (cochenille)", r: "low", t: ["allergen"] },
  "e122": { n: "Azorubine", r: "mod", t: ["child"] },
  "e123": { n: "Amarante", r: "high", t: ["child"] },
  "e124": { n: "Ponceau 4R", r: "mod", t: ["child"] },
  "e127": { n: "Érythrosine", r: "mod", t: ["ed"] },
  "e129": { n: "Rouge allura AC", r: "mod", t: ["child"] },
  "e131": { n: "Bleu patenté V", r: "mod", t: ["allergen"] },
  "e133": { n: "Bleu brillant FCF", r: "low", t: [] },
  "e150c": { n: "Caramel ammoniacal", r: "mod", t: ["cancer2B"] },
  "e150d": { n: "Caramel au sulfite d'ammonium", r: "mod", t: ["cancer2B"] },
  "e151": { n: "Noir brillant BN", r: "mod", t: [] },
  "e155": { n: "Brun HT", r: "mod", t: ["child"] },
  "e171": { n: "Dioxyde de titane", r: "high", t: ["cancer2B"], note: "Interdit dans l'alimentation en France depuis 2020 et dans l'UE depuis 2022 : l'EFSA ne peut plus exclure un effet génotoxique." },
  "e173": { n: "Aluminium", r: "mod", t: [] },
  "e200": { n: "Acide sorbique", r: "low", t: [] },
  "e202": { n: "Sorbate de potassium", r: "low", t: [] },
  "e210": { n: "Acide benzoïque", r: "mod", t: ["allergen"] },
  "e211": { n: "Benzoate de sodium", r: "mod", t: ["child"], note: "Peut former du benzène (cancérogène) en présence de vitamine C." },
  "e212": { n: "Benzoate de potassium", r: "mod", t: [] },
  "e213": { n: "Benzoate de calcium", r: "mod", t: [] },
  "e220": { n: "Anhydride sulfureux", r: "mod", t: ["allergen"] },
  "e221": { n: "Sulfite de sodium", r: "mod", t: ["allergen"] },
  "e222": { n: "Sulfite acide de sodium", r: "mod", t: ["allergen"] },
  "e223": { n: "Disulfite de sodium", r: "mod", t: ["allergen"] },
  "e224": { n: "Disulfite de potassium", r: "mod", t: ["allergen"] },
  "e226": { n: "Sulfite de calcium", r: "mod", t: ["allergen"] },
  "e228": { n: "Sulfite acide de potassium", r: "mod", t: ["allergen"] },
  "e249": { n: "Nitrite de potassium", r: "high", t: ["cancer2A"], note: "Les viandes transformées nitritées sont classées « probablement cancérogènes » (CIRC 2A). L'ANSES (2022) confirme le lien avec le cancer colorectal." },
  "e250": { n: "Nitrite de sodium", r: "high", t: ["cancer2A"], note: "Les viandes transformées nitritées sont classées « probablement cancérogènes » (CIRC 2A). L'ANSES (2022) confirme le lien avec le cancer colorectal." },
  "e251": { n: "Nitrate de sodium", r: "high", t: ["cancer2A"], note: "Se transforme en nitrites : mêmes réserves que E250 (CIRC 2A)." },
  "e252": { n: "Nitrate de potassium", r: "high", t: ["cancer2A"], note: "Se transforme en nitrites : mêmes réserves que E250 (CIRC 2A)." },
  "e310": { n: "Gallate de propyle", r: "mod", t: ["ed", "allergen"] },
  "e319": { n: "TBHQ", r: "mod", t: [] },
  "e320": { n: "BHA", r: "high", t: ["cancer2B", "ed"], note: "Cancérogène possible (CIRC 2B) et perturbateur endocrinien suspecté." },
  "e321": { n: "BHT", r: "mod", t: ["ed"] },
  "e338": { n: "Acide phosphorique", r: "mod", t: ["heart"] },
  "e339": { n: "Phosphates de sodium", r: "mod", t: ["heart"] },
  "e340": { n: "Phosphates de potassium", r: "mod", t: ["heart"] },
  "e341": { n: "Phosphates de calcium", r: "low", t: ["heart"] },
  "e407": { n: "Carraghénanes", r: "mod", t: ["gut"] },
  "e407a": { n: "Algues Eucheuma transformées", r: "mod", t: ["gut"] },
  "e433": { n: "Polysorbate 80", r: "mod", t: ["gut"] },
  "e450": { n: "Diphosphates", r: "mod", t: ["heart"] },
  "e451": { n: "Triphosphates", r: "mod", t: ["heart"] },
  "e452": { n: "Polyphosphates", r: "mod", t: ["heart"] },
  "e466": { n: "Carboxyméthylcellulose", r: "mod", t: ["gut"] },
  "e471": { n: "Mono- et diglycérides d'acides gras", r: "low", t: ["gut"] },
  "e472e": { n: "Esters DATEM", r: "low", t: [] },
  "e473": { n: "Sucroesters d'acides gras", r: "low", t: [] },
  "e476": { n: "Polyricinoléate de polyglycérol", r: "low", t: [] },
  "e481": { n: "Stéaroyl-2-lactylate de sodium", r: "low", t: [] },
  "e621": { n: "Glutamate monosodique", r: "low", t: [] },
  "e627": { n: "Guanylate disodique", r: "low", t: [] },
  "e631": { n: "Inosinate disodique", r: "low", t: [] },
  "e900": { n: "Diméthylpolysiloxane", r: "low", t: [] },
  "e950": { n: "Acésulfame K", r: "mod", t: [] },
  "e951": { n: "Aspartame", r: "mod", t: ["cancer2B"], note: "Classé cancérogène possible (CIRC 2B) en 2023 ; dose journalière admissible maintenue par l'OMS/JECFA." },
  "e952": { n: "Cyclamates", r: "mod", t: [] },
  "e954": { n: "Saccharine", r: "mod", t: [] },
  "e955": { n: "Sucralose", r: "mod", t: ["gut"] },
  "e960": { n: "Glycosides de stéviol", r: "low", t: [] },
  "e961": { n: "Néotame", r: "mod", t: [] },
  "e962": { n: "Sel d'aspartame-acésulfame", r: "mod", t: ["cancer2B"] }
};
// Additifs courants sans risque connu aux doses autorisées (pour afficher leur nom)
const SAFE = { e100: "Curcumine", e101: "Riboflavine", e140: "Chlorophylles", e141: "Complexes cuivre-chlorophylles", e150a: "Caramel ordinaire", e160a: "Caroténoïdes", e160b: "Rocou", e160c: "Extrait de paprika", e162: "Rouge de betterave", e163: "Anthocyanes",
  e170: "Carbonate de calcium", e260: "Acide acétique", e262: "Acétates de sodium", e270: "Acide lactique", e290: "Dioxyde de carbone", e296: "Acide malique", e300: "Acide ascorbique (vitamine C)", e301: "Ascorbate de sodium", e302: "Ascorbate de calcium",
  e306: "Tocophérols (vitamine E)", e307: "Alpha-tocophérol", e322: "Lécithines", e325: "Lactate de sodium", e326: "Lactate de potassium", e327: "Lactate de calcium", e330: "Acide citrique", e331: "Citrates de sodium", e332: "Citrates de potassium", e333: "Citrates de calcium",
  e334: "Acide tartrique", e335: "Tartrates de sodium", e336: "Tartrates de potassium", e392: "Extraits de romarin", e400: "Acide alginique", e401: "Alginate de sodium", e406: "Agar-agar", e410: "Farine de graines de caroube", e412: "Gomme de guar", e414: "Gomme arabique",
  e415: "Gomme xanthane", e418: "Gomme gellane", e420: "Sorbitol", e422: "Glycérol", e440: "Pectines", e460: "Cellulose", e461: "Méthylcellulose", e464: "Hydroxypropylméthylcellulose", e500: "Carbonates de sodium", e501: "Carbonates de potassium", e503: "Carbonates d'ammonium",
  e504: "Carbonates de magnésium", e509: "Chlorure de calcium", e516: "Sulfate de calcium", e524: "Hydroxyde de sodium", e551: "Dioxyde de silicium", e575: "Glucono-delta-lactone", e938: "Argon", e941: "Azote", e948: "Oxygène", e965: "Maltitol", e967: "Xylitol",
  e1404: "Amidon oxydé", e1412: "Phosphate de diamidon", e1414: "Phosphate de diamidon acétylé", e1420: "Amidon acétylé", e1422: "Adipate de diamidon acétylé", e1442: "Phosphate de diamidon hydroxypropylé", e1450: "Octényl succinate d'amidon sodique" };
const SWEETENERS = ["e950", "e951", "e952", "e954", "e955", "e960", "e961", "e962"];

/* ---------- Nutriments pour 100 g (feux tricolores) ---------- */
const NUTRI_LIMITS = {
  food:  { fat: [3, 17.5], sat: [1.5, 5], sug: [5, 22.5], salt: [0.3, 1.5] },
  drink: { fat: [1.5, 8.75], sat: [0.75, 2.5], sug: [2.5, 11.25], salt: [0.3, 0.75] }
};
function isDrink(p) { return p.drink != null ? !!p.drink : (p.cats || []).some(c => /beverages|drinks|waters|juices|sodas/.test(c)); }
function level(p, key) {
  const v = p.n && p.n[key]; if (v == null || isNaN(v)) return null;
  const lim = NUTRI_LIMITS[isDrink(p) ? "drink" : "food"][key];
  return v <= lim[0] ? "low" : v <= lim[1] ? "mid" : "high";
}
// Énergie : repères Yuka-like, pour situer l'apport (kcal/100 g)
function kcalLevel(p) { const v = p.n && p.n.kcal; if (v == null) return null; const d = isDrink(p); return v <= (d ? 20 : 160) ? "low" : v <= (d ? 60 : 400) ? "mid" : "high"; }
function protLevel(p) { const v = p.n && p.n.prot; if (v == null) return null; return v >= 8 ? "good" : v >= 4 ? "ok" : "none"; }
function fibLevel(p) { const v = p.n && p.n.fib; if (v == null) return null; return v >= 6 ? "good" : v >= 3 ? "ok" : "none"; }

/* ---------- Additifs du produit ---------- */
function additivesOf(p) {
  const codes = [...new Set((p.add || []).map(c => c.replace(/^en:/, "").toLowerCase()))];
  // OFF liste à la fois « e322 » et « e322i » : on garde le code principal
  const kept = codes.filter(k => { const b = k.replace(/(i{1,3}|iv|vi?)$/, ""); return b === k || !codes.includes(b); });
  return kept.map(k => {
    const base = ADDITIVES[k] || ADDITIVES[k.replace(/(i{1,3}|iv|vi?)$/, "")] || ADDITIVES[k.replace(/[a-z]$/, "")];
    const safe = SAFE[k] || SAFE[k.replace(/(i{1,3}|iv|vi?)$/, "")] || SAFE[k.replace(/[a-z]$/, "")];
    return { code: k.toUpperCase(), name: base ? base.n : safe || "", risk: base ? base.r : "none", tags: base ? base.t : [], note: base && base.note };
  });
}

/* ---------- Mots-clés dans les ingrédients et catégories ---------- */
function text(p) { return ((p.ing || "") + " " + (p.name || "") + " " + (p.cats || []).join(" ")).toLowerCase(); }
function has(p, re) { return re.test(text(p)); }
function cat(p, re) { return (p.cats || []).some(c => re.test(c)); }

/* ---------- Grossesse et moins de 2 ans ----------
   verdict : ok (conseillé, sans risque), mod (avec modération), no (déconseillé) */
function pregnancy(p) {
  const why = [], adds = additivesOf(p).map(a => a.code.toLowerCase());
  let v = "ok";
  const no = r => { v = "no"; why.push(r); }, mod = r => { if (v === "ok") v = "mod"; why.push(r); };
  if (cat(p, /alcoholic|wines|beers|spirits|liqueurs|ciders/) || has(p, /\balcool\b|\bvin\b|\brhum\b|\bbière\b/)) no("Contient de l'alcool : zéro alcool pendant la grossesse.");
  if (has(p, /lait cru|raw milk|au lait cru/)) no("Fromage ou produit au lait cru : risque de listériose.");
  if (cat(p, /smoked-salmons|smoked-fish|sushi|raw-fish|tarama|surimi-raw/) || has(p, /saumon fumé|truite fumée|poisson cru|sushi/)) no("Poisson cru ou fumé : risque de listériose.");
  if (cat(p, /dry-sausages|dried-hams|raw-hams|saucissons|rillettes|pates-de-campagne|foie-gras|terrines/) || has(p, /jambon cru|saucisson|chorizo|viande crue|carpaccio|rillettes|foie gras/)) no("Charcuterie crue, pâté ou foie gras : risques de listériose ou de toxoplasmose.");
  if (has(p, /\bfoie\b|liver/) && v !== "no") no("Contient du foie : excès de vitamine A, à éviter pendant la grossesse.");
  if (has(p, /réglisse|reglisse|liquorice|licorice/)) no("Réglisse : la glycyrrhizine est déconseillée pendant la grossesse.");
  if (cat(p, /energy-drinks/) || has(p, /taurine|guarana/)) no("Boisson énergisante : trop de caféine et de stimulants.");
  if (cat(p, /coffees|teas/) || has(p, /caféine|caffeine|\bcafé\b/)) mod("Contient de la caféine : 200 mg par jour maximum (environ 2 tasses de café).");
  if (cat(p, /tunas|swordfish|sharks/) || has(p, /\bthon\b|espadon|requin/)) mod("Poisson prédateur (thon…) : mercure, à limiter.");
  if (cat(p, /soy|tofu/) || has(p, /\bsoja\b|\bsoy\b/)) mod("Soja : phyto-œstrogènes, une portion par jour au plus selon l'ANSES.");
  if (adds.some(a => SWEETENERS.includes(a))) mod("Édulcorants : à limiter.");
  if (adds.some(a => /^e25[0-2]$|^e249$/.test(a))) mod("Nitrites : à limiter.");
  if (level(p, "salt") === "high" || level(p, "sug") === "high") mod("Très salé ou très sucré : à consommer avec modération.");
  if (!why.length) why.push("Rien de particulier à signaler pour la grossesse.");
  return { v, why };
}
function baby(p) {
  const why = [], adds = additivesOf(p);
  let v = "ok";
  const no = r => { v = "no"; why.push(r); }, mod = r => { if (v === "ok") v = "mod"; why.push(r); };
  if (cat(p, /alcoholic|wines|beers|spirits/) || has(p, /\balcool\b/)) no("Alcool : interdit aux enfants.");
  if (cat(p, /honeys/) || has(p, /\bmiel\b|\bhoney\b/)) no("Miel : interdit avant 1 an (risque de botulisme infantile).");
  if (has(p, /lait cru|raw milk/)) no("Lait cru : déconseillé avant 5 ans.");
  if (cat(p, /energy-drinks|sodas|colas/) || has(p, /caféine|caffeine|taurine/)) no("Sodas, caféine et boissons énergisantes : à éviter chez les tout-petits.");
  if (adds.some(a => SWEETENERS.includes(a.code.toLowerCase()))) no("Édulcorants : déconseillés chez l'enfant de moins de 3 ans.");
  if (adds.some(a => a.tags.includes("child"))) no("Colorants pouvant nuire à l'attention des enfants (mention obligatoire en Europe).");
  if (cat(p, /plant-based-milks|milk-substitutes|plant-based-beverages/) && !cat(p, /baby|infant/)) no("Boisson végétale : ne remplace pas le lait infantile avant 3 ans.");
  if (cat(p, /nuts$|peanuts|whole-nuts/) && !has(p, /purée|beurre|poudre/)) no("Fruits à coque entiers : risque de fausse route avant 5 ans.");
  if (has(p, /saumon fumé|poisson cru|sushi|jambon cru|saucisson|viande crue/)) no("Viande, charcuterie ou poisson crus : à éviter chez le jeune enfant.");
  if (level(p, "salt") === "high" || (p.n && p.n.salt > 0.3 && !cat(p, /baby/))) mod("Salé : pas de sel ajouté avant 1 an, très peu ensuite.");
  if (level(p, "sug") === "high") mod("Très sucré : sucres ajoutés à éviter avant 2 ans.");
  if (p.nova === 4) mod("Aliment ultra-transformé : à limiter chez le tout-petit.");
  if (adds.some(a => a.risk === "high")) no("Contient un additif à risque.");
  if (!why.length) why.push(cat(p, /baby/) ? "Produit conçu pour les bébés." : "Rien de particulier à signaler, en respectant la diversification selon l'âge.");
  return { v, why };
}

/* ---------- Régimes et préférences ---------- */
const DIETS = ["vegetarian", "vegan", "glutenfree", "lactosefree", "palmfree", "porkfree", "soyfree", "sulfitefree", "nutfree", "peanutfree"];
function dietChecks(p) {
  const ana = p.ana || [], all = (p.all || []).concat(p.tr || []).join(" "), txt = text(p);
  const yes = "yes", no = "no", unk = "unknown";
  const from = (pos, neg) => ana.includes(pos) ? yes : ana.includes(neg) ? no : unk;
  return {
    vegetarian: from("en:vegetarian", "en:non-vegetarian"),
    vegan: from("en:vegan", "en:non-vegan"),
    glutenfree: /en:gluten/.test(all) ? no : (p.lab || []).some(l => /gluten-free|sans-gluten/.test(l)) ? yes : (p.ing ? yes : unk),
    lactosefree: /en:milk/.test(all) ? no : (p.lab || []).some(l => /lactose-free|sans-lactose/.test(l)) ? yes : (p.ing ? yes : unk),
    palmfree: ana.includes("en:palm-oil") ? no : ana.includes("en:palm-oil-free") ? yes : unk,
    porkfree: /porc|pork|lard|jambon|lardons|saindoux|gélatine de porc/.test(txt) ? no : (p.ing ? yes : unk),
    soyfree: /en:soybeans/.test(all) ? no : (p.ing ? yes : unk),
    sulfitefree: /en:sulphur-dioxide-and-sulphites/.test(all) || additivesOf(p).some(a => /^E22[0-8]$/.test(a.code)) ? no : (p.ing ? yes : unk),
    nutfree: /en:nuts/.test(all) ? no : (p.ing ? yes : unk),
    peanutfree: /en:peanuts/.test(all) ? no : (p.ing ? yes : unk)
  };
}

/* ---------- Notes /100 ---------- */
const GRADE = { a: 1, b: 0.8, c: 0.55, d: 0.3, e: 0.1, f: 0 };
function nutritionSub(p) {
  if (p.nss != null && !isNaN(p.nss)) {
    // Score Nutri-Score (≤ -5 excellent … ≥ 19 classe E) ramené entre 0 et 1
    const x = p.nss;
    if (x <= -5) return 1;
    if (x <= 19) return 1 - (x + 5) / 24 * 0.85;
    return Math.max(0, 0.15 - (x - 19) / 11 * 0.15);
  }
  if (p.ns && GRADE[p.ns] != null) return GRADE[p.ns];
  // Sans Nutri-Score : estimation à partir des feux tricolores
  const lv = ["fat", "sat", "sug", "salt"].map(k => level(p, k)).filter(Boolean);
  if (!lv.length) return null;
  const pts = lv.reduce((s, l) => s + (l === "low" ? 1 : l === "mid" ? 0.55 : 0.1), 0) / lv.length;
  return pts;
}
function additivesSub(p) {
  const a = additivesOf(p);
  const high = a.filter(x => x.risk === "high").length, mod = a.filter(x => x.risk === "mod").length, low = a.filter(x => x.risk === "low").length;
  return { s: Math.max(0, 1 - high * 0.6 - mod * 0.2 - low * 0.05), high, mod, low };
}
const NOVA = { 1: 1, 2: 0.85, 3: 0.6, 4: 0.25 };
const DEFAULT_WEIGHTS = { nutrition: 3, additives: 2, processing: 1, environment: 1, organic: 1 };
const PRESETS = {
  balanced: { nutrition: 3, additives: 2, processing: 1, environment: 1, organic: 1 },
  health: { nutrition: 3, additives: 3, processing: 2, environment: 0, organic: 0 },
  planet: { nutrition: 2, additives: 2, processing: 1, environment: 3, organic: 2 },
  natural: { nutrition: 2, additives: 3, processing: 3, environment: 1, organic: 2 }
};
function isOrganic(p) { return (p.lab || []).some(l => /organic|bio\b|en:eu-organic|ab-agriculture-biologique/.test(l)); }
function scoreFood(p, w) {
  w = w || DEFAULT_WEIGHTS;
  const parts = [];
  const nut = nutritionSub(p); if (nut != null && w.nutrition) parts.push(["nutrition", nut, w.nutrition]);
  const ad = additivesSub(p); if (w.additives && (p.add || p.ing)) parts.push(["additives", ad.s, w.additives]);
  if (w.processing && NOVA[p.nova]) parts.push(["processing", NOVA[p.nova], w.processing]);
  const eco = p.eco && GRADE[p.eco]; if (w.environment && eco != null) parts.push(["environment", eco, w.environment]);
  if (w.organic) parts.push(["organic", isOrganic(p) ? 1 : 0, w.organic]);
  if (!parts.length || nut == null) return { score: null, parts };
  let score = Math.round(100 * parts.reduce((s, x) => s + x[1] * x[2], 0) / parts.reduce((s, x) => s + x[2], 0));
  // Un additif à risque élevé plafonne la note à 49 (si les additifs comptent pour l'utilisateur)
  if (w.additives && ad.high) score = Math.min(score, 49);
  return { score, parts };
}
function scoreClass(s) { return s == null ? "unk" : s >= 75 ? "excellent" : s >= 50 ? "good" : s >= 25 ? "poor" : "bad"; }

/* ---------- Cosmétiques ---------- */
const COSMETIC = [
  // [motif dans la liste INCI, risque, étiquettes, nom affiché]
  [/butylparaben/, "high", ["ed"], "Butylparabène"],
  [/propylparaben/, "high", ["ed"], "Propylparabène"],
  [/isobutylparaben|isopropylparaben/, "high", ["ed"], "Parabène interdit"],
  [/\bbha\b|butylated hydroxyanisole/, "high", ["ed", "cancer2B"], "BHA"],
  [/triclosan/, "high", ["ed"], "Triclosan"],
  [/triclocarban/, "high", ["ed"], "Triclocarban"],
  [/benzophenone-3|oxybenzone/, "high", ["ed"], "Benzophénone-3 (filtre UV)"],
  [/ethylhexyl methoxycinnamate|octinoxate/, "high", ["ed"], "Octinoxate (filtre UV)"],
  [/homosalate/, "high", ["ed"], "Homosalate (filtre UV)"],
  [/4-methylbenzylidene camphor/, "high", ["ed"], "4-MBC (filtre UV)"],
  [/cyclotetrasiloxane/, "high", ["ed"], "Cyclotétrasiloxane (D4)"],
  [/cyclopentasiloxane/, "mod", ["ed"], "Cyclopentasiloxane (D5)"],
  [/butylphenyl methylpropional|lilial/, "high", ["repro"], "Lilial (interdit, reprotoxique)"],
  [/dmdm hydantoin|quaternium-15|imidazolidinyl urea|diazolidinyl urea|bronopol|2-bromo-2-nitropropane/, "high", ["cancer1"], "Libérateur de formaldéhyde"],
  [/\bformaldehyde\b/, "high", ["cancer1"], "Formaldéhyde"],
  [/resorcinol/, "high", ["ed"], "Résorcinol"],
  [/\btalc\b/, "mod", ["cancer2A"], "Talc"],
  [/methylisothiazolinone|methylchloroisothiazolinone/, "mod", ["allergen"], "Isothiazolinone (allergène)"],
  [/\bbht\b|butylated hydroxytoluene/, "mod", ["ed"], "BHT"],
  [/octocrylene/, "mod", ["ed"], "Octocrylène (filtre UV)"],
  [/ethylparaben|methylparaben/, "low", [], "Parabène court"],
  [/sodium lauryl sulfate/, "mod", ["irritant"], "Sodium lauryl sulfate (irritant)"],
  [/sodium laureth sulfate/, "low", ["irritant"], "Sodium laureth sulfate"],
  [/\bpeg-\d+/, "low", [], "PEG"],
  [/aluminum chlorohydrate|aluminium chlorohydrate|aluminum zirconium/, "mod", [], "Sel d'aluminium"],
  [/paraffinum liquidum|mineral oil|petrolatum/, "low", [], "Huile minérale"],
  [/phenoxyethanol/, "low", [], "Phénoxyéthanol"],
  [/\bparfum\b|\bfragrance\b/, "low", ["allergen"], "Parfum"],
  [/titanium dioxide.*nano|\[nano\]/, "mod", [], "Nanoparticules"],
  [/\bbenzyl salicylate|limonene|linalool|citral|geraniol|eugenol|coumarin|cinnamal/, "low", ["allergen"], "Allergène de parfum"]
];
function cosmeticIngredients(p) {
  const C = root.CosmeticDB;
  if (C) {
    // Base détaillée : un résultat par ingrédient à risque (faible, modéré, fort), sans doublon
    const seen = new Set(), found = [];
    for (const x of C.composition(p.inci || "")) {
      if (!x.entry || x.entry.lv === "none" || seen.has(x.entry.name)) continue;
      seen.add(x.entry.name); found.push({ name: x.entry.name, risk: x.entry.lv, tags: x.entry.tags });
    }
    return found;
  }
  const list = (p.inci || "").toLowerCase();
  const found = [];
  for (const [re, r, tags, name] of COSMETIC) if (re.test(list)) found.push({ name, risk: r, tags });
  return found;
}
function scoreCosmetic(p) {
  const f = cosmeticIngredients(p);
  if (!p.inci) return { score: null, found: f };
  let s = 100 - f.filter(x => x.risk === "mod").length * 12 - f.filter(x => x.risk === "low").length * 4;
  if (f.some(x => x.risk === "high")) s = Math.min(s, 25 - Math.max(0, f.filter(x => x.risk === "high").length - 1) * 8);
  return { score: Math.max(0, Math.round(s)), found: f };
}

root.FoodRules = { ADDITIVES, NUTRI_LIMITS, isDrink, level, kcalLevel, protLevel, fibLevel, additivesOf, pregnancy, baby, DIETS, dietChecks,
  scoreFood, scoreClass, DEFAULT_WEIGHTS, PRESETS, isOrganic, nutritionSub, additivesSub, scoreCosmetic, cosmeticIngredients };
})(typeof window !== "undefined" ? window : globalThis);
