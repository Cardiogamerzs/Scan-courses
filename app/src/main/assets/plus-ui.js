// Version 4.7 : 23 nouveautés rangées dans les modules existants (onglets en plus, rien de nouveau sur l'accueil).
// Recettes : planning de la semaine, saison, régions, substitutions, « Surprends-moi », Noël.
// Courses : où acheter moins cher, panier anti-inflation, ticket de caisse. Promos : calendrier.
// Mon frigo : conservation. Grossesse & bébé : suivi, fer, liste de naissance, biberons et tétées.
// Ma santé : mesures, objectifs, sommeil, méditerranéen. Défis : succès et mascotte. Fiche produit : index glycémique.
(window.SC_EXT = window.SC_EXT || []).push(function (ctx) {
"use strict";
const P = window.SoveePlus, K = window.KitchenData, D = window.FoodData;
if (!P || !K) return;
const { h, t, settings, saveSettings, go, openSheet, closeSheet, lsGet, lsSet, toast, NATIVE } = ctx;
const DAY = 86400e3;
const isoDay = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const euro = v => (Math.round(v * 100) / 100).toFixed(2).replace(".", ",") + " €";
const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : null; };
const fmt1 = x => (Math.round(x * 10) / 10).toLocaleString(settings.lang);
const strip = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const track = (e, d) => { if (ctx.track) ctx.track(e, d || {}); };
const XT = (view, key, label, fn) => (ctx.extraTabs[view] = ctx.extraTabs[view] || []).push([key, label, fn]);
const locale = () => settings.lang || "fr";

function seg(items, cur, onPick, cls) {
  const s = h("div", { className: "seg" + (cls ? " " + cls : "") });
  items.forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(cur === k)); b.onclick = () => onPick(k); s.append(b); });
  return s;
}
function chips(items, cur, onPick) {
  const row = h("div", { className: "chiprow pxchips" });
  items.forEach(([k, l]) => { const b = h("button", { type: "button", className: "fchip", textContent: l }); b.setAttribute("aria-pressed", String(cur === k)); b.onclick = () => onPick(k); row.append(b); });
  return row;
}
const card = (title, ...kids) => h("div", { className: "optcard" }, title ? h("h3", { textContent: title }) : null, ...kids);
const note = txt => h("p", { className: "notice", textContent: "📚 " + txt });
const sub = txt => h("p", { className: "sub", textContent: txt });
const tag = (txt, cls) => h("span", { className: "pxtag" + (cls ? " " + cls : ""), textContent: txt });
function recipeList(list, max) {
  const l = h("div", { className: "plist" });
  list.slice(0, max || 8).forEach(r => l.append(ctx.recipeRow ? ctx.recipeRow(r) : h("div", { textContent: r.n })));
  if (!list.length) l.append(sub(t("px_noRecipe")));
  return l;
}
const findRecipe = id => K.RECIPES.find(r => r.id === id);
function diets() { return (settings.food && settings.food.diets) || []; }
function okDiet(r) {
  const d = K.recipeDiet(r), ds = diets();
  if (ds.includes("vegan") && !d.vegan) return false;
  if ((ds.includes("vegetarian") || ds.includes("vege")) && !d.vege) return false;
  return true;
}

/* ======================= Recettes en plus : Noël et régions ======================= */
for (const [k, v] of Object.entries(P.XMAS_ING || {})) if (!K.ING[k]) K.ING[k] = v;
function addHand(list, prefix, extraTag) {
  const have = new Set(K.RECIPES.map(r => r.n.toLowerCase()));
  list.forEach(([n, w, c, tm, s, tags, ing, steps], i) => {
    if (have.has(n.toLowerCase())) return;
    const tg = (tags ? tags.split(",") : []).concat(extraTag ? [extraTag] : []);
    const r = { id: prefix + i, n, w, c, t: tm, s, tg, i: ing.trim().split(/\s+/).map(x => { const [k, q] = x.split(":"); return [k, +q || 0]; }).filter(([k, q]) => K.ING[k] && (q > 0 || k === "sel")), e: steps.split("|") };
    if (r.c === "plat" && !r.tg.includes("eq")) { const nu = K.recipeNutrition(r); if (nu.kcal >= 280 && nu.kcal <= 800 && nu.p >= 12) r.tg.unshift("eq"); }
    if (r.t <= 25 && !r.tg.includes("rapide")) r.tg.push("rapide");
    K.RECIPES.push(r); have.add(n.toLowerCase());
  });
}
addHand(P.XMAS || [], "noel-");
addHand(P.REGION_RECIPES || [], "reg-");
const REGION_OF = {}; K.RECIPES.forEach(r => { const k = (P.REGION_OF || {})[r.n]; if (k) REGION_OF[r.id] = k; });
function regionRecipes(key) {
  const reg = P.REGIONS.find(x => x[0] === key); if (!reg) return [];
  return K.RECIPES.filter(r => REGION_OF[r.id] === key || (r.w === "fr" && reg[5].test(strip(r.n))));
}

/* ======================= Mode Noël et grand texte ======================= */
settings.xmas = settings.xmas || "auto";
window.SoveeXmas = () => {
  if (settings.xmas === "on") return true;
  if (settings.xmas === "off") return false;
  const d = new Date(), m = d.getMonth(), day = d.getDate();
  return m === 11 || (m === 0 && day <= 6); // du 1er décembre à l'Épiphanie
};
ctx.homeOptions.push(opts => {
  const big = h("input", { type: "checkbox", id: "o-bigtext" }); big.checked = !!settings.bigText;
  big.onchange = () => { settings.bigText = big.checked; saveSettings(); ctx.render(); };
  opts.append(card("🔠 " + t("px_bigText"), sub(t("px_bigTextHelp")), h("label", { className: "toggle", htmlFor: "o-bigtext" }, h("span", { textContent: t("px_bigTextOn") }), big)));
  opts.append(card("🎄 " + t("px_xmas"), sub(t("px_xmasHelp")), seg([["off", t("px_off")], ["auto", "📅 " + t("px_auto")], ["on", "🎄 " + t("px_on")]], settings.xmas, k => { settings.xmas = k; saveSettings(); ctx.render(); })));
});
ctx.homeHooks.push(el => {
  if (!window.SoveeXmas()) return;
  const snow = h("div", { className: "snow", ariaHidden: "true" });
  for (let i = 0; i < 16; i++) { const f = h("i", { textContent: i % 3 ? "❄" : "✦" }); f.style.left = (i * 6.3 + (i % 4) * 2) % 100 + "%"; f.style.animationDelay = (i * 0.7 % 6) + "s"; f.style.animationDuration = (7 + i % 5) + "s"; f.style.fontSize = (10 + i % 4 * 4) + "px"; snow.append(f); }
  el.append(snow);
  const b = h("button", { type: "button", className: "optcard xmascard" }, h("b", { textContent: "🎄 " + t("px_xmasCard") }), h("small", { textContent: t("px_xmasCardSub") }));
  b.onclick = () => { smartTab = "xmas"; ctx.setRecipeTab && ctx.setRecipeTab("smart"); go("recipes"); };
  el.append(b);
});

/* ======================= Recettes : planning de la semaine ======================= */
function mondayTs() { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); }
const curWeek = () => ctx.menuWeekKey ? ctx.menuWeekKey() : isoDay(mondayTs());
function getMenu() { const m = lsGet("sc-menu", null); return m && m.days && m.week === curWeek() ? m : null; }
function saveMenu(m) { lsSet("sc-menu", m); if (m.days.every(d => d.lunch && d.dinner)) track("plan"); }
function pickRecipe(title, onPick) {
  openSheet(sh => {
    sh.append(h("h2", { textContent: title }));
    const q = h("input", { type: "search", id: "px-rq", placeholder: t("px_searchRecipe"), autocomplete: "off" });
    const list = h("div", { className: "plist", style: "margin-top:8px" });
    const show = () => {
      list.textContent = "";
      const s = strip(q.value.trim());
      const res = (s ? K.RECIPES.filter(r => strip(r.n).includes(s)) : K.RECIPES.filter(r => r.c === "plat" && r.tg.includes("eq") && okDiet(r)).sort(() => Math.random() - 0.5)).slice(0, 25);
      res.forEach(r => { const b = h("button", { type: "button", className: "prow" }, h("div", { className: "pimg", textContent: ({ matin: "🥣", entree: "🥗", soupe: "🍲", plat: "🍽️", dessert: "🍰" })[r.c] || "🍽️" }), h("div", { className: "pmeta" }, h("b", { textContent: r.n }), h("small", { textContent: r.t + " min · " + K.recipeNutrition(r).kcal + " kcal" }))); b.onclick = () => { closeSheet(); onPick(r); }; list.append(b); });
      if (!res.length) list.append(sub(t("px_noRecipe")));
    };
    let tm; q.oninput = () => { clearTimeout(tm); tm = setTimeout(show, 200); };
    sh.append(h("div", { className: "f" }, q), list); show();
  });
}
function planView(body) {
  let menu = getMenu();
  if (!menu) {
    const auto = h("button", { type: "button", className: "btn primary", textContent: "🎲 " + t("px_planAuto") });
    auto.onclick = () => { const m = ctx.buildMenu && ctx.buildMenu(); if (m) { saveMenu(m); ctx.render(); } };
    const empty = h("button", { type: "button", className: "btn", textContent: "✍️ " + t("px_planEmpty") });
    empty.onclick = () => { saveMenu({ week: curWeek(), created: mondayTs(), days: Array.from({ length: 7 }, () => ({ lunch: null, dinner: null, starter: null })) }); ctx.render(); };
    body.append(card("📅 " + t("px_planTitle"), sub(t("px_planNone")), h("div", { className: "row" }, auto, empty)));
    return;
  }
  const filled = menu.days.reduce((n, d) => n + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0), 0);
  body.append(sub(t("px_planHelp", filled)));
  const start = new Date(menu.created), today = isoDay();
  menu.days.forEach((d, i) => {
    const date = new Date(start.getTime() + i * DAY);
    const c = h("div", { className: "optcard menuday" + (isoDay(date) === today ? " today" : "") }, h("h3", { textContent: date.toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "short" }) }));
    [["lunch", "☀️ " + t("k_lunch")], ["dinner", "🌙 " + t("k_dinner")]].forEach(([slot, label]) => {
      const r = d[slot] ? findRecipe(d[slot]) : null;
      const main = h("button", { type: "button", className: "meal" + (r ? "" : " emptyslot") }, h("small", { textContent: label }), h("b", { textContent: r ? r.n : "+ " + t("px_planPick") }));
      main.onclick = () => r ? ctx.openRecipe(r.id, "recipes") : pickRecipe(label, x => { d[slot] = x.id; saveMenu(menu); ctx.render(); });
      const ch = h("button", { type: "button", className: "iconbtn", textContent: "✏️", ariaLabel: t("px_planChange") });
      ch.onclick = () => pickRecipe(label, x => { d[slot] = x.id; if (slot === "dinner") d.starter = null; saveMenu(menu); ctx.render(); });
      const del = h("button", { type: "button", className: "iconbtn", textContent: "✕", ariaLabel: t("px_planClear") });
      del.onclick = () => { d[slot] = null; if (slot === "dinner") d.starter = null; saveMenu(menu); ctx.render(); };
      c.append(h("div", { className: "mealrow" }, main, ch, r ? del : null));
    });
    body.append(c);
  });
  const shopBtn = h("button", { type: "button", className: "btn primary", textContent: "🛒 " + t("px_planShop") });
  shopBtn.onclick = () => {
    const serv = ctx.menuServings ? ctx.menuServings() : 2; let n = 0;
    menu.days.forEach(d => ["lunch", "dinner", "starter"].forEach(s => { const r = d[s] && findRecipe(d[s]); if (r) { ctx.addRecipeToShop(r, serv); n++; } }));
    lsSet("sc-shop-week", menu.week); track("menu2shop"); toast("🛒 " + t("px_planShopped", n)); shopBtn.textContent = "✓ " + t("k_added");
  };
  const reset = h("button", { type: "button", className: "btn", textContent: "🗑️ " + t("px_planReset") });
  reset.onclick = () => { lsSet("sc-menu", null); ctx.render(); };
  body.append(h("div", { className: "row" }, shopBtn, reset));
}
XT("recipes", "plan", () => "📅 " + t("px_planTab"), planView);

/* ======================= Recettes : l'onglet « Malin » ======================= */
let smartTab = window.SoveeXmas() ? "xmas" : "season", seasonMonth = new Date().getMonth(), region = null, subQ = "";
function smartView(body) {
  const tabs = [["season", "🌱 " + t("px_season")], ["regions", "🗺️ " + t("px_regions")], ["subs", "🔁 " + t("px_subs")], ["surprise", "🎲 " + t("px_surprise")], ["xmas", "🎄 " + t("px_xmasShort")]];
  body.append(chips(tabs, smartTab, k => { smartTab = k; ctx.render(); }));
  const box = h("div", { style: "margin-top:10px" }); body.append(box);
  ({ season: seasonView, regions: regionsView, subs: subsView, surprise: surpriseView, xmas: xmasView }[smartTab] || seasonView)(box);
}
XT("recipes", "smart", () => "✨ " + t("px_smartTab"), smartView);

function seasonView(box) {
  const m = P.SEASON[seasonMonth];
  const name = new Date(2026, seasonMonth, 1).toLocaleDateString(locale(), { month: "long" });
  const prev = h("button", { type: "button", className: "iconbtn", textContent: "‹", ariaLabel: t("px_prev") }); prev.onclick = () => { seasonMonth = (seasonMonth + 11) % 12; ctx.render(); };
  const next = h("button", { type: "button", className: "iconbtn", textContent: "›", ariaLabel: t("px_next") }); next.onclick = () => { seasonMonth = (seasonMonth + 1) % 12; ctx.render(); };
  box.append(h("div", { className: "monthbar" }, prev, h("b", { textContent: name.charAt(0).toUpperCase() + name.slice(1) + (seasonMonth === new Date().getMonth() ? " · " + t("px_now") : "") }), next));
  const tags = list => { const d = h("div", { className: "pxtags" }); list.forEach(([n]) => d.append(tag(n))); return d; };
  box.append(card("🥕 " + t("px_veg"), tags(m.veg)), card("🍎 " + t("px_fruit"), tags(m.fruit)));
  const keys = new Set(m.veg.concat(m.fruit).map(x => x[1]).filter(Boolean));
  const scored = K.RECIPES.filter(r => r.c !== "matin" && okDiet(r)).map(r => [r, r.i.filter(([k]) => keys.has(k)).length]).filter(x => x[1] >= 2).sort((a, b) => b[1] - a[1] || (b[0].tg.includes("eq") - a[0].tg.includes("eq")));
  const seen = new Set(), pick = [];
  for (const [r] of scored) { const k = r.n.split(/ (au|à|aux|et|de) /)[0]; if (seen.has(k)) continue; seen.add(k); pick.push(r); if (pick.length >= 10) break; }
  box.append(h("h3", { className: "sect", textContent: "👩‍🍳 " + t("px_seasonRecipes") }), recipeList(pick, 10), note(P.SEASON_SRC));
}

function regionsView(box) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg"); svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("class", "frmap");
  const path = document.createElementNS(svgNS, "path"); path.setAttribute("d", P.FRANCE_PATH); path.setAttribute("class", "frland"); svg.append(path);
  P.REGIONS.forEach(([k, n, em, x, y]) => {
    const g = document.createElementNS(svgNS, "g"); g.setAttribute("class", "frpin" + (region === k ? " on" : "")); g.setAttribute("role", "button"); g.setAttribute("tabindex", "0"); g.setAttribute("aria-label", n);
    const c = document.createElementNS(svgNS, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", region === k ? 6.5 : 5.2);
    const tx = document.createElementNS(svgNS, "text"); tx.setAttribute("x", x); tx.setAttribute("y", y + 2.4); tx.setAttribute("text-anchor", "middle"); tx.setAttribute("font-size", "6.5"); tx.textContent = em;
    g.append(c, tx); g.addEventListener("click", () => { region = k; ctx.render(); }); svg.append(g);
  });
  box.append(sub(t("px_regionsHelp")), h("div", { className: "mapwrap" }, svg));
  box.append(chips(P.REGIONS.map(([k, n, em]) => [k, em + " " + n]), region, k => { region = k; ctx.render(); }));
  if (region) {
    const reg = P.REGIONS.find(x => x[0] === region), list = regionRecipes(region).filter(okDiet);
    box.append(h("h3", { className: "sect", textContent: reg[2] + " " + reg[1] + " · " + list.length }));
    const l = recipeList(list, 15);
    l.addEventListener("click", () => track("region", { r: region }), true);
    box.append(l);
  }
  box.append(h("h3", { className: "sect", textContent: "🌍 " + t("px_world") }));
  const w = h("div", { className: "pxtags" });
  (K.CUISINES || []).filter(c => c[0] !== "fr").forEach(([k, f]) => { const b = h("button", { type: "button", className: "fchip", textContent: f + " " + t("k_cuis_" + k) }); b.onclick = () => { region = null; worldPick = k; ctx.render(); }; b.setAttribute("aria-pressed", String(worldPick === k)); w.append(b); });
  box.append(w);
  if (worldPick) { const list = K.RECIPES.filter(r => r.w === worldPick && r.c !== "matin" && okDiet(r)).sort(() => Math.random() - 0.5); box.append(recipeList(list, 8)); }
}
let worldPick = null;

function subsView(box) {
  const q = h("input", { type: "search", id: "px-subq", placeholder: t("px_subsPh"), value: subQ, autocomplete: "off" });
  const list = h("div");
  const show = () => {
    subQ = q.value; list.textContent = "";
    const s = strip(subQ.trim());
    const res = P.SUBS.filter(([em, n, alts]) => !s || strip(n).includes(s) || alts.some(a => strip(a[0]).includes(s)));
    res.forEach(([em, n, alts]) => {
      const c = h("div", { className: "optcard subcard" }, h("h3", { textContent: em + " " + n }));
      alts.forEach(([a, why]) => c.append(h("div", { className: "subalt" }, h("b", { textContent: "→ " + a }), why ? h("small", { textContent: why }) : null)));
      list.append(c);
    });
    if (!res.length) list.append(sub(t("px_subsNone")));
  };
  q.oninput = show;
  box.append(sub(t("px_subsHelp")), h("div", { className: "f" }, q), list, note(P.SUBS_SRC)); show();
}

let surprise = null;
function surpriseView(box) {
  const pool = () => K.RECIPES.filter(r => r.c === "plat" && r.tg.includes("eq") && okDiet(r) && r.t <= 60);
  const roll = () => { const p = pool(); const any = () => p[Math.floor(Math.random() * p.length)]; surprise = { main: any(), dessert: (() => { const ds = K.RECIPES.filter(r => r.c === "dessert" && okDiet(r) && K.recipeNutrition(r).kcal <= 300); return ds[Math.floor(Math.random() * ds.length)]; })() }; track("surprise"); };
  const btn = h("button", { type: "button", className: "btn primary full bigdice", textContent: "🎲 " + t(surprise ? "px_surpriseAgain" : "px_surpriseBtn") });
  btn.onclick = () => { roll(); ctx.render(); };
  box.append(sub(t("px_surpriseHelp")), btn);
  if (surprise && surprise.main) {
    box.append(h("h3", { className: "sect", textContent: "🍽️ " + t("px_surpriseMain") }), recipeList([surprise.main]));
    if (surprise.dessert) box.append(h("h3", { className: "sect", textContent: "🍰 " + t("px_surpriseDessert") }), recipeList([surprise.dessert]));
    const plan = h("button", { type: "button", className: "btn", textContent: "📅 " + t("px_surprisePlan") });
    plan.onclick = () => {
      let m = getMenu(); if (!m) m = { week: curWeek(), created: mondayTs(), days: Array.from({ length: 7 }, () => ({ lunch: null, dinner: null, starter: null })) };
      const i = Math.max(0, Math.min(6, Math.floor((Date.now() - m.created) / DAY))); m.days[i].dinner = surprise.main.id; m.days[i].starter = null; saveMenu(m); toast("📅 " + t("px_surprisePlanned"));
    };
    box.append(h("div", { className: "row", style: "margin-top:10px" }, plan));
  }
}

function xmasView(box) {
  const list = K.RECIPES.filter(r => r.tg.includes("noel"));
  box.append(card("🎄 " + t("px_xmasTitle"), sub(t("px_xmasIntro"))));
  ["entree", "plat", "dessert"].forEach(c => { const l = list.filter(r => r.c === c); if (l.length) { box.append(h("h3", { className: "sect", textContent: { entree: "🥗 " + t("px_starters"), plat: "🍗 " + t("px_mains"), dessert: "🍰 " + t("px_desserts") }[c] }), recipeList(l, 10)); } });
  box.append(note(t("px_xmasSrc")));
}

/* ======================= Courses : moins cher, anti-inflation, ticket ======================= */
(ctx.shopHooks = ctx.shopHooks || []).push(body => {
  const b1 = h("button", { type: "button", className: "btn small", textContent: "🏪 " + t("px_cheaper") }); b1.onclick = cheaperSheet;
  const b2 = h("button", { type: "button", className: "btn small", textContent: "🧺 " + t("px_infl") }); b2.onclick = inflationSheet;
  const b3 = h("button", { type: "button", className: "btn small", textContent: "🧾 " + t("px_ticket") }); b3.onclick = ticketSheet;
  body.append(h("div", { className: "optcard" }, h("h3", { textContent: "💡 " + t("px_smartShop") }), h("div", { className: "row" }, b1, b2, b3)));
});
function codedItems() {
  const shop = ctx.shopApi ? ctx.shopApi.get() : [];
  let items = shop.filter(x => !x.done && x.code && /^\d{8,14}$/.test(x.code)).map(x => ({ code: x.code, name: x.name }));
  let fromHist = false;
  if (!items.length && ctx.foodHistory) { items = ctx.foodHistory().filter(x => x.type === "food" && x.code).slice(0, 10).map(x => ({ code: x.code, name: x.name || x.code })); fromHist = true; }
  const seen = new Set(); items = items.filter(x => !seen.has(x.code) && seen.add(x.code)).slice(0, 15);
  return { items, fromHist };
}
function cheaperSheet() {
  openSheet(async sh => {
    sh.append(h("h2", { textContent: "🏪 " + t("px_cheaper") }));
    const { items, fromHist } = codedItems();
    if (!items.length) { sh.append(sub(t("px_cheaperNone"))); return; }
    sh.append(sub(fromHist ? t("px_cheaperHist", items.length) : t("px_cheaperHelp", items.length)));
    const out = h("div"); out.append(sub("⏳ " + t("f_loading"))); sh.append(out);
    if (!ctx.pricesFor) { out.textContent = ""; out.append(sub(t("f_offline"))); return; }
    const since = isoDay(Date.now() - 365 * DAY);
    const res = await Promise.all(items.map(it => ctx.pricesFor(it.code).then(l => [it, l]).catch(() => [it, []])));
    out.textContent = "";
    const stores = {}, best = [];
    res.forEach(([it, list]) => {
      const latest = {};
      list.filter(x => !x.date || x.date >= since).forEach(x => { const k = strip(x.store).replace(/\s+/g, " ").trim(); if (!k) return; if (!latest[k] || (x.date || "") > (latest[k].date || "")) latest[k] = x; });
      const vals = Object.entries(latest); if (!vals.length) return;
      const min = Math.min(...vals.map(([, x]) => x.price));
      const top = vals.sort((a, b) => a[1].price - b[1].price)[0];
      best.push([it, top[1]]);
      vals.forEach(([k, x]) => { const s = stores[k] || (stores[k] = { name: x.store, n: 0, ratio: 0, sum: 0 }); s.n++; s.ratio += x.price / min; s.sum += x.price; });
    });
    if (!best.length) { out.append(sub(t("px_cheaperNoData"))); }
    else {
      const rank = Object.values(stores).filter(s => s.n >= Math.min(2, best.length)).sort((a, b) => b.n - a.n || a.ratio / a.n - b.ratio / b.n).slice(0, 8)
        .sort((a, b) => a.ratio / a.n - b.ratio / b.n);
      if (rank.length) {
        out.append(h("h3", { className: "sect", textContent: "🏆 " + t("px_cheaperRank") }));
        const l = h("div", { className: "nlist" });
        rank.forEach((s, i) => l.append(h("div", { className: "nrow" }, h("span", { className: "nico", textContent: ["🥇", "🥈", "🥉"][i] || "🏪" }), h("div", { className: "nmeta" }, h("b", { textContent: s.name }), h("small", { textContent: t("px_cheaperCover", s.n, best.length) })), h("span", { className: "nval", textContent: "+" + Math.round((s.ratio / s.n - 1) * 100) + " %" }))));
        out.append(l, sub(t("px_cheaperIdx")));
      }
      out.append(h("h3", { className: "sect", textContent: "🔎 " + t("px_cheaperBest") }));
      const l2 = h("div", { className: "nlist" });
      best.forEach(([it, x]) => { const r = h("button", { type: "button", className: "nrow" }, h("div", { className: "nmeta" }, h("b", { textContent: it.name }), h("small", { textContent: [x.store, x.city, x.date ? new Date(x.date + "T12:00").toLocaleDateString(locale(), { day: "numeric", month: "short", year: "2-digit" }) : null].filter(Boolean).join(" · ") })), h("span", { className: "nval", textContent: euro(x.price) })); r.onclick = () => { if (ctx.openPrices) ctx.openPrices(it.code, it.name); }; l2.append(r); });
      out.append(l2);
    }
    out.append(note(t("px_cheaperSrc")));
  });
}
function inflationSheet() {
  openSheet(async sh => {
    sh.append(h("h2", { textContent: "🧺 " + t("px_infl") }), sub(t("px_inflHelp")));
    const out = h("div"); out.append(sub("⏳ " + t("f_loading"))); sh.append(out);
    const rows = D ? await D.loadIndex("food").catch(() => []) : [];
    out.textContent = "";
    const byCode = new Map(rows.map(r => [r.c, r]));
    const shop = ctx.shopApi ? ctx.shopApi.get().filter(x => !x.done && x.code) : [];
    const hist = ctx.foodHistory ? ctx.foodHistory().filter(x => x.type === "food" && x.code).slice(0, 20) : [];
    const cand = [], seen = new Set();
    shop.concat(hist).forEach(x => { const r = byCode.get(x.code); if (r && !seen.has(r.c) && !P.MDD.test(r.b || "")) { seen.add(r.c); cand.push(r); } });
    let shown = 0;
    cand.forEach(r => {
      if (shown >= 8 || !r.k) return;
      const sc = x => { if (x.__sv === undefined) x.__sv = ctx.foodScore ? ctx.foodScore(D.rowAsProduct(x)) : null; return x.__sv; };
      const base = sc(r);
      const alts = rows.filter(x => x.k === r.k && (!r.k2 || x.k2 === r.k2) && (!r.g || x.g === r.g) && x.c !== r.c && P.MDD.test(x.b || "") && sc(x) != null && (base == null || sc(x) >= base - 5)).sort((a, b) => sc(b) - sc(a)).slice(0, 3);
      if (!alts.length) return;
      shown++;
      out.append(h("h3", { className: "sect", textContent: "🔄 " + (r.n || r.c) + (r.b ? " (" + r.b + ")" : "") + (base != null ? " · " + base + "/100" : "") }));
      const l = h("div", { className: "plist" });
      alts.forEach(x => l.append(ctx.productRow(D.rowAsProduct(x), { score: sc(x) })));
      out.append(l);
    });
    if (!shown) out.append(sub(cand.length ? t("px_inflNoAlt") : t("px_inflNone")));
    const tips = h("ul", { className: "pxlist" }); [1, 2, 3, 4, 5, 6].forEach(i => tips.append(h("li", { textContent: t("px_inflTip" + i) })));
    out.append(card("💡 " + t("px_inflTips"), tips), note(t("px_inflSrc")));
  });
}
// Lecture d'un ticket de caisse : lignes « LIBELLÉ  1,23 » et le total
function parseTicket(text) {
  const lines = String(text || "").split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const SKIP = /\btva\b|carte|\bcb\b|rendu|esp[eè]ce|sous.?total|remise|fid[eé]lit|points?\b|cagnotte|ticket|merci|siret|t[eé]l\b|tel\.|caisse|magasin|n°|date|heure|\bht\b|ttc|montant|r[eé]gl|paiement|visa|mastercard|sans contact|transaction|avoir|bon d|article|nombre|qt[eé]/i;
  const items = []; let total = null;
  for (const l of lines) {
    const m = l.match(/^(.*?)[\s.:*x]*(-?\d{1,4}[.,]\d{2})\s*(€|eur|[a-z])?\s*$/i);
    if (!m) continue;
    const label = m[1].replace(/[\d]+\s*x\s*[\d.,]+/i, "").replace(/[*#]+/g, "").trim(), v = num(m[2]);
    if (/total|[aà] payer|net/i.test(label) && !/sous/i.test(label)) { if (v > 0) total = v; continue; }
    if (!label || label.length < 3 || SKIP.test(label) || !/[a-z]{2}/i.test(label) || v <= 0 || v > 500) continue;
    items.push({ name: label.charAt(0).toUpperCase() + label.slice(1).toLowerCase(), price: v, keep: false });
  }
  if (total == null && items.length) total = Math.round(items.reduce((s, x) => s + x.price, 0) * 100) / 100;
  return { items, total };
}
ctx.parseTicket = parseTicket;
function ticketSheet() {
  openSheet(sh => {
    sh.append(h("h2", { textContent: "🧾 " + t("px_ticket") }), sub(t("px_ticketHelp")));
    const status = h("p", { className: "sub" });
    const ta = h("textarea", { rows: 5, id: "px-ticket", placeholder: t("px_ticketPh") });
    const res = h("div");
    const analyse = txt => { if (txt != null) ta.value = txt; showTicket(res, parseTicket(ta.value)); };
    if (NATIVE && NATIVE.ocrPhoto) {
      const cam = h("button", { type: "button", className: "btn primary", textContent: "📷 " + t("u_takePhoto") });
      const gal = h("button", { type: "button", className: "btn", textContent: "🖼️ " + t("u_fromGallery") });
      window.onOcr = (text, err) => { if (text && text.trim()) { status.textContent = "✓ " + t("px_ticketRead"); analyse(text); } else status.textContent = err === "cancel" ? "" : t("u_ocrFail"); };
      cam.onclick = () => { status.textContent = t("u_reading"); NATIVE.ocrPhoto(false); };
      gal.onclick = () => { status.textContent = t("u_reading"); NATIVE.ocrPhoto(true); };
      sh.append(h("div", { className: "row" }, cam, gal));
    }
    const go2 = h("button", { type: "button", className: "btn", textContent: "🔎 " + t("px_ticketAnalyse") }); go2.onclick = () => analyse();
    sh.append(status, h("div", { className: "f" }, ta), go2, res);
  });
}
function showTicket(res, tk) {
  res.textContent = "";
  if (!tk.items.length && !tk.total) { res.append(sub(t("px_ticketNothing"))); return; }
  const tot = h("input", { type: "number", step: "0.01", min: 0, id: "px-tktotal", value: tk.total != null ? tk.total.toFixed(2) : "" });
  res.append(h("label", { className: "flabel", htmlFor: "px-tktotal", textContent: t("px_ticketTotal") }), h("div", { className: "f" }, tot));
  if (tk.items.length) {
    res.append(sub(t("px_ticketItems", tk.items.length)));
    const l = h("div", { className: "nlist" });
    tk.items.forEach(x => { const cb = h("input", { type: "checkbox" }); cb.onchange = () => { x.keep = cb.checked; }; l.append(h("label", { className: "shoprow" }, cb, h("div", { className: "nmeta" }, h("b", { textContent: x.name })), h("span", { className: "nval", textContent: euro(x.price) }))); });
    res.append(l);
  }
  let days = 5;
  const dsel = seg([[3, "3 j"], [5, "5 j"], [7, "7 j"], [14, "14 j"]], days, k => { days = k; [...dsel.children].forEach((b, i) => b.setAttribute("aria-pressed", String([3, 5, 7, 14][i] === k))); });
  if (tk.items.length) res.append(sub(t("px_ticketFridge")), dsel);
  const save = h("button", { type: "button", className: "btn primary full", textContent: "✅ " + t("px_ticketSave") });
  save.onclick = () => {
    const v = num(tot.value);
    if (v > 0) { const key = ctx.monthKey ? ctx.monthKey() : isoDay().slice(0, 7), sp = lsGet(ctx.SPEND_KEY || "sc-spend", {}); sp[key] = Math.round(((sp[key] || 0) + v) * 100) / 100; lsSet(ctx.SPEND_KEY || "sc-spend", sp); }
    const keep = tk.items.filter(x => x.keep);
    if (ctx.addExpiryQuick) keep.forEach(x => ctx.addExpiryQuick(x.name, isoDay(Date.now() + days * DAY)));
    track("ticket"); closeSheet(); toast("🧾 " + t("px_ticketSaved", v > 0 ? euro(v) : "—", keep.length)); ctx.render();
  };
  res.append(h("div", { style: "margin-top:12px" }, save));
}

/* ======================= Promos : calendrier ======================= */
(ctx.pricesHooks = ctx.pricesHooks || []).push(wrap => {
  const m = new Date().getMonth() + 1;
  const inM = (e, mm) => e[0] <= e[1] ? mm >= e[0] && mm <= e[1] : mm >= e[0] || mm <= e[1];
  const now = P.PROMO_CAL.filter(e => inM(e, m));
  const soon = P.PROMO_CAL.filter(e => !inM(e, m) && (inM(e, m % 12 + 1) || inM(e, (m + 1) % 12 + 1)));
  wrap.append(h("div", { className: "sect2" }, h("h3", { textContent: "📆 " + t("px_promoCal") }), h("span", { textContent: new Date().toLocaleDateString(locale(), { month: "long" }) })));
  const row = e => h("div", { className: "nrow" }, h("span", { className: "nico", textContent: e[2] }), h("div", { className: "nmeta" }, h("b", { textContent: e[3] }), h("small", { textContent: e[4] })));
  const l = h("div", { className: "nlist" });
  if (now.length) { l.append(h("div", { className: "nhead", textContent: t("px_promoNow") })); now.forEach(e => l.append(row(e))); }
  if (soon.length) { l.append(h("div", { className: "nhead", textContent: t("px_promoSoon") })); soon.forEach(e => l.append(row(e))); }
  const all = h("details", { className: "pxdetails" }, h("summary", { textContent: t("px_promoAll") }));
  const l2 = h("div", { className: "nlist" }); P.PROMO_CAL.forEach(e => l2.append(row(e))); all.append(l2);
  wrap.append(l, all, note(P.PROMO_SRC));
});

/* ======================= Mon frigo : conservation ======================= */
let keepQ = "";
XT("fridge", "keep", () => "❄️ " + t("px_keepTab"), body => {
  const q = h("input", { type: "search", id: "px-keepq", placeholder: t("px_keepPh"), value: keepQ, autocomplete: "off" });
  const list = h("div", { className: "nlist" });
  const show = () => {
    keepQ = q.value; list.textContent = ""; const s = strip(keepQ.trim());
    P.KEEP.filter(x => !s || strip(x[1]).includes(s)).forEach(([em, n, fr, fz, tip]) => list.append(h("div", { className: "nrow keeprow" }, h("span", { className: "nico", textContent: em }), h("div", { className: "nmeta" }, h("b", { textContent: n }), h("small", { textContent: "🧊 " + t("px_keepFridge") + " : " + fr + " · ❄️ " + t("px_keepFreezer") + " : " + fz }), tip ? h("small", { className: "tip", textContent: "💡 " + tip }) : null))));
    if (!list.children.length) list.append(sub(t("px_keepNone")));
  };
  q.oninput = show;
  const tips = h("ul", { className: "pxlist" }); P.KEEP_TIPS.forEach(x => tips.append(h("li", { textContent: x })));
  body.append(card("✅ " + t("px_keepRules"), tips), h("div", { className: "f" }, q), list, note(P.KEEP_SRC)); show();
});

/* ======================= Grossesse & bébé : suivi, fer, naissance, biberons ======================= */
const RDV_KEY = "sc-preg-rdv", BIRTH_KEY = "sc-birth", FEED_KEY = "sc-feeds";
function ironCard(body) {
  body.append(h("h3", { className: "sect", textContent: "🩸 " + t("px_iron") }));
  P.IRON.forEach(([title, text, ings]) => {
    const set = new Set(ings);
    const recs = K.RECIPES.filter(r => r.c !== "dessert" && r.c !== "matin" && r.tg.includes("eq") && okDiet(r) && r.i.some(([k]) => set.has(k)) && !r.i.some(([k]) => k === "oeufcru" || k === "saumonfume" || k === "jamboncru" || k === "reblochon")).sort(() => Math.random() - 0.5).slice(0, 3);
    const det = h("details", { className: "pxdetails" }, h("summary", { textContent: t("px_ironRecipes") }), recipeList(recs, 3));
    body.append(card(title, sub(text), det));
  });
  body.append(note(P.IRON_SRC));
}
XT("family", "follow", () => "📆 " + t("px_followTab"), body => {
  const pi = ctx.extrasApi && ctx.extrasApi.pregInfo();
  if (!pi || pi.days < -30) {
    const b = h("button", { type: "button", className: "btn primary", textContent: "🤰 " + t("px_followSet") });
    b.onclick = () => { ctx.extrasApi.setFamTab("preg"); go("family"); };
    body.append(card("📆 " + t("px_followTitle"), sub(t("px_followNone")), b));
  } else {
    const sa = Math.min(41, Math.max(0, pi.sa)), fr = P.FRUIT[Math.min(41, Math.max(4, sa))] || P.FRUIT[41];
    const hero = h("div", { className: "optcard preghero2" }, h("div", { className: "bigfruit", textContent: fr[0] }), h("div", {}, h("b", { textContent: t("px_followSA", sa) }), h("p", { textContent: sa >= 4 ? t("px_followFruit", fr[1]) : t("px_followEarly") }), h("small", { textContent: pi.days > 0 ? t("px_followDays", pi.days) : t("px_followTerm") })));
    const bar = h("div", { className: "kbar" }), fill = h("div"); fill.style.width = Math.min(100, sa / 41 * 100) + "%"; bar.append(fill); hero.append(bar);
    body.append(hero, h("p", { className: "notice", textContent: P.FRUIT_NOTE }));
    const done = lsGet(RDV_KEY, {});
    body.append(h("h3", { className: "sect", textContent: "🩺 " + t("px_rdv") }));
    const l = h("div", { className: "nlist" });
    P.RDV.forEach(([id, from, to, title, det]) => {
      const st = done[id] ? "done" : sa > to ? "late" : sa >= from ? "now" : "soon";
      const cb = h("input", { type: "checkbox", checked: !!done[id] });
      cb.onchange = () => { const d = lsGet(RDV_KEY, {}); if (cb.checked) d[id] = Date.now(); else delete d[id]; lsSet(RDV_KEY, d); ctx.render(); };
      l.append(h("label", { className: "shoprow rdv " + st }, cb, h("div", { className: "nmeta" }, h("b", { textContent: title }), h("small", { textContent: det }), tag(t("px_rdv_" + st) + (st === "soon" || st === "now" ? " · " + from + "–" + to + " SA" : ""), st))));
    });
    body.append(l, note(P.RDV_SRC));
  }
  ironCard(body);
  // Liste de naissance
  const got = lsGet(BIRTH_KEY, {}), total = P.BIRTH.reduce((n, g) => n + g[1].length, 0), have = Object.keys(got).length;
  body.append(h("div", { className: "sect2" }, h("h3", { textContent: "🎁 " + t("px_birth") }), h("span", { textContent: have + "/" + total })));
  P.BIRTH.forEach(([g, items]) => {
    const n = items.filter(x => got[g + "|" + x]).length;
    const det = h("details", { className: "pxdetails" }, h("summary", { textContent: g + " · " + n + "/" + items.length }));
    const l = h("div", { className: "nlist" });
    items.forEach(x => { const k = g + "|" + x, cb = h("input", { type: "checkbox", checked: !!got[k] }); cb.onchange = () => { const d = lsGet(BIRTH_KEY, {}); if (cb.checked) d[k] = 1; else delete d[k]; lsSet(BIRTH_KEY, d); }; l.append(h("label", { className: "shoprow" }, cb, h("div", { className: "nmeta" }, h("b", { textContent: x })))); });
    det.append(l); body.append(det);
  });
});
let feedKind = "left";
XT("family", "feeds", () => "🍼 " + t("px_feedsTab"), body => {
  const feeds = lsGet(FEED_KEY, []);
  const last = feeds[0];
  if (last) {
    const mins = Math.round((Date.now() - last.t) / 60000);
    const side = feeds.find(x => x.k === "left" || x.k === "right");
    body.append(h("div", { className: "optcard feedhero" }, h("b", { textContent: t("px_feedsLast", mins < 60 ? mins + " min" : Math.floor(mins / 60) + " h " + String(mins % 60).padStart(2, "0")) }), side ? h("small", { textContent: t("px_feedsSide", t("px_feed_" + side.k)) }) : null));
  }
  const kinds = [["left", "🤱 " + t("px_feed_left")], ["right", "🤱 " + t("px_feed_right")], ["bottle", "🍼 " + t("px_feed_bottle")]];
  const amount = h("input", { type: "number", id: "px-feedq", min: 0, step: feedKind === "bottle" ? 10 : 1, value: feedKind === "bottle" ? 90 : 10 });
  const time = h("input", { type: "time", id: "px-feedt", value: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(11, 16) });
  const add = h("button", { type: "button", className: "btn primary full", textContent: "➕ " + t("px_feedsAdd") });
  add.onclick = () => {
    const [hh, mm] = time.value.split(":").map(Number), d = new Date(); d.setHours(hh || 0, mm || 0, 0, 0); if (d.getTime() > Date.now() + 60000) d.setDate(d.getDate() - 1);
    const q = num(amount.value), x = { t: d.getTime(), k: feedKind }; if (q > 0) x[feedKind === "bottle" ? "ml" : "min"] = q;
    const all = lsGet(FEED_KEY, []); all.push(x); all.sort((a, b) => b.t - a.t); lsSet(FEED_KEY, all.slice(0, 600)); toast("🍼 " + t("saved")); ctx.render();
  };
  body.append(card("➕ " + t("px_feedsNew"), seg(kinds, feedKind, k => { feedKind = k; ctx.render(); }),
    h("div", { className: "row2" }, h("label", { className: "flabel", htmlFor: "px-feedq", textContent: feedKind === "bottle" ? t("px_feedsMl") : t("px_feedsMin") }), h("label", { className: "flabel", htmlFor: "px-feedt", textContent: t("px_feedsTime") })),
    h("div", { className: "row2" }, h("div", { className: "f" }, amount), h("div", { className: "f" }, time)), add));
  const day = feeds.filter(x => x.t > Date.now() - DAY);
  const ml = day.reduce((s, x) => s + (x.ml || 0), 0);
  body.append(h("div", { className: "sect2" }, h("h3", { textContent: "📋 " + t("px_feeds24") }), h("span", { textContent: t("px_feedsCount", day.length) + (ml ? " · " + ml + " ml" : "") })));
  const l = h("div", { className: "nlist" });
  feeds.slice(0, 30).forEach(x => {
    const del = h("button", { type: "button", className: "iconbtn", textContent: "✕", ariaLabel: t("px_planClear") });
    del.onclick = () => { lsSet(FEED_KEY, lsGet(FEED_KEY, []).filter(y => !(y.t === x.t && y.k === x.k))); ctx.render(); };
    l.append(h("div", { className: "nrow" }, h("span", { className: "nico", textContent: x.k === "bottle" ? "🍼" : "🤱" }), h("div", { className: "nmeta" }, h("b", { textContent: new Date(x.t).toLocaleString(locale(), { weekday: "short", hour: "2-digit", minute: "2-digit" }) }), h("small", { textContent: t("px_feed_" + x.k) + (x.ml ? " · " + x.ml + " ml" : x.min ? " · " + x.min + " min" : "") })), del));
  });
  if (!feeds.length) l.append(sub(t("px_feedsEmpty")));
  body.append(l, h("p", { className: "notice", textContent: "ℹ️ " + t("px_feedsInfo") }));
});

/* ======================= Ma santé : mesures ======================= */
const HEALTH_KEY = "sc-health";
settings.health = Object.assign({ sex: "", birthYear: "", height: "", activity: 1.375, goal: "keep", tri: 2 }, settings.health || {});
const HS = settings.health;
let mKind = "w";
function lastOf(k) { return lsGet(HEALTH_KEY, []).filter(x => x.k === k).sort((a, b) => b.t - a.t)[0]; }
function bmiClass(b) { return b < 18.5 ? ["low", t("px_bmiLow")] : b < 25 ? ["ok", t("px_bmiOk")] : b < 30 ? ["mid", t("px_bmiOver")] : ["high", t("px_bmiObese")]; }
function bpClass(s, d) { return s >= 180 || d >= 110 ? ["high", t("px_bpVeryHigh")] : s >= 135 || d >= 85 ? ["mid", t("px_bpHigh")] : s < 90 || d < 60 ? ["low", t("px_bpLow")] : ["ok", t("px_bpOk")]; }
function glyClass(v, ctxk) { if (ctxk === "fast") return v < 0.7 ? ["low", t("px_glyLow")] : v < 1.1 ? ["ok", t("px_glyOk")] : v < 1.26 ? ["mid", t("px_glyMid")] : ["high", t("px_glyHigh")]; return v < 0.7 ? ["low", t("px_glyLow")] : v < 1.4 ? ["ok", t("px_glyOk")] : v < 2 ? ["mid", t("px_glyMidPost")] : ["high", t("px_glyHighPost")]; }
function chart(points, series) {
  const W = 300, H = 120, pad = 8;
  if (points.length < 2) return sub(t("px_chartMore"));
  const xs = points.map(p => p.t), all = series.flatMap(s => points.map(p => p[s]).filter(v => v != null));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...all), y1 = Math.max(...all), dy = (y1 - y0) || 1;
  const X = v => pad + (v - x0) / ((x1 - x0) || 1) * (W - 2 * pad), Y = v => H - pad - (v - y0) / dy * (H - 2 * pad);
  const lines = series.map((s, i) => '<polyline fill="none" stroke="' + ["#e8335a", "#1971c2"][i] + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="' + points.filter(p => p[s] != null).map(p => X(p.t).toFixed(1) + "," + Y(p[s]).toFixed(1)).join(" ") + '"/>' + points.filter(p => p[s] != null).map(p => '<circle cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p[s]).toFixed(1) + '" r="2.6" fill="' + ["#e8335a", "#1971c2"][i] + '"/>').join("")).join("");
  const el = h("div", { className: "pxchart" });
  el.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="' + (H - pad) + '" x2="' + W + '" y2="' + (H - pad) + '" stroke="currentColor" opacity=".15"/>' + lines + "</svg>";
  el.append(h("div", { className: "chartlab" }, h("small", { textContent: fmt1(y1) }), h("small", { textContent: fmt1(y0) })));
  return el;
}
XT("meds", "measures", () => "📈 " + t("px_measTab"), body => {
  const data = lsGet(HEALTH_KEY, []);
  body.append(seg([["w", "⚖️ " + t("px_weight")], ["bp", "❤️ " + t("px_bp")], ["gly", "🩸 " + t("px_gly")]], mKind, k => { mKind = k; ctx.render(); }));
  const f = h("div", { className: "optcard" });
  const inp = (id, ph, step) => h("input", { type: "number", id, placeholder: ph, step: step || "any", inputMode: "decimal" });
  let a, b, gctx = "fast";
  if (mKind === "w") { a = inp("px-mw", "kg", "0.1"); f.append(h("label", { className: "flabel", htmlFor: "px-mw", textContent: t("px_weightKg") }), h("div", { className: "f" }, a)); }
  else if (mKind === "bp") { a = inp("px-ms", "120", "1"); b = inp("px-md", "80", "1"); f.append(h("div", { className: "row2" }, h("label", { className: "flabel", htmlFor: "px-ms", textContent: t("px_sys") }), h("label", { className: "flabel", htmlFor: "px-md", textContent: t("px_dia") })), h("div", { className: "row2" }, h("div", { className: "f" }, a), h("div", { className: "f" }, b))); }
  else { a = inp("px-mg", "0,95", "0.01"); const gs = seg([["fast", t("px_glyFast")], ["post", t("px_glyPost")]], gctx, k => { gctx = k; [...gs.children].forEach((x, i) => x.setAttribute("aria-pressed", String(["fast", "post"][i] === k))); }); f.append(h("label", { className: "flabel", htmlFor: "px-mg", textContent: t("px_glyGL") }), h("div", { className: "f" }, a), gs); }
  const add = h("button", { type: "button", className: "btn primary full", textContent: "➕ " + t("px_measAdd"), style: "margin-top:10px" });
  add.onclick = () => {
    const v = num(a.value), v2 = b ? num(b.value) : null;
    const ok = mKind === "w" ? v > 20 && v < 350 : mKind === "bp" ? v > 50 && v < 260 && v2 > 30 && v2 < 160 : v > 0.2 && v < 6;
    if (!ok) { toast("⚠️ " + t("px_measBad")); return; }
    const x = { t: Date.now(), k: mKind, v }; if (mKind === "bp") x.v2 = v2; if (mKind === "gly") x.c = gctx;
    const all = lsGet(HEALTH_KEY, []); all.push(x); lsSet(HEALTH_KEY, all.slice(-1500)); track("measure"); toast("✓ " + t("saved")); ctx.render();
  };
  f.append(add); body.append(f);
  const list = data.filter(x => x.k === mKind).sort((x, y) => x.t - y.t), last = list[list.length - 1];
  if (last) {
    let cls, extra = null;
    if (mKind === "w") { const hm = num(HS.height) / 100; if (hm > 1) { const bmi = last.v / hm / hm; cls = bmiClass(bmi); extra = t("px_bmi", fmt1(bmi)); } }
    else if (mKind === "bp") cls = bpClass(last.v, last.v2); else cls = glyClass(last.v, last.c);
    const val = mKind === "w" ? fmt1(last.v) + " kg" : mKind === "bp" ? last.v + "/" + last.v2 + " mmHg" : fmt1(last.v) + " g/L";
    body.append(h("div", { className: "optcard lastmeas" }, h("small", { textContent: t("px_measLast") + " · " + new Date(last.t).toLocaleDateString(locale(), { day: "numeric", month: "short" }) }), h("b", { textContent: val }), extra ? h("span", { textContent: extra }) : null, cls ? tag(cls[1], cls[0]) : null,
      mKind === "w" && !num(HS.height) ? h("small", { textContent: t("px_bmiNeedHeight") }) : null));
    body.append(chart(list.slice(-30), mKind === "bp" ? ["v", "v2"] : ["v"]));
  }
  const refs = { w: ["px_refBmi"], bp: ["px_refBp1", "px_refBp2"], gly: ["px_refGly1", "px_refGly2"] }[mKind];
  const ul = h("ul", { className: "pxlist" }); refs.forEach(k => ul.append(h("li", { textContent: t(k) })));
  body.append(card("📏 " + t("px_refs"), ul));
  if (list.length) {
    const l = h("div", { className: "nlist" });
    list.slice(-10).reverse().forEach(x => {
      const del = h("button", { type: "button", className: "iconbtn", textContent: "✕", ariaLabel: t("px_planClear") });
      del.onclick = () => { lsSet(HEALTH_KEY, lsGet(HEALTH_KEY, []).filter(y => !(y.t === x.t && y.k === x.k))); ctx.render(); };
      l.append(h("div", { className: "nrow" }, h("div", { className: "nmeta" }, h("b", { textContent: x.k === "w" ? fmt1(x.v) + " kg" : x.k === "bp" ? x.v + "/" + x.v2 + " mmHg" : fmt1(x.v) + " g/L · " + t(x.c === "post" ? "px_glyPost" : "px_glyFast") }), h("small", { textContent: new Date(x.t).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })), del));
    });
    body.append(h("h3", { className: "sect", textContent: "🗂️ " + t("px_measHist") }), l);
  }
  body.append(h("div", { className: "alert medwarn", textContent: "⚠️ " + t("px_measWarn") }), note(t("px_measSrc")));
});

/* ======================= Ma santé : objectifs ======================= */
function goalCalc() {
  const w = (lastOf("w") || {}).v, hcm = num(HS.height), age = new Date().getFullYear() - (num(HS.birthYear) || 0);
  if (!w || !hcm || !HS.sex || !(age > 14 && age < 100)) return null;
  const bmr = 10 * w + 6.25 * hcm - 5 * age + (HS.sex === "m" ? 5 : -161);
  const tdee = bmr * HS.activity;
  const pi = ctx.extrasApi && ctx.extrasApi.pregInfo(), tri = pi && pi.days > 0 ? pi.tri : HS.tri;
  let kcal = tdee, prot = 0.83 * w;
  if (HS.goal === "lose") kcal = tdee * 0.85;
  if (HS.goal === "muscle") { kcal = tdee * 1.1; prot = 1.6 * w; }
  if (HS.goal === "preg") { kcal = tdee + [0, 70, 260, 500][tri]; prot += [0, 1, 9, 28][tri]; }
  const water = (HS.sex === "m" ? 2.5 : 2.0) + (HS.goal === "preg" ? 0.3 : 0);
  return { bmr, tdee, kcal: Math.round(kcal / 50) * 50, prot: Math.round(prot), water, bmi: w / (hcm / 100) ** 2, tri, w };
}
XT("meds", "goals", () => "🎯 " + t("px_goalsTab"), body => {
  const f = h("div", { className: "optcard" }, h("h3", { textContent: "👤 " + t("px_profile") }));
  f.append(seg([["f", "♀ " + t("px_woman")], ["m", "♂ " + t("px_man")]], HS.sex, k => { HS.sex = k; if (k === "m" && HS.goal === "preg") HS.goal = "keep"; saveSettings(); ctx.render(); }));
  const by = h("input", { type: "number", id: "px-by", min: 1920, max: 2015, value: HS.birthYear || "", placeholder: "1985" });
  const hg = h("input", { type: "number", id: "px-hg", min: 120, max: 230, value: HS.height || "", placeholder: "170" });
  by.onchange = () => { HS.birthYear = by.value; saveSettings(); ctx.render(); }; hg.onchange = () => { HS.height = hg.value; saveSettings(); ctx.render(); };
  f.append(h("div", { className: "row2", style: "margin-top:10px" }, h("label", { className: "flabel", htmlFor: "px-by", textContent: t("px_birthYear") }), h("label", { className: "flabel", htmlFor: "px-hg", textContent: t("px_height") })), h("div", { className: "row2" }, h("div", { className: "f" }, by), h("div", { className: "f" }, hg)));
  const lw = lastOf("w");
  f.append(sub(lw ? t("px_weightFrom", fmt1(lw.v)) : t("px_weightNeed")));
  if (!lw) { const b = h("button", { type: "button", className: "btn small", textContent: "⚖️ " + t("px_weightAdd") }); b.onclick = () => { mKind = "w"; setMedsTab("measures"); }; f.append(b); }
  f.append(h("label", { className: "flabel", textContent: t("px_activity") }), seg([[1.2, "🛋️ " + t("px_act1")], [1.375, "🚶 " + t("px_act2")], [1.55, "🚴 " + t("px_act3")], [1.725, "🏋️ " + t("px_act4")]], HS.activity, k => { HS.activity = k; saveSettings(); ctx.render(); }, "wrap"));
  body.append(f);
  const goals = [["keep", "⚖️ " + t("px_gKeep")], ["lose", "📉 " + t("px_gLose")], ["muscle", "💪 " + t("px_gMuscle")]].concat(HS.sex === "m" ? [] : [["preg", "🤰 " + t("px_gPreg")]]);
  body.append(card("🎯 " + t("px_goal"), seg(goals, HS.goal, k => { HS.goal = k; saveSettings(); ctx.render(); }, "wrap")));
  const pi = ctx.extrasApi && ctx.extrasApi.pregInfo();
  if (HS.goal === "preg" && !(pi && pi.days > 0)) body.append(card("", sub(t("px_triPick")), seg([[1, t("px_tri", 1)], [2, t("px_tri", 2)], [3, t("px_tri", 3)]], HS.tri, k => { HS.tri = k; saveSettings(); ctx.render(); })));
  const g = goalCalc();
  if (!g) { body.append(sub("👆 " + t("px_goalNeed"))); return; }
  const res = h("div", { className: "optcard goalres" },
    h("div", { className: "goalbig" }, h("b", { textContent: g.kcal + " kcal" }), h("small", { textContent: t("px_perDay") })),
    h("div", { className: "goalgrid" }, h("div", {}, h("b", { textContent: Math.round(g.bmr) }), h("small", { textContent: t("px_bmr") })), h("div", {}, h("b", { textContent: Math.round(g.tdee) }), h("small", { textContent: t("px_tdee") })), h("div", {}, h("b", { textContent: g.prot + " g" }), h("small", { textContent: t("px_prot") })), h("div", {}, h("b", { textContent: fmt1(g.water) + " L" }), h("small", { textContent: t("px_water") }))));
  const apply = h("button", { type: "button", className: "btn primary full", textContent: "✅ " + t("px_apply") });
  apply.onclick = () => { settings.kitchen = settings.kitchen || {}; settings.kitchen.kcalTarget = g.kcal; saveSettings(); toast("🎯 " + t("px_applied", g.kcal)); };
  res.append(apply); body.append(res);
  const tips = h("ul", { className: "pxlist" });
  const add = k => tips.append(h("li", { textContent: typeof k === "string" ? t(k) : k }));
  if (HS.goal === "lose") { add("px_tLose1"); add("px_tLose2"); if (g.bmi < 18.5) add("⚠️ " + t("px_tLoseLow")); }
  if (HS.goal === "muscle") { add("px_tMus1"); add("px_tMus2"); }
  if (HS.goal === "keep") { add("px_tKeep1"); add("px_tKeep2"); }
  if (HS.goal === "preg") {
    const gain = g.bmi < 18.5 ? "12,5–18" : g.bmi < 25 ? "11,5–16" : g.bmi < 30 ? "7–11,5" : "5–9";
    add(t("px_tPreg1", gain)); add("px_tPreg2"); add("px_tPreg3");
  }
  body.append(card("💡 " + t("px_tips"), tips), note(t("px_goalsSrc")));
});
function setMedsTab(k) { pendingMedsTab = k; go("meds"); }
let pendingMedsTab = null;

/* ======================= Ma santé : sommeil ======================= */
XT("meds", "sleep", () => "😴 " + t("px_sleepTab"), body => {
  const l = h("div", { className: "nlist" });
  P.SLEEP.forEach(([em, ti, tx]) => l.append(h("div", { className: "nrow" }, h("span", { className: "nico", textContent: em }), h("div", { className: "nmeta" }, h("b", { textContent: ti }), h("small", { textContent: tx })))));
  body.append(card("🌙 " + t("px_sleepTitle"), sub(t("px_sleepIntro"))), l);
  const fam = settings.family || {};
  if (fam.babyBirth || fam.dpa) {
    const l2 = h("div", { className: "nlist" });
    P.SLEEP_BABY.forEach(([em, ti, tx]) => l2.append(h("div", { className: "nrow" }, h("span", { className: "nico", textContent: em }), h("div", { className: "nmeta" }, h("b", { textContent: ti }), h("small", { textContent: tx })))));
    body.append(h("h3", { className: "sect", textContent: "👶 " + t("px_sleepParents") }), l2);
  }
  const recs = K.RECIPES.filter(r => (r.c === "plat" || r.c === "soupe") && r.tg.includes("eq") && okDiet(r) && K.recipeNutrition(r).kcal <= 550 && r.i.some(([k]) => ["riz", "rizc", "pates", "patesc", "quinoa", "lentille", "corail", "pchiche", "patate", "pdt", "boulgour", "semoule"].includes(k)) && !r.i.some(([k]) => ["piment", "harissa", "patecurry"].includes(k))).sort(() => Math.random() - 0.5);
  body.append(h("h3", { className: "sect", textContent: "🍲 " + t("px_sleepDinners") }), recipeList(recs, 4), note(P.SLEEP_SRC));
});

/* ======================= Ma santé : régime méditerranéen ======================= */
const MED_KEY = "sc-medas";
XT("meds", "medi", () => "🫒 " + t("px_medTab"), body => {
  const st = lsGet(MED_KEY, { a: {}, hist: [] });
  const score = () => P.MEDAS.filter(([k]) => st.a[k]).length;
  const scoreEl = h("b", { textContent: score() + "/13" });
  const verdict = h("small");
  const upd = () => { const s = score(); scoreEl.textContent = s + "/13"; verdict.textContent = s >= 9 ? t("px_medHigh") : s >= 6 ? t("px_medMid") : t("px_medLow"); top.className = "optcard medscore " + (s >= 9 ? "ok" : s >= 6 ? "mid" : "low"); };
  const top = h("div", { className: "optcard medscore" }, h("div", {}, h("small", { textContent: t("px_medScore") }), scoreEl), verdict);
  body.append(sub(t("px_medIntro")), top);
  const l = h("div", { className: "nlist" });
  P.MEDAS.forEach(([k, q], i) => {
    const cb = h("input", { type: "checkbox", checked: !!st.a[k] });
    cb.onchange = () => { st.a[k] = cb.checked; lsSet(MED_KEY, st); upd(); };
    l.append(h("label", { className: "shoprow" }, cb, h("div", { className: "nmeta" }, h("b", { textContent: (i + 1) + ". " + q }))));
  });
  body.append(l); upd();
  const save = h("button", { type: "button", className: "btn primary full", textContent: "💾 " + t("px_medSave") });
  save.onclick = () => { const s = score(); st.hist = (st.hist || []).concat([{ t: Date.now(), s }]).slice(-50); lsSet(MED_KEY, st); track("medas", { s }); toast("🫒 " + s + "/13"); ctx.render(); };
  body.append(h("div", { style: "margin-top:10px" }, save));
  if ((st.hist || []).length) body.append(chart(st.hist.slice(-20).map(x => ({ t: x.t, v: x.s })), ["v"]));
  const recs = K.RECIPES.filter(r => ["med", "es", "it", "mag"].includes(r.w) && r.c !== "matin" && r.tg.includes("eq") && okDiet(r) && r.i.some(([k]) => k === "huile")).sort(() => Math.random() - 0.5);
  body.append(h("h3", { className: "sect", textContent: "🍅 " + t("px_medRecipes") }), recipeList(recs, 5), note(P.MEDAS_SRC));
});

/* ======================= Fiche produit : index glycémique + liste ======================= */
ctx.productHooks.push((wrap, p) => {
  if (!p || p.type !== "food") return;
  const cats = (p.cats || []).join(" ");
  const gi = P.GI.find(([re]) => re.test(cats));
  if (gi) {
    const [, v, label] = gi, cls = v <= 55 ? ["ok", t("px_giLow")] : v < 70 ? ["mid", t("px_giMid")] : ["high", t("px_giHigh")];
    const box = h("div", { className: "optcard gibox" }, h("div", { className: "girow" }, h("span", { className: "gival " + cls[0], textContent: v }), h("div", {}, h("b", { textContent: t("px_gi") + " : " + cls[1] }), h("small", { textContent: t("px_giAs", label) }))), h("p", { className: "notice", textContent: "📚 " + P.GI_SRC }));
    wrap.append(box);
  }
  if (ctx.shopApi && p.code) {
    const inList = () => ctx.shopApi.get().some(x => x.code === p.code && !x.done);
    const b = h("button", { type: "button", className: "btn small", textContent: inList() ? "✓ " + t("px_inList") : "🛒 " + t("px_toList") });
    b.onclick = () => {
      if (inList()) return;
      const shop = ctx.shopApi.get();
      shop.push({ id: "s" + Date.now().toString(36), name: p.name || p.code, brand: p.brand || "", code: p.code, score: ctx.foodScore ? ctx.foodScore(p) : null, aisle: K.aisleOfCats ? K.aisleOfCats(p.cats, p.type) : "ep", q: 0, from: [] });
      ctx.shopApi.set(shop); b.textContent = "✓ " + t("px_inList"); toast("🛒 " + (p.name || p.code));
    };
    const acts = wrap.querySelector(".pactions");
    if (acts) acts.append(b); else wrap.append(h("div", { className: "pactions" }, b));
  }
});

/* ======================= Défis : succès façon jeu vidéo ======================= */
const ACH_KEY = "sc-ach";
function achState() { const log = ctx.extrasApi ? ctx.extrasApi.log() : []; return P.ACHIEVEMENTS.map(a => ({ k: a[0], ic: a[1], ti: a[2], de: a[3], done: (() => { try { return !!a[4](log); } catch (e) { return false; } })() })); }
function xpInfo() {
  const log = ctx.extrasApi ? ctx.extrasApi.log() : [], ach = achState().filter(a => a.done).length, badges = ctx.extrasApi ? ctx.extrasApi.earned().length : 0, wins = (lsGet("sc-wins", []) || []).length;
  const xp = Math.min(1500, log.filter(x => x.e === "scan").length * 2) + Math.min(600, log.filter(x => x.e === "recipe").length * 3) + Math.min(400, log.filter(x => x.e !== "scan" && x.e !== "recipe").length) + ach * 100 + badges * 50 + wins * 150;
  const TH = [0, 100, 300, 600, 1000, 1600, 2500, 4000];
  let lv = 0; while (lv < TH.length - 1 && xp >= TH[lv + 1]) lv++;
  return { xp, lv, name: P.LEVELS[lv], next: TH[lv + 1], from: TH[lv] };
}
(() => { // premier lancement : on ne fête pas les succès déjà acquis
  if (lsGet(ACH_KEY, null) == null) lsSet(ACH_KEY, achState().filter(a => a.done).map(a => a.k));
  const orig = ctx.track;
  if (orig) ctx.track = (e, d) => {
    orig(e, d);
    const seen = lsGet(ACH_KEY, []), now = achState().filter(a => a.done && !seen.includes(a.k));
    if (now.length) { lsSet(ACH_KEY, seen.concat(now.map(a => a.k))); setTimeout(() => toast("🏆 " + t("px_achNew") + " " + now[0].ic + " " + now[0].ti), 1200); }
  };
})();
XT("progress", "ach", () => "🏆 " + t("px_achTab"), body => {
  const x = xpInfo(), list = achState();
  const hero = h("div", { className: "optcard xphero" });
  hero.innerHTML = window.SoveeMascot ? SoveeMascot.img(64) : "";
  const bar = h("div", { className: "kbar" }), fill = h("div"); fill.style.width = (x.next ? Math.min(100, (x.xp - x.from) / (x.next - x.from) * 100) : 100) + "%"; bar.append(fill);
  hero.append(h("div", { className: "xpmeta" }, h("small", { textContent: t("px_level", x.lv + 1) }), h("b", { textContent: x.name }), bar, h("small", { textContent: x.next ? t("px_xpNext", x.xp, x.next) : x.xp + " XP · " + t("px_xpMax") })));
  body.append(hero, sub(t("px_achDone", list.filter(a => a.done).length, list.length)));
  const g = h("div", { className: "achgrid" });
  list.forEach(a => g.append(h("div", { className: "ach" + (a.done ? " on" : "") }, h("span", { className: "achic", textContent: a.done ? a.ic : "🔒" }), h("b", { textContent: a.ti }), h("small", { textContent: a.de }))));
  body.append(g, h("p", { className: "notice", textContent: "🎮 " + t("px_xpHow") }));
});

/* ======================= Défis : mascotte personnalisable ======================= */
settings.mascot = Object.assign({ hat: "auto", tint: "none" }, settings.mascot || {});
const M = window.SoveeMascot;
if (M && !M.__plus) {
  const baseImg = M.img;
  const hatFor = () => settings.mascot.hat === "auto" ? (window.SoveeXmas() ? "santa" : "none") : settings.mascot.hat;
  M.img = M.svg = function (a, b) {
    const size = typeof a === "number" ? a : (b || 120);
    const html = baseImg(size), hat = P.HATS[hatFor()] || "", tint = (P.TINTS.find(x => x[0] === settings.mascot.tint) || [])[2] || "";
    if (!hat && !tint) return html;
    return '<span class="mascotbox" style="width:' + size + "px;height:" + size + 'px">' + (tint ? html.replace("<img ", '<img style="filter:' + tint + '" ') : html) + (hat ? '<svg class="mhat" viewBox="0 0 100 40" aria-hidden="true">' + hat + "</svg>" : "") + "</span>";
  };
  M.__plus = true;
}
XT("progress", "mascot", () => "🎨 " + t("px_mascotTab"), body => {
  const prev = h("div", { className: "optcard mascotprev" }); prev.innerHTML = M ? M.img(150) : "";
  body.append(prev);
  body.append(h("h3", { className: "sect", textContent: "🎩 " + t("px_hat") }), chips([["auto", "✨ " + t("px_hatAuto")]].concat(P.HAT_LIST), settings.mascot.hat, k => { settings.mascot.hat = k; saveSettings(); ctx.render(); }));
  body.append(h("h3", { className: "sect", textContent: "🎨 " + t("px_tint") }), chips(P.TINTS.map(x => [x[0], x[1]]), settings.mascot.tint, k => { settings.mascot.tint = k; saveSettings(); ctx.render(); }));
  body.append(sub(t("px_mascotHelp")));
});

// Onglet demandé par un autre écran (ex. « ajouter un poids » depuis les objectifs)
const medsView = ctx.VIEWS.meds;
if (medsView) ctx.VIEWS.meds = root => { if (pendingMedsTab && ctx.setMedsTab) { ctx.setMedsTab(pendingMedsTab); } pendingMedsTab = null; medsView(root); };
});
