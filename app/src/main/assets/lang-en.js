// Anglais sur tout le contenu : recettes, ingrédients, fiches additifs et cosmétiques, guides santé, contenus 4.7.
// Le dictionnaire français → anglais (data/tr-en.jgz) est produit à la fabrication de l'APK par tools/translate.py
// (traduction automatique Helsinki-NLP opus-mt-fr-en, gardée en cache). Sans dictionnaire, le texte reste en français.
(function (root) {
"use strict";
const isText = s => typeof s === "string" && s.length > 1 && /[A-Za-zÀ-ÿ]{2}/.test(s) && !/^[a-z0-9_:.+-]+$/.test(s) && s[0] !== "<" && !/^(hue-rotate|saturate|M\d)/.test(s) && !/^https?:/.test(s);
// Liste des textes à traduire : [objet, clé]. Utilisée dans l'appli et par tools/extract-strings.mjs.
function collect(W) {
  const out = [], seen = new Set();
  const put = (o, k) => { if (o && isText(o[k])) out.push([o, k]); };
  const walk = (v, depth) => {
    if (!v || depth > 6 || typeof v !== "object" || v instanceof RegExp || seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) v.forEach((x, i) => typeof x === "string" ? put(v, i) : walk(x, depth + 1));
    else for (const k of Object.keys(v)) { const x = v[k]; if (typeof x === "string") put(v, k); else walk(x, depth + 1); }
  };
  const K = W.KitchenData;
  if (K) {
    (K.RECIPES || []).forEach(r => { put(r, "n"); (r.e || []).forEach((_, i) => put(r.e, i)); });
    Object.values(K.ING || {}).forEach(v => put(v, 0));
    Object.values(K.PLATE || {}).forEach(v => put(v, 0));
    (K.AISLES || []).forEach(v => put(v, 2));
    (K.PLATE_GROUPS || []).forEach(v => put(v, 2));
    walk(K.PNNS, 0); walk(K.PREGNANCY_TIPS, 0);
  }
  const A = W.AdditiveDB;
  if (A) { Object.values(A.DB || {}).forEach(v => { put(v, 0); put(v, 4); }); Object.values(A.FN || {}).forEach(v => { put(v, 0); put(v, 1); }); Object.keys(A.SRC || {}).forEach(k => put(A.SRC, k)); }
  const C = W.CosmeticDB;
  if (C) { Object.values(C.DB || {}).forEach(v => { put(v, "fn"); put(v, "why"); (v.refs || []).forEach((_, i) => put(v.refs, i)); }); Object.keys(C.SOURCES || {}).forEach(k => put(C.SOURCES, k)); }
  if (W.SoveeContent) walk(W.SoveeContent, 0);
  const P = W.SoveePlus;
  if (P) for (const k of Object.keys(P)) if (!["XMAS", "REGION_RECIPES", "REGION_OF", "HATS", "FRANCE_PATH", "XMAS_ING", "MDD"].includes(k)) { if (typeof P[k] === "string") put(P, k); else walk(P[k], 0); }
  return out;
}
let entries = null, dict = null, loading = null, cur = "fr", onReady = null;
function apply(lang) {
  if (!entries) entries = collect(root).map(([o, k]) => [o, k, o[k]]);
  for (const [o, k, fr] of entries) o[k] = lang === "en" && dict ? (dict[fr] || fr) : fr;
  cur = lang === "en" && dict ? "en" : "fr";
}
async function load() {
  try {
    const r = await fetch("data/tr-en.jgz");
    if (!r.ok || typeof DecompressionStream !== "function") throw new Error("pas de dictionnaire");
    dict = await new Response(r.body.pipeThrough(new DecompressionStream("gzip"))).json();
  } catch (e) {
    try { const r = await fetch("data/tr-en.json"); if (r.ok) dict = await r.json(); } catch (e2) {}
  }
  return dict;
}
root.SoveeLang = lang => {
  const want = lang === "en" ? "en" : "fr";
  if (want === "en" && !dict) {
    if (!loading) loading = load().then(d => { if (d && onReady) onReady(); });
    if (cur !== "fr") apply("fr");
    return;
  }
  if (want !== cur) apply(want);
};
root.SoveeTr = { collect, isText, ready: () => !!dict, size: () => dict ? Object.keys(dict).length : 0 };
(root.SC_EXT = root.SC_EXT || []).push(ctx => { onReady = () => { if (ctx.settings.lang === "en") ctx.render(); }; });
})(typeof window !== "undefined" ? window : globalThis);
