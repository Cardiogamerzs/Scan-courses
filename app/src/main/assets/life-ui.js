// Version 4.6 : mode sombre, sauvegarde, liste partagée, budget, péremptions, anti-gaspi, rappels produits (RappelConso),
// salle de bain, comparateur, médicaments et aliments, recherche vocale, « Ma journée » et widget.
// Tout reste sur le téléphone (localStorage), sauf les requêtes aux bases publiques (Open Food Facts, Open Prices, RappelConso).
(window.SC_EXT = window.SC_EXT || []).push(function (ctx) {
"use strict";
const { h, t, settings, saveSettings, go, header, openSheet, closeSheet, VIEWS, lsGet, lsSet, toast, NATIVE } = ctx;
const D = window.FoodData, K = window.KitchenData, R = window.FoodRules;
const DAY = 86400e3;
const euro = v => (Math.round(v * 100) / 100).toFixed(2).replace(".", ",") + " €";
const isoDay = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const daysLeft = iso => Math.round((new Date(iso + "T12:00") - new Date(isoDay() + "T12:00")) / DAY);
const fmtDate = iso => new Date(iso + "T12:00").toLocaleDateString(settings.lang, { weekday: "short", day: "numeric", month: "short" });
const hash = s => { let x = 7; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) | 0; return Math.abs(x) % 2000000000; };
function seg(items, cur, onPick) {
  const s = h("div", { className: "seg" });
  items.forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(cur === k)); b.onclick = () => onPick(k); s.append(b); });
  return s;
}
function getJSON(url) { if (ctx.getJSON) return ctx.getJSON(url); return fetch(url).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
// Scanner un code (y compris un QR code, sans retirer les lettres)
function scanRaw(ok) {
  if (NATIVE && NATIVE.scan) { window.onNativeScan = (text, fmt) => { if (text) ok(text); else toast(fmt || t("scanFail")); }; NATIVE.scan(); return; }
  ctx.pickPhoto(async f => { try { const r = await ctx.decodeImage(f); ok(r.text); } catch (e) { toast(t("scanFail")); } });
}
function scanProduct(ok) { ctx.scanBarcode(async code => { toast(t("f_loading")); const p = await D.findProduct(code).catch(() => null); if (!p) { toast(t("sh_unknown")); return; } ok(p); }, m => toast(m)); }

/* ======================= Mode sombre ======================= */
ctx.homeOptions.push(opts => {
  const cur = settings.dark || "off";
  const card = h("div", { className: "optcard" }, h("h3", { textContent: "🌙 " + t("dm_title") }), h("p", { className: "sub", textContent: t("dm_help") }));
  card.append(seg([["off", "☀️ " + t("dm_off")], ["auto", "🌗 " + t("dm_auto")], ["on", "🌙 " + t("dm_on")]], cur, k => { settings.dark = k; saveSettings(); ctx.applyTheme(ctx.themeFor("home")); ctx.render(); }));
  opts.append(card);
});

/* ======================= Sauvegarde et restauration ======================= */
function backupJSON() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); data[k] = localStorage.getItem(k); }
  return JSON.stringify({ app: "Sovee", v: 1, date: new Date().toISOString(), data });
}
function doBackup() {
  const name = "sovee-sauvegarde-" + isoDay() + ".json", json = backupJSON();
  if (NATIVE && NATIVE.saveFile) { window.onFileSaved = ok => toast(ok ? "💾 " + t("bk_saved") : t("bk_fail")); NATIVE.saveFile(name, json); return; }
  const a = h("a", { href: URL.createObjectURL(new Blob([json], { type: "application/json" })), download: name }); document.body.append(a); a.click(); a.remove(); toast("💾 " + t("bk_saved"));
}
function restoreFrom(text) {
  let o = null; try { o = JSON.parse(text); } catch (e) {}
  if (!o || o.app !== "Sovee" || !o.data) { toast(t("bk_bad")); return; }
  openSheet(sh => {
    const n = Object.keys(o.data).length;
    sh.append(h("h2", { textContent: "📂 " + t("bk_restore") }), h("p", { className: "sub", textContent: t("bk_confirm", new Date(o.date).toLocaleString(settings.lang), n) }));
    const yes = h("button", { type: "button", className: "btn primary", textContent: t("bk_doIt") }), no = h("button", { type: "button", className: "btn", textContent: t("cancel") || "Annuler" });
    no.onclick = closeSheet;
    yes.onclick = () => { try { localStorage.clear(); for (const [k, v] of Object.entries(o.data)) localStorage.setItem(k, v); } catch (e) { toast(t("bk_fail")); return; } toast("✅ " + t("bk_done")); setTimeout(() => location.reload(), 600); };
    sh.append(h("div", { className: "row" }, no, yes));
  });
}
function doRestore() {
  if (NATIVE && NATIVE.openFile) { window.onFileText = txt => { if (txt) restoreFrom(txt); }; NATIVE.openFile(); return; }
  const f = h("input", { type: "file", accept: "application/json,.json" }); f.onchange = () => { if (f.files[0]) f.files[0].text().then(restoreFrom); }; f.click();
}
ctx.homeOptions.push(opts => {
  const save = h("button", { type: "button", className: "btn primary", textContent: "💾 " + t("bk_save") }); save.onclick = doBackup;
  const rest = h("button", { type: "button", className: "btn", textContent: "📂 " + t("bk_restore") }); rest.onclick = doRestore;
  opts.append(h("div", { className: "optcard" }, h("h3", { textContent: "💾 " + t("bk_title") }), h("p", { className: "sub", textContent: t("bk_help") }), h("div", { className: "row" }, save, rest)));
});

/* ======================= Liste de courses : partage et budget ======================= */
const SPEND_KEY = "sc-spend";
settings.budget = Object.assign({ monthly: 0 }, settings.budget || {});
const monthKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
const b64 = s => btoa(unescape(encodeURIComponent(s))), unb64 = s => decodeURIComponent(escape(atob(s)));
function listCode(items) { return "SOVEE-LISTE:" + b64(JSON.stringify(items.map(x => [x.name, x.aisle || "", x.code || "", x.price || 0]))); }
function shareList() {
  const shop = ctx.shopApi.get().filter(x => !x.done);
  if (!shop.length) { toast(t("k_shopEmpty")); return; }
  const lines = ["🛒 " + t("sl_shareTitle")];
  for (const [a, ico, label] of K.AISLES) { const it = shop.filter(x => x.aisle === a); if (!it.length) continue; lines.push("", ico + " " + label); it.forEach(x => lines.push("• " + x.name)); }
  const rest = shop.filter(x => !K.AISLES.some(a => a[0] === x.aisle)); if (rest.length) { lines.push(""); rest.forEach(x => lines.push("• " + x.name)); }
  const code = listCode(shop);
  const text = lines.join("\n") + "\n\n" + t("sl_howImport") + "\n" + code;
  openSheet(sh => {
    sh.append(h("h2", { textContent: "👫 " + t("sl_share") }), h("p", { className: "sub", textContent: t("sl_shareHelp") }));
    const qr = ctx.codeSVG(code, "QR"), box = h("div", { className: "qrbox" });
    if (qr) { box.innerHTML = qr.svg; sh.append(box, h("p", { className: "sub", style: "text-align:center", textContent: t("sl_qrHelp") })); }
    const send = h("button", { type: "button", className: "btn primary full", textContent: "📤 " + t("sl_send") });
    send.onclick = () => { if (NATIVE && NATIVE.share) NATIVE.share(text, t("sl_shareTitle")); else ctx.copyText(text); };
    sh.append(send);
  });
}
function importList(raw) {
  const m = /SOVEE-LISTE:([A-Za-z0-9+/=]+)/.exec(raw || "");
  if (!m) { toast(t("sl_noCode")); return false; }
  let arr; try { arr = JSON.parse(unb64(m[1])); } catch (e) { toast(t("sl_noCode")); return false; }
  const shop = ctx.shopApi.get(), have = new Set(shop.filter(x => !x.done).map(x => x.name.toLowerCase()));
  let n = 0;
  arr.forEach(([name, aisle, code, price]) => { if (!name || have.has(String(name).toLowerCase())) return; have.add(String(name).toLowerCase()); shop.push({ id: "s" + Date.now().toString(36) + n, name: String(name), aisle: aisle || (K.aisleOfText ? K.aisleOfText(name) : "ep"), code: code || undefined, price: +price || undefined, q: 0, from: [] }); n++; });
  ctx.shopApi.save(); toast("📥 " + t("sl_imported", n)); closeSheet(); ctx.render(); return true;
}
function importSheet() {
  openSheet(sh => {
    sh.append(h("h2", { textContent: "📥 " + t("sl_import") }), h("p", { className: "sub", textContent: t("sl_importHelp") }));
    const scan = h("button", { type: "button", className: "btn primary full", textContent: "📷 " + t("sl_scanQr") });
    scan.onclick = () => scanRaw(txt => importList(txt));
    const ta = h("textarea", { rows: 4, placeholder: t("sl_pastePh"), className: "pastebox" });
    const paste = h("button", { type: "button", className: "btn", textContent: "📋 " + t("u_paste") });
    paste.onclick = () => { if (NATIVE && NATIVE.paste) { window.onPaste = txt => { ta.value = txt; if (/SOVEE-LISTE:/.test(txt)) importList(txt); else toast(t("sl_noCode")); }; NATIVE.paste(); } else if (navigator.clipboard) navigator.clipboard.readText().then(x => { ta.value = x; importList(x); }).catch(() => {}); };
    const go_ = h("button", { type: "button", className: "btn primary", textContent: t("sl_doImport") }); go_.onclick = () => importList(ta.value);
    sh.append(scan, h("div", { className: "f", style: "margin:12px 0 8px" }, ta), h("div", { className: "row" }, paste, go_));
  });
}
async function medianPrice(code) {
  if (!ctx.pricesFor || !code) return null;
  const list = await ctx.pricesFor(code).catch(() => []); if (!list.length) return null;
  const v = list.map(x => x.price).sort((a, b) => a - b); return v[Math.floor(v.length / 2)];
}
function pricesSheet() {
  const shop = ctx.shopApi.get();
  openSheet(sh => {
    sh.append(h("h2", { textContent: "💶 " + t("bu_prices") }), h("p", { className: "sub", textContent: t("bu_pricesHelp") }));
    const list = h("div", { className: "nlist" });
    shop.forEach(x => {
      const inp = h("input", { type: "number", inputMode: "decimal", step: "0.01", min: "0", value: x.price || "", placeholder: "€", className: "priceinp" });
      inp.onchange = () => { const v = parseFloat(String(inp.value).replace(",", ".")); x.price = isFinite(v) && v > 0 ? v : undefined; ctx.shopApi.save(); };
      list.append(h("div", { className: "nrow" }, h("div", { className: "nmeta" }, h("b", { textContent: x.name }), x.code ? h("small", { textContent: "🏷️ " + t("bu_hasCode") }) : null), inp));
    });
    const auto = h("button", { type: "button", className: "btn full", textContent: "🔎 " + t("bu_auto") });
    auto.onclick = async () => {
      const todo = shop.filter(x => x.code && !x.price); if (!todo.length) { toast(t("bu_nothing")); return; }
      auto.disabled = true; auto.textContent = "⏳ " + t("f_loading"); let n = 0;
      for (const x of todo) { const p = await medianPrice(x.code); if (p) { x.price = Math.round(p * 100) / 100; n++; } }
      ctx.shopApi.save(); toast(t("bu_found", n)); closeSheet(); ctx.render();
    };
    const done = h("button", { type: "button", className: "btn primary full", textContent: "✓ " + t("bu_ok") }); done.onclick = () => { closeSheet(); ctx.render(); };
    sh.append(list, h("div", { style: "display:grid;gap:8px;margin-top:12px" }, auto, done));
  });
}
function finishSheet(estimate) {
  openSheet(sh => {
    sh.append(h("h2", { textContent: "🧾 " + t("bu_finish") }), h("p", { className: "sub", textContent: t("bu_finishHelp") }));
    const inp = h("input", { type: "number", inputMode: "decimal", step: "0.01", min: "0", value: estimate ? estimate.toFixed(2) : "", id: "bu-paid" });
    const ok = h("button", { type: "button", className: "btn primary full", textContent: t("bu_save") });
    ok.onclick = () => {
      const v = parseFloat(String(inp.value).replace(",", ".")); if (!(v > 0)) { toast(t("bu_amount")); return; }
      const sp = lsGet(SPEND_KEY, {}); sp[monthKey()] = Math.round(((sp[monthKey()] || 0) + v) * 100) / 100; lsSet(SPEND_KEY, sp);
      ctx.shopApi.set(ctx.shopApi.get().filter(x => !x.done)); toast("✅ " + t("bu_saved", euro(v))); closeSheet(); ctx.render();
    };
    sh.append(h("label", { className: "flabel", htmlFor: "bu-paid", textContent: "💶 " + t("bu_paid") }), h("div", { className: "f", style: "margin:0 0 12px" }, inp), ok);
  });
}
function budgetSheet() {
  openSheet(sh => {
    const inp = h("input", { type: "number", inputMode: "decimal", min: "0", step: "10", value: settings.budget.monthly || "", id: "bu-month" });
    const ok = h("button", { type: "button", className: "btn primary full", textContent: t("bu_save") });
    ok.onclick = () => { const v = parseFloat(String(inp.value).replace(",", ".")); settings.budget.monthly = v > 0 ? v : 0; saveSettings(); closeSheet(); ctx.render(); };
    const sp = lsGet(SPEND_KEY, {}), months = Object.keys(sp).sort().reverse().slice(0, 6);
    sh.append(h("h2", { textContent: "💶 " + t("bu_title") }), h("label", { className: "flabel", htmlFor: "bu-month", textContent: t("bu_monthly") }), h("div", { className: "f", style: "margin:0 0 12px" }, inp), ok);
    if (months.length) { sh.append(h("h3", { className: "sect", textContent: t("bu_history") })); const l = h("div", { className: "nlist" }); months.forEach(m => l.append(h("div", { className: "nrow" }, h("div", { className: "nmeta" }, h("b", { textContent: new Date(m + "-15").toLocaleDateString(settings.lang, { month: "long", year: "numeric" }) })), h("span", { className: "nval", textContent: euro(sp[m]) })))); sh.append(l); }
  });
}
(ctx.shopHooks = ctx.shopHooks || []).push(body => {
  const shop = ctx.shopApi.get();
  const share = h("button", { type: "button", className: "btn", textContent: "👫 " + t("sl_share") }); share.onclick = shareList;
  const imp = h("button", { type: "button", className: "btn", textContent: "📥 " + t("sl_import") }); imp.onclick = importSheet;
  body.append(h("div", { className: "row", style: "margin-top:8px" }, share, imp));
  // Budget
  const todo = shop.filter(x => !x.done), priced = shop.filter(x => x.price > 0);
  const total = todo.reduce((s, x) => s + (x.price || 0), 0);
  const spent = lsGet(SPEND_KEY, {})[monthKey()] || 0, bud = settings.budget.monthly;
  const card = h("div", { className: "optcard budget" });
  const top = h("div", { className: "burow" }, h("div", {}, h("small", { textContent: t("bu_estimate") }), h("b", { textContent: shop.length ? euro(total) : "—" }), h("small", { className: "bsub", textContent: shop.length ? t("bu_priced", priced.length, shop.length) : "" })),
    h("div", { style: "text-align:right" }, h("small", { textContent: t("bu_month") }), h("b", { textContent: euro(spent) }), h("small", { className: "bsub", textContent: bud ? t("bu_of", euro(bud)) : t("bu_noBudget") })));
  card.append(top);
  if (bud) { const bar = h("div", { className: "kbar" }), fill = h("div"); fill.style.width = Math.min(100, Math.round(spent / bud * 100)) + "%"; if (spent > bud) fill.style.background = "#d93a2b"; bar.append(fill); card.append(bar); }
  const b1 = h("button", { type: "button", className: "btn small", textContent: "✏️ " + t("bu_prices") }); b1.onclick = pricesSheet;
  const b2 = h("button", { type: "button", className: "btn small", textContent: "🧾 " + t("bu_finish") }); b2.onclick = () => finishSheet(ctx.shopApi.get().filter(x => x.done).reduce((s, x) => s + (x.price || 0), 0));
  const b3 = h("button", { type: "button", className: "btn small", textContent: "🎯 " + t("bu_title") }); b3.onclick = budgetSheet;
  card.append(h("div", { className: "row", style: "margin-top:10px" }, b1, b2, b3));
  body.append(card);
});

/* ======================= Dates de péremption ======================= */
const EXP_KEY = "sc-expiry";
let expiry = lsGet(EXP_KEY, []);
function saveExpiry() { lsSet(EXP_KEY, expiry); }
function schedule(x) {
  if (!NATIVE || !NATIVE.remind) return;
  const at1 = new Date(x.date + "T09:00").getTime() - DAY, at0 = new Date(x.date + "T09:00").getTime(), now = Date.now();
  try {
    if (at1 > now) NATIVE.remind(hash(x.id + "a"), at1, "⏰ " + t("ex_tomorrowT"), t("ex_tomorrow", x.name));
    if (at0 > now) NATIVE.remind(hash(x.id + "b"), at0, "⏰ " + t("ex_todayT"), t("ex_today", x.name));
  } catch (e) {}
}
function unschedule(x) { if (NATIVE && NATIVE.unremind) try { NATIVE.unremind(hash(x.id + "a")); NATIVE.unremind(hash(x.id + "b")); } catch (e) {} }
expiry.forEach(schedule); // les alarmes sont perdues au redémarrage du téléphone : on les reprogramme à chaque ouverture
function addExpiry(item) {
  openSheet(sh => {
    sh.append(h("h2", { textContent: "📅 " + t("ex_add") }), h("p", { className: "sub", textContent: item.name }));
    const d = h("input", { type: "date", id: "ex-date", value: isoDay(Date.now() + 3 * DAY), min: isoDay(Date.now() - 30 * DAY) });
    const quick = h("div", { className: "chips" });
    [[1, t("ex_d1")], [3, t("ex_d3")], [7, t("ex_d7")], [30, t("ex_d30")]].forEach(([n, l]) => { const b = h("button", { type: "button", className: "chip", textContent: l }); b.onclick = () => { d.value = isoDay(Date.now() + n * DAY); }; quick.append(b); });
    const ok = h("button", { type: "button", className: "btn primary full", textContent: t("ex_save") });
    ok.onclick = () => {
      if (!d.value) return;
      const x = { id: "e" + Date.now().toString(36), name: item.name, code: item.code || "", date: d.value };
      expiry.push(x); saveExpiry(); schedule(x); closeSheet(); toast("📅 " + t("ex_saved", fmtDate(x.date))); if (["fridge", "home"].includes(ctx.view())) ctx.render();
    };
    sh.append(h("label", { className: "flabel", htmlFor: "ex-date", textContent: t("ex_date") }), h("div", { className: "f", style: "margin:0 0 10px" }, d), quick, h("div", { style: "margin-top:12px" }, ok), h("p", { className: "notice", textContent: t("ex_notifHelp") }));
  });
}
function expiryView(body) {
  const add = h("button", { type: "button", className: "btn primary", textContent: "📷 " + t("ex_scan") }); add.onclick = () => scanProduct(p => addExpiry({ name: p.name || p.code, code: p.code }));
  const inp = h("input", { placeholder: t("ex_manualPh"), id: "ex-name" });
  const plus = h("button", { type: "button", className: "btn", textContent: "+" }); plus.onclick = () => { const v = inp.value.trim(); if (v) addExpiry({ name: v }); };
  body.append(h("div", { className: "row" }, add), h("div", { className: "inrow", style: "margin-top:8px" }, inp, plus));
  if (!expiry.length) { body.append(h("div", { className: "soon", style: "margin-top:14px" }, h("p", { style: "margin:0;color:var(--muted)", textContent: t("ex_empty") }))); return; }
  const l = h("div", { className: "nlist", style: "margin-top:12px" });
  expiry.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(x => {
    const n = daysLeft(x.date), col = n < 0 ? "#6b7280" : n <= 1 ? "#d93a2b" : n <= 3 ? "#e8900c" : "#1f9d55";
    const lab = n < 0 ? t("ex_past", -n) : n === 0 ? t("ex_d0") : n === 1 ? t("ex_d1s") : t("ex_dn", n);
    const del = h("button", { type: "button", className: "iconbtn", ariaLabel: t("ex_eaten"), textContent: "✓" });
    del.onclick = () => { unschedule(x); expiry = expiry.filter(y => y !== x); saveExpiry(); if (ctx.track) ctx.track("eaten"); ctx.render(); toast("👍 " + t("ex_eatenT")); };
    const row = h("div", { className: "nrow" }, h("span", { className: "nico", textContent: n <= 1 ? "⏰" : "🥫" }), h("div", { className: "nmeta" }, h("b", { textContent: x.name }), h("small", { textContent: fmtDate(x.date) })), h("span", { className: "exday", style: "background:" + col, textContent: lab }), del);
    if (x.code) row.querySelector(".nmeta").onclick = () => ctx.openProduct(x.code);
    l.append(row);
  });
  body.append(l, h("p", { className: "sub", textContent: t("ex_tip") }));
}

/* ======================= Anti-gaspi : une recette avec ce qu'il reste ======================= */
const STAPLE = new Set(["sel", "poivre", "huile", "colza", "olive", "epices", "herbes", "eau", "bouillon", "sucre", "farine", "vinaigre", "ail", "beurre", "moutarde"]);
const HAVE_KEY = "sc-fridge-have";
let have = new Set(lsGet(HAVE_KEY, [])), gQuery = "";
function gaspiView(body) {
  const q = h("input", { placeholder: t("ag_searchPh"), value: gQuery, id: "ag-q", autocomplete: "off" });
  body.append(h("p", { className: "sub", style: "margin-top:0", textContent: t("ag_help") }), h("div", { className: "f", style: "margin:0 0 8px" }, q));
  const chips = h("div", { className: "chips agchips" }), res = h("div");
  body.append(chips);
  const used = {}; K.RECIPES.forEach(r => r.i.forEach(([k]) => { if (!STAPLE.has(k) && K.ING[k]) used[k] = (used[k] || 0) + 1; }));
  const keys = Object.keys(used).sort((a, b) => used[b] - used[a]);
  const drawChips = () => {
    chips.textContent = "";
    const nq = D.norm(gQuery.trim());
    const show = nq ? keys.filter(k => D.norm(K.ING[k][0]).includes(nq)).slice(0, 40) : [...have].concat(keys.filter(k => !have.has(k)).slice(0, 36 - have.size));
    show.forEach(k => { const b = h("button", { type: "button", className: "chip" + (have.has(k) ? " on" : ""), textContent: (have.has(k) ? "✓ " : "") + K.ING[k][0] }); b.onclick = () => { have.has(k) ? have.delete(k) : have.add(k); lsSet(HAVE_KEY, [...have]); drawChips(); drawRes(); }; chips.append(b); });
  };
  const drawRes = () => {
    res.textContent = "";
    if (!have.size) { res.append(h("div", { className: "soon", style: "margin-top:12px" }, h("p", { style: "margin:0;color:var(--muted)", textContent: t("ag_pick") }))); return; }
    const scored = [];
    for (const r of K.RECIPES) {
      const main = r.i.map(x => x[0]).filter(k => !STAPLE.has(k)); if (!main.length) continue;
      const got = main.filter(k => have.has(k)); if (!got.length) continue;
      scored.push({ r, got: got.length, miss: main.filter(k => !have.has(k)), ratio: got.length / main.length });
    }
    scored.sort((a, b) => b.got - a.got || a.miss.length - b.miss.length || a.r.t - b.r.t);
    const clear = h("button", { type: "button", className: "btn small", textContent: t("ag_clear") }); clear.onclick = () => { have.clear(); lsSet(HAVE_KEY, []); drawChips(); drawRes(); };
    res.append(h("div", { className: "sect2" }, h("h3", { textContent: t("ag_found", scored.length) }), clear));
    const l = h("div", { className: "nlist" });
    scored.slice(0, 40).forEach(x => {
      const b = h("button", { type: "button", className: "nrow" }, h("span", { className: "nico", textContent: x.miss.length ? "🍳" : "🎉" }), h("div", { className: "nmeta" }, h("b", { textContent: x.r.n }), h("small", { textContent: x.miss.length ? t("ag_miss", x.miss.slice(0, 4).map(k => K.ING[k] ? K.ING[k][0] : k).join(", ") + (x.miss.length > 4 ? "…" : "")) : t("ag_all") })), h("span", { className: "nval", textContent: x.got + "✓ · " + x.r.t + " min" }));
      b.onclick = () => ctx.openRecipe(x.r.id, "fridge"); l.append(b);
    });
    res.append(l);
  };
  q.oninput = () => { gQuery = q.value; drawChips(); };
  drawChips(); drawRes(); body.append(res);
}

/* ======================= Rappels de produits (RappelConso) ======================= */
const RC = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-trie/records";
const RC_KEY = "sc-recalls";
const rcSeen = () => lsGet("sc-recalls-seen", []);
function normRecall(r) {
  const img = String(r.liens_vers_les_images || r.lien_vers_les_images || "").split(/[\s|,]+/).find(u => /^https:\/\//.test(u)) || "";
  return { id: String(r.numero_fiche || r.reference_fiche || r.id || r.rappel_guid || (r.libelle + r.date_publication)), gtin: String(r.gtin || ""), name: r.libelle || r.modeles_ou_references || r.nom_de_la_marque_du_produit || "", brand: r.marque_produit || r.nom_de_la_marque_du_produit || "",
    date: String(r.date_publication || "").slice(0, 10), why: r.motif_rappel || r.motif_du_rappel || "", risk: r.risques_encourus || r.risques_encourus_par_le_consommateur || "", todo: r.conduites_a_tenir_par_le_consommateur || "",
    shops: r.distributeurs || "", end: r.date_de_fin_de_la_procedure_de_rappel || "", lots: String(r.identification_produits || r.identification_des_produits || "").replace(/\$/g, " · ").slice(0, 400), health: r.preconisations_sanitaires || "", img, cat: r.categorie_produit || r.categorie_de_produit || "" };
}
function myCodes() {
  const s = new Set();
  (ctx.foodHistory ? ctx.foodHistory() : []).slice(0, 120).forEach(x => x.code && s.add(x.code));
  ctx.shopApi && ctx.shopApi.get().forEach(x => x.code && s.add(x.code));
  expiry.forEach(x => x.code && s.add(x.code)); lsGet("sc-bath", []).forEach(x => s.add(x.code));
  return [...s].filter(c => /^\d{8,14}$/.test(c)).map(c => c.replace(/^0+/, ""));
}
async function fetchMine(force) {
  const cache = lsGet(RC_KEY, null), codes = myCodes(), sig = hash(codes.slice().sort().join(","));
  if (!force && cache && cache.sig === sig && Date.now() - cache.t < 12 * 3600e3) return cache.mine;
  const mine = [];
  for (let i = 0; i < codes.length; i += 30) {
    const where = codes.slice(i, i + 30).map(c => "gtin=" + c).join(" OR ");
    const j = await getJSON(RC + "?limit=100&where=" + encodeURIComponent(where));
    (j.results || []).forEach(r => mine.push(normRecall(r)));
  }
  lsSet(RC_KEY, { t: Date.now(), sig, mine }); return mine;
}
async function fetchRecent() {
  const j = await getJSON(RC + "?limit=40&order_by=" + encodeURIComponent("date_publication desc") + "&where=" + encodeURIComponent('categorie_produit="alimentation"'));
  const seen = new Set(), out = [];
  (j.results || []).map(normRecall).forEach(x => { if (!seen.has(x.id)) { seen.add(x.id); out.push(x); } });
  return out.slice(0, 25);
}
function recallCard(x, mine) {
  const det = h("div", { className: "ndet" });
  [["⚠️", t("rc_why"), x.why], ["🩺", t("rc_risk"), x.risk], ["💡", t("rc_health"), x.health], ["👉", t("rc_todo"), x.todo], ["🏪", t("rc_shops"), x.shops], ["🔢", t("rc_lots"), x.lots], ["📆", t("rc_end"), x.end && String(x.end).slice(0, 10)]]
    .forEach(([i, l, v]) => { if (v) det.append(h("small", {}, h("b", { textContent: i + " " + l + " : " }), String(v))); });
  det.hidden = !mine;
  const im = h("div", { className: "pimg" }); if (x.img) im.style.backgroundImage = "url('" + x.img.replace(/'/g, "%27") + "')"; else im.textContent = "🚨";
  const head = h("button", { type: "button", className: "prow" + (mine ? " rcmine" : "") }, im, h("div", { className: "pmeta" }, h("b", { textContent: x.name || x.brand }), h("small", { textContent: [x.brand, x.date && new Date(x.date + "T12:00").toLocaleDateString(settings.lang)].filter(Boolean).join(" · ") })));
  head.onclick = () => det.hidden = !det.hidden;
  return h("div", { className: "rccard" }, head, det);
}
let rcRecent = null, rcErr = false;
function recallView(body) {
  const cache = lsGet(RC_KEY, null);
  const box = h("div"); body.append(box);
  const draw = mine => {
    box.textContent = "";
    box.append(h("h3", { className: "sect", style: "margin-top:4px", textContent: "🛒 " + t("rc_mine") }));
    if (!mine) box.append(h("p", { className: "sub", textContent: "⏳ " + t("f_loading") }));
    else if (!mine.length) box.append(h("div", { className: "okbox", textContent: "✅ " + t("rc_none", myCodes().length) }));
    else mine.forEach(x => box.append(recallCard(x, true)));
    if (mine) lsSet("sc-recalls-seen", mine.map(x => x.id));
    box.append(h("h3", { className: "sect", textContent: "📰 " + t("rc_recent") }));
    if (rcErr) box.append(h("p", { className: "sub", textContent: t("rc_offline") }));
    else if (!rcRecent) box.append(h("p", { className: "sub", textContent: "⏳ " + t("f_loading") }));
    else rcRecent.forEach(x => box.append(recallCard(x, false)));
    box.append(h("p", { className: "notice", textContent: t("rc_source") }));
  };
  draw(cache ? cache.mine : null);
  Promise.all([fetchMine(false).catch(() => { rcErr = true; return cache ? cache.mine : []; }), rcRecent ? rcRecent : fetchRecent().then(r => rcRecent = r).catch(() => { rcErr = true; })])
    .then(([mine]) => { if (ctx.view() === "fridge" && fTab === "recalls") draw(mine); });
}
// Vérification discrète au lancement (au plus deux fois par jour)
setTimeout(() => { fetchMine(false).then(m => { if (m.some(x => !rcSeen().includes(x.id)) && ctx.view() === "home") ctx.render(); }).catch(() => {}); }, 4000);

/* ======================= Module « Mon frigo » ======================= */
let fTab = "dates";
VIEWS.fridge = root => {
  const wrap = h("div", { className: "wrap" }); root.append(wrap);
  wrap.append(h("header", {}, header(t("modFridge"), { back: true })));
  wrap.append(seg(ctx.tabsFor("fridge", [["dates", "⏰ " + t("fr_dates")], ["gaspi", "🧊 " + t("fr_gaspi")], ["recalls", "🚨 " + t("fr_recalls")]]), fTab, k => { fTab = k; go("fridge"); }));
  const body = h("div", { style: "margin-top:12px" }); wrap.append(body);
  (ctx.extraView("fridge", fTab) || { dates: expiryView, gaspi: gaspiView, recalls: recallView }[fTab] || expiryView)(body);
};
ctx.modules.push({ key: "fridge", color: "linear-gradient(135deg,#22b8cf,#1971c2)", title: () => t("modFridge"), sub: () => t("modFridgeSub"),
  badge: () => { const n = expiry.filter(x => daysLeft(x.date) <= 2).length; return n ? "⏰ " + n : null; },
  icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M9 5v2M9 13v3"/></svg>' });

/* ======================= Ma salle de bain ======================= */
const BATH_KEY = "sc-bath";
let bath = lsGet(BATH_KEY, []);
function saveBath() { lsSet(BATH_KEY, bath); }
function inBath(code) { return bath.some(x => x.code === code); }
function toBath(p) { if (inBath(p.code)) return; bath.unshift({ code: p.code, name: p.name || p.code, brand: p.brand || "", score: ctx.foodScore ? ctx.foodScore(p) : null, t: Date.now() }); saveBath(); }
VIEWS.bathroom = root => {
  const wrap = h("div", { className: "wrap" }); root.append(wrap);
  wrap.append(h("header", {}, header(t("modBath"), { back: true })));
  const sc = bath.filter(x => x.score != null), avg = sc.length ? Math.round(sc.reduce((s, x) => s + x.score, 0) / sc.length) : null;
  const hero = h("div", { className: "chhero bathhero" }); hero.innerHTML = window.SoveeMascot ? SoveeMascot.img(70) : "";
  hero.append(h("div", {}, h("b", { textContent: avg == null ? t("ba_title") : t("ba_avg", avg) }), h("span", { textContent: t("ba_count", bath.length) })));
  wrap.append(hero);
  const add = h("button", { type: "button", className: "btn primary full", textContent: "📷 " + t("ba_scan") });
  add.onclick = () => scanProduct(p => { if (p.type !== "beauty") { toast(t("ba_notBeauty")); return; } toBath(p); toast("🧴 " + t("ba_added")); ctx.openProduct(p.code); });
  wrap.append(add);
  if (!bath.length) { wrap.append(h("div", { className: "soon", style: "margin-top:14px" }, h("p", { style: "margin:0;color:var(--muted)", textContent: t("ba_empty") }))); return; }
  const sorted = bath.slice().sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
  wrap.append(h("h3", { className: "sect", textContent: t("ba_list") }));
  const l = h("div", { className: "plist" });
  sorted.forEach(x => {
    const row = ctx.productRow({ code: x.code, name: x.name, brand: x.brand, type: "beauty" }, { score: x.score });
    const rm = h("button", { type: "button", className: "iconbtn rmbtn", ariaLabel: t("ba_remove"), textContent: "✕" });
    rm.onclick = e => { e.stopPropagation(); bath = bath.filter(y => y.code !== x.code); saveBath(); ctx.render(); };
    l.append(h("div", { className: "bathrow" }, row, rm));
  });
  wrap.append(l, h("p", { className: "notice", textContent: t("ba_tip") }));
};
ctx.modules.push({ key: "bathroom", color: "linear-gradient(135deg,#63e6be,#0ca678)", title: () => t("modBath"), sub: () => t("modBathSub"),
  badge: () => bath.length ? String(bath.length) : null,
  icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M9 3h6v4H9zM8 7h8l1 3v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10z"/><path d="M10 14h4"/></svg>' });

/* ======================= Médicaments et aliments ======================= */
// Interactions bien établies (ANSM, Thésaurus des interactions médicamenteuses ; RCP des médicaments ; HAS). Pas d'avis personnalisé.
const MEDS = [
  { k: "avk", ic: "🩸", re: /\b(chou|choux|[eé]pinard|brocoli|persil|cresson|kale|blettes?|laitue|foie|natto)\b/i, src: "ANSM, RCP des AVK" },
  { k: "statin", ic: "🫀", re: /pamplemousse|grapefruit|pomelo/i, src: "ANSM (simvastatine, atorvastatine)" },
  { k: "ccb", ic: "💓", re: /pamplemousse|grapefruit|pomelo/i, src: "ANSM, RCP (félodipine, nifédipine…)" },
  { k: "immuno", ic: "🛡️", re: /pamplemousse|grapefruit|pomelo|millepertuis/i, src: "ANSM (ciclosporine, tacrolimus)" },
  { k: "levo", ic: "🦋", re: /\bsoja\b|\bsoy|caf[eé]|coffee|calcium|\bfer\b/i, src: "ANSM, RCP lévothyroxine" },
  { k: "abx", ic: "💊", re: /\blait\b|milk|yaourt|fromage|calcium|cheese|yogurt/i, src: "RCP (fluoroquinolones, cyclines)" },
  { k: "kalium", ic: "🧂", re: /chlorure de potassium|potassium chloride|sel de r[eé]gime|\be508\b|\be-508\b/i, src: "ANSM (IEC, sartans, épargneurs de potassium)" },
  { k: "licorice", ic: "🍬", re: /r[eé]glisse|glycyrrh|liquorice|licorice/i, src: "ANSES 2014 ; RCP digoxine, diurétiques" },
  { k: "alcohol", ic: "🍷", re: /\balcool\b|alcohol|\bvin\b|bi[eè]re|\bwine\b|\bbeer\b|rhum|whisky|vodka|liqueur/i, src: "ANSM, RCP" },
  { k: "maoi", ic: "🧀", re: /fromage affin|parmesan|roquefort|choucroute|sauce soja|soy sauce|salami|saucisson|levure|miso/i, src: "RCP des IMAO" }
];
settings.meds = Array.isArray(settings.meds) ? settings.meds : [];
function medHits(p) {
  if (!settings.meds.length || !p || p.type === "beauty") return [];
  const txt = [p.name, p.ing, (p.cats || []).join(" "), (p.add || []).join(" ")].join(" ");
  return MEDS.filter(m => settings.meds.includes(m.k) && m.re.test(txt));
}
let mTab = null;
VIEWS.meds = root => {
  const wrap = h("div", { className: "wrap" }); root.append(wrap);
  wrap.append(h("header", {}, header(t("modMeds"), { back: true })));
  const tabs = ctx.tabsFor("meds", []).concat([["drugs", "💊 " + t("md_tab")]]);
  if (!mTab || !tabs.some(x => x[0] === mTab)) mTab = tabs[0][0];
  if (tabs.length > 1) wrap.append(seg(tabs, mTab, k => { mTab = k; go("meds"); }));
  const xv = ctx.extraView("meds", mTab);
  if (xv) { const body = h("div", { style: "margin-top:12px" }); wrap.append(body); xv(body); return; }
  wrap.append(h("div", { className: "alert medwarn", textContent: "⚠️ " + t("md_warn") }), h("p", { className: "sub", textContent: t("md_help") }));
  const l = h("div", { className: "nlist" });
  MEDS.forEach(m => {
    const cb = h("input", { type: "checkbox", id: "md-" + m.k }); cb.checked = settings.meds.includes(m.k);
    cb.onchange = () => { settings.meds = cb.checked ? [...settings.meds, m.k] : settings.meds.filter(x => x !== m.k); saveSettings(); toast(t("saved")); };
    const det = h("div", { className: "ndet" }, h("small", {}, h("b", { textContent: "💊 " + t("md_drugs") + " : " }), t("md_" + m.k + "_drugs")), h("small", {}, h("b", { textContent: "🍽️ " + t("md_foods") + " : " }), t("md_" + m.k + "_foods")), h("small", {}, h("b", { textContent: "👉 " + t("md_advice") + " : " }), t("md_" + m.k + "_advice")), h("small", { className: "srcline", textContent: "📚 " + m.src }));
    det.hidden = true;
    const head = h("div", { className: "nrow open" }, h("span", { className: "nico", textContent: m.ic }), h("div", { className: "nmeta" }, h("b", { textContent: t("md_" + m.k) }), h("small", { textContent: t("md_" + m.k + "_short") })), h("label", { className: "medcb", htmlFor: "md-" + m.k, onclick: e => e.stopPropagation() }, cb));
    head.onclick = () => det.hidden = !det.hidden;
    l.append(h("div", {}, head, det));
  });
  wrap.append(l, h("p", { className: "notice", textContent: t("md_source") }));
};
ctx.modules.push({ key: "meds", color: "linear-gradient(135deg,#748ffc,#4263eb)", title: () => t("modMeds"), sub: () => t("modMedsSub"),
  badge: () => settings.meds.length ? "💊 " + settings.meds.length : null,
  icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="M9.5 8.5l5 5.8"/></svg>' });

/* ======================= Comparateur ======================= */
let cmp = [null, null];
function compareRows(a, b) {
  const sa = ctx.foodScore(a), sb = ctx.foodScore(b), na = a.n || {}, nb = b.n || {};
  const rows = [[t("cp_score"), sa, sb, 1, v => v == null ? "?" : v + "/100"]];
  if (a.type !== "beauty" && b.type !== "beauty") {
    rows.push(["Nutri-Score", a.ns ? "abcde".indexOf(a.ns) : null, b.ns ? "abcde".indexOf(b.ns) : null, -1, v => v == null || v < 0 ? "?" : "ABCDE"[v]]);
    rows.push(["NOVA", a.nova || null, b.nova || null, -1, v => v == null ? "?" : String(v)]);
    [["kcal", "kcal", ""], ["sug", t("cp_sugar"), " g"], ["salt", t("cp_salt"), " g"], ["sat", t("cp_sat"), " g"], ["fib", t("cp_fib"), " g"], ["prot", t("cp_prot"), " g"]].forEach(([k, l, u]) => rows.push([l, na[k], nb[k], k === "fib" || k === "prot" ? 1 : -1, v => v == null ? "?" : (Math.round(v * 10) / 10).toString().replace(".", ",") + u]));
    rows.push([t("cp_add"), (a.add || []).length, (b.add || []).length, -1, v => String(v)]);
  }
  return rows;
}
VIEWS.compare = root => {
  const wrap = h("div", { className: "wrap" }); root.append(wrap);
  wrap.append(h("header", {}, header(t("cp_title"), { back: true })));
  const [a, b] = cmp; if (!a || !b) { wrap.append(h("p", { className: "sub", textContent: t("cp_pick") })); return; }
  const head = h("div", { className: "cphead" });
  [a, b].forEach(p => { const c = h("button", { type: "button", className: "cpcol" }); const im = ctx.productImage(h("div", { className: "pimg" }), p); c.append(im, h("b", { textContent: p.name || p.code }), h("small", { textContent: p.brand || "" })); c.onclick = () => ctx.openProduct(p.code); head.append(c); });
  wrap.append(head);
  const tb = h("div", { className: "cptable" }); let wa = 0, wb = 0;
  compareRows(a, b).forEach(([l, va, vb, dir, f]) => {
    const both = va != null && vb != null && !(typeof va === "number" && va < 0) && !(typeof vb === "number" && vb < 0);
    const better = both && va !== vb ? ((va > vb) === (dir > 0) ? 0 : 1) : -1;
    if (better === 0) wa++; if (better === 1) wb++;
    tb.append(h("div", { className: "cprow" }, h("span", { className: "cpv" + (better === 0 ? " win" : ""), textContent: f(va) }), h("small", { textContent: l }), h("span", { className: "cpv" + (better === 1 ? " win" : ""), textContent: f(vb) })));
  });
  wrap.append(tb);
  const sa = ctx.foodScore(a), sb = ctx.foodScore(b);
  const win = sa == null || sb == null ? null : sa === sb ? -1 : sa > sb ? 0 : 1;
  wrap.append(h("div", { className: "cpverdict" }, h("b", { textContent: win == null ? t("cp_unknown") : win < 0 ? t("cp_tie") : "🏆 " + t("cp_win", ([a, b][win].name || "")) }), h("small", { textContent: t("cp_points", wa, wb) })));
  const again = h("button", { type: "button", className: "btn full", textContent: "🔄 " + t("cp_other") }); again.onclick = () => pickSecond(a);
  wrap.append(again);
};
function pickSecond(a) {
  cmp = [a, null];
  openSheet(sh => {
    sh.append(h("h2", { textContent: "⚖️ " + t("cp_with") }), h("p", { className: "sub", textContent: a.name || a.code }));
    const scan = h("button", { type: "button", className: "btn primary full", textContent: "📷 " + t("cp_scan") });
    scan.onclick = () => scanProduct(p => { cmp = [a, p]; go("compare"); });
    sh.append(scan);
    const hist = (ctx.foodHistory ? ctx.foodHistory() : []).filter(x => x.code !== a.code && (x.type === "beauty") === (a.type === "beauty")).slice(0, 15);
    if (hist.length) {
      sh.append(h("h3", { className: "sect", textContent: t("cp_recent") }));
      const l = h("div", { className: "plist" });
      hist.forEach(x => { const r = h("button", { type: "button", className: "prow" }, ctx.productImage(h("div", { className: "pimg" }), x), h("div", { className: "pmeta" }, h("b", { textContent: x.name || x.code }), h("small", { textContent: x.brand || "" })));
        r.onclick = async () => { const p = await D.findProduct(x.code).catch(() => null); if (!p) { toast(t("sh_unknown")); return; } cmp = [a, p]; go("compare"); }; l.append(r); });
      sh.append(l);
    }
  });
}

/* ======================= Boutons sur la fiche produit ======================= */
const recallByCode = {};
ctx.productHooks.push((wrap, p) => {
  if (!p || !p.code) return;
  // Alerte rappel produit
  const alertBox = h("div");
  wrap.append(alertBox);
  const showRecall = list => { alertBox.textContent = ""; list.forEach(x => { const c = recallCard(x, true); c.classList.add("rcalert"); alertBox.append(h("div", { className: "rctitle", textContent: "🚨 " + t("rc_alert") }), c); }); };
  const code = p.code.replace(/^0+/, ""), cache = lsGet(RC_KEY, null);
  const known = (cache ? cache.mine : []).filter(x => x.gtin.replace(/^0+/, "") === code);
  if (known.length) showRecall(known);
  else if (recallByCode[code]) showRecall(recallByCode[code]);
  else if (/^\d{8,14}$/.test(code)) getJSON(RC + "?limit=5&where=" + encodeURIComponent("gtin=" + code)).then(j => { recallByCode[code] = (j.results || []).map(normRecall); if (recallByCode[code].length && ctx.view() === "product") showRecall(recallByCode[code]); }).catch(() => {});
  // Médicaments
  const mh = medHits(p);
  if (mh.length) { const box = h("div", { className: "medalert" }, h("b", { textContent: "💊 " + t("md_alert") })); mh.forEach(m => box.append(h("span", { textContent: m.ic + " " + t("md_" + m.k) + " : " + t("md_" + m.k + "_advice") }))); wrap.append(box); }
  // Actions
  const row = h("div", { className: "pactions" });
  const cp = h("button", { type: "button", className: "btn small", textContent: "⚖️ " + t("cp_btn") }); cp.onclick = () => pickSecond(p); row.append(cp);
  if (p.type !== "beauty") { const ex = h("button", { type: "button", className: "btn small", textContent: "📅 " + t("ex_btn") }); ex.onclick = () => addExpiry({ name: p.name || p.code, code: p.code }); row.append(ex); }
  if (p.type === "beauty") {
    const bb = h("button", { type: "button", className: "btn small", textContent: inBath(p.code) ? "✓ " + t("ba_in") : "🧴 " + t("ba_add") });
    bb.onclick = () => { if (inBath(p.code)) { bath = bath.filter(x => x.code !== p.code); saveBath(); bb.textContent = "🧴 " + t("ba_add"); } else { toBath(p); bb.textContent = "✓ " + t("ba_in"); toast("🧴 " + t("ba_added")); } };
    row.append(bb);
  }
  wrap.append(row);
});

/* ======================= Ma journée (accueil) ======================= */
ctx.homeHooks.push(el => {
  // Alertes : rappels et dates proches
  const cache = lsGet(RC_KEY, null), seen = rcSeen(), fresh = (cache ? cache.mine : []).filter(x => !seen.includes(x.id));
  if (fresh.length) { const b = h("button", { type: "button", className: "homealert red" }, h("b", { textContent: "🚨 " + t("rc_home", fresh.length) }), h("small", { textContent: fresh[0].name })); b.onclick = () => { fTab = "recalls"; go("fridge"); }; el.append(b); }
  const soon = expiry.filter(x => daysLeft(x.date) <= 1 && daysLeft(x.date) >= -1);
  if (soon.length) { const b = h("button", { type: "button", className: "homealert" }, h("b", { textContent: "⏰ " + t("ex_home", soon.length) }), h("small", { textContent: soon.map(x => x.name).join(", ") })); b.onclick = () => { fTab = "dates"; go("fridge"); }; el.append(b); }
  // Eau et calories du jour
  const DAY_KEY = "sc-balance-day", all = lsGet(DAY_KEY, {}), k = isoDay(), d = Object.assign({ fl: 0, water: 0, dairy: 0, whole: false, move: false }, all[k] || {});
  const meals = lsGet("sc-meals", []).filter(m => isoDay(new Date(m.t)) === k);
  const PL = K.PLATE || [], kcal = Math.round(meals.reduce((s, m) => s + (m.items || []).reduce((a, x) => a + ((PL[x.i] || [])[2] || 0) * x.g / 100, 0), 0));
  const target = (settings.kitchen && settings.kitchen.kcalTarget) || 2000;
  const card = h("div", { className: "dayCard" });
  const mood = d.water >= 8 ? "😍" : d.water >= 4 ? "😊" : "🥵";
  const wv = h("b", { textContent: d.water + "/8" });
  const set = n => { if (n === 8 && d.water === 7 && ctx.track) ctx.track("water8"); d.water = Math.max(0, Math.min(20, n)); all[k] = d; lsSet(DAY_KEY, all); wv.textContent = d.water + "/8"; drops.style.setProperty("--p", Math.min(100, d.water / 8 * 100) + "%"); face.textContent = d.water >= 8 ? "😍" : d.water >= 4 ? "😊" : "🥵"; if (d.water === 8) toast("💧 " + t("dy_waterOk")); };
  const minus = h("button", { type: "button", className: "iconbtn", ariaLabel: "-", textContent: "−" }); minus.onclick = () => set(d.water - 1);
  const plus = h("button", { type: "button", className: "iconbtn", ariaLabel: "+", textContent: "+" }); plus.onclick = () => set(d.water + 1);
  const drops = h("div", { className: "dbar water" }); drops.style.setProperty("--p", Math.min(100, d.water / 8 * 100) + "%");
  const face = h("span", { className: "dface", textContent: mood });
  const kb = h("div", { className: "dbar kcal" }); kb.style.setProperty("--p", Math.min(100, kcal / target * 100) + "%");
  const kcalBtn = h("button", { type: "button", className: "dkcal" }, h("span", { textContent: "🔥 " + t("dy_kcal") }), h("b", { textContent: kcal + " / " + target }), kb);
  kcalBtn.onclick = () => go("plate");
  card.append(h("div", { className: "dhead" }, face, h("b", { textContent: t("dy_title") })),
    h("div", { className: "dwater" }, h("span", { textContent: "💧 " + t("dy_water") }), h("div", { className: "stepper" }, minus, wv, plus), drops), kcalBtn);
  el.append(card);
});

/* ======================= Recherche vocale ======================= */
function cleanQuery(s) {
  return D.norm(s).replace(/[?!.,;:'’"«»]/g, " ").replace(/\b(sovee|sovée|dis|dites|hey|ok|est ce que|est-ce que|c est|cest|bon|bonne|sain|saine|il|elle|ils|le|la|les|l|du|de|des|un|une|pour|moi|la sante|sante|is|it|good|the|a|healthy|es|bueno|el|los|las|lo)\b/g, " ").replace(/\s+/g, " ").trim();
}
async function voiceSearch(text) {
  if (!text) return;
  const raw = D.norm(text);
  if (/\b(scanne|scanner|scan)\b/.test(raw)) { ctx.scanBarcode(c => ctx.openProduct(c), m => toast(m)); return; }
  if (/\bliste\b|courses|shopping/.test(raw)) { go("recipes"); return; }
  const q = cleanQuery(text); if (!q) { toast(t("vo_none")); return; }
  toast("🎙️ « " + text + " »");
  let rows = await D.searchLocal(q, 30).catch(() => []);
  if (!rows.length && q.split(" ").length > 1) rows = await D.searchLocal(q.split(" ").sort((a, b) => b.length - a.length)[0], 30).catch(() => []);
  if (!rows.length) { toast(t("vo_notFound", q)); return; }
  rows.sort((a, b) => D.norm(a.n).split(" ").length - D.norm(b.n).split(" ").length);
  const exact = rows.find(r => D.norm(r.n) === q) || (rows.length === 1 ? rows[0] : null);
  if (exact) { ctx.openProduct(exact.c, { name: exact.n }); return; }
  openSheet(sh => {
    sh.append(h("h2", { textContent: "🎙️ " + t("vo_results", text) }));
    const l = h("div", { className: "plist" });
    rows.slice(0, 12).forEach(r => { const row = r.type === "beauty" ? ctx.productRow({ code: r.c, name: r.n, brand: r.b, type: "beauty" }, { score: r.s }) : ctx.productRow(D.rowAsProduct(r)); l.append(row); });
    sh.append(l);
  });
}
function listen() {
  if (NATIVE && NATIVE.voice) { window.onVoice = (txt, err) => { if (txt) voiceSearch(txt); else if (err === "none") toast(t("vo_unavailable")); }; NATIVE.voice({ fr: "fr-FR", en: "en-GB", es: "es-ES" }[settings.lang] || "fr-FR"); return; }
  openSheet(sh => {
    const inp = h("input", { placeholder: t("vo_typePh"), id: "vo-q" }); const ok = h("button", { type: "button", className: "btn primary", textContent: "🔎" });
    ok.onclick = () => { closeSheet(); voiceSearch(inp.value); }; inp.onkeydown = e => { if (e.key === "Enter") ok.onclick(); };
    sh.append(h("h2", { textContent: "🎙️ " + t("vo_title") }), h("div", { className: "inrow" }, inp, ok));
  });
}
ctx.homeBar.push(() => { const b = h("button", { type: "button", className: "langbtn micbtn", ariaLabel: t("vo_title"), textContent: "🎙️" }); b.onclick = listen; return b; });
ctx.voiceSearch = voiceSearch;
// Pour les tests automatiques sur émulateur (aucune donnée exposée)
ctx.setMedsTab = k => { mTab = k; }; ctx.addExpiry = addExpiry; ctx.addExpiryQuick = (name, date) => { const x = { id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, code: "", date }; expiry.push(x); saveExpiry(); schedule(x); }; ctx.fridgeTab = k => { fTab = k; }; ctx.scanProduct = scanProduct; ctx.monthKey = monthKey; ctx.SPEND_KEY = SPEND_KEY;
window.SoveeTest = { open: c => ctx.openProduct(c), go: v => go(v), compare: (a, b) => Promise.all([D.findProduct(a), D.findProduct(b)]).then(([x, y]) => { cmp = [x, y]; go("compare"); }) };

/* ======================= Widget de l'écran d'accueil ======================= */
window.onWidget = a => {
  if (a === "scan") { go("food"); setTimeout(() => ctx.scanBarcode(c => ctx.openProduct(c), m => toast(m)), 250); return; }
  if (VIEWS[a]) go(a);
};
ctx.backHooks.push(() => { if (ctx.view() === "compare") { go("product"); return true; } return false; });
});
