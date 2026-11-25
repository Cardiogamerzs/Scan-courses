// Module Lecteur QR : lit n'importe quel QR code (ou code-barres), reconnaît liens, Wi-Fi, contacts, etc.
// et permet aussi d'en créer un.
(window.SC_EXT = window.SC_EXT || []).push(function (ctx) {
"use strict";
const { h, t, settings, go, header, openSheet, closeSheet, VIEWS, lsGet, lsSet, toast, NATIVE, openUrl, copyText } = ctx;
const KEY = "sc-qr-history";
let hist = lsGet(KEY, []);
function save() { lsSet(KEY, hist.slice(0, 150)); }

/* ---------- Reconnaissance du contenu ---------- */
function field(src, key) {
  // Champs de type « WIFI:S:nom;P:motdepasse;; » (avec \; échappés)
  const re = new RegExp("(?:^|;|:)" + key + ":((?:\\\\.|[^;])*)", "i");
  const m = src.match(re); return m ? m[1].replace(/\\(.)/g, "$1") : "";
}
function vcard(src, key) {
  const m = src.match(new RegExp("^" + key + "(?:;[^:\\n]*)?:(.*)$", "im")); return m ? m[1].trim() : "";
}
function parse(text, fmt) {
  const s = String(text || "").trim();
  if (/^https?:\/\//i.test(s) || /^www\.[^\s]+\.[a-z]{2,}/i.test(s)) {
    const url = /^www\./i.test(s) ? "https://" + s : s;
    let host = ""; try { host = new URL(url).hostname; } catch (e) {}
    return { kind: "url", url, host, insecure: /^http:/i.test(url) };
  }
  if (/^WIFI:/i.test(s)) return { kind: "wifi", ssid: field(s, "S"), pass: field(s, "P"), sec: field(s, "T") || "—", hidden: /^true$/i.test(field(s, "H")) };
  if (/^BEGIN:VCARD/i.test(s)) {
    const n = vcard(s, "FN") || vcard(s, "N").split(";").filter(Boolean).reverse().join(" ");
    return { kind: "contact", name: n, tel: vcard(s, "TEL"), email: vcard(s, "EMAIL"), org: vcard(s, "ORG"), adr: vcard(s, "ADR").replace(/;+/g, " ").trim(), url: vcard(s, "URL") };
  }
  if (/^MECARD:/i.test(s)) return { kind: "contact", name: field(s, "N").split(",").reverse().join(" ").trim(), tel: field(s, "TEL"), email: field(s, "EMAIL"), org: field(s, "ORG"), adr: field(s, "ADR"), url: field(s, "URL") };
  if (/^BEGIN:VEVENT|BEGIN:VCALENDAR/i.test(s)) {
    const d = x => { const m = (x || "").match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/); return m ? new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)).toLocaleString(settings.lang, { dateStyle: "medium", timeStyle: m[4] ? "short" : undefined }) : ""; };
    return { kind: "event", title: vcard(s, "SUMMARY"), start: d(vcard(s, "DTSTART")), end: d(vcard(s, "DTEND")), place: vcard(s, "LOCATION") };
  }
  if (/^tel:/i.test(s)) return { kind: "tel", tel: s.slice(4) };
  if (/^(mailto:|matmsg:)/i.test(s)) {
    if (/^matmsg:/i.test(s)) return { kind: "email", to: field(s, "TO"), subject: field(s, "SUB"), body: field(s, "BODY") };
    const [to, q] = s.slice(7).split("?"); const p = new URLSearchParams(q || "");
    return { kind: "email", to, subject: p.get("subject") || "", body: p.get("body") || "" };
  }
  if (/^(smsto|sms):/i.test(s)) { const [, num, ...msg] = s.split(":"); return { kind: "sms", tel: num, body: msg.join(":") }; }
  if (/^geo:/i.test(s)) { const m = s.match(/^geo:([-\d.]+),([-\d.]+)/i); if (m) return { kind: "geo", lat: +m[1], lon: +m[2] }; }
  if (/^\d{8,14}$/.test(s) && !/^(QR|AZTEC|DATAMATRIX|PDF417)$/.test(fmt || "")) return { kind: "product", code: s };
  return { kind: "text", text: s };
}
const ICON = { url: "🔗", wifi: "📶", contact: "👤", event: "📅", tel: "📞", email: "✉️", sms: "💬", geo: "📍", product: "🛒", text: "📝" };

function addHist(text, fmt) {
  hist = hist.filter(x => x.text !== text);
  hist.unshift({ text, fmt: fmt || "QR", t: Date.now() }); save();
}
function summary(r) {
  return ({ url: () => r.host || r.url, wifi: () => r.ssid, contact: () => r.name || r.tel || r.email, event: () => r.title, tel: () => r.tel, email: () => r.to, sms: () => r.tel,
    geo: () => r.lat.toFixed(4) + ", " + r.lon.toFixed(4), product: () => r.code, text: () => r.text.slice(0, 80) })[r.kind]() || "—";
}

/* ---------- Résultat ---------- */
function showResult(text, fmt) {
  const r = parse(text, fmt);
  openSheet(sh => {
    sh.append(h("div", { className: "qrkind" }, h("span", { textContent: ICON[r.kind] }), h("b", { textContent: t("qr_k_" + r.kind) })));
    const lines = h("div", { className: "qrlines" });
    const line = (label, value, mono) => { if (!value) return; lines.append(h("div", { className: "qrline" }, h("small", { textContent: label }), h("div", { className: mono ? "mono" : "", textContent: value }))); };
    const btns = h("div", { className: "row" });
    const btn = (label, fn, primary) => { const b = h("button", { type: "button", className: "btn" + (primary ? " primary" : ""), textContent: label }); b.onclick = fn; btns.append(b); };
    switch (r.kind) {
      case "url":
        line(t("qr_site"), r.host); line(t("qr_link"), r.url, true);
        sh.append(lines);
        sh.append(h("p", { className: "tip" + (r.insecure ? " warn" : ""), textContent: r.insecure ? t("qr_insecure") : t("qr_checkHost") }));
        btn(t("qr_open"), () => openUrl(r.url), true); btn(t("qr_copy"), () => copyText(r.url));
        break;
      case "wifi":
        line(t("qr_network"), r.ssid); line(t("qr_password"), r.pass || t("qr_noPass"), true); line(t("qr_security"), r.sec);
        sh.append(lines, h("p", { className: "tip", textContent: t("qr_wifiHelp") }));
        if (r.pass) btn(t("qr_copyPass"), () => copyText(r.pass), true);
        btn(t("qr_copyName"), () => copyText(r.ssid));
        break;
      case "contact":
        line(t("name"), r.name); line(t("qr_org"), r.org); line(t("qr_phone"), r.tel); line(t("qr_mail"), r.email); line(t("qr_address"), r.adr); line(t("qr_site"), r.url);
        sh.append(lines);
        if (r.tel) btn(t("qr_call"), () => openUrl("tel:" + r.tel.replace(/[^\d+]/g, "")), true);
        if (r.email) btn(t("qr_write"), () => openUrl("mailto:" + r.email));
        btn(t("qr_copy"), () => copyText([r.name, r.org, r.tel, r.email, r.adr].filter(Boolean).join("\n")));
        break;
      case "event":
        line(t("qr_title"), r.title); line(t("qr_start"), r.start); line(t("qr_end"), r.end); line(t("qr_place"), r.place);
        sh.append(lines); btn(t("qr_copy"), () => copyText([r.title, r.start, r.place].filter(Boolean).join("\n")), true);
        break;
      case "tel":
        line(t("qr_phone"), r.tel, true); sh.append(lines);
        btn(t("qr_call"), () => openUrl("tel:" + r.tel), true); btn(t("qr_copy"), () => copyText(r.tel));
        break;
      case "email":
        line(t("qr_to"), r.to); line(t("qr_subject"), r.subject); line(t("qr_message"), r.body); sh.append(lines);
        btn(t("qr_write"), () => openUrl("mailto:" + r.to + "?subject=" + encodeURIComponent(r.subject) + "&body=" + encodeURIComponent(r.body)), true);
        btn(t("qr_copy"), () => copyText(r.to));
        break;
      case "sms":
        line(t("qr_phone"), r.tel, true); line(t("qr_message"), r.body); sh.append(lines);
        btn(t("qr_sms"), () => openUrl("sms:" + r.tel + (r.body ? "?body=" + encodeURIComponent(r.body) : "")), true);
        break;
      case "geo":
        line(t("qr_coords"), summary(r), true); sh.append(lines);
        btn(t("qr_map"), () => openUrl("geo:" + r.lat + "," + r.lon + "?q=" + r.lat + "," + r.lon), true);
        btn(t("qr_copy"), () => copyText(r.lat + ", " + r.lon));
        break;
      case "product":
        line(t("qr_barcode"), r.code, true); sh.append(lines);
        btn(t("qr_seeProduct"), () => { closeSheet(); if (ctx.openProduct) ctx.openProduct(r.code); }, true);
        if (ctx.openPrices) btn(t("qr_seePrices"), () => { closeSheet(); ctx.openPrices(r.code); });
        btn(t("qr_copy"), () => copyText(r.code));
        break;
      default:
        sh.append(h("div", { className: "qrtext", textContent: r.text }));
        btn(t("qr_copy"), () => copyText(r.text), true);
        btn(t("qr_searchWeb"), () => openUrl("https://duckduckgo.com/?q=" + encodeURIComponent(r.text.slice(0, 200))));
    }
    const close = h("button", { type: "button", className: "btn", textContent: t("close") }); close.onclick = closeSheet; btns.append(close);
    sh.append(btns);
    if (r.kind !== "text") sh.append(h("details", { className: "ing" }, h("summary", { textContent: t("qr_raw") }), h("p", { className: "mono", textContent: text })));
  });
}

/* ---------- Écran du module ---------- */
let qrTab = "scan";
VIEWS.qr = root => {
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(t("modQr"), { back: true, options: "qr" })));
  const seg = h("div", { className: "seg" });
  [["scan", t("qr_read")], ["make", t("qr_make")]].forEach(([k, l]) => { const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(qrTab === k)); b.onclick = () => { qrTab = k; go("qr"); }; seg.append(b); });
  wrap.append(seg);
  const body = h("div", { style: "margin-top:14px" }); wrap.append(body);
  (qrTab === "scan" ? scanTab : makeTab)(body);
  root.append(wrap);
};
function scanTab(body) {
  const big = h("button", { type: "button", className: "bigscan qrbig" });
  big.innerHTML = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>';
  big.append(h("b", { textContent: t("qr_scanBtn") }), h("span", { textContent: t("qr_scanSub") }));
  const msg = h("div", { className: "msg" });
  const done = (text, fmt) => { addHist(text, fmt); go("qr"); showResult(text, fmt); };
  big.onclick = () => {
    if (NATIVE) { window.onNativeScan = (text, fmt) => { if (text) done(text, fmt); else { msg.className = "msg err"; msg.textContent = fmt || t("scanFail"); } }; NATIVE.scan(); return; }
    fromPhoto();
  };
  const fromPhoto = () => ctx.pickPhoto(async f => { try { const r = await ctx.decodeImage(f); done(r.text, r.format); } catch (e) { msg.className = "msg err"; msg.textContent = t("qr_noCode"); } });
  const gal = h("button", { type: "button", className: "btn full", textContent: "🖼️ " + t("qr_fromImage") }); gal.onclick = fromPhoto;
  body.append(big, msg, h("div", { className: "row" }, gal));
  body.append(h("div", { className: "sect2" }, h("h3", { textContent: t("f_history") }), h("span", { textContent: hist.length ? String(hist.length) : "" })));
  if (!hist.length) { body.append(h("p", { className: "sub", textContent: t("qr_noHistory") })); return; }
  const list = h("div", { className: "plist" });
  hist.forEach(x => {
    const r = parse(x.text, x.fmt);
    const b = h("button", { type: "button", className: "prow" }, h("div", { className: "pimg", textContent: ICON[r.kind] }),
      h("div", { className: "pmeta" }, h("b", { textContent: summary(r) }), h("small", { textContent: t("qr_k_" + r.kind) + " · " + new Date(x.t).toLocaleString(settings.lang, { dateStyle: "short", timeStyle: "short" }) })));
    b.onclick = () => showResult(x.text, x.fmt);
    list.append(b);
  });
  const clear = h("button", { type: "button", className: "btn danger full", textContent: t("qr_clear") });
  clear.onclick = () => { hist = []; save(); go("qr"); toast(t("f_cleared")); };
  body.append(list, h("div", { className: "row" }, clear));
}
let makeKind = "text", makeVals = {};
function makeTab(body) {
  const kinds = [["text", t("qr_k_text")], ["url", t("qr_k_url")], ["wifi", t("qr_k_wifi")], ["tel", t("qr_k_tel")]];
  const seg = h("div", { className: "chiprow" });
  kinds.forEach(([k, l]) => { const b = h("button", { type: "button", className: "fchip", textContent: ICON[k] + " " + l }); b.setAttribute("aria-pressed", String(makeKind === k)); b.onclick = () => { makeKind = k; go("qr"); }; seg.append(b); });
  body.append(seg);
  const out = h("div", { className: "codebox", style: "margin-top:14px" });
  const fields = { text: [["v", t("qr_k_text")]], url: [["v", "https://…"]], wifi: [["ssid", t("qr_network")], ["pass", t("qr_password")]], tel: [["v", "+33 6 …"]] }[makeKind];
  const build = () => {
    const v = makeVals;
    const txt = makeKind === "wifi" ? (v.ssid ? "WIFI:T:WPA;S:" + esc(v.ssid) + ";P:" + esc(v.pass || "") + ";;" : "")
      : makeKind === "tel" ? (v.v ? "tel:" + v.v.replace(/\s/g, "") : "") : makeKind === "url" ? (v.v ? (/^https?:/i.test(v.v) ? v.v : "https://" + v.v) : "") : (v.v || "");
    out.textContent = "";
    if (!txt) { out.append(h("p", { className: "sub", textContent: t("qr_makeHelp") })); return; }
    const r = ctx.codeSVG(txt, "QR");
    if (r) { const holder = h("div"); holder.innerHTML = r.svg; const svg = holder.firstElementChild; svg.removeAttribute("width"); svg.removeAttribute("height"); svg.style.width = "min(70vw,260px)"; out.append(holder); }
  };
  const esc = x => x.replace(/([\\;,:"])/g, "\\$1");
  fields.forEach(([k, ph]) => {
    const inp = makeKind === "text" ? h("textarea", { rows: 3, placeholder: ph, value: makeVals[k] || "" }) : h("input", { placeholder: ph, value: makeVals[k] || "", autocomplete: "off" });
    inp.oninput = () => { makeVals[k] = inp.value; build(); };
    body.append(h("label", { className: "f" }, ph, inp));
  });
  body.append(out, h("p", { className: "tip", textContent: t("qr_showTip") }));
  build();
}

ctx.modules.push({ key: "qr", color: "linear-gradient(135deg,#0b7285,#1c7ed6)", title: () => t("modQr"), sub: () => t("modQrSub"),
  icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>' });
ctx.backHooks.push(() => { if (ctx.view() === "qr" && qrTab !== "scan") { qrTab = "scan"; go("qr"); return true; } return false; });
ctx.showQrResult = showResult;
});
