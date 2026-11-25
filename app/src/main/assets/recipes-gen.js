// Grande base de recettes : ingrédients supplémentaires, recettes du monde écrites à la main (recipes-hand.js)
// et familles de recettes déclinées (veloutés, salades-repas, poêlées, curries, papillotes, tajines, bowls…).
// Chaque recette garde le même format que kitchen-data.js ; le « w » indique la cuisine d'origine.
(function (root) {
"use strict";
const K = root.KitchenData;

/* ---------- Ingrédients supplémentaires (pour 100 g) ---------- */
Object.assign(K.ING, {
  colin: ["Filets de colin", "po", 80, 17, 0, 1, 0, "f"], truite: ["Filets de truite", "po", 140, 20, 0, 6.5, 0, "f"], dorade: ["Filets de dorade", "po", 120, 20, 0, 4, 0, "f"],
  maquereau: ["Filets de maquereau", "po", 200, 19, 0, 14, 0, "f"], calamar: ["Anneaux de calamar", "po", 80, 16, 1, 1, 0, "f"], thonfrais: ["Thon frais", "po", 130, 24, 0, 4, 0, "f"],
  sardinef: ["Sardines fraîches", "po", 160, 21, 0, 9, 0, "f"],
  agneau: ["Agneau (épaule)", "vi", 230, 17, 0, 18, 0, "m"], magret: ["Magret de canard", "vi", 200, 19, 0, 13, 350, "m"], veau: ["Veau à mijoter", "vi", 110, 21, 0, 3, 0, "m"],
  saucisse: ["Saucisses", "vi", 290, 15, 1, 25, 100, "m"], merguez: ["Merguez", "vi", 300, 15, 2, 26, 60, "m"], chorizo: ["Chorizo", "vi", 455, 24, 2, 39, 0, "mp"],
  chou: ["Chou vert", "fl", 25, 1.3, 5.8, 0.1, 1000], chourouge: ["Chou rouge", "fl", 31, 1.4, 7, 0.2, 1000], kale: ["Chou kale", "fl", 35, 2.9, 4.4, 1.5, 0],
  celerirave: ["Céleri-rave", "fl", 42, 1.5, 9, 0.3, 800], navet: ["Navets", "fl", 28, 0.9, 6, 0.1, 150], panais: ["Panais", "fl", 75, 1.2, 18, 0.3, 200],
  potiron: ["Potiron ou potimarron", "fl", 26, 1, 6.5, 0.1, 0], asperge: ["Asperges", "fl", 20, 2.2, 3.9, 0.1, 0], artichaut: ["Cœurs d'artichaut (boîte)", "ep", 30, 2, 5, 0.2, 0],
  blette: ["Blettes", "fl", 19, 1.8, 3.7, 0.2, 0], endive: ["Endives", "fl", 17, 1.2, 3.4, 0.1, 120], radis: ["Radis", "fl", 16, 0.7, 3.4, 0.1, 0],
  harblanc: ["Haricots blancs (boîte, égouttés)", "ep", 100, 7, 14, 0.5, 0], edamame: ["Edamame (fèves de soja)", "su", 120, 11, 9, 5, 0], pakchoi: ["Pak choï", "fl", 13, 1.5, 2.2, 0.2, 150],
  germes: ["Germes de soja", "fl", 30, 3, 6, 0.2, 0], olive: ["Olives", "ep", 145, 1, 4, 15, 0], capre: ["Câpres", "co", 25, 2.4, 5, 0.9, 0], citronconfit: ["Citrons confits", "ep", 30, 0.5, 6, 0.3, 0],
  pruneau: ["Pruneaux", "es", 240, 2.2, 57, 0.4, 0], abricotsec: ["Abricots secs", "es", 240, 3.4, 55, 0.5, 0], raisinsec: ["Raisins secs", "es", 300, 3, 72, 0.5, 0], datte: ["Dattes", "es", 280, 2.5, 67, 0.4, 0],
  pignon: ["Pignons de pin", "es", 670, 14, 13, 68, 0], noisette: ["Noisettes", "es", 630, 15, 7, 61, 0], cacahuete: ["Cacahuètes", "es", 590, 26, 9, 49, 0], sesame: ["Graines de sésame", "es", 570, 18, 10, 50, 0],
  tahini: ["Purée de sésame (tahini)", "ep", 600, 17, 20, 54, 0], piment: ["Piment", "fl", 40, 1.9, 9, 0.4, 0], harissa: ["Harissa", "co", 70, 3, 10, 2, 0], patecurry: ["Pâte de curry", "co", 120, 2, 12, 7, 0],
  pita: ["Pains pita", "bo", 275, 9, 55, 1.2, 60, "g"], nouilleble: ["Nouilles de blé", "ep", 360, 12, 72, 1.5, 0, "g"], polenta: ["Polenta", "ep", 360, 8, 78, 1, 0], gnocchi: ["Gnocchis", "cr", 150, 3.5, 33, 0.3, 0, "g"],
  sarrasin: ["Sarrasin", "ep", 340, 13, 70, 3, 0], pfeuilletee: ["Pâte feuilletée", "cr", 410, 6, 40, 25, 230, "gd"], brick: ["Feuilles de brick", "ep", 300, 8, 62, 2, 0, "g"],
  comte: ["Comté râpé", "cr", 410, 28, 0, 33, 0, "d"], cheddar: ["Cheddar", "cr", 400, 25, 1, 33, 0, "d"], bleu: ["Bleu (roquefort, gorgonzola)", "cr", 350, 21, 0, 29, 0, "dp"],
  mascarpone: ["Mascarpone", "cr", 430, 5, 4, 44, 0, "d"], ygrec: ["Yaourt à la grecque", "cr", 95, 6, 4, 6, 0, "d"], skyr: ["Skyr", "cr", 60, 10, 4, 0.2, 0, "d"],
  myrtille: ["Myrtilles", "fl", 57, 0.7, 14, 0.3, 0], peche: ["Pêches", "fl", 40, 0.9, 9.5, 0.3, 150], abricot: ["Abricots", "fl", 45, 0.9, 10, 0.4, 45], prune: ["Prunes", "fl", 46, 0.7, 11, 0.3, 40],
  cerise: ["Cerises", "fl", 60, 1, 14, 0.3, 0], ananas: ["Ananas", "fl", 50, 0.5, 12, 0.1, 1000], rhubarbe: ["Rhubarbe", "fl", 21, 0.9, 4.5, 0.2, 0], figue: ["Figues", "fl", 75, 0.8, 19, 0.3, 50],
  melon: ["Melon", "fl", 34, 0.8, 8, 0.2, 1000], pasteque: ["Pastèque", "fl", 30, 0.6, 7.5, 0.2, 0], framboise: ["Framboises", "fl", 45, 1.2, 9, 0.7, 0], clementine: ["Clémentines", "fl", 47, 0.9, 12, 0.2, 70],
  cacao: ["Cacao en poudre non sucré", "es", 380, 20, 15, 22, 0], erable: ["Sirop d'érable", "es", 260, 0, 67, 0, 0], maizena: ["Fécule de maïs", "es", 360, 0.3, 88, 0, 0],
  amandepoudre: ["Poudre d'amande", "es", 600, 21, 9, 50, 0], cocorapee: ["Noix de coco râpée", "es", 660, 6, 7, 65, 0], beurrecacahuete: ["Beurre de cacahuète", "es", 600, 25, 15, 50, 0],
  confiture: ["Confiture", "es", 250, 0.4, 62, 0.1, 0], chia: ["Graines de chia", "es", 490, 17, 8, 31, 0], gelatine: ["Gélatine ou agar-agar", "es", 330, 85, 0, 0, 0],
  oignonrouge: ["Oignons rouges", "fl", 40, 1.1, 9.3, 0.1, 100], ciboulette: ["Ciboulette", "fl", 30, 3, 4, 0.7, 0], tomcerise: ["Tomates cerises", "fl", 20, 0.9, 4, 0.2, 0],
  pois: ["Pois cassés", "ep", 340, 24, 50, 1.5, 0], feve: ["Fèves (surgelées)", "su", 70, 6, 8, 0.5, 0], semoulefine: ["Vermicelles de blé", "ep", 360, 12, 73, 1.5, 0, "g"],
  pdtgrenaille: ["Pommes de terre grenaille", "fl", 77, 2, 17, 0.1, 0], mozzarellar: ["Mozzarella râpée", "cr", 280, 20, 2, 21, 0, "d"], cremecoco: ["Crème de coco", "ep", 200, 2, 4, 20, "ml"],
  vinblanc: ["Bouillon de légumes (en remplacement du vin)", "co", 5, 0.3, 0.5, 0.1, "ml"]
});

/* ---------- Outils ---------- */
const out = [];
let seq = 0;
const slug = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const fixName = n => n.replace(/\baux (brocoli|chou-fleur|chou kale|chou rouge|chou|fenouil|potiron|butternut|céleri-rave|pak choï|maïs)(?=[ ,]|$)/g, "au $1").replace(/\b(de|De) ([aeiouéèêœ])/g, (m, d, v) => (d === "De" ? "D'" : "d'") + v);
function add(n, w, c, t, s, tg, i, e) {
  n = fixName(n);
  const id = "g" + (++seq).toString(36) + "-" + slug(n);
  out.push({ id, n, w, c, t, s, tg: tg || [], i: i.filter(x => x && x[1] > 0 || (x && x[0] === "sel")), e });
}
function parseIng(str) { return str.trim().split(/\s+/).map(x => { const [id, q] = x.split(":"); return [id, q == null ? 0 : +q]; }); }
const pick = (arr, i) => arr[i % arr.length];

/* ---------- Légumes (nom, « de/d' », quantité pour 4) ---------- */
const VEG = {
  carotte: ["carottes", "de carottes", 600], potiron: ["potiron", "de potiron", 900], butternut: ["butternut", "de butternut", 900], poireau: ["poireaux", "de poireaux", 600],
  courgette: ["courgettes", "de courgettes", 700], brocoli: ["brocoli", "de brocoli", 600], choufleur: ["chou-fleur", "de chou-fleur", 700], tomate: ["tomates", "de tomates", 800],
  petitspois: ["petits pois", "de petits pois", 500], epinard: ["épinards", "d'épinards", 400], champi: ["champignons", "de champignons", 500], celerirave: ["céleri-rave", "de céleri-rave", 600],
  panais: ["panais", "de panais", 600], patate: ["patates douces", "de patates douces", 700], navet: ["navets", "de navets", 600], chou: ["chou", "de chou", 600], asperge: ["asperges", "d'asperges", 500],
  fenouil: ["fenouil", "de fenouil", 600], betterave: ["betteraves", "de betteraves", 600], poivron: ["poivrons", "de poivrons", 600], aubergine: ["aubergines", "d'aubergines", 600],
  hv: ["haricots verts", "de haricots verts", 500], kale: ["chou kale", "de chou kale", 300], blette: ["blettes", "de blettes", 500], pakchoi: ["pak choï", "de pak choï", 450],
  germes: ["germes de soja", "de germes de soja", 300], oignon: ["oignons", "d'oignons", 300], endive: ["endives", "d'endives", 500]
};
const vn = id => VEG[id][0];
const andList = ids => ids.length === 1 ? vn(ids[0]) : ids.slice(0, -1).map(vn).join(", ") + " et " + vn(ids[ids.length - 1]);
const vegIng = (ids, total) => ids.map(id => [id, Math.round(total / ids.length)]);

/* ---------- 1. Soupes et veloutés ---------- */
const SOUP_VEG = ["carotte", "potiron", "butternut", "poireau", "courgette", "brocoli", "choufleur", "tomate", "petitspois", "epinard", "champi", "celerirave", "panais", "patate", "navet", "chou", "asperge", "fenouil", "betterave", "poivron", "kale", "blette"];
SOUP_VEG.forEach((v, k) => {
  const [name, de, q] = VEG[v];
  const base = [[v, q], ["oignon", 100], ["bouillon", 10], ["sel", 0]];
  add("Velouté " + de, "fr", "soupe", 35, 4, ["eq", "budget"], [...base, ["pdt", 200], ["cremel", 60], ["huile", 10]],
    ["Épluche et coupe les " + name + " et la pomme de terre en morceaux.", "Fais revenir l'oignon émincé dans l'huile, ajoute les légumes et couvre de bouillon (environ 80 cl).", "Laisse cuire 25 min, puis mixe avec la crème légère. Rectifie l'assaisonnement."]);
  add("Soupe " + de + " au lait de coco et curry", "in", "soupe", 30, 4, ["eq"], [...base, ["coco", 150], ["epices", 5], ["gingembre", 5], ["colza", 10]],
    ["Fais revenir l'oignon et le gingembre dans l'huile avec le curry.", "Ajoute les " + name + " en morceaux, couvre de bouillon et laisse cuire 20 à 25 min.", "Mixe avec le lait de coco et sers bien chaud."]);
  add("Soupe " + de + " et lentilles corail", "fr", "soupe", 35, 4, ["eq", "budget"], [[v, Math.round(q * .75)], ["corail", 120], ["oignon", 100], ["epices", 4], ["bouillon", 10], ["huile", 10], ["sel", 0]],
    ["Fais revenir l'oignon dans l'huile avec le cumin.", "Ajoute les " + name + " en morceaux, les lentilles rincées et 1 litre de bouillon.", "Laisse cuire 25 min, mixe et ajoute un filet de citron si tu veux."]);
  add("Velouté " + de + " au chèvre frais", "fr", "soupe", 35, 4, ["eq"], [...base, ["pdt", 150], ["chevre", 100], ["huile", 10]],
    ["Fais revenir l'oignon dans l'huile, ajoute les " + name + " et la pomme de terre en morceaux.", "Couvre de bouillon et laisse cuire 25 min.", "Mixe avec le chèvre frais et poivre généreusement."]);
});

/* ---------- 2. Salades-repas ---------- */
const SAL_BASE = [["riz", 200, "de riz", "Fais cuire le riz, rince-le à l'eau froide et égoutte-le."], ["quinoa", 200, "de quinoa", "Fais cuire le quinoa 12 min et laisse-le refroidir."],
  ["boulgour", 200, "de boulgour", "Fais gonfler le boulgour 10 min dans l'eau bouillante salée, égoutte et laisse refroidir."], ["patesc", 240, "de pâtes complètes", "Fais cuire les pâtes, rafraîchis-les sous l'eau froide."],
  ["lentille", 200, "de lentilles", "Fais cuire les lentilles 20 min, égoutte et laisse tiédir."], ["pchiche", 500, "de pois chiches", "Rince et égoutte les pois chiches."],
  ["pdt", 800, "de pommes de terre", "Fais cuire les pommes de terre 20 min à l'eau, puis coupe-les en morceaux."], ["semoule", 200, "de semoule", "Prépare la semoule avec la même quantité d'eau bouillante salée et égrène-la."],
  ["harblanc", 500, "de haricots blancs", "Rince et égoutte les haricots blancs."], ["patate", 800, "de patates douces rôties", "Rôtis les patates douces en cubes 25 min au four à 210 °C."],
  ["salade", 250, "verte", "Lave et essore la salade."], ["sarrasin", 200, "de sarrasin", "Fais cuire le sarrasin 12 min, égoutte et laisse refroidir."]];
const SAL_PROT = [["thon", 280, "au thon", "le thon émietté"], ["poulet", 450, "au poulet", "le poulet cuit à la poêle et coupé en lanières"], ["oeuf", 330, "aux œufs durs", "les œufs cuits 10 min et coupés en quartiers"],
  ["feta", 200, "à la feta", "la feta en dés"], ["mozza", 250, "à la mozzarella", "la mozzarella en morceaux"], ["saumon", 400, "au saumon", "le saumon cuit et effeuillé"],
  ["tofu", 400, "au tofu grillé", "le tofu doré à la poêle"], ["crevette", 300, "aux crevettes", "les crevettes"], ["sardine", 250, "aux sardines", "les sardines"],
  ["chevre", 200, "au chèvre", "le chèvre émietté"], ["jambon", 200, "au jambon", "le jambon en dés"], ["pchiche", 400, "aux pois chiches", "les pois chiches"],
  ["maquereau", 300, "au maquereau", "le maquereau cuit et effeuillé"], ["dinde", 450, "à la dinde", "la dinde cuite et émincée"]];
const SAL_VEG = [[["tomate", 360], ["concombre", 300]], [["poivron", 300], ["mais", 150]], [["carotte", 200], ["radis", 150]], [["avocat", 300], ["tomcerise", 250]],
  [["courgette", 300], ["poivron", 200]], [["concombre", 300], ["radis", 120]], [["tomcerise", 300], ["salade", 80]]];
const VNAME = { tomate: "tomates", concombre: "concombre", poivron: "poivron", mais: "maïs", carotte: "carottes", radis: "radis", avocat: "avocat", tomcerise: "tomates cerises", courgette: "courgettes grillées", salade: "salade" };
SAL_BASE.forEach((b, i) => SAL_PROT.forEach((p, j) => {
  if (b[0] === p[0]) return;
  const veg = pick(SAL_VEG, i + j);
  const name = "Salade " + b[2] + " " + p[2] + ", " + VNAME[veg[0][0]] + " et " + VNAME[veg[1][0]];
  const w = ["feta", "pchiche"].includes(p[0]) || ["boulgour", "semoule"].includes(b[0]) ? "med" : "fr";
  add(name, w, "plat", 25, 4, ["eq"], [[b[0], b[1]], [p[0], p[1]], ...veg, ["herbes", 10], ["huile", 30], ["vinaigre", 10], ["sel", 0]],
    [b[3], "Coupe " + VNAME[veg[0][0]] + " et " + VNAME[veg[1][0]] + " en morceaux.", "Mélange avec " + p[3] + ", les herbes, l'huile, le vinaigre, sel et poivre. Sers frais."]);
}));

/* ---------- 3. Poêlées complètes ---------- */
const POE_PROT = [["poulet", 500, "Poulet sauté", "m"], ["dinde", 500, "Dinde sautée", "f"], ["porc", 500, "Porc sauté", "m"], ["boeuf", 500, "Bœuf sauté", "m"], ["saumon", 520, "Saumon poêlé", "m"],
  ["cabillaud", 600, "Cabillaud poêlé", "m"], ["crevette", 400, "Crevettes sautées", "fp"], ["tofu", 400, "Tofu sauté", "m"], ["pchiche", 500, "Pois chiches sautés", "mp"], ["colin", 600, "Colin poêlé", "m"]];
const POE_VEG = [["courgette", "poivron"], ["brocoli", "carotte"], ["hv", "champi"], ["poireau", "carotte"], ["choufleur", "petitspois"], ["epinard", "champi"], ["aubergine", "tomate"],
  ["fenouil", "courgette"], ["asperge", "petitspois"], ["chou", "carotte"], ["patate", "epinard"], ["poivron", "oignon"], ["blette", "tomate"], ["kale", "champi"],
  ["courgette", "champi"], ["brocoli", "poivron"], ["hv", "tomate"], ["navet", "carotte"], ["endive", "champi"], ["potiron", "epinard"]];
const STARCH = [["rizc", 240, "riz complet", "Fais cuire le riz complet (25 min)."], ["quinoa", 240, "quinoa", "Fais cuire le quinoa 12 min."], ["pdt", 700, "pommes de terre vapeur", "Fais cuire les pommes de terre à la vapeur (20 min)."],
  ["semoule", 240, "semoule", "Prépare la semoule à l'eau bouillante salée."], ["patesc", 300, "pâtes complètes", "Fais cuire les pâtes complètes."], ["boulgour", 240, "boulgour", "Fais cuire le boulgour 12 min."]];
const SPICE = [["herbes de Provence", ["herbes", 8]], ["paprika et ail", ["epices", 4]], ["citron et persil", ["citron", 60]], ["gingembre et sauce soja", ["soja_s", 30]], ["cumin et coriandre", ["epices", 4]]];
POE_PROT.forEach((p, i) => POE_VEG.forEach((vv, j) => {
  const st = pick(STARCH, i + j), sp = pick(SPICE, i * 3 + j);
  const adj = p[3].startsWith("f") ? "aux" : "aux";
  const name = p[2] + " " + adj + " " + vn(vv[0]) + " et " + vn(vv[1]) + ", " + st[2];
  add(name, sp[0].includes("soja") ? "as" : "fr", "plat", 30, 4, ["eq", "rapide"], [[p[0], p[1]], ...vegIng(vv, 700), [st[0], st[1]], sp[1], ["huile", 20], ["ail", 5], ["sel", 0]],
    [st[3], "Coupe les " + vn(vv[0]) + " et les " + vn(vv[1]) + " en morceaux.", "Fais dorer " + p[2].split(" ")[0].toLowerCase().replace("pois", "les pois chiches").replace("crevettes", "les crevettes") + " dans l'huile à feu vif, puis réserve.", "Fais sauter les légumes avec l'ail 8 à 10 min, ajoute l'assaisonnement (" + sp[0] + ") et remets la protéine 2 min. Sers avec " + st[2] + "."]);
}));

/* ---------- 4. Curries ---------- */
const CUR_PROT = [["poulet", 500, "poulet"], ["crevette", 400, "crevettes"], ["cabillaud", 600, "cabillaud"], ["tofu", 400, "tofu"], ["pchiche", 500, "pois chiches"], ["agneau", 500, "agneau"], ["patate", 600, "patate douce"], ["corail", 200, "lentilles corail"]];
const CUR_VEG = ["epinard", "courgette", "choufleur", "brocoli", "petitspois", "poivron", "aubergine", "potiron", "hv", "champi", "carotte", "kale"];
CUR_PROT.forEach((p, i) => CUR_VEG.forEach((v, j) => {
  if (p[0] === v) return;
  const thai = (i + j) % 2 === 1;
  const name = (thai ? "Curry thaï de " : "Curry de ") + p[2] + " " + (v === "epinard" ? "aux épinards" : "aux " + vn(v));
  add(name, thai ? "as" : "in", "plat", 35, 4, ["eq"], [[p[0], p[1]], [v, 450], ["oignon", 100], [thai ? "patecurry" : "epices", thai ? 30 : 8], ["coco", 200], ["concasse", thai ? 0 : 300], ["gingembre", 10], ["ail", 10], ["colza", 15], ["riz", 240], ["sel", 0]],
    ["Fais cuire le riz.", "Fais revenir l'oignon, l'ail et le gingembre dans l'huile, ajoute " + (thai ? "la pâte de curry" : "les épices (curry, curcuma, cumin)") + " 1 min.", "Ajoute " + (p[0] === "corail" ? "les lentilles rincées" : "le " + p[2]) + ", les " + vn(v) + (thai ? "" : ", les tomates") + " et le lait de coco. Laisse mijoter 15 à 20 min.", "Sers avec le riz et de la coriandre fraîche."]);
}));

/* ---------- 5. Woks ---------- */
const WOK_PROT = [["poulet", 450, "poulet"], ["boeuf", 450, "bœuf"], ["porc", 450, "porc"], ["crevette", 400, "crevettes"], ["tofu", 400, "tofu"], ["calamar", 450, "calamars"], ["edamame", 300, "edamame"]];
const WOK_VEG = [["brocoli", "carotte"], ["pakchoi", "champi"], ["poivron", "oignon"], ["hv", "carotte"], ["germes", "courgette"], ["chou", "carotte"], ["brocoli", "poivron"], ["hv", "champi"]];
const WOK_ST = [["nouille", 240, "nouilles de riz"], ["nouilleble", 240, "nouilles"], ["riz", 240, "riz"]];
WOK_PROT.forEach((p, i) => WOK_VEG.forEach((vv, j) => {
  const st = pick(WOK_ST, i + j);
  add("Wok de " + p[2] + " aux " + vn(vv[0]) + " et " + vn(vv[1]) + ", " + st[2], "as", "plat", 25, 4, ["eq", "rapide"], [[p[0], p[1]], ...vegIng(vv, 600), [st[0], st[1]], ["soja_s", 40], ["gingembre", 10], ["ail", 10], ["colza", 15], ["sesame", 10]],
    ["Prépare " + (st[0] === "riz" ? "le riz" : "les nouilles selon le paquet") + ".", "Coupe le " + p[2] + " et les légumes en lanières.", "Saisis le " + p[2] + " à feu très vif dans l'huile, ajoute ail et gingembre, puis les légumes 5 min : ils restent croquants.", "Ajoute " + (st[0] === "riz" ? "le riz" : "les nouilles") + " et la sauce soja, parsème de sésame et sers."]);
}));

/* ---------- 6. Papillotes de poisson ---------- */
const PAP_FISH = [["cabillaud", 600, "cabillaud"], ["saumon", 520, "saumon"], ["colin", 600, "colin"], ["truite", 520, "truite"], ["dorade", 560, "dorade"], ["maquereau", 480, "maquereau"], ["thonfrais", 520, "thon"], ["sardinef", 520, "sardines"]];
const PAP_VEG = [[["courgette", 300], ["tomate", 240]], [["poireau", 300], ["carotte", 200]], [["fenouil", 400]], [["epinard", 400]], [["asperge", 400]], [["poivron", 300], ["oignon", 100]], [["brocoli", 400]], [["hv", 400]], [["tomcerise", 300], ["olive", 40]], [["courgette", 250], ["carotte", 200]], [["blette", 400]], [["champi", 250], ["epinard", 200]], [["poireau", 250], ["champi", 200]], [["chou", 400]], [["potiron", 400]]];
const PAP_ST = [["pdt", 700, "pommes de terre vapeur"], ["riz", 240, "riz"], ["quinoa", 240, "quinoa"]];
PAP_FISH.forEach((f, i) => PAP_VEG.forEach((vv, j) => {
  const st = pick(PAP_ST, i + j), names = vv.map(x => (VEG[x[0]] || [x[0] === "tomcerise" ? "tomates cerises" : "olives"])[0]);
  add("Papillote de " + f[2] + " aux " + names.join(" et ") + ", " + st[2], i % 3 === 2 ? "med" : "fr", "plat", 35, 4, ["eq"], [[f[0], f[1]], ...vv, [st[0], st[1]], ["citron", 80], ["herbes", 10], ["huile", 15], ["sel", 0]],
    ["Préchauffe le four à 200 °C et prépare " + st[2] + ".", "Taille les légumes finement.", "Sur 4 feuilles de papier cuisson, dépose les légumes, le poisson, une rondelle de citron, des herbes, un filet d'huile, sel et poivre. Ferme bien.", "Enfourne 18 à 22 min : le poisson doit être cuit à cœur."]);
}));

/* ---------- 7. Tajines et couscous ---------- */
const TAJ_P = [["cuisse", 1000, "poulet"], ["agneau", 700, "agneau"], ["veau", 700, "veau"], ["boeufhache", 500, "kefta"], ["colin", 700, "poisson"], ["pchiche", 500, "pois chiches"]];
const TAJ_G = [["au citron confit et aux olives", [["citronconfit", 80], ["olive", 80], ["oignon", 200], ["courgette", 400]], true],
  ["aux pruneaux et amandes", [["pruneau", 150], ["amande", 50], ["oignon", 200], ["carotte", 300]], false],
  ["aux légumes", [["courgette", 400], ["carotte", 300], ["navet", 300], ["oignon", 150]], true],
  ["aux abricots secs", [["abricotsec", 120], ["oignon", 200], ["courgette", 300], ["carotte", 200]], false],
  ["aux petits pois et artichauts", [["petitspois", 400], ["artichaut", 300], ["oignon", 150]], true]];
TAJ_P.forEach((p, i) => TAJ_G.forEach((g, j) => {
  add("Tajine " + (p[2] === "kefta" ? "de kefta" : "de " + p[2]) + " " + g[0], "mag", "plat", 70, 4, g[2] ? ["eq"] : [], [[p[0], p[1]], ...g[1], ["epices", 10], ["huile", 20], ["herbes", 10], ["semoule", 240], ["sel", 0]],
    ["Fais revenir " + (p[2] === "kefta" ? "des boulettes de viande hachée épicée" : "le " + p[2]) + " dans l'huile avec l'oignon et les épices (gingembre, curcuma, cumin, ras-el-hanout).", "Ajoute la garniture et un grand verre d'eau, couvre et laisse mijoter " + (["poulet", "poisson", "pois chiches", "kefta"].includes(p[2]) ? "35" : "60") + " min à feu doux.", "Parsème de coriandre et sers avec la semoule."]);
}));
[["Couscous au poulet", "cuisse:900"], ["Couscous à l'agneau", "agneau:700"], ["Couscous royal", "cuisse:500 merguez:240"], ["Couscous aux boulettes", "boeufhache:500"], ["Couscous de poisson", "colin:700"], ["Couscous aux sept légumes", "pchiche:400 potiron:300"]].forEach(([n, p], k) => {
  add(n, "mag", "plat", 75, 4, k === 2 ? [] : ["eq"], [...parseIng(p), ...parseIng("carotte:300 courgette:400 navet:300 oignon:150 concasse:400 pchiche:200 epices:10 huile:20 semoule:280 sel:0")],
    ["Fais revenir la viande ou le poisson avec l'oignon et les épices.", "Ajoute carottes, navets, tomates et 1,5 litre d'eau ; laisse cuire 40 min (15 min pour le poisson).", "Ajoute courgettes et pois chiches, poursuis 15 min.", "Prépare la semoule et sers avec le bouillon et les légumes."]);
});

/* ---------- 8. Bowls ---------- */
const BOWL_G = [["quinoa", 240, "quinoa"], ["rizc", 240, "riz complet"], ["boulgour", 240, "boulgour"], ["sarrasin", 240, "sarrasin"], ["patate", 800, "patate douce rôtie"], ["semoule", 240, "semoule"]];
const BOWL_P = [["pchiche", 400, "pois chiches rôtis"], ["tofu", 400, "tofu mariné"], ["saumon", 400, "saumon"], ["poulet", 450, "poulet grillé"], ["oeuf", 330, "œufs mollets"], ["lentille", 160, "lentilles"],
  ["crevette", 320, "crevettes"], ["feta", 200, "feta"], ["edamame", 300, "edamame"], ["harblanc", 400, "haricots blancs"]];
const BOWL_V = [["avocat:300 carotte:200 concombre:300", "avocat, carotte et concombre"], ["chourouge:250 mangue:300 radis:120", "chou rouge, mangue et radis"], ["epinard:150 tomcerise:300 betterave:200", "épinards, tomates cerises et betterave"],
  ["brocoli:400 edamame:0 carotte:200", "brocoli et carotte"], ["courgette:300 poivron:300 salade:80", "légumes grillés et salade"]];
BOWL_G.forEach((g, i) => BOWL_P.forEach((p, j) => {
  const v = pick(BOWL_V, i + j);
  add("Bowl " + g[2] + ", " + p[2] + ", " + v[1], j % 3 === 1 ? "as" : "ww", "plat", 25, 4, ["eq", "rapide"], [[g[0], g[1]], [p[0], p[1]], ...parseIng(v[0]), ["citron", 50], ["huile", 25], ["sesame", 10], ["sel", 0]],
    ["Prépare la base : " + g[2] + ".", "Prépare " + p[2] + " (à la poêle ou au four selon l'ingrédient).", "Coupe les légumes et compose les bols. Arrose d'huile, de citron et parsème de sésame."]);
}));

/* ---------- 9. Plaques au four et brochettes ---------- */
const OVEN_P = [["cuisse", 1000, "Cuisses de poulet"], ["poulet", 600, "Poulet"], ["saumon", 520, "Saumon"], ["cabillaud", 600, "Cabillaud"], ["saucisse", 400, "Saucisses"], ["tofu", 400, "Tofu"], ["pchiche", 500, "Pois chiches"], ["dinde", 600, "Dinde"]];
const OVEN_V = [["courgette", "poivron", "oignonrouge"], ["patate", "brocoli"], ["carotte", "panais", "oignon"], ["choufleur", "pchiche"], ["potiron", "oignonrouge"], ["pdtgrenaille", "hv"], ["aubergine", "tomate"], ["fenouil", "carotte"]];
const vn2 = id => VEG[id] ? VEG[id][0] : ({ oignonrouge: "oignons rouges", pdtgrenaille: "grenailles", pchiche: "pois chiches" })[id];
OVEN_P.forEach((p, i) => OVEN_V.forEach((vv, j) => {
  if (vv.includes(p[0])) return;
  add(p[2] + " rôti" + (p[2].endsWith("s") ? "s" : "") + " au four, " + vv.map(vn2).join(", "), "fr", "plat", 45, 4, ["eq"], [[p[0], p[1]], ...vv.map(v => [v, Math.round(900 / vv.length)]), ["huile", 25], ["herbes", 8], ["epices", 4], ["ail", 10], ["sel", 0]],
    ["Préchauffe le four à 210 °C.", "Coupe les légumes en morceaux, mélange-les sur la plaque avec l'huile, l'ail, les herbes et les épices.", "Ajoute " + p[2].toLowerCase() + " et enfourne " + (p[0] === "cuisse" ? "45" : "25 à 30") + " min en remuant à mi-cuisson : tout doit être bien cuit et doré."]);
}));
const BRO = [["poulet", "Brochettes de poulet", "yaourt:250 citron:50 epices:6", "mariné au yaourt et aux épices"], ["boeuf", "Brochettes de bœuf", "huile:20 herbes:5 ail:10", "à l'ail et aux herbes"],
  ["crevette", "Brochettes de crevettes", "citron:60 ail:10 huile:15", "au citron"], ["tofu", "Brochettes de tofu", "soja_s:40 gingembre:10 miel:10", "laqué"], ["dinde", "Brochettes de dinde", "epices:6 citron:50 huile:15", "au paprika"],
  ["agneau", "Brochettes d'agneau", "epices:8 menthe:10 huile:15", "au cumin et à la menthe"], ["saumon", "Brochettes de saumon", "citron:50 herbes:5 huile:10", "à l'aneth"], ["boeufhache", "Kefta grillées", "oignon:100 herbes:15 epices:8", "aux herbes"]];
const BRO_S = [["boulgour:240 tomate:360 concombre:300", "taboulé"], ["rizc:240 courgette:400 poivron:300", "légumes grillés et riz complet"], ["pdt:700 salade:150", "pommes de terre et salade verte"], ["semoule:240 carotte:300 courgette:300", "semoule aux légumes"]];
BRO.forEach((b, i) => BRO_S.forEach((s, j) => {
  add(b[1] + " " + b[3] + ", " + s[1], i === 7 || i === 5 ? "mag" : "med", "plat", 35, 4, ["eq"], [[b[0], b[0] === "boeufhache" ? 500 : 550], ...parseIng(b[2]), ...parseIng(s[0]), ["huile", 15], ["sel", 0]],
    ["Coupe la protéine en cubes (ou façonne les kefta) et fais-la mariner au moins 30 min avec l'assaisonnement.", "Prépare l'accompagnement : " + s[1] + ".", "Enfile sur des piques et fais griller 8 à 12 min en retournant : la viande ou le poisson doit être bien cuit."]);
}));

/* ---------- 10. Poissons au four ---------- */
const FISH = [["cabillaud", "Dos de cabillaud"], ["saumon", "Pavé de saumon"], ["colin", "Filet de colin"], ["truite", "Filet de truite"], ["dorade", "Filet de dorade"], ["maquereau", "Filets de maquereau"]];
const FPREP = [["au citron et aux herbes", "citron:80 herbes:10 huile:15", "hv:500 pdt:700"], ["en croûte d'herbes", "chapelure:40 herbes:15 huile:20", "brocoli:500 riz:240"],
  ["sauce vierge", "tomate:300 herbes:15 huile:30 citron:40", "courgette:500 quinoa:240"], ["à la moutarde", "moutarde:30 cremel:100", "epinard:400 rizc:240"], ["à la provençale", "tomate:400 olive:40 herbes:10 huile:20", "aubergine:400 semoule:240"]];
FISH.forEach((f, i) => FPREP.forEach((pr, j) => {
  add(f[1] + " " + pr[0], "fr", "plat", 30, 4, ["eq"], [[f[0], 560], ...parseIng(pr[1]), ...parseIng(pr[2]), ["sel", 0]],
    ["Préchauffe le four à 200 °C et prépare l'accompagnement.", "Dépose le poisson dans un plat, ajoute la préparation (" + pr[0] + ").", "Enfourne 15 à 20 min selon l'épaisseur : le poisson doit être cuit à cœur et se détacher en lamelles."]);
}));

/* ---------- 11. Pâtes, risottos, gnocchis, pizzas ---------- */
const PASTA = [
  ["Pâtes complètes all'arrabbiata", "concasse:600 ail:10 piment:5 huile:20 parmesan:20", 1], ["Pâtes à la puttanesca", "concasse:600 olive:60 capre:20 ail:10 huile:20", 1],
  ["Pâtes carbonara", "lardons:150 oeufcru:165 parmesan:60", 0], ["Pâtes aux légumes du soleil", "courgette:300 aubergine:250 poivron:250 concasse:300 huile:25", 1],
  ["Pâtes aux courgettes, citron et ricotta", "courgette:600 citron:50 ricotta:150 huile:15", 1], ["Pâtes au saumon et aux épinards", "saumon:350 epinard:300 cremel:150", 1],
  ["Pâtes au thon et à la tomate", "thon:280 concasse:600 oignon:100 huile:15", 1], ["Pâtes aux champignons et persil", "champi:500 cremel:120 herbes:15 ail:10", 1],
  ["Orecchiette aux brocolis et à l'ail", "brocoli:600 ail:15 huile:30 parmesan:30 piment:3", 1], ["Pâtes alla norma", "aubergine:600 concasse:600 ricotta:120 huile:30", 1],
  ["Linguine aux crevettes et à l'ail", "crevette:400 ail:15 tomcerise:300 huile:25 herbes:10", 1], ["Penne au poulet et au brocoli", "poulet:400 brocoli:500 cremel:100 parmesan:30", 1],
  ["Pâtes aux petits pois et au jambon", "petitspois:400 jambon:200 cremel:100", 1], ["Pâtes primavera", "asperge:300 petitspois:300 courgette:300 parmesan:30 huile:20", 1],
  ["Bolognaise végétarienne aux lentilles", "corail:150 carotte:200 oignon:100 concasse:700 huile:15", 1], ["Pâtes à la ricotta et aux épinards", "ricotta:250 epinard:500 parmesan:30", 1],
  ["Pâtes au gorgonzola et aux noix", "bleu:150 noix:50 cremel:100", 0], ["Spaghetti cacio e pepe", "parmesan:120 beurre:20", 0], ["Pâtes aux fruits de mer", "moule:1000 crevette:200 calamar:200 concasse:400 ail:10 huile:20", 1],
  ["Pâtes à la sicilienne", "sardinef:400 raisinsec:30 pignon:30 fenouil:300 huile:25", 1], ["Pâtes aux poivrons grillés", "poivron:700 ail:10 huile:25 parmesan:30", 1],
  ["Pâtes caprese tomates cerises et mozzarella", "tomcerise:500 mozza:250 herbes:15 huile:25", 1], ["Pâtes aux poireaux et lardons", "poireau:600 lardons:150 cremel:100", 0],
  ["Pâtes au chou kale et pois chiches", "kale:300 pchiche:400 ail:10 huile:25 parmesan:20", 1], ["Spaghetti all'amatriciana", "lardons:150 concasse:600 oignon:100 parmesan:40", 0],
  ["Pâtes au pesto, haricots verts et pommes de terre", "pesto:100 hv:300 pdt:300", 1], ["Pâtes au thon, citron et câpres", "thon:280 citron:60 capre:20 huile:30 herbes:10", 1],
  ["Pâtes aux aubergines et à la feta", "aubergine:600 feta:150 concasse:300 huile:25", 1], ["Pâtes au potiron et à la sauge", "potiron:700 parmesan:40 beurre:20 herbes:5", 1],
  ["Pâtes aux sardines et tomates", "sardine:250 concasse:500 ail:10 herbes:10", 1]];
PASTA.forEach(([n, ing, eq], k) => {
  const pt = k % 2 ? ["patesc", 320] : ["pates", 320];
  add(n, "it", "plat", 25, 4, eq ? ["eq", "rapide"] : ["rapide"], [pt, ...parseIng(ing), ["sel", 0]],
    ["Fais cuire les pâtes al dente dans un grand volume d'eau salée ; garde une louche d'eau de cuisson.", "Pendant ce temps, prépare la sauce à la poêle avec les autres ingrédients" + (/oeufcru/.test(ing) ? " (les œufs se mélangent hors du feu)" : "") + ".", "Mélange les pâtes égouttées avec la sauce, ajoute un peu d'eau de cuisson pour lier et sers aussitôt."]);
});
const RISO = [["asperges", "asperge:400 parmesan:40", 1], ["petits pois et menthe", "petitspois:400 menthe:10 parmesan:30", 1], ["courge", "butternut:600 parmesan:40", 1], ["poireaux", "poireau:500 parmesan:30", 1],
  ["citron et crevettes", "crevette:300 citron:60", 1], ["épinards", "epinard:400 parmesan:30", 1], ["tomates et mozzarella", "concasse:400 mozza:125", 0], ["saumon", "saumon:350 cremel:50", 1],
  ["poulet et champignons", "poulet:400 champi:300 parmesan:30", 1], ["betterave et chèvre", "betterave:400 chevre:120", 1], ["courgettes et chèvre", "courgette:500 chevre:120", 1],
  ["fenouil et citron", "fenouil:400 citron:50 parmesan:30", 1], ["brocoli", "brocoli:500 parmesan:40", 1], ["milanaise au parmesan", "parmesan:80 beurre:30", 0], ["chou-fleur et noisettes", "choufleur:500 noisette:30 parmesan:30", 1]];
RISO.forEach(([n, ing, eq]) => add("Risotto " + (/^[aeéiouy]/i.test(n) ? "aux " : "aux ") + n, "it", "plat", 35, 4, eq ? ["eq"] : [], [["rizrond", 300], ["oignon", 100], ["bouillon", 20], ["huile", 15], ...parseIng(ing), ["sel", 0]],
  ["Prépare 1 litre de bouillon chaud.", "Fais revenir l'oignon dans l'huile, ajoute le riz et remue jusqu'à ce qu'il soit nacré.", "Verse le bouillon louche par louche en remuant (18 min) ; ajoute la garniture en cours de cuisson selon sa cuisson.", "Hors du feu, ajoute le fromage et laisse reposer 2 min."]));
[["Gnocchis à la sauce tomate et basilic", "concasse:600 herbes:10 huile:15 parmesan:30"], ["Gnocchis au pesto et tomates cerises", "pesto:80 tomcerise:300"], ["Gnocchis aux épinards et gorgonzola", "epinard:400 bleu:100"],
 ["Gnocchis poêlés aux champignons", "champi:400 ail:10 huile:20 herbes:10"], ["Gnocchis à la courge rôtie", "butternut:600 parmesan:30 huile:20"]].forEach(([n, ing]) =>
  add(n, "it", "plat", 20, 4, ["rapide"], [["gnocchi", 800], ...parseIng(ing), ["sel", 0]], ["Fais cuire les gnocchis dans l'eau bouillante : ils sont prêts quand ils remontent.", "Prépare la garniture à la poêle.", "Ajoute les gnocchis égouttés, fais-les dorer 2 min et sers."]));
const PIZ = [["margherita", "concasse:200 mozza:250 herbes:5"], ["reine", "concasse:200 mozza:200 jambon:120 champi:150"], ["4 fromages", "mozza:150 bleu:60 chevre:60 parmesan:30"], ["végétarienne", "concasse:200 mozza:150 poivron:150 courgette:150 champi:100 oignonrouge:50"],
  ["thon et oignons", "concasse:200 mozza:150 thon:140 oignonrouge:80"], ["chèvre et miel", "cremel:100 chevre:150 miel:20 noix:20"], ["calzone", "concasse:150 mozza:200 jambon:120 oeuf:55"], ["au chorizo", "concasse:200 mozza:200 chorizo:80 poivron:150"],
  ["épinards et ricotta", "epinard:300 ricotta:150 mozza:100"], ["saumon et crème", "cremel:120 saumon:200 mozza:100 citron:20"], ["bianca aux pommes de terre", "pdt:300 mozza:150 herbes:5 huile:15"], ["aux légumes grillés et feta", "concasse:200 aubergine:200 poivron:150 feta:120"]];
PIZ.forEach(([n, ing]) => add("Pizza " + n, "it", "plat", 35, 4, ["enfant"], [["pizza", 520], ...parseIng(ing), ["huile", 10]],
  ["Préchauffe le four au maximum (240 à 250 °C).", "Étale la pâte, garnis avec les ingrédients.", "Enfourne 12 à 15 min jusqu'à ce que la pâte soit dorée et le fromage fondu."]));

/* ---------- 12. Quiches, tartes salées, omelettes, gratins, farcis ---------- */
const QUI = [["Quiche lorraine", "lardons:200 oeuf:165 cremel:200 lait:150", 0], ["Quiche saumon et épinards", "saumon:250 epinard:300 oeuf:165 cremel:200", 0], ["Quiche chèvre et courgettes", "chevre:150 courgette:500 oeuf:165 cremel:150", 0],
  ["Tarte à la tomate et à la moutarde", "tomate:600 moutarde:40 emmental:40 herbes:5", 0], ["Quiche thon et tomates", "thon:200 tomate:300 oeuf:165 cremel:200", 0], ["Quiche brocoli et feta", "brocoli:400 feta:150 oeuf:165 cremel:150", 0],
  ["Quiche aux champignons", "champi:500 oeuf:165 cremel:200 emmental:50", 0], ["Tarte à l'oignon", "oignon:800 oeuf:110 cremel:150 beurre:20", 0], ["Tarte fine aux légumes du soleil", "courgette:300 aubergine:200 tomate:300 huile:20 herbes:5", 1],
  ["Tarte potiron et chèvre", "potiron:600 chevre:150 oeuf:110 cremel:100", 0], ["Quiche aux asperges", "asperge:400 oeuf:165 cremel:200 parmesan:30", 0], ["Quiche jambon-fromage", "jambon:200 emmental:100 oeuf:165 cremel:200 lait:100", 0],
  ["Quiche poulet et poivrons", "poulet:300 poivron:300 oeuf:165 cremel:200", 0], ["Tarte épinards et ricotta", "epinard:500 ricotta:250 oeuf:110 parmesan:30", 0], ["Quiche saumon et poireaux", "saumon:250 poireau:400 oeuf:165 cremel:200", 0],
  ["Quiche chorizo et poivrons", "chorizo:100 poivron:300 oeuf:165 cremel:200", 0], ["Tarte courgette, menthe et feta", "courgette:600 feta:150 menthe:10 oeuf:110", 0], ["Tatin de tomates", "tomate:800 oignon:100 huile:20 herbes:5", 1],
  ["Pissaladière", "oignon:1000 olive:60 huile:30 herbes:5", 0], ["Tarte aux poireaux et au comté", "poireau:600 comte:80 oeuf:110 cremel:150", 0]];
QUI.forEach(([n, ing, eq], k) => add(n, "fr", "plat", 50, 6, eq ? ["eq"] : [], [[k % 3 === 2 || /Tatin|fine|Pissaladière/.test(n) ? "pfeuilletee" : "pbrisee", 230], ...parseIng(ing), ["sel", 0]],
  ["Préchauffe le four à 190 °C et étale la pâte dans un moule.", "Prépare la garniture : fais revenir les légumes si besoin, mélange œufs et crème s'il y en a.", "Garnis la pâte et enfourne 30 à 35 min. Sers avec une salade verte."]));
const OME = [["Tortilla espagnole", "es", "oeuf:330 pdt:600 oignon:150 huile:40"], ["Frittata aux courgettes", "it", "oeuf:330 courgette:500 parmesan:30 huile:15"], ["Omelette aux fines herbes", "fr", "oeuf:330 herbes:20 beurre:10"],
  ["Omelette au fromage", "fr", "oeuf:330 emmental:80 beurre:10"], ["Piperade basque aux œufs", "fr", "oeuf:330 poivron:600 tomate:400 oignon:150 huile:20"], ["Omelette épinards et feta", "med", "oeuf:330 epinard:300 feta:120 huile:10"],
  ["Œufs brouillés au saumon fumé", "fr", "oeuf:330 saumonfume:150 ciboulette:10 beurre:10"], ["Omelette au jambon", "fr", "oeuf:330 jambon:150 beurre:10"], ["Frittata tomates et basilic", "it", "oeuf:330 tomcerise:300 herbes:10 parmesan:20 huile:10"],
  ["Omelette aux oignons", "fr", "oeuf:330 oignon:300 huile:15"], ["Frittata aux asperges", "it", "oeuf:330 asperge:400 parmesan:30 huile:10"], ["Omelette chèvre et épinards", "fr", "oeuf:330 chevre:120 epinard:300"],
  ["Chakchouka", "mag", "oeuf:330 poivron:500 tomate:600 oignon:150 epices:5 huile:20"], ["Œufs cocotte aux poireaux", "fr", "oeuf:330 poireau:400 cremel:100"], ["Frittata aux pommes de terre et poivrons", "it", "oeuf:330 pdt:400 poivron:300 huile:20"],
  ["Omelette aux champignons et ciboulette", "fr", "oeuf:330 champi:400 ciboulette:10 huile:10"]];
OME.forEach(([n, w, ing]) => add(n + ", salade et pain complet", w, "plat", 25, 4, ["eq", "rapide"], [...parseIng(ing), ["salade", 200], ["painc", 160], ["vinaigre", 10], ["huile", 10], ["sel", 0]],
  ["Prépare la garniture à la poêle (légumes fondus ou dorés).", "Bats les œufs avec sel et poivre, verse-les sur la garniture et laisse cuire à feu moyen jusqu'à ce qu'ils soient bien pris.", "Sers avec la salade assaisonnée et le pain complet."]));
const GRA = ["courgette", "brocoli", "poireau", "potiron", "epinard", "choufleur", "aubergine", "endive", "blette", "celerirave", "fenouil", "patate", "chou", "panais", "butternut", "hv"];
GRA.forEach(v => add("Gratin " + VEG[v][1] + (v === "endive" ? " au jambon" : ""), "fr", "plat", 50, 4, ["enfant"], [[v, 1000], ["lait", 400], ["farine", 30], ["beurre", 25], ["emmental", 70], v === "endive" ? ["jambon", 180] : ["oeuf", 0], ["rizc", 200], ["sel", 0]],
  ["Fais précuire les " + vn(v) + " 10 min à la vapeur et égoutte-les bien.", "Prépare une béchamel légère : beurre fondu, farine, puis lait en fouettant jusqu'à épaississement.", "Mets les légumes dans un plat, nappe de béchamel et d'emmental, enfourne 25 min à 200 °C. Sers avec du riz complet."]));
const FAR = [["tomate", "Tomates farcies"], ["courgette", "Courgettes farcies"], ["poivron", "Poivrons farcis"], ["aubergine", "Aubergines farcies"], ["champi", "Champignons farcis"]];
const FARCE = [["à la viande", "boeufhache:400 oignon:100 chapelure:30 herbes:10", "fr"], ["au riz et à la feta", "riz:150 feta:150 herbes:15 tomate:200", "med"], ["au quinoa et aux pois chiches", "quinoa:150 pchiche:300 epices:4 herbes:10", "med"]];
FAR.forEach(([v, n]) => FARCE.forEach(([fn, ing, w]) => add(n + " " + fn, w, "plat", 60, 4, ["eq"], [[v, 1000], ...parseIng(ing), ["huile", 20], ["ail", 10], ["rizc", 160], ["sel", 0]],
  ["Préchauffe le four à 190 °C. Évide les " + vn(v) + " et garde la chair.", "Prépare la farce : fais revenir la chair hachée avec l'ail et les ingrédients de la farce.", "Garnis les légumes, arrose d'un filet d'huile et enfourne 40 min. Sers avec un peu de riz."])));

/* ---------- 13. Légumineuses et galettes végétales ---------- */
[["Falafels au four, sauce yaourt", "med", "pchiche:500 oignon:80 herbes:30 ail:10 epices:6 farine:30 yaourt:250 huile:20 salade:150 pita:240"],
 ["Galettes de lentilles et carottes", "fr", "lentille:200 carotte:300 oeuf:110 chapelure:50 huile:20 salade:200"], ["Steaks de haricots rouges, salade de chou", "mx", "hrouge:500 oignon:80 chapelure:60 epices:5 huile:20 chourouge:300"],
 ["Croquettes de pois chiches et patate douce", "ww", "pchiche:400 patate:500 epices:5 chapelure:40 huile:20 salade:200"], ["Galettes de quinoa aux légumes", "ww", "quinoa:200 courgette:300 carotte:200 oeuf:110 huile:20 salade:150"],
 ["Boulettes de lentilles à la sauce tomate", "it", "lentille:200 chapelure:50 oeuf:55 concasse:600 parmesan:20 pates:240"], ["Galettes de courgettes et feta", "med", "courgette:700 feta:150 oeuf:110 farine:60 menthe:10 huile:20"],
 ["Burger végétarien aux pois chiches", "us", "pchiche:400 painburger:240 tomate:200 salade:60 oignonrouge:50 ygrec:100 epices:4"], ["Nuggets de pois chiches au four", "ww", "pchiche:500 chapelure:80 epices:5 huile:15 hv:500"],
 ["Rösti de légumes et œuf", "fr", "pdt:500 carotte:200 courgette:200 oeuf:220 huile:25 salade:150"]].forEach(([n, w, ing]) =>
  add(n, w, "plat", 40, 4, ["eq"], [...parseIng(ing), ["sel", 0]], ["Prépare et mixe (ou écrase) les ingrédients de base avec les épices.", "Façonne des galettes ou boulettes et fais-les dorer à la poêle ou au four (200 °C, 20 min).", "Sers avec l'accompagnement prévu."]));
[["Dahl de lentilles vertes aux épinards", "in", "lentille:250 epinard:300 concasse:400 coco:100 oignon:100 epices:8 riz:200"], ["Chana masala", "in", "pchiche:600 concasse:400 oignon:150 gingembre:10 epices:10 colza:15 riz:200"],
 ["Haricots rouges au lait de coco", "ww", "hrouge:600 coco:200 oignon:100 poivron:200 epices:5 riz:200"], ["Lentilles à la provençale", "fr", "lentille:250 concasse:400 courgette:300 oignon:100 herbes:5 huile:15"],
 ["Harira", "mag", "lentille:100 pchiche:250 concasse:400 celeri:100 oignon:100 herbes:20 epices:6 semoulefine:40 huile:10"], ["Loubia (haricots blancs à la tomate)", "mag", "harblanc:600 concasse:400 oignon:100 ail:10 epices:6 huile:15 painc:160"],
 ["Mujaddara (lentilles, riz et oignons)", "med", "lentille:200 riz:150 oignon:400 huile:30 epices:4 ygrec:200 salade:150"], ["Soupe de pois cassés", "fr", "pois:300 carotte:200 oignon:100 bouillon:10 huile:10"],
 ["Chili sin carne aux patates douces", "mx", "hrouge:400 patate:500 concasse:400 poivron:200 epices:6 huile:15"], ["Ragoût de pois chiches et blettes", "med", "pchiche:500 blette:500 concasse:300 oignon:100 epices:4 huile:20 painc:160"]].forEach(([n, w, ing]) =>
  add(n, w, n.startsWith("Soupe") || n === "Harira" ? "soupe" : "plat", 45, 4, ["eq", "budget"], [...parseIng(ing), ["sel", 0]], ["Fais revenir l'oignon (et les aromates) dans l'huile avec les épices.", "Ajoute les légumineuses, les légumes et le liquide ; laisse mijoter 25 à 35 min.", "Rectifie l'assaisonnement et sers avec l'accompagnement."]));

/* ---------- 14. Desserts ---------- */
const FRUITS = [["pomme", "pommes"], ["poire", "poires"], ["fruitsrouges", "fruits rouges"], ["rhubarbe", "rhubarbe"], ["peche", "pêches"], ["abricot", "abricots"], ["prune", "prunes"], ["mangue", "mangue"], ["banane", "bananes"], ["myrtille", "myrtilles"], ["cerise", "cerises"], ["figue", "figues"]];
FRUITS.forEach(([f, n], k) => {
  add("Crumble aux " + n, "fr", "dessert", 45, 6, ["enfant"], [[f, 900], ["farine", 100], ["avoine", 50], ["beurre", 80], ["sucre", 70]], ["Préchauffe le four à 180 °C et coupe les fruits dans un plat.", "Sable du bout des doigts farine, flocons, sucre et beurre froid.", "Parsème sur les fruits et enfourne 30 min."]);
  add("Clafoutis aux " + n, "fr", "dessert", 45, 6, ["enfant"], [[f, 500], ["oeuf", 165], ["lait", 300], ["farine", 80], ["sucre", 70], ["beurre", 10]], ["Préchauffe le four à 180 °C, beurre un plat et répartis les fruits.", "Fouette œufs et sucre, ajoute farine puis lait.", "Verse sur les fruits et enfourne 35 min."]);
  add("Compote de " + n + " sans sucre ajouté", "fr", "dessert", 25, 4, ["eq", "budget", "enfant"], [[f, 900], ["citron", 20], ["epices", 1]], ["Coupe les fruits en morceaux.", "Fais-les cuire 15 à 20 min à feu doux avec un fond d'eau et le citron.", "Écrase ou mixe ; la cannelle ou la vanille remplacent le sucre."]);
  add("Tarte fine aux " + n, "fr", "dessert", 40, 6, [], [["pfeuilletee", 230], [f, 600], ["sucre", 40], ["beurre", 15]], ["Préchauffe le four à 200 °C et étale la pâte sur une plaque.", "Dispose les fruits en fines tranches, saupoudre de sucre et ajoute quelques noisettes de beurre.", "Enfourne 25 à 30 min."]);
  if (k < 8) add("Yaourt glacé minute aux " + n, "ww", "dessert", 10, 4, ["eq", "rapide"], [[f, 400], ["ygrec", 400], ["miel", 30]], ["Coupe les fruits et congèle-les au moins 4 h.", "Mixe les fruits congelés avec le yaourt et le miel.", "Sers aussitôt, comme une glace."]);
});
[["Salade de fruits exotiques", "mangue:300 ananas:400 kiwi:225 citron:30 menthe:5"], ["Salade de fruits rouges à la menthe", "fraise:300 framboise:200 myrtille:150 menthe:5"], ["Salade d'agrumes à la cannelle", "orange:600 clementine:280 epices:2"],
 ["Salade d'oranges à la fleur d'oranger et cannelle", "orange:800 datte:60 epices:2"], ["Salade de fruits d'été", "peche:300 abricot:225 melon:400 menthe:5"], ["Salade de fruits d'automne", "pomme:300 poire:320 raisin:200 noix:30"],
 ["Brochettes de fruits", "ananas:300 fraise:250 banane:240 kiwi:150"], ["Melon et pastèque à la menthe", "melon:500 pasteque:500 menthe:5 citron:20"]].forEach(([n, ing]) =>
  add(n, n.includes("fleur d'oranger") ? "mag" : "fr", "dessert", 15, 4, ["eq", "rapide"], parseIng(ing), ["Lave, épluche et coupe les fruits.", "Mélange avec les aromates.", "Garde au frais jusqu'au moment de servir."]));
[["Cake au citron", "farine:200 sucre:150 oeuf:165 beurre:120 citron:100 levure:11"], ["Cake marbré", "farine:200 sucre:150 oeuf:220 beurre:150 cacao:25 levure:11"], ["Muffins aux myrtilles", "farine:250 sucre:120 oeuf:110 lait:200 colza:80 myrtille:150 levure:11"],
 ["Muffins banane et chocolat", "farine:220 banane:240 sucre:80 oeuf:110 lait:100 colza:70 choco:80 levure:11"], ["Banana bread", "farine:220 banane:360 sucre:90 oeuf:110 beurre:80 levure:11 noix:40"],
 ["Gâteau au chocolat fondant", "choco:200 beurre:150 sucre:120 oeuf:220 farine:50"], ["Quatre-quarts", "farine:200 sucre:200 oeuf:220 beurre:200"], ["Gâteau aux pommes", "pomme:500 farine:150 sucre:100 oeuf:165 lait:100 beurre:80 levure:11"],
 ["Carrot cake", "carotte:300 farine:200 sucre:120 oeuf:165 colza:120 noix:60 epices:4 levure:11"], ["Madeleines", "farine:150 sucre:120 oeuf:165 beurre:125 citron:20 levure:5"],
 ["Brownies", "choco:200 beurre:150 sucre:150 oeuf:165 farine:80 noix:80"], ["Cookies aux pépites de chocolat", "farine:250 beurre:125 sucre:150 oeuf:55 choco:150 levure:5"],
 ["Cheesecake", "fblanc:500 mascarpone:250 sucre:120 oeuf:165 biscuit:0 beurre:80 farine:150"], ["Apple pie", "pbrisee:460 pomme:900 sucre:80 epices:3 beurre:20"], ["Pancakes moelleux", "farine:250 lait:300 oeuf:110 sucre:30 levure:11 beurre:30"],
 ["Panna cotta aux fruits rouges", "cremel:500 lait:200 sucre:60 gelatine:6 fruitsrouges:250"], ["Tiramisu", "mascarpone:500 oeufcru:220 sucre:100 cacao:15 farine:0 biscuit:0"], ["Crème caramel", "lait:500 oeuf:220 sucre:150"],
 ["Crema catalana", "lait:500 oeuf:110 sucre:110 maizena:30 citron:20"], ["Flan pâtissier", "lait:750 oeuf:165 sucre:150 maizena:80 pbrisee:230"], ["Île flottante", "lait:500 oeuf:220 sucre:100"],
 ["Semoule au lait", "lait:1000 semoule:100 sucre:70 vanille:7"], ["Crème au chocolat", "lait:500 choco:100 maizena:30 sucre:40"], ["Cornes de gazelle", "amandepoudre:250 sucre:100 farine:200 beurre:60 oeuf:55"],
 ["Churros au four", "farine:200 beurre:60 oeuf:165 sucre:60 epices:2"], ["Mousse aux fruits rouges (sans œufs crus)", "fruitsrouges:400 ygrec:400 sucre:40 gelatine:6"], ["Fondant à la patate douce", "patate:500 choco:150 oeuf:165 sucre:60 amandepoudre:50"]].forEach(([n, ing]) => {
  const w = { "Tiramisu": "it", "Panna cotta aux fruits rouges": "it", "Crema catalana": "es", "Churros au four": "es", "Cornes de gazelle": "mag", "Brownies": "us", "Cookies aux pépites de chocolat": "us", "Cheesecake": "us", "Apple pie": "us", "Pancakes moelleux": "us", "Banana bread": "us", "Muffins aux myrtilles": "us", "Muffins banane et chocolat": "us", "Carrot cake": "us" }[n] || "fr";
  add(n, w, n === "Pancakes moelleux" ? "matin" : "dessert", 45, 8, ["enfant"], parseIng(ing).filter(x => K.ING[x[0]]), ["Prépare les ingrédients et préchauffe le four si besoin (180 °C).", "Mélange les ingrédients dans l'ordre : œufs et sucre, matières grasses, puis farine ou fécule, enfin les parfums ou les fruits.", "Fais cuire (four, casserole ou poêle selon la recette) puis laisse refroidir avant de servir."]);
});

/* ---------- 15. Petits-déjeuners ---------- */
const SMOO = [["banane", "fraise"], ["mangue", "ananas"], ["myrtille", "banane"], ["kiwi", "pomme"], ["peche", "framboise"], ["orange", "mangue"], ["epinard", "banane"], ["fruitsrouges", "banane"],
  ["abricot", "peche"], ["poire", "kiwi"], ["ananas", "banane"], ["fraise", "myrtille"]];
const SMB = [["yaourt", 250, "au yaourt"], ["lait", 300, "au lait"], ["soja", 300, "au lait de soja"]];
SMOO.forEach((sm, i) => SMB.forEach((b, j) => {
  if ((i + j) % 3 === 2) return;
  const nm = sm.map(x => K.ING[x][0].toLowerCase().replace(/s$/, "").replace("fruits rouges surgelé", "fruits rouges").replace("épinards frai", "épinards"));
  add("Smoothie " + nm.join("-") + " " + b[2], "ww", "matin", 5, 2, ["eq", "rapide"], [[sm[0], 150], [sm[1], 150], [b[0], b[1]]], ["Lave et coupe les fruits.", "Mixe-les avec " + (b[0] === "yaourt" ? "le yaourt" : "le lait") + " jusqu'à obtenir une texture lisse.", "Sers aussitôt, bien frais."]);
}));
const TOP = [["banane", "à la banane et aux noix", "banane:120 noix:20"], ["pomme", "pomme-cannelle", "pomme:150 epices:1"], ["myrtille", "aux myrtilles", "myrtille:120 amande:15"], ["poire", "à la poire et aux noisettes", "poire:160 noisette:15"],
  ["fraise", "aux fraises", "fraise:150 chia:10"], ["mangue", "à la mangue et coco", "mangue:150 cocorapee:10"], ["cacao", "au cacao et à la banane", "cacao:10 banane:120"], ["abricot", "aux abricots et amandes", "abricot:135 amande:15"]];
TOP.forEach(([, n, ing]) => {
  add("Porridge " + n, "ww", "matin", 10, 2, ["eq", "rapide"], [["avoine", 80], ["lait", 400], ...parseIng(ing), ["miel", 10]], ["Fais chauffer les flocons avec le lait 5 min en remuant.", "Verse dans les bols et ajoute la garniture.", "Un filet de miel si tu veux."]);
  add("Overnight oats " + n, "us", "matin", 5, 2, ["eq", "rapide"], [["avoine", 80], ["lait", 200], ["yaourt", 125], ...parseIng(ing)], ["La veille, mélange les flocons, le lait et le yaourt dans deux pots.", "Laisse la nuit au réfrigérateur.", "Le matin, ajoute la garniture et déguste."]);
  add("Bol de skyr " + n, "ww", "matin", 5, 2, ["eq", "rapide"], [["skyr", 300], ["avoine", 30], ...parseIng(ing)], ["Verse le skyr dans deux bols.", "Ajoute les flocons et la garniture.", "Déguste aussitôt."]);
});
[["Tartines pain complet, avocat et œuf poché", "painc:160 avocat:150 oeuf:110 citron:10"], ["Tartines beurre de cacahuète et banane", "painc:160 beurrecacahuete:30 banane:120"], ["Tartines fromage frais, radis et ciboulette", "painc:160 fblanc:120 radis:80 ciboulette:5"],
 ["Tartines ricotta, figues et miel", "painc:160 ricotta:100 figue:100 miel:10"], ["Œufs brouillés et pain complet", "oeuf:220 painc:120 beurre:5 tomate:120"], ["Tartines tomate et huile d'olive (pan con tomate)", "baguette:200 tomate:240 huile:20 ail:5"],
 ["Pudding de chia au lait de coco et mangue", "chia:50 coco:200 lait:100 mangue:200"], ["Pain perdu aux fruits", "painc:200 oeuf:110 lait:200 fruitsrouges:150 sucre:10"], ["Granola maison et yaourt", "avoine:100 amande:30 miel:30 yaourt:250 fruitsrouges:100"],
 ["Crêpes au sarrasin, œuf et fromage", "sarrasin:120 oeuf:110 emmental:40 lait:150"], ["Msemen (crêpes feuilletées) et miel", "semoule:150 farine:100 huile:30 miel:30"], ["Pancakes à l'avoine et aux myrtilles", "avoine:100 oeuf:110 lait:150 myrtille:100 banane:60"]].forEach(([n, ing], k) =>
  add(n, k === 5 ? "es" : k === 10 ? "mag" : "fr", "matin", 15, 2, k === 10 || k === 7 ? ["rapide"] : ["eq", "rapide"], parseIng(ing), ["Prépare les ingrédients.", "Fais griller, cuire ou assemble selon la recette.", "Sers aussitôt."]));

/* ---------- Recettes écrites à la main (recipes-hand.js) ---------- */
(root.RECIPES_HAND || []).concat(root.RECIPES_MORE || []).forEach(r => {
  const [n, w, c, t, s, tags, ing, steps] = r;
  add(n, w, c, t, s, tags ? tags.split(",") : [], parseIng(ing), steps.split("|"));
});

/* ---------- Étiquette « équilibré » vérifiée par le calcul ---------- */
const VEGIDS = new Set(Object.keys(K.ING).filter(id => K.ING[id][1] === "fl" && !["pdt", "patate", "pdtgrenaille", "avocat", "citron", "herbes", "menthe", "ail", "gingembre", "piment", "ciboulette"].includes(id)).concat(["concasse", "petitspois", "artichaut", "edamame", "feve"]));
function balanced(r) {
  if (!["plat", "soupe", "entree"].includes(r.c)) return r.tg.includes("eq");
  const n = K.recipeNutrition(r);
  const veg = r.i.reduce((s, [id, q]) => s + (VEGIDS.has(id) ? q : 0), 0) / r.s;
  const fatPct = n.kcal ? n.l * 9 / n.kcal : 0;
  if (r.c === "plat") return n.kcal >= 280 && n.kcal <= 800 && fatPct <= 0.45 && veg >= 100 && n.p >= 12;
  return n.kcal <= 450 && fatPct <= 0.5 && veg >= 90;
}
const W = { "poulet-soleil": "fr", "saumon-brocoli": "fr", "dahl": "in", "chili-sin": "mx", "curry-pchiche": "in", "bolo": "it", "wok-poulet": "as", "tajine": "mag", "couscous-vege": "mag", "risotto": "it",
  "pizza-legumes": "it", "lasagnes-epinards": "it", "buddha": "ww", "bowl-saumon": "as", "tofu-saute": "as", "gaspacho": "es", "taboule": "med", "grecque": "med", "houmous": "med", "burger": "us", "smoothie": "ww", "pancakes-banane": "us", "wraps": "mx" };
K.RECIPES.forEach(r => { r.w = r.w || W[r.id] || "fr"; });
const seen = new Set(K.RECIPES.map(r => r.n.toLowerCase()));
for (const r of out) {
  if (seen.has(r.n.toLowerCase())) continue;
  seen.add(r.n.toLowerCase());
  const eq = balanced(r);
  r.tg = r.tg.filter(x => x !== "eq"); if (eq) r.tg.unshift("eq");
  if (r.t <= 25 && !r.tg.includes("rapide")) r.tg.push("rapide");
  K.RECIPES.push(r);
}
K.CUISINES = [["fr", "🇫🇷", "France"], ["mag", "🌙", "Maghreb"], ["it", "🇮🇹", "Italie"], ["es", "🇪🇸", "Espagne"], ["us", "🇺🇸", "États-Unis"], ["mx", "🇲🇽", "Mexique"], ["as", "🥢", "Asie"], ["in", "🇮🇳", "Inde"], ["med", "🫒", "Grèce, Liban, Turquie"], ["af", "🌍", "Afrique"], ["ww", "🌐", "Healthy & monde"]];
})(typeof window !== "undefined" ? window : globalThis);
