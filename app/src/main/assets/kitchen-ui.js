// Modules Recettes (+ liste de courses), Manger équilibré et Calories d'une assiette.
(window.SC_EXT = window.SC_EXT || []).push(function (ctx) {
"use strict";
const K = window.KitchenData;
const { h, t, settings, saveSettings, go, header, openSheet, closeSheet, VIEWS, lsGet, lsSet, toast, NATIVE, copyText } = ctx;
settings.kitchen = Object.assign({ kcalTarget: 2000, menuServings: 2 }, settings.kitchen || {});
const S = settings.kitchen;
const food = () => settings.food || { diets: [], pregnancy: true };
const fmt = x => (Math.round(x * 10) / 10).toString().replace(".", ",");
const todayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

/* ================= Liste de courses ================= */
const SHOP_KEY = "sc-shop";
let shop = lsGet(SHOP_KEY, []);
function saveShop() { lsSet(SHOP_KEY, shop); }
function addRecipeToShop(r, servings) {
  const f = servings / r.s;
  for (const [id, q] of r.i) {
    if (id === "sel") continue;
    const info = K.ingInfo(id);
    let it = shop.find(x => x.ing === id && !x.done);
    if (!it) { it = { id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ing: id, name: info.name, aisle: info.aisle, q: 0, from: [] }; shop.push(it); }
    it.q += q * f; if (!it.from.includes(r.n)) it.from.push(r.n);
  }
  saveShop();
}
function shopCount() { return shop.filter(x => !x.done).length; }
function shopText() {
  const lines = [];
  for (const [a, ico, label] of K.AISLES) {
    const items = shop.filter(x => x.aisle === a && !x.done); if (!items.length) continue;
    lines.push(ico + " " + label); items.forEach(x => lines.push("• " + x.name + (x.ing ? " : " + K.qtyText(x.ing, x.q, 1) : "")));
  }
  return lines.join("\n");
}
function shopView(body) {
  const add = h("input", { id: "shop-add", placeholder: t("k_addItem"), autocomplete: "off" });
  const addBtn = h("button", { type: "button", className: "btn primary", textContent: "+" });
  const doAdd = () => { const v = add.value.trim(); if (!v) return; shop.push({ id: "s" + Date.now().toString(36), name: v, aisle: "xx", q: 0, from: [] }); saveShop(); add.value = ""; ctx.render(); setTimeout(() => { const el = document.getElementById("shop-add"); if (el) el.focus(); }, 30); };
  addBtn.onclick = doAdd; add.onkeydown = e => { if (e.key === "Enter") doAdd(); };
  body.append(h("div", { className: "inrow" }, add, addBtn));
  if (!shop.length) { body.append(h("div", { className: "soon", style: "margin-top:14px" }, h("p", { textContent: t("k_shopEmpty"), style: "margin:0;color:var(--muted)" }))); return; }
  for (const [a, ico, label] of K.AISLES) {
    const items = shop.filter(x => x.aisle === a); if (!items.length) continue;
    body.append(h("h3", { className: "sect", textContent: ico + " " + label }));
    const list = h("div", { className: "nlist" });
    items.forEach(x => {
      const cb = h("input", { type: "checkbox", checked: !!x.done });
      cb.onchange = () => { x.done = cb.checked; saveShop(); row.classList.toggle("done", x.done); };
      const row = h("label", { className: "shoprow" + (x.done ? " done" : "") }, cb, h("div", { className: "nmeta" }, h("b", { textContent: x.name }), x.from.length ? h("small", { textContent: x.from.join(", ") }) : null),
        x.ing ? h("span", { className: "nval", textContent: K.qtyText(x.ing, x.q, 1) }) : null);
      list.append(row);
    });
    body.append(list);
  }
  const copy = h("button", { type: "button", className: "btn", textContent: "📋 " + t("k_copyList") }); copy.onclick = () => copyText(shopText());
  const clearDone = h("button", { type: "button", className: "btn", textContent: t("k_clearDone") }); clearDone.onclick = () => { shop = shop.filter(x => !x.done); saveShop(); ctx.render(); };
  const clearAll = h("button", { type: "button", className: "btn danger", textContent: t("k_clearAll") }); clearAll.onclick = () => { shop = []; saveShop(); ctx.render(); };
  body.append(h("div", { className: "row" }, copy, clearDone, clearAll));
}

/* ================= Recettes ================= */
const CATS = ["all", "matin", "entree", "soupe", "plat", "dessert"];
const FILTERS = ["eq", "rapide", "budget", "enfant", "vege", "vegan", "gf", "preg"];
let rTab = "ideas", rCat = "all", rQuery = "", rFilters = null, rCuis = "all";
const PAGE = 40;
const FLAG = Object.fromEntries((K.CUISINES || []).map(([k, f]) => [k, f]));
function cuisineChips(cur, onTap) { return chips([["all", "🌍 " + t("k_cuisAll")]].concat((K.CUISINES || []).map(([k, f, n]) => [k, f + " " + t("k_cuis_" + k)])), k => cur === k, onTap); }
function pagedList(list, rows, more) {
  let shown = 0;
  const btn = h("button", { type: "button", className: "btn", style: "margin-top:10px;width:100%" });
  const step = () => { rows.slice(shown, shown + PAGE).forEach(r => list.append(recipeRow(r))); shown += PAGE; btn.hidden = shown >= rows.length; btn.textContent = t("k_seeMore", Math.min(PAGE, rows.length - shown)); };
  btn.onclick = step; more.textContent = ""; more.append(btn); step();
}
function initFilters() {
  if (rFilters) return;
  const d = food().diets || [];
  rFilters = new Set([d.includes("vegan") ? "vegan" : d.includes("vegetarian") ? "vege" : null, d.includes("glutenfree") ? "gf" : null].filter(Boolean));
}
function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function matches(r, filters, cat, q) {
  if (cat && cat !== "all" && r.c !== cat) return false;
  const d = K.recipeDiet(r);
  for (const f of filters) {
    if (["eq", "rapide", "budget", "enfant"].includes(f) && !r.tg.includes(f)) return false;
    if (f === "vege" && !d.vege) return false; if (f === "vegan" && !d.vegan) return false;
    if (f === "gf" && !d.glutenFree) return false; if (f === "preg" && d.preg) return false;
  }
  if (q) { const n = norm(q); const hay = norm(r.n + " " + r.i.map(([id]) => (K.ING[id] || [""])[0]).join(" ")); if (!n.split(/\s+/).every(w => hay.includes(w))) return false; }
  return true;
}
function recipeRow(r) {
  const n = K.recipeNutrition(r), d = K.recipeDiet(r);
  const b = h("button", { type: "button", className: "prow" });
  b.append(h("div", { className: "pimg", textContent: ({ matin: "🥣", entree: "🥗", soupe: "🍲", plat: "🍽️", dessert: "🍰" })[r.c] }),
    h("div", { className: "pmeta" }, h("b", { textContent: r.n }), h("small", { textContent: [(FLAG[r.w] || "") + " " + r.t + " min", n.kcal + " kcal/" + t("k_portion"), d.vegan ? "🌱 vegan" : d.vege ? "🥕 " + t("k_vege") : null, r.tg.includes("eq") ? "⚖️ " + t("k_eq") : null].filter(Boolean).join(" · ") })));
  b.onclick = () => openRecipe(r.id);
  return b;
}
function chips(list, isOn, onTap) {
  const row = h("div", { className: "chiprow" });
  list.forEach(([k, label]) => { const b = h("button", { type: "button", className: "fchip", textContent: label }); b.setAttribute("aria-pressed", String(isOn(k))); b.onclick = () => onTap(k); row.append(b); });
  return row;
}
VIEWS.recipes = root => {
  initFilters();
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(t("modRecipes"), { back: true, options: "recipes" })));
  const seg = h("div", { className: "seg" });
  [["ideas", t("k_ideas")], ["shop", t("k_shop") + (shopCount() ? " (" + shopCount() + ")" : "")]].forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(rTab === k)); b.onclick = () => { rTab = k; go("recipes"); }; seg.append(b); });
  wrap.append(seg);
  const body = h("div", { style: "margin-top:14px" }); wrap.append(body);
  if (rTab === "shop") shopView(body); else ideasView(body);
  root.append(wrap);
};
function ideasView(body) {
  // Idée du jour
  const day = Math.floor(Date.now() / 86400000);
  const pool = K.RECIPES.filter(r => r.c === "plat" && matches(r, rFilters, "all", ""));
  if (pool.length) {
    const r = pool[day % pool.length], n = K.recipeNutrition(r);
    const card = h("button", { type: "button", className: "daycard" }, h("small", { textContent: "✨ " + t("k_ofDay") }), h("b", { textContent: r.n }), h("span", { textContent: r.t + " min · " + n.kcal + " kcal/" + t("k_portion") }));
    card.onclick = () => openRecipe(r.id); body.append(card);
  }
  const q = h("input", { id: "r-q", type: "search", placeholder: t("k_searchPh"), value: rQuery, autocomplete: "off" });
  const box = h("label", { className: "search", htmlFor: "r-q", style: "margin-top:14px" }); box.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'; box.append(q);
  body.append(box);
  body.append(chips(CATS.map(c => [c, t("k_cat_" + c)]), k => rCat === k, k => { rCat = k; ctx.render(); }));
  body.append(cuisineChips(rCuis, k => { rCuis = k; ctx.render(); }));
  body.append(chips(FILTERS.map(f => [f, t("k_f_" + f)]), k => rFilters.has(k), k => { rFilters.has(k) ? rFilters.delete(k) : rFilters.add(k); ctx.render(); }));
  const list = h("div", { className: "plist", style: "margin-top:12px" }), info = h("p", { className: "sub" }), more = h("div");
  const fill = () => {
    list.textContent = "";
    const rows = K.RECIPES.filter(r => (rCuis === "all" || r.w === rCuis) && matches(r, rFilters, rCat, rQuery));
    info.textContent = t("k_nRecipes", rows.length);
    pagedList(list, rows, more);
  };
  let timer; q.oninput = () => { rQuery = q.value; clearTimeout(timer); timer = setTimeout(fill, 200); };
  body.append(info, list, more); fill();
  body.append(h("p", { className: "notice", textContent: t("k_recipeNote") }));
}

/* Fiche recette */
let curRecipe = null, curServ = null, recipeFrom = "recipes";
function openRecipe(id, from) { curRecipe = K.RECIPES.find(r => r.id === id); curServ = curRecipe ? curRecipe.s : 2; recipeFrom = from || (ctx.view() === "balance" ? "balance" : "recipes"); go("recipe"); }
ctx.viewModule.recipe = "recipes";
VIEWS.recipe = root => {
  const r = curRecipe; const wrap = h("div", { className: "wrap" }); root.append(wrap);
  if (!r) return;
  const n = K.recipeNutrition(r), d = K.recipeDiet(r), f = curServ / r.s;
  wrap.append(h("header", {}, header(r.n, { back: true })));
  const meta = h("div", { className: "rmeta" },
    h("div", {}, h("b", { textContent: r.t + " min" }), h("small", { textContent: t("k_time") })),
    h("div", {}, h("b", { textContent: n.kcal + " kcal" }), h("small", { textContent: t("k_perPortion") })),
    h("div", {}, h("b", { textContent: n.p + " g" }), h("small", { textContent: t("n_prot") })));
  wrap.append(meta);
  const badges = h("div", { className: "diets", style: "margin-top:12px" });
  const bd = (ok, label) => badges.append(h("span", { className: "diet d-" + (ok ? "yes" : "no"), textContent: (ok ? "✓ " : "✗ ") + label }));
  bd(d.vege, t("k_vege")); bd(d.vegan, "Vegan"); bd(d.glutenFree, t("k_f_gf"));
  if (r.tg.includes("eq")) badges.append(h("span", { className: "diet d-yes", textContent: "⚖️ " + t("k_eq") }));
  wrap.append(badges);
  if (d.preg) wrap.append(h("div", { className: "alert", textContent: "🤰 " + t("k_pregWarn") }));
  wrap.append(h("p", { className: "sub", style: "margin-top:10px", textContent: t("k_macros", n.g, n.l) }));
  // Portions
  const minus = h("button", { type: "button", className: "iconbtn", textContent: "−" }), plus = h("button", { type: "button", className: "iconbtn", textContent: "+" });
  minus.onclick = () => { if (curServ > 1) { curServ--; ctx.render(); } }; plus.onclick = () => { if (curServ < 20) { curServ++; ctx.render(); } };
  wrap.append(h("div", { className: "sect2" }, h("h3", { textContent: t("k_ingredients") }), h("div", { className: "stepper" }, minus, h("b", { textContent: t("k_nPeople", curServ) }), plus)));
  const list = h("div", { className: "nlist" });
  r.i.forEach(([id, q]) => { const info = K.ingInfo(id); const a = K.AISLES.find(x => x[0] === info.aisle); list.append(h("div", { className: "nrow" }, h("span", { className: "nico", textContent: a ? a[1] : "•" }), h("div", { className: "nmeta" }, h("b", { textContent: info.name })), h("span", { className: "nval", textContent: id === "sel" ? t("k_toTaste") : K.qtyText(id, q, f) }))); });
  wrap.append(list);
  const addShop = h("button", { type: "button", className: "btn primary full", textContent: "🛒 " + t("k_addToShop") });
  addShop.onclick = () => { addRecipeToShop(r, curServ); toast(t("k_added")); addShop.textContent = "✓ " + t("k_added"); };
  wrap.append(h("div", { className: "row" }, addShop));
  wrap.append(h("h3", { className: "sect", textContent: t("k_steps") }));
  const ol = h("ol", { className: "steps" }); r.e.forEach(s => ol.append(h("li", { textContent: s }))); wrap.append(ol);
  wrap.append(h("p", { className: "notice", textContent: t("k_nutriNote") }));
};

/* ================= Manger équilibré ================= */
let bTab = "guide";
const DAY_KEY = "sc-balance-day", MENU_KEY = "sc-menu";
VIEWS.balance = root => {
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(t("modBalance"), { back: true, options: "balance" })));
  const seg = h("div", { className: "seg" });
  [["guide", t("k_guide")], ["menu", t("k_menu")], ["list", t("k_recipesEq")]].forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(bTab === k)); b.onclick = () => { bTab = k; go("balance"); }; seg.append(b); });
  wrap.append(seg);
  const body = h("div", { style: "margin-top:14px" }); wrap.append(body);
  ({ guide: guideView, menu: menuView, list: eqList })[bTab](body);
  root.append(wrap);
};
function plateSVG() {
  const el = h("div", { className: "plate" });
  el.innerHTML = '<svg viewBox="0 0 200 200" width="170" height="170" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="var(--surface)" stroke="var(--line)" stroke-width="4"/>' +
    '<path d="M100 100 L100 12 A88 88 0 0 0 100 188 Z" fill="#7cc242"/><path d="M100 100 L100 12 A88 88 0 0 1 188 100 Z" fill="#f2c14e"/><path d="M100 100 L188 100 A88 88 0 0 1 100 188 Z" fill="#e8733c"/></svg>';
  el.append(h("div", { className: "plegend" }, h("span", {}, dotc("#7cc242"), t("k_plateVeg")), h("span", {}, dotc("#f2c14e"), t("k_plateStarch")), h("span", {}, dotc("#e8733c"), t("k_plateProt"))));
  return el;
}
function dotc(c) { const d = h("span", { className: "ndot" }); d.style.background = c; return d; }
function guideView(body) {
  // Suivi du jour
  const all = lsGet(DAY_KEY, {}); const k = todayKey(); const day = Object.assign({ fl: 0, water: 0, dairy: 0, whole: false, move: false }, all[k] || {});
  const saveDay = () => { all[k] = day; const keys = Object.keys(all).sort(); while (keys.length > 60) delete all[keys.shift()]; lsSet(DAY_KEY, all); };
  const counter = (key, ico, label, goal) => {
    const val = h("b", { textContent: day[key] + " / " + goal });
    const m = h("button", { type: "button", className: "iconbtn", textContent: "−" }), p = h("button", { type: "button", className: "iconbtn", textContent: "+" });
    const row = h("div", { className: "nrow" + (day[key] >= goal ? " goal" : "") }, h("span", { className: "nico", textContent: ico }), h("div", { className: "nmeta" }, h("b", { textContent: label })), h("div", { className: "stepper" }, m, val, p));
    const upd = () => { val.textContent = day[key] + " / " + goal; row.classList.toggle("goal", day[key] >= goal); saveDay(); };
    m.onclick = () => { if (day[key] > 0) { day[key]--; upd(); } }; p.onclick = () => { day[key]++; upd(); };
    return row;
  };
  const check = (key, ico, label) => { const cb = h("input", { type: "checkbox", checked: day[key] }); cb.onchange = () => { day[key] = cb.checked; saveDay(); }; return h("label", { className: "shoprow" }, h("span", { className: "nico", textContent: ico }), h("div", { className: "nmeta" }, h("b", { textContent: label })), cb); };
  body.append(h("div", { className: "sect2", style: "margin-top:0" }, h("h3", { textContent: t("k_today") }), h("span", { textContent: new Date().toLocaleDateString(settings.lang, { weekday: "long", day: "numeric", month: "long" }) })));
  body.append(h("div", { className: "nlist" }, counter("fl", "🥕", t("k_trFL"), 5), counter("water", "💧", t("k_trWater"), 8), counter("dairy", "🥛", t("k_trDairy"), 2), check("whole", "🌾", t("k_trWhole")), check("move", "🏃", t("k_trMove"))));
  // Assiette équilibrée
  body.append(h("h3", { className: "sect", textContent: t("k_plateTitle") }), h("div", { className: "optcard platecard" }, plateSVG(), h("p", { className: "sub", textContent: t("k_plateTxt") })));
  // Repères PNNS
  const titles = { up: "⬆️ " + t("k_up"), go: "➡️ " + t("k_go"), down: "⬇️ " + t("k_down") };
  for (const sec of K.PNNS) {
    body.append(h("h3", { className: "sect", textContent: titles[sec.k] }));
    body.append(h("div", { className: "nlist" }, ...sec.items.map(([ico, title, txt]) => h("div", { className: "nrow" }, h("span", { className: "nico", textContent: ico }), h("div", { className: "nmeta" }, h("b", { textContent: title }), h("small", { textContent: txt }))))));
  }
  // Grossesse
  const preg = h("details", { className: "ing pregbox", open: !!food().pregnancy }, h("summary", { textContent: "🤰 " + t("k_pregTitle") }));
  preg.append(h("div", { className: "nlist" }, ...K.PREGNANCY_TIPS.map(([ico, title, txt]) => h("div", { className: "nrow" }, h("span", { className: "nico", textContent: ico }), h("div", { className: "nmeta" }, h("b", { textContent: title }), h("small", { textContent: txt }))))));
  body.append(preg);
  body.append(h("p", { className: "notice", textContent: t("k_pnnsSource") }));
}
let eqCat = "all", eqCuis = "all";
function eqList(body) {
  initFilters();
  body.append(h("p", { className: "sub", textContent: t("k_eqHelp") }));
  body.append(chips(CATS.map(c => [c, t("k_cat_" + c)]), k => eqCat === k, k => { eqCat = k; ctx.render(); }));
  body.append(cuisineChips(eqCuis, k => { eqCuis = k; ctx.render(); }));
  const rows = K.RECIPES.filter(r => r.tg.includes("eq") && (eqCuis === "all" || r.w === eqCuis) && matches(r, rFilters, eqCat, ""));
  const list = h("div", { className: "plist", style: "margin-top:12px" }), more = h("div");
  body.append(h("p", { className: "sub", textContent: t("k_nEq", rows.length) }), list, more);
  pagedList(list, rows, more);
}
/* Menu équilibré de la semaine : midi et soir, 2 poissons, 2 légumes secs, peu de viande rouge */
function kind(r) {
  const ids = r.i.map(x => x[0]);
  if (ids.some(id => /saumon|cabillaud|thon|sardine|crevette|moule|colin|truite|dorade|maquereau|calamar/.test(id))) return "fish";
  if (ids.some(id => /boeuf|porc|lardons|agneau|veau|saucisse|merguez|chorizo/.test(id))) return "red";
  if (ids.some(id => /poulet|cuisse|dinde|jambon|magret/.test(id))) return "poultry";
  if (ids.some(id => /lentille|corail|pchiche|hrouge|harblanc|pois$|feve/.test(id))) return "legume";
  return "veg";
}
function menuPool() {
  initFilters();
  return K.RECIPES.filter(r => r.c === "plat" && r.tg.includes("eq") && matches(r, rFilters, "all", ""));
}
/* Semaine ISO : le menu se renouvelle tout seul chaque lundi */
function weekStart(d) { const x = new Date(d || Date.now()); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
function weekKey(d) { const m = weekStart(d); return m.getFullYear() + "-" + (m.getMonth() + 1) + "-" + m.getDate(); }
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t2 = Math.imul(a ^ (a >>> 15), 1 | a); t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2; return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function buildMenu(auto, avoid) {
  const all = menuPool(); if (!all.length) return null;
  const rnd = auto ? seeded(weekStart().getTime() / 86400000) : Math.random;
  const fresh = avoid ? all.filter(r => !avoid.has(r.id)) : all;
  const pool = fresh.length >= 20 ? fresh : all;
  const shuffled = shuffle(pool, rnd);
  const pick = [], used = new Set();
  const take = (k, n) => { for (const r of shuffled) { if (n <= 0) break; if (!used.has(r.id) && kind(r) === k) { pick.push(r.id); used.add(r.id); n--; } } };
  take("fish", 2); take("legume", 3); take("red", 1); take("poultry", 3);
  for (const r of shuffled) { if (pick.length >= 14) break; if (!used.has(r.id) && kind(r) !== "red") { pick.push(r.id); used.add(r.id); } }
  while (pick.length < 14) pick.push(shuffled[pick.length % shuffled.length].id); // petite base : on répète
  const order = shuffle(pick, rnd);
  // Soir : une soupe ou une entrée équilibrée en plus, un soir sur deux
  const light = shuffle(K.RECIPES.filter(r => (r.c === "soupe" || r.c === "entree") && r.tg.includes("eq") && matches(r, rFilters, "all", "")), rnd);
  return { created: weekStart().getTime(), week: weekKey(), days: Array.from({ length: 7 }, (_, d) => ({ lunch: order[d * 2], dinner: order[d * 2 + 1], starter: d % 2 && light.length ? light[d % light.length].id : null })) };
}
function menuView(body) {
  let menu = lsGet(MENU_KEY, null);
  if (!menu || !menu.days || menu.week !== weekKey()) {
    const prev = new Set(menu && menu.days ? menu.days.flatMap(d => [d.lunch, d.dinner]) : []);
    menu = buildMenu(true, prev); if (menu) lsSet(MENU_KEY, menu);
  }
  if (!menu) { body.append(h("p", { className: "sub", textContent: t("k_noMenu") })); return; }
  body.append(h("p", { className: "sub", textContent: t("k_menuHelp") }));
  const start = new Date(menu.created);
  menu.days.forEach((d, i) => {
    const date = new Date(start.getTime() + i * 86400000);
    const card = h("div", { className: "optcard menuday" }, h("h3", { textContent: date.toLocaleDateString(settings.lang, { weekday: "long", day: "numeric", month: "short" }) }));
    [["lunch", "☀️ " + t("k_lunch")], ["dinner", "🌙 " + t("k_dinner")]].forEach(([slot, label]) => {
      const r = K.RECIPES.find(x => x.id === d[slot]); if (!r) return;
      const starter = slot === "dinner" && d.starter ? K.RECIPES.find(x => x.id === d.starter) : null;
      const b = h("button", { type: "button", className: "meal" }, h("small", { textContent: label }), h("b", { textContent: (starter ? starter.n + " + " : "") + r.n }));
      b.onclick = () => openRecipe(r.id, "balance");
      const swap = h("button", { type: "button", className: "iconbtn", textContent: "🔄", ariaLabel: t("k_swap") });
      swap.onclick = () => { const pool = menuPool().filter(x => x.id !== r.id && kind(x) === kind(r)); const alt = (pool.length ? pool : menuPool()).filter(x => x.id !== r.id); if (alt.length) { d[slot] = alt[Math.floor(Math.random() * alt.length)].id; lsSet(MENU_KEY, menu); ctx.render(); } };
      card.append(h("div", { className: "mealrow" }, b, swap));
    });
    body.append(card);
  });
  const shopBtn = h("button", { type: "button", className: "btn primary", textContent: "🛒 " + t("k_menuToShop", S.menuServings) });
  shopBtn.onclick = () => {
    menu.days.forEach(d => ["lunch", "dinner", "starter"].forEach(s => { const r = K.RECIPES.find(x => x.id === d[s]); if (r) addRecipeToShop(r, S.menuServings); }));
    toast(t("k_added")); shopBtn.textContent = "✓ " + t("k_added");
  };
  const again = h("button", { type: "button", className: "btn", textContent: "🎲 " + t("k_newMenu") });
  again.onclick = () => { const m = buildMenu(); if (m) { lsSet(MENU_KEY, m); ctx.render(); } };
  body.append(h("div", { className: "row" }, shopBtn, again));
}

/* ================= Calories d'une assiette ================= */
const MEALS_KEY = "sc-meals";
let meals = lsGet(MEALS_KEY, []);
function saveMeals() { lsSet(MEALS_KEY, meals.slice(0, 200)); }
let draft = null, pGroup = "all", pQuery = "";
function newDraft() { const hr = new Date().getHours(); return { id: "m" + Date.now().toString(36), t: Date.now(), photo: null, items: [], type: hr < 10 ? "breakfast" : hr < 15 ? "lunch" : hr < 18 ? "snack" : "dinner" }; }
function totals(items) { const s = { kcal: 0, p: 0, g: 0, l: 0 }; items.forEach(x => { const f = K.PLATE[x.i]; if (!f) return; s.kcal += f[2] * x.g / 100; s.p += f[3] * x.g / 100; s.g += f[4] * x.g / 100; s.l += f[5] * x.g / 100; }); for (const k in s) s[k] = Math.round(s[k]); return s; }
function photoSrc(ref) { return !ref ? "" : ref.startsWith("data:") ? ref : "/docs/" + ref; }
VIEWS.plate = root => {
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(draft ? t("k_myPlate") : t("modPlate"), { back: true, options: "plate" })));
  root.append(wrap);
  if (draft) return plateEditor(wrap);
  // Accueil du module : photo + journal du jour
  const big = h("button", { type: "button", className: "bigscan platebig" });
  big.innerHTML = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="4"/></svg>';
  big.append(h("b", { textContent: t("k_photoBtn") }), h("span", { textContent: t("k_photoSub") }));
  big.onclick = () => takePlatePhoto();
  const gal = h("button", { type: "button", className: "btn", textContent: "🖼️ " + t("k_fromGallery") });
  gal.onclick = () => ctx.pickPhoto(async f => { draft = newDraft(); draft.photo = await shrinkPhoto(f); go("plate"); });
  const noPhoto = h("button", { type: "button", className: "btn", textContent: "✍️ " + t("k_noPhoto") });
  noPhoto.onclick = () => { draft = newDraft(); go("plate"); };
  wrap.append(big, h("div", { className: "row" }, gal, noPhoto), h("p", { className: "notice", textContent: t("k_plateHonest") }));
  // Journal
  const k = todayKey(), today = meals.filter(m => todayKey(new Date(m.t)) === k);
  const tot = today.reduce((s, m) => s + totals(m.items).kcal, 0);
  const pct = Math.min(100, Math.round(tot / S.kcalTarget * 100));
  wrap.append(h("div", { className: "sect2" }, h("h3", { textContent: t("k_today") }), h("span", { textContent: tot + " / " + S.kcalTarget + " kcal" })));
  const bar = h("div", { className: "kbar" }); const fill = h("div"); fill.style.width = pct + "%"; if (tot > S.kcalTarget) fill.style.background = "#d93a2b"; bar.append(fill); wrap.append(bar);
  const byDay = {}; meals.forEach(m => (byDay[todayKey(new Date(m.t))] ||= []).push(m));
  const days = Object.keys(byDay).sort().reverse().slice(0, 14);
  if (!days.length) wrap.append(h("p", { className: "sub", textContent: t("k_noMeal") }));
  days.forEach(dk => {
    const ms = byDay[dk]; const sum = ms.reduce((s, m) => s + totals(m.items).kcal, 0);
    if (dk !== k) wrap.append(h("div", { className: "sect2" }, h("h3", { textContent: new Date(dk + "T12:00").toLocaleDateString(settings.lang, { weekday: "long", day: "numeric", month: "short" }) }), h("span", { textContent: sum + " kcal" })));
    const list = h("div", { className: "plist" });
    ms.forEach(m => {
      const th = h("div", { className: "pimg" }); if (m.photo) th.style.backgroundImage = "url('" + photoSrc(m.photo) + "')"; else th.textContent = "🍽️";
      const b = h("button", { type: "button", className: "prow" }, th, h("div", { className: "pmeta" }, h("b", { textContent: t("k_meal_" + m.type) + " · " + totals(m.items).kcal + " kcal" }), h("small", { textContent: m.items.map(x => (K.PLATE[x.i] || [""])[0]).join(", ") || "—" })));
      b.onclick = () => { draft = JSON.parse(JSON.stringify(m)); draft.existing = true; go("plate"); };
      list.append(b);
    });
    wrap.append(list);
  });
};
ctx.viewModule.plate = "plate";
function takePlatePhoto() {
  if (NATIVE && NATIVE.takePhoto) {
    window.onPhoto = name => { if (!name) { toast(t("k_photoFail")); return; } draft = newDraft(); draft.photo = name; go("plate"); };
    NATIVE.takePhoto(); return;
  }
  ctx.pickPhoto(async f => { draft = newDraft(); draft.photo = await shrinkPhoto(f); go("plate"); });
}
function shrinkPhoto(file) {
  return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, 520 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .72)); URL.revokeObjectURL(img.src); }; img.onerror = () => res(null); img.src = URL.createObjectURL(file); });
}
function plateEditor(wrap) {
  const d = draft;
  if (d.photo) wrap.append(h("img", { className: "platephoto", src: photoSrc(d.photo), alt: "" }));
  const sel = h("select", { id: "m-type" });
  ["breakfast", "lunch", "snack", "dinner"].forEach(k => sel.append(h("option", { value: k, textContent: t("k_meal_" + k) })));
  sel.value = d.type; sel.onchange = () => { d.type = sel.value; };
  wrap.append(h("label", { className: "f", htmlFor: "m-type" }, t("k_mealType"), sel));
  // Totaux et équilibre
  const tot = totals(d.items);
  wrap.append(h("div", { className: "rmeta", style: "margin-top:14px" },
    h("div", {}, h("b", { textContent: tot.kcal + " kcal" }), h("small", { textContent: t("k_total") })),
    h("div", {}, h("b", { textContent: tot.p + " g" }), h("small", { textContent: t("n_prot") })),
    h("div", {}, h("b", { textContent: tot.g + " g" }), h("small", { textContent: t("k_carbs") })),
    h("div", {}, h("b", { textContent: tot.l + " g" }), h("small", { textContent: t("k_fat") }))));
  const advice = plateAdvice(d.items); if (advice) wrap.append(h("p", { className: "tip", style: "text-align:left", textContent: advice }));
  // Ce qui est dans l'assiette
  wrap.append(h("h3", { className: "sect", textContent: t("k_inPlate") }));
  if (!d.items.length) wrap.append(h("p", { className: "sub", textContent: t("k_addFoods") }));
  const list = h("div", { className: "nlist" });
  d.items.forEach((x, idx) => {
    const f = K.PLATE[x.i]; if (!f) return;
    const sizes = h("div", { className: "sizes" });
    [0, 1, 2].forEach(si => { const b = h("button", { type: "button", textContent: t("k_size" + si) }); b.setAttribute("aria-pressed", String(x.g === f[6][si])); b.onclick = () => { x.g = f[6][si]; ctx.render(); }; sizes.append(b); });
    const m = h("button", { type: "button", className: "iconbtn", textContent: "−" }), p = h("button", { type: "button", className: "iconbtn", textContent: "+" });
    m.onclick = () => { x.g = Math.max(5, x.g - (x.g > 100 ? 25 : 10)); ctx.render(); }; p.onclick = () => { x.g += x.g >= 100 ? 25 : 10; ctx.render(); };
    const del = h("button", { type: "button", className: "iconbtn", textContent: "✕", ariaLabel: t("k_remove") }); del.onclick = () => { d.items.splice(idx, 1); ctx.render(); };
    list.append(h("div", { className: "pitem" }, h("div", { className: "pihead" }, h("div", { className: "nmeta" }, h("b", { textContent: f[0] }), h("small", { textContent: Math.round(f[2] * x.g / 100) + " kcal" })), del),
      h("div", { className: "pctl" }, sizes, h("div", { className: "stepper" }, m, h("b", { textContent: x.g + " g" }), p))));
  });
  wrap.append(list);
  // Ajout d'aliments
  wrap.append(h("h3", { className: "sect", textContent: t("k_addFood") }));
  const q = h("input", { id: "p-q", type: "search", placeholder: t("k_foodSearch"), value: pQuery, autocomplete: "off" });
  const box = h("label", { className: "search", htmlFor: "p-q" }); box.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'; box.append(q);
  wrap.append(box, chips([["all", t("k_cat_all")], ...K.PLATE_GROUPS.map(([k, ico, l]) => [k, ico + " " + l])], k => pGroup === k, k => { pGroup = k; ctx.render(); }));
  const opts = h("div", { className: "foodgrid" });
  const fill = () => {
    opts.textContent = "";
    const n = norm(pQuery.trim());
    K.PLATE.forEach((f, i) => {
      if (pGroup !== "all" && f[1] !== pGroup) return; if (n && !norm(f[0]).includes(n)) return;
      const b = h("button", { type: "button", className: "fchip food" }, h("span", { textContent: f[0] }), h("small", { textContent: f[2] + " kcal/100 g" }));
      b.onclick = () => { d.items.push({ i, g: f[6][1] }); ctx.render(); window.scrollTo(0, 0); toast("+ " + f[0]); };
      opts.append(b);
    });
  };
  let timer; q.oninput = () => { pQuery = q.value; clearTimeout(timer); timer = setTimeout(fill, 150); };
  fill(); wrap.append(opts);
  const save = h("button", { type: "button", className: "btn primary", textContent: t("save") });
  save.onclick = () => { if (!d.items.length) { toast(t("k_addFoods")); return; } const m = { ...d }; delete m.existing; meals = meals.filter(x => x.id !== m.id); meals.unshift(m); meals.sort((a, b) => b.t - a.t); saveMeals(); draft = null; go("plate"); toast(t("k_saved")); };
  const cancel = h("button", { type: "button", className: "btn", textContent: t("cancel") });
  cancel.onclick = () => { if (!d.existing && d.photo && !d.photo.startsWith("data:") && NATIVE && NATIVE.deleteImage) try { NATIVE.deleteImage(d.photo); } catch (e) {} draft = null; go("plate"); };
  wrap.append(h("div", { className: "row" }, cancel, save));
  if (d.existing) wrap.append(ctx.deleteZone(t("k_meal_" + d.type), t("k_deleteMeal"), () => { if (d.photo && !d.photo.startsWith("data:") && NATIVE && NATIVE.deleteImage) try { NATIVE.deleteImage(d.photo); } catch (e) {} meals = meals.filter(x => x.id !== d.id); saveMeals(); draft = null; go("plate"); }));
  wrap.append(h("p", { className: "notice", textContent: t("k_nutriNote") }));
}
function plateAdvice(items) {
  if (!items.length) return "";
  const g = { leg: 0, fec: 0, pro: 0, plat: 0, suc: 0, gra: 0, boi: 0 };
  items.forEach(x => { const f = K.PLATE[x.i]; if (f && g[f[1]] != null) g[f[1]] += x.g; });
  const main = g.leg + g.fec + g.pro + g.plat;
  const tips = [];
  if (main && g.leg < main / 3) tips.push(t("k_adv_veg"));
  if (g.fec + g.plat === 0 && g.leg > 0) tips.push(t("k_adv_starch"));
  if (g.pro + g.plat === 0 && main > 0) tips.push(t("k_adv_prot"));
  if (g.gra > 30) tips.push(t("k_adv_fat"));
  if (g.suc > 100 || g.boi > 0 && items.some(x => /Soda|Jus/.test((K.PLATE[x.i] || [""])[0]))) tips.push(t("k_adv_sugar"));
  return tips.length ? "💡 " + tips.join(" ") : "👍 " + t("k_adv_ok");
}

/* ================= Enregistrement des modules ================= */
ctx.modules.push(
  { key: "recipes", color: "linear-gradient(135deg,#e8590c,#f59f00)", title: () => t("modRecipes"), sub: () => t("modRecipesSub"), badge: () => shopCount() ? "🛒 " + shopCount() : null,
    icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13.9A4 4 0 0 1 7 6a5 5 0 0 1 10 0 4 4 0 0 1 1 7.9V20H6z"/><path d="M6 17h12"/></svg>',
    options: box => {
      const serv = h("input", { type: "number", min: 1, max: 12, value: S.menuServings, id: "o-serv" }); serv.onchange = () => { S.menuServings = Math.max(1, Math.min(12, +serv.value || 2)); saveSettings(); };
      box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("k_menuServ") }), h("label", { className: "f", htmlFor: "o-serv", style: "margin:0" }, t("k_people"), serv)));
    } },
  { key: "balance", color: "linear-gradient(135deg,#2f9e44,#94d82d)", title: () => t("modBalance"), sub: () => t("modBalanceSub"),
    icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/></svg>' },
  { key: "plate", color: "linear-gradient(135deg,#c2255c,#f06595)", title: () => t("modPlate"), sub: () => t("modPlateSub"),
    icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3.5"/><path d="M2 4v6M2 7h1.5M22 4v16"/></svg>',
    options: box => {
      const inp = h("input", { type: "number", min: 1000, max: 5000, step: 50, value: S.kcalTarget, id: "o-kcal" }); inp.onchange = () => { S.kcalTarget = Math.max(800, Math.min(6000, +inp.value || 2000)); saveSettings(); };
      box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("k_kcalTarget") }), h("p", { className: "sub", textContent: t("k_kcalHelp") }), h("label", { className: "f", htmlFor: "o-kcal", style: "margin:0" }, "kcal", inp)));
      const clear = h("button", { type: "button", className: "btn danger full", textContent: t("k_clearMeals") }); clear.onclick = () => { meals.forEach(m => { if (m.photo && !m.photo.startsWith("data:") && NATIVE && NATIVE.deleteImage) try { NATIVE.deleteImage(m.photo); } catch (e) {} }); meals = []; saveMeals(); toast(t("f_cleared")); };
      box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("k_journal") }), clear));
    } }
);
ctx.backHooks.push(() => {
  const v = ctx.view();
  if (v === "recipe") { go(recipeFrom); return true; }
  if (v === "plate" && draft) { draft = null; go("plate"); return true; }
  if (v === "recipes" && rTab !== "ideas") { rTab = "ideas"; go("recipes"); return true; }
  if (v === "balance" && bTab !== "guide") { bTab = "guide"; go("balance"); return true; }
  return false;
});
ctx.addRecipeToShop = addRecipeToShop;
});
