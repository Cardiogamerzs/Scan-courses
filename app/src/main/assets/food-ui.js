// Interface du Scan alimentaire. Branchée sur app.js via window.FoodUI.install(ctx).
(function (root) {
"use strict";
const R = root.FoodRules, D = root.FoodData;

root.FoodUI = { install(ctx) {
const { h, t, T, settings, saveSettings, go, header, openSheet, closeSheet, VIEWS, fab, lsGet, lsSet, toast, NATIVE } = ctx;
settings.food = Object.assign({ setup: false, preset: "balanced", weights: { ...R.DEFAULT_WEIGHTS }, diets: [], pregnancy: true, baby: true }, settings.food || {});
const F = settings.food;

const HIST_KEY = "sc-food-history";
let history = lsGet(HIST_KEY, []);
function addHistory(p, score) {
  history = history.filter(x => x.code !== p.code);
  history.unshift({ code: p.code, type: p.type, name: p.name, brand: p.brand, score, t: Date.now() });
  history = history.slice(0, 300); lsSet(HIST_KEY, history);
}

let tab = "scan";          // scan | history | search | rank
let current = null;        // produit affiché
let productTab = "health"; // health | env | alt
let rankKind = "food", rankGroupId = null;

/* ---------- Petits composants ---------- */
const COLORS = { excellent: "#1f9d55", good: "#7cc242", poor: "#e8900c", bad: "#d93a2b", unk: "#9aa0ad" };
function scoreOf(p) { return p.type === "beauty" ? R.scoreCosmetic(p).score : R.scoreFood(p, F.weights).score; }
function scoreLabel(s) { return t("sc_" + R.scoreClass(s)); }
function ring(score, size = 84) {
  const cls = R.scoreClass(score), c = COLORS[cls], r = size / 2 - 6, len = 2 * Math.PI * r, pct = score == null ? 0 : score / 100;
  const el = h("div", { className: "ring", style: "width:" + size + "px;height:" + size + "px" });
  el.innerHTML = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="8"/>' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (len * pct) + ' ' + len + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>';
  el.append(h("div", { className: "ringval" }, h("b", { textContent: score == null ? "?" : score }), h("small", { textContent: "/100" })));
  return el;
}
function pill(score, over20) {
  const cls = R.scoreClass(score);
  const v = score == null ? "?" : over20 ? (Math.round(score / 5 * 10) / 10).toString().replace(".", ",") + "/20" : score + "/100";
  const el = h("span", { className: "spill", textContent: v }); el.style.setProperty("--sc", COLORS[cls]); return el;
}
function dot(kind) { const el = h("span", { className: "ndot" }); el.style.background = kind; return el; }
const LV = { low: "#1f9d55", mid: "#e8900c", high: "#d93a2b", good: "#1f9d55", ok: "#7cc242", none: "#9aa0ad" };
function productRow(p, opts = {}) {
  const b = h("button", { type: "button", className: "prow" });
  const th = h("div", { className: "pimg" }); if (p.img) th.style.backgroundImage = "url('" + p.img + "')"; else th.textContent = p.type === "beauty" ? "🧴" : "🥫";
  const meta = h("div", { className: "pmeta" }, h("b", { textContent: p.name || p.code }), h("small", { textContent: [p.brand, opts.sub].filter(Boolean).join(" · ") }));
  b.append(th, meta, pill(opts.score !== undefined ? opts.score : scoreOf(p), opts.over20));
  b.onclick = () => openProduct(p.code, p);
  return b;
}

/* ---------- Écran du module ---------- */
VIEWS.food = rootEl => {
  if (!F.setup) return onboarding(rootEl);
  const wrap = h("div", { className: "wrap foodwrap" });
  const titles = { scan: t("modFood"), history: t("f_history"), search: t("f_search"), rank: t("f_rank") };
  wrap.append(h("header", {}, header(titles[tab], { back: true, options: "food" })));
  const body = h("div", { className: "fbody" }); wrap.append(body);
  ({ scan: tabScan, history: tabHistory, search: tabSearch, rank: tabRank })[tab](body);
  rootEl.append(wrap, tabbar());
};
function tabbar() {
  const bar = h("nav", { className: "tabbar" });
  const items = [["scan", t("f_scan"), '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 9v6M10 9v6M14 9v6M17 9v6"/>'],
    ["history", t("f_history"), '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'],
    ["search", t("f_search"), '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'],
    ["rank", t("f_rank"), '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>']];
  for (const [k, label, path] of items) {
    const b = h("button", { type: "button" }); b.setAttribute("aria-pressed", String(tab === k));
    b.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' + path + '</svg>';
    b.append(h("span", { textContent: label })); b.onclick = () => { tab = k; go("food"); };
    bar.append(b);
  }
  return bar;
}

/* Onglet Scanner */
function tabScan(body) {
  const big = h("button", { type: "button", className: "bigscan" });
  big.innerHTML = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 9v6M10 9v6M14 9v6M17 9v6"/></svg>';
  big.append(h("b", { textContent: t("f_scanBtn") }), h("span", { textContent: t("f_scanSub") }));
  const msg = h("div", { className: "msg" });
  big.onclick = () => scanBarcode(code => openProduct(code), m => { msg.className = "msg err"; msg.textContent = m; });
  const codeIn = h("input", { id: "f-code", className: "mono", inputMode: "numeric", placeholder: "3017620422003", autocomplete: "off" });
  const goBtn = h("button", { type: "button", className: "btn primary", textContent: t("f_open") });
  goBtn.onclick = () => { const c = codeIn.value.replace(/\D/g, ""); if (c.length >= 8) openProduct(c); else { msg.className = "msg err"; msg.textContent = t("f_badCode"); } };
  body.append(big, msg, h("div", { className: "f" }, h("label", { htmlFor: "f-code", textContent: t("f_typeCode") }), h("div", { className: "inrow" }, codeIn, goBtn)));
  if (history.length) {
    body.append(h("h3", { className: "sect", textContent: t("f_recent") }));
    const list = h("div", { className: "plist" }); history.slice(0, 5).forEach(x => list.append(productRow(x, { score: x.score }))); body.append(list);
  }
  const prof = h("p", { className: "notice" }); prof.textContent = t("f_profileIs", t("preset_" + F.preset)); body.append(prof);
}
function scanBarcode(ok, fail) {
  if (NATIVE) {
    root.onNativeScan = (text, fmt) => { if (text) ok(text.replace(/\D/g, "") || text); else fail(fmt || t("scanFail")); };
    NATIVE.scan(); return;
  }
  ctx.pickPhoto(async file => { try { const r = await ctx.decodeImage(file); ok(r.text); } catch (e) { fail(t("scanFail")); } });
}

/* Onglet Historique */
function tabHistory(body) {
  if (!history.length) { body.append(h("div", { className: "soon" }, h("p", { textContent: t("f_noHistory"), style: "margin:0;color:var(--muted)" }))); return; }
  const list = h("div", { className: "plist" });
  history.forEach(x => list.append(productRow(x, { score: x.score, sub: new Date(x.t).toLocaleDateString(settings.lang) })));
  const clear = h("button", { type: "button", className: "btn danger full", textContent: t("f_clearHistory") });
  clear.onclick = () => { history = []; lsSet(HIST_KEY, history); go("food"); };
  body.append(list, h("div", { className: "row" }, clear));
}

/* Onglet Recherche */
let lastQuery = "";
function tabSearch(body) {
  const q = h("input", { id: "f-q", type: "search", placeholder: t("f_searchPh"), value: lastQuery, autocomplete: "off" });
  const box = h("label", { className: "search", htmlFor: "f-q" }); box.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'; box.append(q);
  const list = h("div", { className: "plist" }), info = h("p", { className: "sub", style: "margin:10px 0" });
  const online = h("button", { type: "button", className: "btn full", textContent: t("f_searchOnline") }); online.hidden = true;
  let timer = null, seq = 0;
  const run = async () => {
    const my = ++seq; lastQuery = q.value;
    list.textContent = ""; online.hidden = !q.value.trim();
    if (!q.value.trim()) { info.textContent = t("f_searchHelp"); return; }
    info.textContent = "…";
    const rows = await D.searchLocal(q.value, 80); if (my !== seq) return;
    info.textContent = rows.length ? t("f_found", rows.length) : t("f_nothingLocal");
    rows.map(r => ({ r, s: r.type === "beauty" ? r.s : R.scoreFood(D.rowAsProduct(r), F.weights).score })).sort((a, b) => (b.s ?? -1) - (a.s ?? -1))
      .forEach(({ r, s }) => list.append(productRow({ code: r.c, name: r.n, brand: r.b, type: r.type }, { score: s })));
  };
  q.oninput = () => { clearTimeout(timer); timer = setTimeout(run, 250); };
  online.onclick = async () => {
    online.disabled = true; online.textContent = t("f_searching");
    const res = await D.onlineSearch(q.value);
    online.disabled = false; online.textContent = t("f_searchOnline");
    if (res == null) { info.textContent = t("f_offline"); return; }
    list.textContent = ""; info.textContent = t("f_found", res.length);
    res.forEach(p => { D.seenPut(p); list.append(productRow(p)); });
  };
  body.append(box, info, list, h("div", { className: "row" }, online));
  run(); setTimeout(() => q.focus(), 50);
}

/* Onglet Classements */
function tabRank(body) {
  const seg = h("div", { className: "seg" });
  [["food", t("f_food")], ["beauty", t("f_beauty")]].forEach(([k, l]) => {
    const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(rankKind === k));
    b.onclick = () => { rankKind = k; rankGroupId = null; go("food"); }; seg.append(b);
  });
  body.append(seg);
  const list = h("div", { className: "plist", style: "margin-top:12px" }); body.append(list);
  const groups = rankKind === "food" ? D.RANK_FOOD : D.RANK_BEAUTY;
  if (!rankGroupId) {
    list.append(h("p", { className: "sub", textContent: t("f_rankHelp") }));
    D.loadIndex(rankKind).then(idx => {
      const counts = {}; idx.forEach(r => { if (r.r) counts[r.r] = (counts[r.r] || 0) + 1; });
      groups.forEach(([id, label]) => {
        const b = h("button", { type: "button", className: "grow" }, h("b", { textContent: label }), h("small", { textContent: t("f_nProducts", counts[id] || 0) }));
        b.disabled = !counts[id]; b.onclick = () => { rankGroupId = id; go("food"); }; list.append(b);
      });
    });
    return;
  }
  const g = groups.find(x => x[0] === rankGroupId);
  const backBtn = h("button", { type: "button", className: "btn", textContent: "← " + t("f_allGroups") }); backBtn.onclick = () => { rankGroupId = null; go("food"); };
  list.append(h("div", { className: "row", style: "margin-top:0" }, backBtn), h("h3", { className: "sect", textContent: g ? g[1] : "" }));
  D.loadIndex(rankKind).then(idx => {
    const rows = idx.filter(r => r.r === rankGroupId).map(r => ({ r, s: rankKind === "beauty" ? r.s : R.scoreFood(D.rowAsProduct(r), F.weights).score }))
      .filter(x => x.s != null && dietOk(x.r)).sort((a, b) => b.s - a.s);
    rows.slice(0, 100).forEach(({ r, s }, i) => { const row = productRow({ code: r.c, name: r.n, brand: r.b, type: rankKind }, { score: s, over20: true, sub: "#" + (i + 1) }); list.append(row); });
    if (!rows.length) list.append(h("p", { className: "sub", textContent: t("f_nothingLocal") }));
  });
}
// Respect des régimes choisis sur une ligne d'index (quand l'info existe)
function dietOk(r) {
  if (!F.diets.length || !r.an) return true;
  const p = D.rowAsProduct(r), d = R.dietChecks(p);
  return F.diets.every(k => d[k] !== "no");
}

/* ---------- Fiche produit ---------- */
async function openProduct(code, hint) {
  current = { loading: true, code, name: hint && hint.name };
  productTab = "health"; go("product");
  const p = await D.findProduct(code);
  if (!p) { current = { missing: true, code }; if (ctx.view() === "product") ctx.render(); return; }
  current = p; addHistory(p, scoreOf(p));
  if (ctx.view() === "product") ctx.render();
}
VIEWS.product = rootEl => {
  const p = current, wrap = h("div", { className: "wrap" });
  rootEl.append(wrap);
  if (!p || p.loading) { wrap.append(h("header", {}, header(p && p.name || t("f_loading"), { back: true })), h("p", { className: "sub", textContent: t("f_looking") })); return; }
  if (p.missing) {
    wrap.append(h("header", {}, header(t("f_unknown"), { back: true })),
      h("div", { className: "soon" }, h("p", { textContent: t("f_unknownTxt", p.code), style: "margin:0" })));
    return;
  }
  const sc = p.type === "beauty" ? R.scoreCosmetic(p) : R.scoreFood(p, F.weights);
  wrap.append(h("header", {}, header(p.name || p.code, { back: true })));
  const hero = h("div", { className: "phero" });
  const img = h("div", { className: "pbig" }); if (p.img) img.style.backgroundImage = "url('" + p.img + "')"; else img.textContent = p.type === "beauty" ? "🧴" : "🥫";
  const info = h("div", { className: "pinfo" }, h("small", { textContent: [p.brand, p.qty].filter(Boolean).join(" · ") }));
  const verdict = h("div", { className: "verdict" }, ring(sc.score), h("div", {}, h("b", { textContent: scoreLabel(sc.score), style: "color:" + COLORS[R.scoreClass(sc.score)] }), h("small", { textContent: sc.score == null ? t("f_noScore") : (Math.round(sc.score / 5 * 10) / 10).toString().replace(".", ",") + "/20" })));
  info.append(verdict);
  if (p.type !== "beauty") {
    const chips = h("div", { className: "chips" });
    if (p.ns) chips.append(h("span", { className: "chip ns ns-" + p.ns, textContent: "Nutri-Score " + p.ns.toUpperCase() }));
    if (p.nova) chips.append(h("span", { className: "chip", textContent: "NOVA " + p.nova }));
    if (p.eco) chips.append(h("span", { className: "chip ns ns-" + (p.eco === "f" ? "e" : p.eco), textContent: "Éco " + p.eco.toUpperCase() }));
    info.append(chips);
  }
  hero.append(img, info); wrap.append(hero);
  if (p.type !== "beauty" && ctx.openPrices) {
    const pb = h("button", { type: "button", className: "btn full pricebtn", textContent: "🏷️ " + t("pr_compare") });
    pb.onclick = () => ctx.openPrices(p.code, p.name); wrap.append(h("div", { className: "row", style: "margin-top:10px" }, pb));
  }
  // Alertes régimes
  if (p.type !== "beauty" && F.diets.length) {
    const d = R.dietChecks(p), bad = F.diets.filter(k => d[k] === "no");
    if (bad.length) wrap.append(h("div", { className: "alert", textContent: "⚠️ " + bad.map(k => t("diet_" + k + "_no")).join(" · ") }));
  }
  const seg = h("div", { className: "seg ptabs" });
  const tabs = p.type === "beauty" ? [["health", t("f_health")], ["alt", t("f_alt")]] : [["health", t("f_health")], ["env", t("f_env")], ["alt", t("f_alt")]];
  tabs.forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(productTab === k)); b.onclick = () => { productTab = k; ctx.render(); }; seg.append(b); });
  wrap.append(seg);
  const body = h("div", { className: "pbody" }); wrap.append(body);
  if (p.type === "beauty") (productTab === "alt" ? altTab : beautyHealth)(body, p, sc);
  else ({ health: healthTab, env: envTab, alt: altTab })[productTab](body, p, sc);
};

function item(icon, title, sub, value, color, open) {
  const row = h("div", { className: "nrow" }, h("span", { className: "nico", textContent: icon }), h("div", { className: "nmeta" }, h("b", { textContent: title }), h("small", { textContent: sub })),
    value != null ? h("span", { className: "nval", textContent: value }) : null, color ? dot(color) : null);
  if (open) { row.classList.add("open"); const det = h("div", { className: "ndet" }); det.append(...open); det.hidden = true; row.onclick = () => det.hidden = !det.hidden; return h("div", {}, row, det); }
  return row;
}
function fmt(v, unit) { return v == null ? "—" : (Math.round(v * 100) / 100).toString().replace(".", ",") + unit; }
function healthTab(body, p, sc) {
  const bad = [], good = [];
  const adds = R.additivesOf(p);
  const hi = adds.filter(a => a.risk === "high"), mo = adds.filter(a => a.risk === "mod");
  const addList = adds.map(a => h("div", { className: "addrow" }, dot(a.risk === "high" ? LV.high : a.risk === "mod" ? LV.mid : LV.low), h("span", { textContent: a.name ? a.code + " · " + a.name : a.code }), a.note ? h("small", { textContent: a.note }) : null));
  if (hi.length || mo.length) bad.push(item("⚗️", t("n_additives"), hi.length ? t("n_addRisk") : t("n_addMod"), String(adds.length), hi.length ? LV.high : LV.mid, addList));
  else if (p.ing || adds.length) good.push(item("⚗️", adds.length ? t("n_additives") : t("n_noAdditive"), t("n_addOk"), adds.length ? String(adds.length) : null, LV.low, addList.length ? addList : null));
  const nut = [["sug", "🍬", t("n_sugar"), "g"], ["sat", "💧", t("n_sat"), "g"], ["fat", "🫒", t("n_fat"), "g"], ["salt", "🧂", t("n_salt"), "g"]];
  for (const [k, ic, label, u] of nut) {
    const lv = R.level(p, k); if (!lv) continue;
    const row = item(ic, label, t("lv_" + lv), fmt(p.n[k], u), LV[lv]);
    (lv === "high" || lv === "mid" ? bad : good).push(row);
  }
  const kl = R.kcalLevel(p); if (kl) (kl === "high" ? bad : good).push(item("🔥", t("n_kcal"), t("lv_" + kl), fmt(p.n.kcal, " kcal"), LV[kl]));
  const pl = R.protLevel(p); if (pl && pl !== "none") good.push(item("🐟", t("n_prot"), t("q_" + pl), fmt(p.n.prot, "g"), LV[pl]));
  const fl = R.fibLevel(p); if (fl && fl !== "none") good.push(item("🌾", t("n_fib"), t("q_" + fl), fmt(p.n.fib, "g"), LV[fl]));
  if (p.nova === 4) bad.push(item("🏭", t("n_nova"), t("n_nova4"), "NOVA 4", LV.high)); else if (p.nova === 1) good.push(item("🌿", t("n_nova"), t("n_nova1"), "NOVA 1", LV.low));
  if (R.isOrganic(p)) good.push(item("🍃", t("n_bio"), t("n_bioSub"), null, LV.low));
  body.append(h("div", { className: "sect2" }, h("h3", { textContent: t("f_defects") }), h("span", { textContent: t("f_per100") })));
  if (bad.length) body.append(h("div", { className: "nlist" }, ...bad)); else body.append(h("p", { className: "sub", textContent: t("f_noDefect") }));
  body.append(h("div", { className: "sect2" }, h("h3", { textContent: t("f_qualities") })));
  if (good.length) body.append(h("div", { className: "nlist" }, ...good)); else body.append(h("p", { className: "sub", textContent: "—" }));

  // Substances préoccupantes
  const conc = adds.filter(a => a.tags.some(x => /^cancer|^ed$/.test(x)));
  body.append(h("h3", { className: "sect", textContent: t("f_concern") }));
  if (conc.length) {
    const tagTxt = x => ({ cancer1: t("tg_cancer1"), cancer2A: t("tg_cancer2A"), cancer2B: t("tg_cancer2B"), ed: t("tg_ed") })[x];
    body.append(h("div", { className: "nlist" }, ...conc.map(a => item(a.tags.includes("ed") ? "🧬" : "☢️", a.code + " · " + a.name, a.tags.map(tagTxt).filter(Boolean).join(" · "), null, a.risk === "high" ? LV.high : LV.mid, a.note ? [h("small", { textContent: a.note })] : null))));
  } else body.append(h("p", { className: "sub", textContent: t("f_noConcern") }));

  // Grossesse / bébés
  const verdictRow = (title, r) => {
    const c = r.v === "ok" ? LV.low : r.v === "mod" ? LV.mid : LV.high;
    return item(title === "preg" ? "🤰" : "👶", title === "preg" ? t("f_preg") : t("f_baby"), t("vd_" + r.v), null, c, r.why.map(w => h("small", { textContent: "• " + w })));
  };
  if (F.pregnancy || F.baby) {
    body.append(h("h3", { className: "sect", textContent: t("f_special") }));
    const l = h("div", { className: "nlist" });
    if (F.pregnancy) l.append(verdictRow("preg", R.pregnancy(p)));
    if (F.baby) l.append(verdictRow("baby", R.baby(p)));
    body.append(l, h("p", { className: "notice", textContent: t("f_medical") }));
  }

  // Régimes
  body.append(h("h3", { className: "sect", textContent: t("f_diets") }));
  const d = R.dietChecks(p), grid = h("div", { className: "diets" });
  R.DIETS.forEach(k => { const v = d[k]; grid.append(h("span", { className: "diet d-" + v, textContent: (v === "yes" ? "✓ " : v === "no" ? "✗ " : "? ") + t("diet_" + k) })); });
  body.append(grid);

  // Détail de la note
  body.append(h("h3", { className: "sect", textContent: t("f_scoreDetail") }));
  const det = h("div", { className: "nlist" });
  sc.parts.forEach(([k, v, w]) => det.append(item("•", t("w_" + k), t("f_weight", w), Math.round(v * 100) + "%", v >= .7 ? LV.low : v >= .4 ? LV.mid : LV.high)));
  if (hi.length && F.weights.additives) det.append(h("p", { className: "sub", textContent: t("f_capped") }));
  body.append(det);
  if (p.ing) { const ing = h("details", { className: "ing" }, h("summary", { textContent: t("f_ingredients") }), h("p", { textContent: p.ing })); body.append(ing); }
  body.append(h("p", { className: "notice", textContent: t("f_source") }));
}
function envTab(body, p) {
  const rows = [];
  const eg = p.eco; const EC = { a: LV.low, b: LV.ok, c: LV.mid, d: "#e8590c", e: LV.high, f: LV.high };
  rows.push(item("🌍", t("e_eco"), eg ? t("e_eco_" + eg) : t("e_unknown"), p.ecos != null ? Math.round(p.ecos) + "/100" : eg ? eg.toUpperCase() : null, eg ? EC[eg] : LV.none));
  rows.push(item("🍃", t("n_bio"), R.isOrganic(p) ? t("e_bioYes") : t("e_bioNo"), null, R.isOrganic(p) ? LV.low : LV.none));
  const palm = (p.ana || []).includes("en:palm-oil") ? "no" : (p.ana || []).includes("en:palm-oil-free") ? "yes" : "unk";
  rows.push(item("🌴", t("e_palm"), palm === "yes" ? t("e_palmFree") : palm === "no" ? t("e_palmYes") : t("e_unknown"), null, palm === "yes" ? LV.low : palm === "no" ? LV.high : LV.none));
  const ori = (p.ori || []).map(x => x.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).join(", ");
  rows.push(item("📍", t("e_origin"), ori || t("e_unknown"), null, ori ? (/(france|europe|union)/i.test(ori) ? LV.low : LV.mid) : LV.none));
  const pack = (p.pack || []).map(x => x.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).slice(0, 6).join(", ");
  rows.push(item("♻️", t("e_pack"), pack || t("e_unknown"), null, pack ? (/plastic|plastique/i.test(pack) ? LV.mid : LV.low) : LV.none));
  body.append(h("div", { className: "nlist" }, ...rows));
  if (!F.weights.environment) body.append(h("p", { className: "notice", textContent: t("e_notCounted") }));
}
function beautyHealth(body, p, sc) {
  const C = root.CosmeticDB;
  const tagTxt = x => ({ ed: t("tg_ed"), cancer1: t("tg_cancer1"), cancer2A: t("tg_cancer2A"), cancer2B: t("tg_cancer2B"), allergen: t("tg_allergen"), irritant: t("tg_irritant"), repro: t("tg_repro"), env: t("tg_env"), preg: t("tg_preg") })[x];
  const RC = { high: LV.high, mod: LV.mid, low: "#e8c20c", none: LV.low, unk: LV.none };
  if (!p.inci || !C) {
    body.append(h("p", { className: "sub", textContent: t("b_noInci") }));
    body.append(h("p", { className: "notice", textContent: t("b_source") }));
    return;
  }
  const comp = C.composition(p.inci);
  // Résumé : nombre d'ingrédients par niveau de risque
  const counts = { high: 0, mod: 0, low: 0, none: 0, unk: 0 }; comp.forEach(x => counts[x.lv]++);
  const sum = h("div", { className: "risksum" });
  ["high", "mod", "low", "none", "unk"].forEach(k => { if (!counts[k]) return; const c = h("span", { className: "rchip" }, dot(RC[k]), h("b", { textContent: counts[k] }), " " + t("rk_" + k)); sum.append(c); });
  body.append(h("div", { className: "sect2" }, h("h3", { textContent: t("b_composition") }), h("span", { textContent: t("b_nIng", comp.length) })), sum,
    h("p", { className: "sub", textContent: t("b_tapHelp") }));
  // Ingrédients à risque d'abord, puis l'ordre de la liste
  const ord = { high: 0, mod: 1, low: 2, none: 3, unk: 4 };
  const sorted = comp.map((x, i) => ({ ...x, i })).sort((a, b) => ord[a.lv] - ord[b.lv] || a.i - b.i);
  const list = h("div", { className: "nlist" });
  sorted.forEach(x => {
    const e = x.entry;
    const sub = e ? [e.fn, ...(e.tags || []).map(tagTxt).filter(Boolean)].join(" · ") : t("rk_unkSub");
    const det = [];
    if (e) {
      det.push(h("p", { className: "why" }, h("b", { textContent: t("rk_" + e.lv) + (e.name.toLowerCase() !== x.label.toLowerCase() ? " · " + e.name : "") + " — " }), e.why));
      if (e.src && e.src.length) det.push(h("div", { className: "srcs" }, h("small", { textContent: t("b_sources") }), ...e.src.map(k => h("small", { textContent: "• " + (C.SOURCES[k] || k) }))));
    } else det.push(h("p", { className: "why", textContent: t("rk_unkWhy") }));
    list.append(item("", x.label, sub, t("rk_" + x.lv + "S"), RC[x.lv], det));
  });
  body.append(list);
  if (counts.high + counts.mod === 0) body.append(h("p", { className: "sub", textContent: t("b_clean") }));
  body.append(h("details", { className: "ing" }, h("summary", { textContent: t("f_ingredients") }), h("p", { textContent: p.inci })));
  body.append(h("p", { className: "notice", textContent: t("b_source2") }));
}
function altTab(body, p) {
  body.append(h("p", { className: "sub", textContent: t("a_help") }));
  const list = h("div", { className: "plist" }); body.append(list);
  const type = p.type === "beauty" ? "beauty" : "food";
  const mine = scoreOf(p);
  D.loadIndex(type).then(idx => {
    const lastCat = (p.cats || [])[p.cats.length - 1];
    let pool = idx.filter(r => r.c !== p.code && ((p.rg && r.r === p.rg) || (lastCat && r.k === lastCat)));
    if (pool.length < 5 && p.g2) pool = idx.filter(r => r.c !== p.code && r.g === p.g2);
    const rows = pool.map(r => ({ r, s: type === "beauty" ? r.s : R.scoreFood(D.rowAsProduct(r), F.weights).score }))
      .filter(x => x.s != null && (mine == null || x.s > mine) && (type === "beauty" || dietOk(x.r))).sort((a, b) => b.s - a.s).slice(0, 15);
    if (!rows.length) { list.append(h("p", { className: "sub", textContent: mine != null && mine >= 75 ? t("a_already") : t("a_none") })); return; }
    rows.forEach(({ r, s }) => list.append(productRow({ code: r.c, name: r.n, brand: r.b, type }, { score: s })));
  });
}

/* ---------- Premier lancement : préférences de notation ---------- */
function onboarding(rootEl) {
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(t("ob_title"), { back: true })), h("p", { className: "sub", textContent: t("ob_intro") }));
  wrap.append(prefsEditor(true));
  const done = h("button", { type: "button", className: "btn primary full", textContent: t("ob_start") });
  done.onclick = () => { F.setup = true; saveSettings(); go("food"); };
  wrap.append(h("div", { className: "row" }, done));
  rootEl.append(wrap);
}
function prefsEditor() {
  const box = h("div", { className: "opts" });
  // Profils prêts à l'emploi
  const presets = h("div", { className: "presetgrid" });
  Object.keys(R.PRESETS).forEach(k => {
    const b = h("button", { type: "button", className: "presetc" }, h("b", { textContent: t("preset_" + k) }), h("small", { textContent: t("preset_" + k + "_sub") }));
    b.setAttribute("aria-pressed", String(F.preset === k));
    b.onclick = () => { F.preset = k; F.weights = { ...R.PRESETS[k] }; saveSettings(); ctx.render(); };
    presets.append(b);
  });
  box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("ob_profile") }), presets));
  // Réglage fin
  const fine = h("div", { className: "optcard" }, h("h3", { textContent: t("ob_weights") }), h("p", { className: "sub", textContent: t("ob_weightsHelp") }));
  ["nutrition", "additives", "processing", "environment", "organic"].forEach(k => {
    const sel = h("div", { className: "wsel" });
    [0, 1, 2, 3].forEach(v => { const b = h("button", { type: "button", textContent: t("wv_" + v) }); b.setAttribute("aria-pressed", String(F.weights[k] === v)); b.onclick = () => { F.weights[k] = v; F.preset = "custom"; saveSettings(); ctx.render(); }; sel.append(b); });
    fine.append(h("div", { className: "wline" }, h("span", { textContent: t("w_" + k) }), sel));
  });
  box.append(fine);
  // Régimes
  const diets = h("div", { className: "diets" });
  R.DIETS.forEach(k => {
    const b = h("button", { type: "button", className: "diet dsel", textContent: t("diet_" + k) }); b.setAttribute("aria-pressed", String(F.diets.includes(k)));
    b.onclick = () => { F.diets = F.diets.includes(k) ? F.diets.filter(x => x !== k) : [...F.diets, k]; saveSettings(); b.setAttribute("aria-pressed", String(F.diets.includes(k))); };
    diets.append(b);
  });
  box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("ob_diets") }), h("p", { className: "sub", textContent: t("ob_dietsHelp") }), diets));
  // Grossesse / bébé
  const tg = (key, label) => { const cb = h("input", { type: "checkbox", id: "o-" + key, checked: F[key] }); cb.onchange = () => { F[key] = cb.checked; saveSettings(); }; return h("label", { className: "toggle", htmlFor: "o-" + key }, h("span", { textContent: label }), cb); };
  box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("ob_special") }), tg("pregnancy", t("ob_preg")), tg("baby", t("ob_baby"))));
  return box;
}
ctx.openProduct = code => openProduct(code);
ctx.foodOptions = box => {
  box.append(prefsEditor());
  const clear = h("button", { type: "button", className: "btn danger full", textContent: t("f_clearHistory") });
  clear.onclick = () => { history = []; lsSet(HIST_KEY, history); toast(t("f_cleared")); };
  box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("f_history") }), clear));
};
ctx.foodBack = () => {
  if (ctx.view() === "product") { go("food"); return true; }
  if (ctx.view() === "food" && tab === "rank" && rankGroupId) { rankGroupId = null; go("food"); return true; }
  if (ctx.view() === "food" && tab !== "scan") { tab = "scan"; go("food"); return true; }
  return false;
};
}};
})(window);
