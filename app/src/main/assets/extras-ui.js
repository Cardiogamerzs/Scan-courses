// Modules « Grossesse & bébé » et « Défis & bilan » : suivi des scans, défis de la semaine, badges, bilan du mois.
// Tout reste sur le téléphone (localStorage). Contenus santé : Santé publique France, ANSES, EFSA, SFP.
(window.SC_EXT = window.SC_EXT || []).push(function (ctx) {
"use strict";
const { h, t, settings, saveSettings, go, header, openSheet, closeSheet, VIEWS, lsGet, lsSet, toast } = ctx;
const R = window.FoodRules;
const F = settings.food || (settings.food = {});
settings.family = Object.assign({ dpa: "", babyBirth: "", intro: {} }, settings.family || {});
const FAM = settings.family;

/* ================= Journal d'activité ================= */
const LOG_KEY = "sc-log";
let log = lsGet(LOG_KEY, null);
if (!log) { // premier lancement : on reprend l'historique des scans
  log = (lsGet("sc-food-history", []) || []).filter(x => x.t).map(x => ({ e: "scan", t: x.t, c: x.code, s: x.score, ty: x.type })).sort((a, b) => a.t - b.t);
  lsSet(LOG_KEY, log);
}
function weekStart(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); }
function weekKey(d = new Date()) { return new Date(weekStart(d)).toISOString().slice(0, 10); }

/* ================= Défis de la semaine ================= */
const CHALLENGES = {
  scan10: { ic: "📷", goal: 10, count: l => l.filter(x => x.e === "scan").length },
  green5: { ic: "🟢", goal: 5, count: l => new Set(l.filter(x => x.e === "scan" && x.s != null && x.s >= 50).map(x => x.c)).size },
  alt3: { ic: "🔄", goal: 3, count: l => l.filter(x => x.e === "alt").length },
  clean3: { ic: "🧪", goal: 3, count: l => new Set(l.filter(x => x.e === "scan" && x.ty === "food" && !x.risky).map(x => x.c)).size },
  menu1: { ic: "🛒", goal: 1, count: l => l.filter(x => x.e === "menu2shop").length },
  recipe3: { ic: "👩‍🍳", goal: 3, count: l => l.filter(x => x.e === "recipe").length },
  veg1: { ic: "🥦", goal: 1, count: l => l.filter(x => x.e === "recipe" && x.veg).length },
  check10: { ic: "✅", goal: 10, count: l => l.filter(x => x.e === "shopcheck").length }
};
function weekChallenges(wk = weekKey()) {
  const keys = Object.keys(CHALLENGES), seed = wk.split("-").reduce((s, x) => s * 31 + +x, 7);
  const out = []; let i = seed;
  while (out.length < 3) { const k = keys[Math.abs(i) % keys.length]; if (!out.includes(k)) out.push(k); i = i * 1103515245 + 12345 >> 3; }
  return out;
}
function progress(wk = weekKey()) {
  const from = new Date(wk + "T00:00:00").getTime(), to = from + 7 * 86400e3;
  const l = log.filter(x => x.t >= from && x.t < to);
  return weekChallenges(wk).map(k => { const c = CHALLENGES[k], n = Math.min(c.goal, c.count(l)); return { k, ic: c.ic, n, goal: c.goal, done: n >= c.goal }; });
}

/* ================= Badges ================= */
const BADGES = [
  ["first", "🌱", l => l.filter(x => x.e === "scan").length >= 1],
  ["scan50", "📸", l => l.filter(x => x.e === "scan").length >= 50],
  ["scan200", "🏅", l => l.filter(x => x.e === "scan").length >= 200],
  ["green25", "🦉", l => new Set(l.filter(x => x.e === "scan" && x.s >= 50).map(x => x.c)).size >= 25],
  ["alt10", "🔍", l => l.filter(x => x.e === "alt").length >= 10],
  ["chef", "👨‍🍳", l => l.filter(x => x.e === "recipe").length >= 10],
  ["veggie", "🥕", l => l.filter(x => x.e === "recipe" && x.veg).length >= 5],
  ["planner", "📋", l => l.filter(x => x.e === "menu2shop").length >= 3],
  ["pet", "🐾", l => l.some(x => x.e === "scan" && x.ty === "pet")],
  ["week", "🏆", () => (lsGet("sc-wins", []) || []).length >= 1],
  ["weeks4", "👑", () => (lsGet("sc-wins", []) || []).length >= 4]
];
function earned() { return BADGES.filter(b => b[2](log)).map(b => b[0]); }

/* ================= Suivi ================= */
ctx.track = (e, data = {}) => {
  const before = progress().filter(x => x.done).length, badgesBefore = earned();
  log.push(Object.assign({ e, t: Date.now() }, data.code ? { c: data.code, s: data.score, ty: data.type, risky: !!data.risky } : {}, data.veg ? { veg: true } : {}));
  if (log.length > 4000) log = log.slice(-4000);
  lsSet(LOG_KEY, log);
  const pr = progress(), after = pr.filter(x => x.done).length;
  if (after > before) {
    const won = pr.find(x => x.done && !x.was);
    toast("🎉 " + t("ch_done") + " " + (won ? t("ch_" + won.k) : ""));
    if (after === pr.length) { const w = lsGet("sc-wins", []); if (!w.includes(weekKey())) { w.push(weekKey()); lsSet("sc-wins", w); } }
  }
  const nb = earned().filter(b => !badgesBefore.includes(b));
  if (nb.length) setTimeout(() => toast("🏅 " + t("bd_new") + " " + t("bd_" + nb[0])), after > before ? 2200 : 0);
};

/* ================= Bilan du mois ================= */
function monthStats(y, m) {
  const from = new Date(y, m, 1).getTime(), to = new Date(y, m + 1, 1).getTime();
  const sc = log.filter(x => x.e === "scan" && x.t >= from && x.t < to && x.s != null && x.ty !== "beauty");
  const last = {}; sc.forEach(x => { last[x.c] = x; });
  const list = Object.values(last);
  const avg = list.length ? Math.round(list.reduce((s, x) => s + x.s, 0) / list.length) : null;
  const cls = { excellent: 0, good: 0, poor: 0, bad: 0 }; list.forEach(x => cls[R.scoreClass(x.s)]++);
  return { n: list.length, avg, cls, list, alts: log.filter(x => x.e === "alt" && x.t >= from && x.t < to).length, recipes: log.filter(x => x.e === "recipe" && x.t >= from && x.t < to).length };
}
const COLORS = { excellent: "#1f9d55", good: "#7cc242", poor: "#e8900c", bad: "#d93a2b" };
function reportView(body) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const cur = monthStats(y, m), prev = monthStats(m ? y : y - 1, m ? m - 1 : 11);
  const mname = now.toLocaleDateString(settings.lang, { month: "long", year: "numeric" });
  const card = h("div", { className: "optcard report" }, h("h3", { textContent: "📊 " + t("rp_title", mname) }));
  if (!cur.n) { card.append(h("p", { className: "sub", textContent: t("rp_empty") })); body.append(card); return; }
  const big = h("div", { className: "rpbig" }, h("b", { textContent: cur.avg + "/100" }), h("span", { textContent: t("rp_avg") }));
  big.querySelector("b").style.color = COLORS[R.scoreClass(cur.avg)];
  card.append(big);
  if (prev.n) { const d = cur.avg - prev.avg; card.append(h("p", { className: "rpdiff " + (d >= 0 ? "up" : "down"), textContent: (d >= 0 ? "📈 +" : "📉 ") + d + " " + t("rp_vsPrev", prev.avg) })); }
  const bar = h("div", { className: "rpbar" });
  ["excellent", "good", "poor", "bad"].forEach(k => { if (!cur.cls[k]) return; const s = h("span", { title: cur.cls[k] }); s.style.flex = cur.cls[k]; s.style.background = COLORS[k]; bar.append(s); });
  card.append(bar, h("div", { className: "rplegend" }, ...["excellent", "good", "poor", "bad"].map(k => h("span", {}, h("i", { style: "background:" + COLORS[k] }), t("sc_" + k) + " · " + cur.cls[k]))));
  card.append(h("div", { className: "rpnums" }, h("div", {}, h("b", { textContent: cur.n }), h("small", { textContent: t("rp_products") })), h("div", {}, h("b", { textContent: cur.alts }), h("small", { textContent: t("rp_alts") })), h("div", {}, h("b", { textContent: cur.recipes }), h("small", { textContent: t("rp_recipes") }))));
  body.append(card);
  const hist = (ctx.foodHistory ? ctx.foodHistory() : []), name = c => (hist.find(x => x.code === c) || {}).name || c;
  const sorted = cur.list.slice().sort((a, b) => b.s - a.s);
  const rowsOf = (arr, title) => { if (!arr.length) return; body.append(h("h3", { className: "sect", textContent: title })); const l = h("div", { className: "nlist" }); arr.forEach(x => { const b = h("button", { type: "button", className: "nrow" }, h("div", { className: "nmeta" }, h("b", { textContent: name(x.c) })), h("span", { className: "nval", textContent: x.s + "/100" })); b.onclick = () => ctx.openProduct(x.c); l.append(b); }); body.append(l); };
  rowsOf(sorted.slice(0, 3).filter(x => x.s >= 50), "🌟 " + t("rp_best"));
  rowsOf(sorted.slice(-3).reverse().filter(x => x.s < 50), "🙈 " + t("rp_worst"));
  body.append(h("p", { className: "notice", textContent: t("rp_tip") }));
}

/* ================= Écran Défis & bilan ================= */
let pTab = "challenges";
function challengesView(body) {
  const pr = progress(), done = pr.filter(x => x.done).length;
  const hero = h("div", { className: "chhero" });
  hero.innerHTML = window.SoveeMascot ? SoveeMascot.img(84) : "";
  hero.append(h("div", {}, h("b", { textContent: done === pr.length ? t("ch_allDone") : t("ch_title") }), h("span", { textContent: t("ch_count", done, pr.length) })));
  body.append(hero);
  const l = h("div", { className: "chlist" });
  pr.forEach(x => {
    const bar = h("div", { className: "chbar" }, h("i", { style: "width:" + Math.round(100 * x.n / x.goal) + "%" }));
    l.append(h("div", { className: "chrow" + (x.done ? " done" : "") }, h("span", { className: "chico", textContent: x.done ? "✅" : x.ic }), h("div", { className: "nmeta" }, h("b", { textContent: t("ch_" + x.k) }), bar), h("span", { className: "nval", textContent: x.n + "/" + x.goal })));
  });
  body.append(l, h("p", { className: "sub", textContent: t("ch_renew") }));
}
function badgesView(body) {
  const got = earned();
  body.append(h("p", { className: "sub", textContent: t("bd_count", got.length, BADGES.length) }));
  const g = h("div", { className: "badgegrid" });
  BADGES.forEach(([k, ic]) => g.append(h("div", { className: "badgecell" + (got.includes(k) ? " got" : "") }, h("span", { className: "bico", textContent: got.includes(k) ? ic : "🔒" }), h("b", { textContent: t("bd_" + k) }), h("small", { textContent: t("bd_" + k + "Sub") }))));
  body.append(g);
}
VIEWS.progress = root => {
  const wrap = h("div", { className: "wrap" }); root.append(wrap);
  wrap.append(h("header", {}, header(t("modProgress"), { back: true })));
  const seg = h("div", { className: "seg" });
  [["challenges", t("ch_tab")], ["report", t("rp_tab")], ["badges", t("bd_tab")]].forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(pTab === k)); b.onclick = () => { pTab = k; go("progress"); }; seg.append(b); });
  wrap.append(seg);
  const body = h("div", { style: "margin-top:12px" }); wrap.append(body);
  ({ challenges: challengesView, report: reportView, badges: badgesView })[pTab](body);
};
ctx.modules.push({ key: "progress", color: "linear-gradient(135deg,#f59f00,#e8590c)", title: () => t("modProgress"), sub: () => t("modProgressSub"),
  badge: () => { const p = progress(); return p.filter(x => x.done).length + "/" + p.length; },
  icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>' });

/* ================= Grossesse & bébé ================= */
const PREG = [
  ["no", "🍷", "Alcool", "Zéro alcool pendant toute la grossesse : aucune dose n'est sans risque pour le bébé.", "Santé publique France"],
  ["no", "🧀", "Fromages au lait cru et croûtes", "Risque de listériose. Les pâtes pressées cuites (comté, emmental, beaufort, gruyère) et les fromages pasteurisés sans la croûte sont possibles.", "ANSES"],
  ["no", "🥓", "Charcuteries crues, pâtés, rillettes, foie gras", "Listériose et toxoplasmose. Le jambon cuit sous vide est possible.", "ANSES"],
  ["no", "🥩", "Viande crue ou peu cuite", "Tartare, carpaccio, viande rosée : toxoplasmose si tu n'es pas immunisée. Viande bien cuite à cœur.", "ANSES"],
  ["no", "🍣", "Poissons crus ou fumés, sushis, coquillages crus", "Risque de listériose et d'intoxication.", "ANSES"],
  ["no", "🥚", "Œufs crus ou peu cuits", "Mayonnaise maison, mousse au chocolat, tiramisu : salmonelle. Œufs cuits durs OK.", "ANSES"],
  ["no", "🐟", "Espadon, marlin, requin, lamproie", "Très chargés en mercure : à éviter. Limiter aussi thon, brochet, bar, daurade.", "ANSES (méthylmercure)"],
  ["no", "🍬", "Réglisse", "La glycyrrhizine est associée à un risque d'accouchement prématuré et fait monter la tension.", "ANSES"],
  ["no", "🌱", "Graines germées crues, lait cru", "Risque de bactéries (E. coli, listeria).", "ANSES"],
  ["no", "🌿", "Compléments à base de plantes, huiles essentielles", "Seulement sur avis du médecin ou de la sage-femme.", "ANSES"],
  ["no", "🧈", "Produits enrichis en phytostérols", "Non adaptés pendant la grossesse.", "Règlement UE 2017/2470"],
  ["no", "🫘", "Soja en excès", "Limiter les aliments à base de soja (phytoestrogènes) à une portion par jour.", "AFSSA 2005"],
  ["no", "🍖", "Foie et produits à base de foie", "Excès de vitamine A, toxique pour le fœtus.", "ANSES"],
  ["mod", "☕", "Caféine", "Pas plus de 200 mg par jour (environ 2 tasses de café). Attention au thé, cola et boissons énergisantes.", "EFSA 2015"]
];
const PREG_GOOD = [
  ["💊", "Acide folique (B9)", "Supplémentation dès le projet de grossesse et jusqu'à la fin du 1er trimestre, sur prescription."],
  ["🐟", "Poisson 2 fois par semaine", "Dont un poisson gras peu contaminé : sardine, maquereau, hareng, saumon cuit."],
  ["🧂", "Sel iodé", "L'iode est important pour le développement du cerveau du bébé."],
  ["🥦", "Fruits, légumes et légumineuses", "Bien lavés, à chaque repas."],
  ["🥛", "Produits laitiers pasteurisés", "Pour le calcium : 2 à 3 par jour."]
];
const BABY = [
  ["0 – 4 mois", "🍼", "Lait maternel ou lait infantile uniquement."],
  ["4 – 6 mois", "🥕", "Début de la diversification, jamais avant 4 mois révolus ni après 6 mois. Légumes et fruits en purée lisse, quelques cuillères."],
  ["Dès le début", "🥜", "Introduire les aliments allergènes sans attendre : œuf bien cuit, arachide en poudre ou purée lisse (jamais entière), gluten, poisson, fruits à coque en poudre. Cela réduit le risque d'allergie."],
  ["6 – 8 mois", "🍗", "Viande, poisson ou œuf : 10 g par jour (2 cuillères à café, ou 1/4 d'œuf dur). Une cuillère à café d'huile (colza, noix) dans les purées."],
  ["8 – 12 mois", "🍝", "Textures plus épaisses puis petits morceaux fondants. Féculents, produits laitiers adaptés. 20 g de viande ou poisson vers 1 an."],
  ["1 – 3 ans", "🧒", "Il mange presque comme toi, en petites quantités. Lait de croissance ou lait de vache entier."]
];
const BABY_NO = [
  ["🍯", "Miel avant 1 an", "Risque de botulisme infantile."],
  ["🧂", "Sel et sucre ajoutés avant 1 an", "Les reins sont immatures ; le goût sucré s'installe tôt."],
  ["🥛", "Lait de vache en boisson avant 1 an", "Pas adapté aux besoins (fer, protéines)."],
  ["🌾", "Boissons végétales (soja, amande, riz…)", "Elles ne remplacent pas le lait infantile : carences graves."],
  ["🧃", "Jus de fruits, sodas, sirops", "L'eau est la seule boisson indispensable."],
  ["🥜", "Fruits à coque entiers avant 5 ans", "Risque d'étouffement : en poudre ou en purée seulement."],
  ["🧀", "Lait cru, viande ou poisson crus avant 5 ans", "Risque d'infections graves (listeria, E. coli)."]
];
const BABY_ALLERGENS = [["eggs", "🥚"], ["peanuts", "🥜"], ["gluten", "🌾"], ["milk", "🥛"], ["fish", "🐟"], ["nuts", "🌰"], ["soybeans", "🫘"], ["sesame-seeds", "⚪"], ["crustaceans", "🦐"]];
function allergenLabel(a) { const k = "al_" + a.replace(/-/g, "_"); const v = t(k); return v && v !== k ? v : a; }
function pregInfo() {
  if (!FAM.dpa) return null;
  const dpa = new Date(FAM.dpa + "T12:00"), days = Math.round((dpa - Date.now()) / 86400e3);
  const sa = Math.max(0, Math.floor(41 - days / 7)); // terme en France : 41 semaines d'aménorrhée
  return { days, sa, tri: sa < 15 ? 1 : sa < 29 ? 2 : 3 };
}
function modeToggle(key, label) {
  const cb = h("input", { type: "checkbox", id: "fm-" + key }); cb.checked = !!F[key];
  cb.onchange = () => { F[key] = cb.checked; if (cb.checked) F[key === "pregMode" ? "pregnancy" : "baby"] = true; saveSettings(); toast(cb.checked ? t("fm_on") : t("fm_off")); };
  return h("label", { className: "toggle modetoggle", htmlFor: "fm-" + key }, h("span", {}, h("b", { textContent: label }), h("small", { className: "tgsub", textContent: t("fm_modeSub") })), cb);
}
function guideList(rows, verdict) {
  const l = h("div", { className: "nlist" });
  rows.forEach(r => {
    const [v, ic, title, txt, src] = verdict ? r : [null, ...r];
    const det = [h("small", { textContent: txt })]; if (src) det.push(h("small", { className: "srcline", textContent: "📚 " + src }));
    const row = h("div", {}, h("div", { className: "nrow open" }, h("span", { className: "nico", textContent: ic }), h("div", { className: "nmeta" }, h("b", { textContent: title }), v ? h("small", { textContent: t(v === "no" ? "vd_no" : "fm_limit") }) : null), v ? h("span", { className: "ndot", style: "background:" + (v === "no" ? "#d93a2b" : "#e8900c") }) : null));
    const d = h("div", { className: "ndet" }, ...det); d.hidden = !!verdict; row.firstChild.onclick = () => d.hidden = !d.hidden; row.append(d); l.append(row);
  });
  return l;
}
let fTab = "preg";
function pregView(body) {
  body.append(modeToggle("pregMode", "🤰 " + t("fm_pregMode")));
  const dpa = h("input", { type: "date", id: "fm-dpa", value: FAM.dpa || "" });
  dpa.onchange = () => { FAM.dpa = dpa.value; saveSettings(); go("family"); };
  body.append(h("div", { className: "optcard" }, h("label", { className: "flabel", htmlFor: "fm-dpa", textContent: "📅 " + t("fm_dpa") }), dpa));
  const pi = pregInfo();
  if (pi && pi.days > -30) {
    const c = h("div", { className: "preghero" }); c.innerHTML = window.SoveeMascot ? SoveeMascot.img(64) : "";
    c.append(h("div", {}, h("b", { textContent: pi.days > 0 ? t("fm_countdown", pi.days) : t("fm_born") }), h("span", { textContent: t("fm_sa", pi.sa, pi.tri) })));
    body.append(c);
  }
  body.append(h("h3", { className: "sect", textContent: "🚫 " + t("fm_avoid") }), guideList(PREG, true));
  body.append(h("h3", { className: "sect", textContent: "💚 " + t("fm_good") }), guideList(PREG_GOOD, false));
  body.append(h("p", { className: "notice", textContent: t("fm_notice") }));
}
function babyView(body) {
  body.append(modeToggle("babyMode", "👶 " + t("fm_babyMode")));
  body.append(h("h3", { className: "sect", textContent: "🗓️ " + t("fm_steps") }));
  const tl = h("div", { className: "timeline" });
  BABY.forEach(([age, ic, txt]) => tl.append(h("div", { className: "tlrow" }, h("span", { className: "tlico", textContent: ic }), h("div", {}, h("b", { textContent: age }), h("p", { textContent: txt })))));
  body.append(tl);
  body.append(h("h3", { className: "sect", textContent: "🥜 " + t("fm_allergens") }), h("p", { className: "sub", textContent: t("fm_allergensHelp") }));
  const al = h("div", { className: "nlist" });
  BABY_ALLERGENS.forEach(([a, ic]) => {
    const cb = h("input", { type: "checkbox", id: "al-" + a }); cb.checked = !!FAM.intro[a];
    const when = h("small", { textContent: FAM.intro[a] ? t("fm_introOn", new Date(FAM.intro[a]).toLocaleDateString(settings.lang)) : t("fm_notYet") });
    cb.onchange = () => { if (cb.checked) FAM.intro[a] = Date.now(); else delete FAM.intro[a]; saveSettings(); when.textContent = cb.checked ? t("fm_introOn", new Date().toLocaleDateString(settings.lang)) : t("fm_notYet"); };
    al.append(h("label", { className: "shoprow" }, cb, h("span", { className: "nico", textContent: ic }), h("div", { className: "nmeta" }, h("b", { textContent: allergenLabel(a) }), when)));
  });
  body.append(al);
  body.append(h("h3", { className: "sect", textContent: "🚫 " + t("fm_babyNo") }), guideList(BABY_NO.map(([ic, ti, tx]) => ["no", ic, ti, tx]), true));
  body.append(h("h3", { className: "sect", textContent: "🍼 " + t("fm_jars") }), h("p", { className: "sub", textContent: t("fm_jarsHelp") }));
  const sc = h("button", { type: "button", className: "btn primary full", textContent: "📷 " + t("fm_scanJar") });
  sc.onclick = () => { F.baby = true; F.babyMode = true; saveSettings(); ctx.scanBarcode && ctx.scanBarcode(c => ctx.openProduct(c), m => toast(m)); };
  body.append(sc, h("p", { className: "notice", textContent: t("fm_babyNotice") }));
}
VIEWS.family = root => {
  const wrap = h("div", { className: "wrap" }); root.append(wrap);
  wrap.append(h("header", {}, header(t("modFamily"), { back: true })));
  const seg = h("div", { className: "seg" });
  [["preg", "🤰 " + t("fm_tabPreg")], ["baby", "👶 " + t("fm_tabBaby")]].forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(fTab === k)); b.onclick = () => { fTab = k; go("family"); }; seg.append(b); });
  wrap.append(seg);
  const body = h("div", { style: "margin-top:12px" }); wrap.append(body);
  (fTab === "preg" ? pregView : babyView)(body);
};
ctx.modules.push({ key: "family", color: "linear-gradient(135deg,#f783ac,#9775fa)", title: () => t("modFamily"), sub: () => t("modFamilySub"),
  badge: () => { const p = pregInfo(); return p && p.days > 0 ? t("fm_badge", p.sa) : null; },
  icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="3"/><path d="M12 9c-4 0-6 3-6 6h12c0-3-2-6-6-6zM9 21v-6M15 21v-6"/></svg>' });
ctx.backHooks.push(() => { if (ctx.view() === "progress" && pTab !== "challenges") { pTab = "challenges"; go("progress"); return true; } return false; });
});
