// Module Promos & prix : compare les prix relevés d'un produit dans les magasins autour de toi.
// Source : Open Prices (projet ouvert d'Open Food Facts, prix relevés par les consommateurs) + tes propres relevés.
// Aucune enseigne ne publie ses prix et promos de façon ouverte : c'est l'option réaliste la plus complète.
(window.SC_EXT = window.SC_EXT || []).push(function (ctx) {
"use strict";
const { h, t, settings, saveSettings, go, header, openSheet, closeSheet, VIEWS, lsGet, lsSet, toast, NATIVE, openUrl } = ctx;
const D = window.FoodData;
settings.prices = Object.assign({ radius: 20 }, settings.prices || {});
const P = settings.prices;
const API = "https://prices.openfoodfacts.org/api/v1/prices";
const MINE_KEY = "sc-myprices", POS_KEY = "sc-pos";
let mine = lsGet(MINE_KEY, []);
function saveMine() { lsSet(MINE_KEY, mine.slice(0, 500)); }

/* ---------- Réseau (par Android pour éviter les blocages CORS) ---------- */
let seq = 0; const pending = {};
window.onHttp = (id, status, body) => { const cb = pending[id]; if (cb) { delete pending[id]; cb(status, body); } };
function getJSON(url) {
  if (NATIVE && NATIVE.httpGet) {
    return new Promise((ok, ko) => {
      const id = "h" + (++seq);
      const timer = setTimeout(() => { delete pending[id]; ko(new Error("timeout")); }, 20000);
      pending[id] = (status, body) => { clearTimeout(timer); if (status >= 200 && status < 300) { try { ok(JSON.parse(body)); } catch (e) { ko(e); } } else ko(new Error("HTTP " + status)); };
      NATIVE.httpGet(id, url);
    });
  }
  const c = new AbortController(); setTimeout(() => c.abort(), 15000);
  return fetch(url, { signal: c.signal }).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
}

/* ---------- Position ---------- */
function savedPos() { const p = lsGet(POS_KEY, null); return p && Date.now() - p.t < 6 * 3600e3 ? p : null; }
function locate() {
  return new Promise((ok, ko) => {
    // Sans position, on se repère avec le code postal des options (Base adresse nationale)
    const byZip = e => {
      const zip = (settings.zip || "").trim(); if (!/^\d{5}$/.test(zip)) return ko(e);
      fetch("https://api-adresse.data.gouv.fr/search/?q=" + zip + "&type=municipality&limit=1").then(r => r.json()).then(j => {
        const f = j.features && j.features[0]; if (!f) return ko(e);
        const v = { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], acc: 5000, t: Date.now(), zip }; ok(v);
      }).catch(() => ko(e));
    };
    if (!navigator.geolocation) return byZip(new Error("geo"));
    navigator.geolocation.getCurrentPosition(p => { const v = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() }; lsSet(POS_KEY, v); ok(v); },
      e => byZip(e), { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60e3 });
  });
}
function distKm(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/* ---------- Lecture des prix Open Prices ---------- */
function normPrice(it) {
  const loc = it.location || {};
  const lat = +(loc.osm_lat ?? loc.lat), lon = +(loc.osm_lon ?? loc.lon);
  const name = loc.osm_name || loc.osm_brand || loc.website_url || t("pr_store");
  const city = loc.osm_address_city || "";
  const prod = it.product || {};
  return {
    price: +it.price, was: it.price_without_discount != null ? +it.price_without_discount : null, promo: !!it.price_is_discounted,
    per: it.price_per || "", cur: it.currency || "EUR", date: it.date || (it.created || "").slice(0, 10),
    store: name, city, lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null,
    code: it.product_code || prod.code || "", pname: prod.product_name || it.product_name || "", brand: (prod.brands || "").split(",")[0], img: prod.image_url || "", src: "op"
  };
}
async function pricesFor(code) {
  const j = await getJSON(API + "?product_code=" + encodeURIComponent(code) + "&order_by=-date&size=50");
  return (j.items || j.results || []).map(normPrice).filter(x => isFinite(x.price) && x.price > 0);
}
async function recentPromos() {
  const since = new Date(Date.now() - 45 * 86400e3).toISOString().slice(0, 10);
  const j = await getJSON(API + "?price_is_discounted=true&date__gte=" + since + "&order_by=-date&size=100");
  return (j.items || j.results || []).map(normPrice).filter(x => isFinite(x.price) && x.price > 0);
}
const money = (v, cur) => isFinite(v) ? v.toLocaleString(settings.lang, { style: "currency", currency: cur || "EUR" }) : "—";

/* ---------- Écran principal ---------- */
let promoCache = null;
VIEWS.prices = root => {
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(t("modPrices"), { back: true, options: "prices" })));
  root.append(wrap);
  // Position + rayon
  const pos = savedPos();
  const posTxt = h("small", { textContent: pos ? t("pr_located", fmtKm((pos.acc || 0) / 1000)) : t("pr_notLocated") });
  const locBtn = h("button", { type: "button", className: "btn", textContent: "📍 " + (pos ? t("pr_relocate") : t("pr_locate")) });
  locBtn.onclick = async () => { locBtn.disabled = true; locBtn.textContent = "…"; try { await locate(); promoCache = null; go("prices"); } catch (e) { locBtn.disabled = false; locBtn.textContent = "📍 " + t("pr_locate"); toast(t("pr_noGeo")); } };
  const radius = h("div", { className: "sizes" });
  [5, 10, 20, 50].forEach(r => { const b = h("button", { type: "button", textContent: r + " km" }); b.setAttribute("aria-pressed", String(P.radius === r)); b.onclick = () => { P.radius = r; saveSettings(); go("prices"); }; radius.append(b); });
  wrap.append(h("div", { className: "optcard" }, h("div", { className: "nmeta" }, h("b", { textContent: t("pr_around") }), posTxt), h("div", { className: "row", style: "margin-top:10px;align-items:center" }, radius, locBtn)));
  // Scanner / chercher un produit
  const big = h("button", { type: "button", className: "bigscan pricebig" });
  big.innerHTML = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>';
  big.append(h("b", { textContent: t("pr_scanBtn") }), h("span", { textContent: t("pr_scanSub") }));
  const msg = h("div", { className: "msg" });
  big.onclick = () => {
    if (NATIVE) { window.onNativeScan = (text, fmt) => { if (text) openPrices(text.replace(/\D/g, "") || text); else { msg.className = "msg err"; msg.textContent = fmt || t("scanFail"); } }; NATIVE.scan(); return; }
    ctx.pickPhoto(async f => { try { const r = await ctx.decodeImage(f); openPrices(r.text); } catch (e) { msg.className = "msg err"; msg.textContent = t("scanFail"); } });
  };
  wrap.append(h("div", { style: "margin-top:14px" }, big), msg);
  const q = h("input", { id: "pr-q", type: "search", placeholder: t("pr_searchPh"), autocomplete: "off" });
  const box = h("label", { className: "search", htmlFor: "pr-q", style: "margin-top:12px" }); box.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'; box.append(q);
  const found = h("div", { className: "plist", style: "margin-top:8px" });
  let timer; q.oninput = () => { clearTimeout(timer); timer = setTimeout(async () => { found.textContent = ""; if (!q.value.trim() || !D) return; const rows = await D.searchLocal(q.value, 15); rows.filter(r => r.type !== "beauty").forEach(r => { const b = h("button", { type: "button", className: "prow" }, h("div", { className: "pimg", textContent: "🏷️" }), h("div", { className: "pmeta" }, h("b", { textContent: r.n }), h("small", { textContent: r.b || r.c }))); b.onclick = () => openPrices(r.c, r.n); found.append(b); }); }, 250); };
  wrap.append(box, found);
  // Promos récentes autour de moi
  wrap.append(h("div", { className: "sect2" }, h("h3", { textContent: "🔥 " + t("pr_promosNear") }), h("span", { textContent: P.radius + " km" })));
  const promoBox = h("div", { className: "plist" }); wrap.append(promoBox);
  if (!pos) promoBox.append(h("p", { className: "sub", textContent: t("pr_needPos") }));
  else {
    promoBox.append(h("p", { className: "sub", textContent: t("f_loading") }));
    (promoCache ? Promise.resolve(promoCache) : recentPromos()).then(list => {
      promoCache = list; promoBox.textContent = "";
      const near = list.filter(x => x.lat != null && distKm(pos, x) <= P.radius).sort((a, b) => b.date.localeCompare(a.date));
      if (!near.length) { promoBox.append(h("p", { className: "sub", textContent: t("pr_noPromoNear") })); return; }
      near.slice(0, 30).forEach(x => promoBox.append(priceRow(x, pos, true)));
    }).catch(() => { promoBox.textContent = ""; promoBox.append(h("p", { className: "sub", textContent: t("f_offline") })); });
  }
  // Mes relevés
  wrap.append(h("div", { className: "sect2" }, h("h3", { textContent: "📝 " + t("pr_mine") }), h("span", { textContent: mine.length ? String(mine.length) : "" })));
  if (!mine.length) wrap.append(h("p", { className: "sub", textContent: t("pr_mineHelp") }));
  else { const l = h("div", { className: "plist" }); mine.slice(0, 20).forEach(x => l.append(priceRow(x, null, true))); wrap.append(l); }
  // Prospectus
  wrap.append(h("h3", { className: "sect", textContent: "📰 " + t("pr_flyers") }), h("p", { className: "sub", textContent: t("pr_flyersHelp") }));
  const links = h("div", { className: "chiprow" });
  [["Bonial (tous les catalogues)", "https://www.bonial.fr/"], ["Intermarché", "https://www.intermarche.com/"], ["Auchan", "https://www.auchan.fr/"], ["Carrefour", "https://www.carrefour.fr/"],
   ["E.Leclerc", "https://www.e.leclerc/"], ["Lidl", "https://www.lidl.fr/"], ["Super U", "https://www.magasins-u.com/"], ["Picard", "https://www.picard.fr/"], ["Monoprix", "https://www.monoprix.fr/"]]
    .forEach(([l, u]) => { const b = h("button", { type: "button", className: "fchip", textContent: l + " ↗" }); b.onclick = () => openUrl(u); links.append(b); });
  wrap.append(links);
  wrap.append(h("p", { className: "notice", textContent: t("pr_honest") }));
  const contrib = h("button", { type: "button", className: "btn full", textContent: "🤝 " + t("pr_contribute") }); contrib.onclick = () => openUrl("https://prices.openfoodfacts.org/");
  wrap.append(h("div", { className: "row" }, contrib));
};
function priceRow(x, pos, showProduct) {
  const d = pos && x.lat != null ? distKm(pos, x) : null;
  const sub = [showProduct ? (x.pname || x.code) : null, x.city, d != null ? fmtKm(d) : null, x.date ? new Date(x.date + "T12:00").toLocaleDateString(settings.lang, { day: "numeric", month: "short" }) : null, x.src === "me" ? t("pr_byMe") : null].filter(Boolean).join(" · ");
  const price = h("div", { className: "price" }, h("b", { textContent: money(x.price, x.cur) }), x.was && x.was > x.price ? h("s", { textContent: money(x.was, x.cur) }) : null);
  const row = h("button", { type: "button", className: "prow" }, h("div", { className: "pimg", textContent: x.promo ? "🔥" : "🏪" }), h("div", { className: "pmeta" }, h("b", { textContent: x.store }), h("small", { textContent: sub })), price);
  row.onclick = () => { if (x.code) openPrices(x.code, x.pname); };
  return row;
}
function fmtKm(d) { return d < 1 ? Math.round(d * 1000) + " m" : (Math.round(d * 10) / 10).toString().replace(".", ",") + " km"; }

/* ---------- Comparaison pour un produit ---------- */
let cmp = null;
async function openPrices(code, name) {
  code = String(code).trim();
  cmp = { code, name: name || "", loading: true, list: [] };
  go("pricecmp");
  if (D && !name) D.findProduct(code).then(p => { if (p && cmp && cmp.code === code) { cmp.name = p.name; cmp.brand = p.brand; cmp.img = p.img; if (ctx.view() === "pricecmp") ctx.render(); } }).catch(() => {});
  try { cmp.list = await pricesFor(code); cmp.error = null; } catch (e) { cmp.error = true; }
  cmp.loading = false;
  if (ctx.view() === "pricecmp") ctx.render();
}
ctx.openPrices = openPrices;
ctx.viewModule.pricecmp = "prices";
VIEWS.pricecmp = root => {
  const c = cmp, wrap = h("div", { className: "wrap" }); root.append(wrap);
  if (!c) return;
  wrap.append(h("header", {}, header(c.name || c.code, { back: true })));
  wrap.append(h("p", { className: "sub", textContent: [c.brand, c.code].filter(Boolean).join(" · ") }));
  const pos = savedPos();
  if (!pos) { const b = h("button", { type: "button", className: "btn full", textContent: "📍 " + t("pr_locate") }); b.onclick = async () => { try { await locate(); ctx.render(); } catch (e) { toast(t("pr_noGeo")); } }; wrap.append(h("div", { className: "row" }, b)); }
  const my = mine.filter(x => x.code === c.code);
  const all = [...c.list, ...my];
  if (c.loading) wrap.append(h("p", { className: "sub", textContent: t("f_loading") }));
  else if (c.error && !my.length) wrap.append(h("p", { className: "sub", textContent: t("f_offline") }));
  if (!c.loading) {
    // Dernier prix connu par magasin
    const byStore = {};
    all.forEach(x => { const k = x.store + "|" + x.city; if (!byStore[k] || x.date > byStore[k].date) byStore[k] = x; });
    const stores = Object.values(byStore).map(x => ({ ...x, d: pos && x.lat != null ? distKm(pos, x) : null }));
    const near = stores.filter(x => x.src === "me" || (x.d != null && x.d <= P.radius)).sort((a, b) => a.price - b.price);
    const far = stores.filter(x => !near.includes(x)).sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
    if (near.length) {
      const best = near[0];
      wrap.append(h("div", { className: "bestprice" }, h("small", { textContent: "🏆 " + t("pr_best", P.radius) }), h("b", { textContent: money(best.price, best.cur) }), h("span", { textContent: best.store + (best.city ? " · " + best.city : "") + (best.promo ? " · 🔥 " + t("pr_promo") : "") })));
    }
    wrap.append(h("div", { className: "sect2" }, h("h3", { textContent: t("pr_nearStores", P.radius) }), h("span", { textContent: String(near.length) })));
    if (near.length) { const l = h("div", { className: "plist" }); near.forEach(x => l.append(priceRow(x, pos, false))); wrap.append(l); }
    else wrap.append(h("p", { className: "sub", textContent: pos ? t("pr_noneNear") : t("pr_needPos") }));
    if (far.length) {
      const det = h("details", { className: "ing" }, h("summary", { textContent: t("pr_elsewhere", far.length) }));
      const l = h("div", { className: "plist" }); far.slice(0, 30).forEach(x => l.append(priceRow(x, pos, false))); det.append(l); wrap.append(det);
    }
  }
  const add = h("button", { type: "button", className: "btn primary full", textContent: "✍️ " + t("pr_iSaw") }); add.onclick = () => addMine(c);
  wrap.append(h("div", { className: "row" }, add));
  const seeProduct = h("button", { type: "button", className: "btn full", textContent: "🥫 " + t("qr_seeProduct") }); seeProduct.onclick = () => ctx.openProduct && ctx.openProduct(c.code);
  wrap.append(h("div", { className: "row", style: "margin-top:8px" }, seeProduct));
  wrap.append(h("p", { className: "notice", textContent: t("pr_source") }));
};
function addMine(c) {
  openSheet(sh => {
    sh.append(h("h2", { textContent: t("pr_iSaw") }), h("p", { className: "sub", textContent: c.name || c.code }));
    const stores = ["Intermarché", "Auchan", "Carrefour", "E.Leclerc", "Lidl", "Super U", "Picard", "Monoprix", "Aldi", "Casino"];
    const storeIn = h("input", { id: "pm-store", placeholder: "Intermarché Fréjus", autocomplete: "off" }); storeIn.setAttribute("list", "pm-stores");
    const dl = h("datalist", { id: "pm-stores" }); stores.forEach(s => dl.append(h("option", { value: s })));
    const priceIn = h("input", { id: "pm-price", type: "number", step: "0.01", min: "0", inputMode: "decimal", placeholder: "2,49" });
    const promo = h("input", { type: "checkbox", id: "pm-promo" });
    const wasIn = h("input", { id: "pm-was", type: "number", step: "0.01", min: "0", inputMode: "decimal", placeholder: "2,99" });
    const wasBox = h("label", { className: "f", htmlFor: "pm-was" }, t("pr_was"), wasIn); wasBox.hidden = true;
    promo.onchange = () => { wasBox.hidden = !promo.checked; };
    const err = h("div", { className: "msg err" });
    const save = h("button", { type: "button", className: "btn primary", textContent: t("save") });
    save.onclick = () => {
      const price = parseFloat(String(priceIn.value).replace(",", ".")); const store = storeIn.value.trim();
      if (!store) { err.textContent = t("pr_needStore"); return; } if (!(price > 0)) { err.textContent = t("pr_needPrice"); return; }
      const pos = savedPos();
      mine.unshift({ code: c.code, pname: c.name, store, city: "", price, was: promo.checked ? parseFloat(String(wasIn.value).replace(",", ".")) || null : null, promo: promo.checked, cur: "EUR",
        date: new Date().toISOString().slice(0, 10), lat: pos ? pos.lat : null, lon: pos ? pos.lon : null, src: "me" });
      saveMine(); closeSheet(); ctx.render(); toast(t("k_saved"));
    };
    const cancel = h("button", { type: "button", className: "btn", textContent: t("cancel") }); cancel.onclick = closeSheet;
    sh.append(h("label", { className: "f", htmlFor: "pm-store" }, t("pr_store"), storeIn), dl, h("label", { className: "f", htmlFor: "pm-price" }, t("pr_price"), priceIn),
      h("label", { className: "toggle", htmlFor: "pm-promo" }, h("span", { textContent: "🔥 " + t("pr_isPromo") }), promo), wasBox, err, h("div", { className: "row" }, cancel, save));
  });
}

ctx.modules.push({ key: "prices", color: "linear-gradient(135deg,#f03e3e,#fd7e14)", title: () => t("modPrices"), sub: () => t("modPricesSub"),
  icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  options: box => {
    const clear = h("button", { type: "button", className: "btn danger full", textContent: t("pr_clearMine") }); clear.onclick = () => { mine = []; saveMine(); toast(t("f_cleared")); };
    box.append(h("div", { className: "optcard" }, h("h3", { textContent: t("pr_mine") }), clear));
  } });
ctx.backHooks.push(() => { if (ctx.view() === "pricecmp") { go("prices"); return true; } return false; });
});
