(() => {
"use strict";
const APP_VERSION = "4.6";
const NATIVE = window.Android || null;
const $ = s => document.querySelector(s);
function h(tag, props = {}, ...kids) { const el = document.createElement(tag); Object.assign(el, props); el.append(...kids.filter(k => k != null)); return el; }
function lsGet(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

/* ================= Réglages, langue, thèmes ================= */
const SETTINGS_KEY = "sc-settings";
const settings = Object.assign({ lang: guessLang(), theme: "sand", modTheme: {}, cardsSort: "uses", bright: true }, lsGet(SETTINGS_KEY, {}));
function saveSettings() { lsSet(SETTINGS_KEY, settings); }
function guessLang() { const l = (navigator.language || "fr").slice(0, 2); return ["fr", "en", "es"].includes(l) ? l : "fr"; }
function T() { return I18N[settings.lang] || I18N.fr; }
function t(key, ...args) { const v = T()[key] ?? I18N.fr[key]; return typeof v === "function" ? v(...args) : v; }

const THEMES = {
  sand:     { bg: "#f3f1ee", surface: "#ffffff", fg: "#1b1d26", muted: "#6b6f7d", line: "#e2dfda", dark: false },
  white:    { bg: "#ffffff", surface: "#f6f6f8", fg: "#17181d", muted: "#686b78", line: "#e6e6ea", dark: false },
  mint:     { bg: "#e9f5ef", surface: "#ffffff", fg: "#15261e", muted: "#5c7268", line: "#d3e7dc", dark: false },
  sky:      { bg: "#e8f1fb", surface: "#ffffff", fg: "#14202e", muted: "#5b6b7e", line: "#d4e2f2", dark: false },
  lavender: { bg: "#f0ecfa", surface: "#ffffff", fg: "#1e1830", muted: "#6d6584", line: "#e0d9f2", dark: false },
  peach:    { bg: "#fdeee6", surface: "#ffffff", fg: "#2a1a14", muted: "#7d655b", line: "#f3dbcf", dark: false },
  night:    { bg: "#14161f", surface: "#1e212d", fg: "#f2f1ee", muted: "#9a9eae", line: "#2c3040", dark: true },
  rose:     { bg: "#fdebf1", surface: "#ffffff", fg: "#2a141c", muted: "#7d5f6a", line: "#f3d6e0", dark: false },
  lemon:    { bg: "#fbf5d8", surface: "#ffffff", fg: "#26220f", muted: "#77704f", line: "#efe6bd", dark: false },
  coral:    { bg: "#ffe3d9", surface: "#ffffff", fg: "#2b160f", muted: "#80614f", line: "#f6cfc0", dark: false },
  sage:     { bg: "#e7eee2", surface: "#ffffff", fg: "#1b2418", muted: "#64705e", line: "#d3dfcc", dark: false },
  ocean:    { bg: "#0f2233", surface: "#17314a", fg: "#eef5fb", muted: "#93a9bd", line: "#24425e", dark: true },
  forest:   { bg: "#12241a", surface: "#1b3326", fg: "#eef6f0", muted: "#94ac9c", line: "#284634", dark: true },
  plum:     { bg: "#221428", surface: "#311d39", fg: "#f6eef8", muted: "#b09cb8", line: "#432a4d", dark: true }
};
/* Fonds d'écran : dégradés et motifs (palette de base + image de fond) */
const svgUrl = s => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
const HEART_P = "M60 104C30 86 6 66 6 38C6 20 20 6 37 6C47 6 55 11 60 19C65 11 73 6 83 6C100 6 114 20 114 38C114 66 90 86 60 104Z";
const WALLS = {
  g_sunrise:  { base: "peach", wall: "linear-gradient(165deg,#ffe0d6 0%,#ffd6e5 50%,#e8dcff 100%)", bar: "#ffe0d6" },
  g_lagoon:   { base: "sky", wall: "linear-gradient(165deg,#d6f5ef 0%,#d8e8ff 100%)", bar: "#d6f5ef" },
  g_meadow:   { base: "mint", wall: "linear-gradient(165deg,#eef8d8 0%,#d4f1e3 100%)", bar: "#eef8d8" },
  g_candy:    { base: "rose", wall: "linear-gradient(165deg,#ffe1f0 0%,#fff1d4 100%)", bar: "#ffe1f0" },
  g_lilac:    { base: "lavender", wall: "linear-gradient(165deg,#ece3ff 0%,#ffe3f1 100%)", bar: "#ece3ff" },
  g_citrus:   { base: "lemon", wall: "linear-gradient(165deg,#fff6c9 0%,#ffe0c2 100%)", bar: "#fff6c9" },
  g_aurora:   { base: "night", wall: "linear-gradient(165deg,#0f1d33 0%,#22144a 55%,#0d2f2b 100%)", bar: "#0f1d33" },
  g_dusk:     { base: "plum", wall: "linear-gradient(165deg,#2b1330 0%,#40192a 50%,#1a1630 100%)", bar: "#2b1330" },
  g_deepsea:  { base: "ocean", wall: "linear-gradient(165deg,#0b2a3f 0%,#0f1f3a 100%)", bar: "#0b2a3f" },
  p_hearts:   { base: "rose", wall: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><path transform="translate(8 8) scale(.13)" d="' + HEART_P + '" fill="#ffc6d3"/><path transform="translate(36 34) scale(.09)" d="' + HEART_P + '" fill="#ffd9e2"/></svg>') + " 0 0/56px 56px, #fff0f4", bar: "#fff0f4" },
  p_dots:     { base: "sky", wall: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="7" cy="7" r="3" fill="#cfdcf6"/><circle cx="21" cy="21" r="3" fill="#cfdcf6"/></svg>') + " 0 0/28px 28px, #eef3fd", bar: "#eef3fd" },
  p_waves:    { base: "mint", wall: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="24"><path d="M0 12q10-10 20 0t20 0 20 0 20 0" fill="none" stroke="#c9e8d8" stroke-width="3"/></svg>') + " 0 0/80px 24px, #eaf6f0", bar: "#eaf6f0" },
  p_fruits:   { base: "lemon", wall: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><circle cx="20" cy="22" r="9" fill="#ffd6a8"/><path d="M20 13q3-6 8-5" stroke="#9bd18c" stroke-width="3" fill="none"/><circle cx="66" cy="62" r="7" fill="#ffc2c2"/><circle cx="74" cy="66" r="7" fill="#ffc2c2"/><path d="M70 56l3-8" stroke="#9bd18c" stroke-width="2.5"/></svg>') + " 0 0/90px 90px, #fffaf0", bar: "#fffaf0" },
  p_stars:    { base: "night", wall: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70"><circle cx="12" cy="15" r="1.4" fill="#ffffff" opacity=".55"/><circle cx="48" cy="40" r="1" fill="#ffffff" opacity=".4"/><path d="M58 10l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#ffe08a" opacity=".6"/><circle cx="25" cy="58" r="1.2" fill="#ffffff" opacity=".5"/></svg>') + " 0 0/70px 70px, #121630", bar: "#121630" }
};

/* Couleurs vives et motifs colorés (texte clair, cartes teintées) */
function vivid(bg, surface, light) {
  return light ? { bg, surface, fg: "#1b1d26", muted: "#5b5a4c", line: "rgba(0,0,0,.12)", dark: false, vivid: true }
    : { bg, surface, fg: "#ffffff", muted: "rgba(255,255,255,.78)", line: "rgba(255,255,255,.2)", dark: true, vivid: true };
}
function vwall(bg, surface, svg, size, light) { const th = vivid(bg, surface, light); return { th, wall: svg ? svgUrl(svg) + " 0 0/" + size + ", " + bg : bg, bar: bg }; }
const W = "#ffffff";
Object.assign(WALLS, {
  v_blue: vwall("#1d4ed8", "#1e3a8a"), v_red: vwall("#dc2626", "#7f1d1d"), v_green: vwall("#16a34a", "#14532d"), v_orange: vwall("#ea580c", "#7c2d12"),
  v_violet: vwall("#7c3aed", "#4c1d95"), v_pink: vwall("#db2777", "#831843"), v_teal: vwall("#0d9488", "#134e4a"), v_yellow: vwall("#facc15", "#fffbea", null, null, true), v_black: vwall("#0a0a0a", "#1f1f1f"),
  vp_waves: vwall("#1d4ed8", "#1e3a8a", '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="28"><path d="M0 14q10-12 20 0t20 0 20 0 20 0" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3.5"/></svg>', "80px 28px"),
  vp_hearts: vwall("#dc2626", "#7f1d1d", '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path transform="translate(8 8) scale(.14)" d="' + HEART_P + '" fill="#fff" fill-opacity=".2"/><path transform="translate(38 36) scale(.1)" d="' + HEART_P + '" fill="#fff" fill-opacity=".14"/></svg>', "60px 60px"),
  vp_dots: vwall("#16a34a", "#14532d", '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="8" cy="8" r="4" fill="#fff" fill-opacity=".22"/><circle cx="23" cy="23" r="4" fill="#fff" fill-opacity=".22"/></svg>', "30px 30px"),
  vp_stripes: vwall("#ea580c", "#7c2d12", '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M-6 6l12-12M0 24L24 0M18 30l12-12" stroke="#fff" stroke-opacity=".2" stroke-width="5"/></svg>', "24px 24px"),
  vp_stars: vwall("#7c3aed", "#4c1d95", '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M16 6l2.6 6 6.4.6-4.8 4.2 1.4 6.2L16 19.8 10.4 23l1.4-6.2L7 12.6l6.4-.6z" fill="#fff" fill-opacity=".25"/><circle cx="48" cy="44" r="2.5" fill="#fff" fill-opacity=".3"/><circle cx="40" cy="14" r="1.6" fill="#fff" fill-opacity=".3"/></svg>', "64px 64px"),
  vp_check: vwall("#db2777", "#831843", '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="20" height="20" fill="#fff" fill-opacity=".14"/><rect x="20" y="20" width="20" height="20" fill="#fff" fill-opacity=".14"/></svg>', "40px 40px"),
  vp_zigzag: vwall("#0d9488", "#134e4a", '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><path d="M0 15l10-10 10 10 10-10 10 10" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/></svg>', "40px 20px"),
  vp_polka: vwall("#facc15", "#fffbea", '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><circle cx="9" cy="9" r="5" fill="#fff" fill-opacity=".45"/><circle cx="26" cy="26" r="5" fill="#fff" fill-opacity=".45"/></svg>', "34px 34px", true),
  vp_confetti: vwall("#0a0a0a", "#1f1f1f", '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect x="10" y="12" width="8" height="3" rx="1.5" fill="#f43f5e" transform="rotate(30 14 13)"/><rect x="50" y="20" width="8" height="3" rx="1.5" fill="#facc15" transform="rotate(-20 54 21)"/><circle cx="30" cy="50" r="2.5" fill="#22c55e"/><rect x="60" y="60" width="8" height="3" rx="1.5" fill="#3b82f6" transform="rotate(60 64 61)"/><circle cx="70" cy="8" r="2" fill="#a855f7"/><circle cx="12" cy="70" r="2" fill="#fb923c"/></svg>', "80px 80px"),
  vp_grid: vwall("#1e40af", "#172554", '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M32 0H0v32" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2"/></svg>', "32px 32px")
});
const THEME_ORDER = ["sand", "white", "rose", "peach", "coral", "lemon", "mint", "sage", "sky", "lavender", "night", "ocean", "forest", "plum", "auto"];
const WALL_ORDER = Object.keys(WALLS);
const PHOTO_KEY = "sc-wall-photo";
function resolveTheme(name) {
  if (name === "photo") {
    const img = lsGet(PHOTO_KEY, null);
    if (img) { const dark = !!settings.photoDark, base = dark ? THEMES.night : THEMES.sand, veil = dark ? "rgba(10,12,20,.45)" : "rgba(255,255,255,.35)";
      return Object.assign({}, base, { wall: "linear-gradient(" + veil + "," + veil + "), url(" + img + ") center/cover no-repeat", bar: base.bg }); }
    name = "sand";
  }
  if (WALLS[name]) return Object.assign({}, WALLS[name].th || THEMES[WALLS[name].base], { wall: WALLS[name].wall, bar: WALLS[name].bar });
  if (name === "auto" || !THEMES[name]) {
    const dark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    return THEMES[name] || (dark ? THEMES.night : THEMES.sand);
  }
  return THEMES[name];
}
function darkWanted() { const d = settings.dark || "off"; return d === "on" || (d === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
function applyTheme(name) {
  let th = resolveTheme(name); const r = document.documentElement.style;
  if (!th.dark && darkWanted()) th = Object.assign({}, THEMES.night, { wall: THEMES.night.bg, bar: THEMES.night.bg });
  document.documentElement.classList.toggle("darkui", !!th.dark);
  r.setProperty("--bg", th.bg); r.setProperty("--surface", th.surface); r.setProperty("--fg", th.fg);
  r.setProperty("--muted", th.muted); r.setProperty("--line", th.line); r.setProperty("--wall", th.wall || th.bg);
  r.setProperty("--accent", th.dark ? "#ff6b4a" : "#ff5a36"); r.setProperty("--accent-fg", th.dark ? "#14161f" : "#ffffff");
  r.setProperty("--scrim", th.dark ? "rgba(0,0,0,.65)" : "rgba(20,22,31,.55)");
  document.documentElement.style.colorScheme = th.dark ? "dark" : "light";
  document.documentElement.classList.toggle("vivid", !!th.vivid);
  if (NATIVE && NATIVE.setBars) try { NATIVE.setBars(th.bar || th.bg, !th.dark); } catch (e) {}
}
function themeFor(view) {
  if (view === "product") view = "food";
  if (ctx.viewModule && ctx.viewModule[view]) view = ctx.viewModule[view];
  const mod = settings.modTheme[view];
  return mod && mod !== "home" ? mod : settings.theme;
}

/* ================= Navigation ================= */
let view = "home";
const VIEWS = {};
function go(v) { closeSheet(); view = v; applyTheme(themeFor(v === "options" ? optScope : v)); render(); window.scrollTo(0, 0); }
function render() { document.documentElement.lang = settings.lang; const root = $("#app"); root.textContent = ""; $("#fabwrap").textContent = ""; VIEWS[view](root); if (ctx.scanFab) ctx.scanFab(view); }
window.onBack = () => {
  if ($("#layer").firstChild) { closeSheet(); return true; }
  if (view === "options") { go(optScope === "home" ? "home" : optScope); return true; }
  if (ctx.foodBack && ctx.foodBack()) return true;
  for (const hook of ctx.backHooks) if (hook()) return true;
  if (view !== "home") { go("home"); return true; }
  return false;
};

function header(title, opts = {}) {
  const row = h("div", { className: "hrow" });
  if (opts.back) {
    const b = h("button", { type: "button", className: "iconbtn", ariaLabel: t("back") });
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    b.onclick = () => window.onBack(); row.append(b);
  }
  row.append(h("h1", { textContent: title }));
  if (opts.count != null) row.append(h("span", { className: "count", textContent: opts.count }));
  if (opts.options) {
    const o = h("button", { type: "button", className: "iconbtn", ariaLabel: t("options") });
    o.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
    o.onclick = () => openOptions(opts.options); row.append(o);
  }
  return row;
}

/* ================= Accueil ================= */
const ICONS = {
  cards: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></svg>',
  food: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M12 8c-2.5 0-4 1.8-4 4.2C8 15 10 17 12 17s4-2 4-4.8C16 9.8 14.5 8 12 8zM12 8c0-1.2.6-2 1.6-2.4"/></svg>',
  docs: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="3"/><circle cx="8.5" cy="11" r="2.3"/><path d="M5 16.5c.6-1.6 2-2.5 3.5-2.5s2.9.9 3.5 2.5M15 9h4M15 13h4"/></svg>'
};
const LANGS = [["fr", "🇫🇷", "FR"], ["en", "🇬🇧", "EN"], ["es", "🇪🇸", "ES"]];
let tipIdx = Math.floor(Date.now() / 86400000), petMood = "happy";
function greeting() {
  const hr = new Date().getHours(), name = (settings.name || "").trim();
  const g = hr < 5 ? t("hiNight") : hr < 12 ? t("hiMorning") : hr < 18 ? t("hiAfternoon") : t("hiEvening");
  return g.replace("{name}", name ? " " + name : "");
}
function todayInfo() {
  const out = [];
  const menu = lsGet("sc-menu", null), K = window.KitchenData;
  if (menu && menu.days && K) {
    const i = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(menu.created).setHours(0, 0, 0, 0)) / 86400000);
    const d = menu.days[i], slot = new Date().getHours() < 15 ? "lunch" : "dinner";
    const r = d && K.RECIPES.find(x => x.id === d[slot]);
    if (r) out.push(["🍽️", t(slot === "lunch" ? "todayLunch" : "todayDinner"), r.n, "balance"]);
  }
  const shop = lsGet("sc-shop", []).filter(x => !x.done).length;
  if (shop) out.push(["🛒", t("todayShop"), t("nItems", shop), "recipes"]);
  if (K) { const pool = K.RECIPES.filter(r => r.c === "plat" && r.tg.includes("eq")); if (pool.length) out.push(["✨", t("k_ofDay"), pool[(Math.floor(Date.now() / 86400000) * 7) % pool.length].n, "recipes"]); }
  return out;
}
VIEWS.home = root => {
  const wrap = h("div", { className: "wrap home" });
  // Barre du haut : logo, langue, options
  const bar = h("div", { className: "homebar" });
  const logo = h("div", { className: "logo" }); logo.innerHTML = SoveeMascot.svg("happy", 36); logo.append(h("b", { textContent: t("appName") }));
  const cur = LANGS.find(l => l[0] === settings.lang) || LANGS[0];
  const lang = h("button", { type: "button", className: "langbtn", ariaLabel: t("language") }, h("span", { textContent: cur[1] }), h("b", { textContent: cur[2] }));
  lang.onclick = () => { const i = LANGS.indexOf(cur); settings.lang = LANGS[(i + 1) % LANGS.length][0]; saveSettings(); render(); toast(t("langNow")); };
  const opt = header("", { options: "home" }).lastChild;
  bar.append(logo, h("div", { className: "sp" }));
  for (const hk of ctx.homeBar) { const el = hk(); if (el) bar.append(el); }
  bar.append(lang, opt);
  // La mascotte et sa bulle
  const tips = T().tips || I18N.fr.tips;
  const hero = h("section", { className: "hero" });
  const pet = h("button", { type: "button", className: "pet", ariaLabel: t("petLabel") }); pet.innerHTML = SoveeMascot.svg(petMood, 124);
  const tipEl = h("span", { textContent: tips[tipIdx % tips.length] });
  const bubble = h("div", { className: "bubble" }, h("b", { textContent: greeting() }), tipEl);
  pet.onclick = () => {
    tipIdx++; const anim = ["hop", "wiggle", "spin", "squash"][tipIdx % 4];
    pet.classList.remove("hop", "wiggle", "spin", "squash"); void pet.offsetWidth; pet.classList.add(anim);
    tipEl.textContent = tips[tipIdx % tips.length];
  };
  hero.append(pet, bubble);
  // Aujourd'hui
  const today = h("div", { className: "today" });
  todayInfo().forEach(([ico, label, val, go_]) => { const b = h("button", { type: "button", className: "tchip" }, h("span", { className: "tico", textContent: ico }), h("div", {}, h("small", { textContent: label }), h("b", { textContent: val }))); b.onclick = () => go(go_); today.append(b); });
  // Modules
  const filled = Object.values(cards).filter(c => c.number && !c.hidden).length;
  const mods = h("div", { className: "modules" });
  const mk = (key, color, title, sub, badge) => {
    const b = h("button", { type: "button", className: "module" });
    b.style.setProperty("--m1", color);
    const ico = h("div", { className: "ico" }); ico.innerHTML = ICONS[key];
    b.append(ico, h("div", { className: "txt" }, h("b", { textContent: title }), h("span", { textContent: sub })));
    if (badge) b.append(h("div", { className: "badge", textContent: badge }));
    b.onclick = () => go(key); return b;
  };
  mods.append(
    mk("cards", "linear-gradient(135deg,#ff5a36,#e8336b)", t("modCards"), t("modCardsSub"), t("nCards", filled)),
    mk("food", "linear-gradient(135deg,#1f9d55,#0f766e)", t("modFood"), t("modFoodSub"), null)
  );
  for (const m of ctx.modules) { ICONS[m.key] = m.icon; mods.append(mk(m.key, m.color, m.title(), m.sub(), m.badge ? m.badge() : null)); }
  const extra = h("div", { className: "homeextra" }); for (const hk of ctx.homeHooks) { try { hk(extra); } catch (e) { console.error(e); } }
  wrap.append(bar, hero, today, extra, h("h2", { className: "homeh", textContent: t("hello") }), mods, h("p", { className: "version", textContent: t("version", APP_VERSION) }));
  root.append(wrap);
};

/* ================= Cartes de fidélité ================= */
const BRANDS = [
  { id: "intermarche", name: "Intermarché", c1: "#e2001a", c2: "#ff4d5e", ink: "#fff" },
  { id: "auchan", name: "Auchan", c1: "#e3001b", c2: "#2e9a3b", ink: "#fff" },
  { id: "carrefour", name: "Carrefour", c1: "#004e9f", c2: "#e3001b", ink: "#fff" },
  { id: "picard", name: "Picard", c1: "#0a2a5e", c2: "#3d7ad6", ink: "#fff" },
  { id: "orchestra", name: "Orchestra", c1: "#f2a20f", c2: "#e8507a", ink: "#1b1d26" },
  { id: "leclerc", name: "E.Leclerc", c1: "#0066b3", c2: "#f39200", ink: "#fff" },
  { id: "lidl", name: "Lidl", c1: "#0050aa", c2: "#fff000", ink: "#fff" },
  { id: "superu", name: "Super U", c1: "#e30613", c2: "#0b4ea2", ink: "#fff" },
  { id: "monoprix", name: "Monoprix", c1: "#111111", c2: "#e40046", ink: "#fff" },
  { id: "decathlon", name: "Decathlon", c1: "#0082c3", c2: "#7ad0f5", ink: "#fff" },
  { id: "sephora", name: "Sephora", c1: "#000000", c2: "#555555", ink: "#fff" },
  { id: "fnac", name: "Fnac", c1: "#e1a925", c2: "#1b1d26", ink: "#1b1d26" },
  { id: "ikea", name: "IKEA Family", c1: "#0058a3", c2: "#ffdb00", ink: "#fff" },
  { id: "action", name: "Action", c1: "#0d4ea6", c2: "#e1251b", ink: "#fff" },
  { id: "leroy", name: "Leroy Merlin", c1: "#78be20", c2: "#2e7d1e", ink: "#fff" },
  { id: "pharmacie", name: "Pharmacie", c1: "#00a36c", c2: "#7fe0b8", ink: "#fff" }
];
const DEFAULTS = ["intermarche", "auchan", "carrefour", "picard", "orchestra"];
const SWATCHES = ["#ff5a36", "#e2001a", "#d6336c", "#7b3fe4", "#0b63ce", "#0a8f8f", "#2e9a3b", "#f2a20f", "#5b4636", "#1b1d26"];
const byId = Object.fromEntries(BRANDS.map(b => [b.id, b]));
const CARDS_KEY = "cartes-fidelite-v1";
let cards = lsGet(CARDS_KEY, {});
function saveCards() { lsSet(CARDS_KEY, cards); }
function saveCard(c) { c.updated = Date.now(); cards[c.id] = c; saveCards(); if (view === "cards") render(); }
function removeCard(c) {
  if (DEFAULTS.includes(c.id)) saveCard({ id: c.id, brand: c.brand || c.id, name: c.name, number: "", hidden: true });
  else { delete cards[c.id]; saveCards(); if (view === "cards") render(); }
}
function look(c) {
  const b = c.brand && byId[c.brand];
  if (b) return { c1: b.c1, c2: b.c2, ink: b.ink };
  const col = c.color || "#ff5a36";
  return { c1: col, c2: "rgba(255,255,255,.18)", ink: lightColor(col) ? "#1b1d26" : "#fff" };
}
function lightColor(hex) { const n = parseInt(hex.slice(1), 16); return (((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000) > 165; }
function styleVars(el, l) { el.style.setProperty("--c1", l.c1); el.style.setProperty("--c2", l.c2); el.style.setProperty("--ink", l.ink); }
function spaced(n) { return n.length > 8 && /^\d+$/.test(n) ? n.replace(/(.{4})/g, "$1 ").trim() : n; }

function allCards() {
  const list = Object.values(cards).filter(c => !c.hidden);
  for (const id of DEFAULTS) if (!cards[id]) list.push({ id, brand: id, name: byId[id].name, number: "", placeholder: true });
  return list.sort((a, b) => {
    if (!!a.number !== !!b.number) return a.number ? -1 : 1;
    if (settings.cardsSort === "alpha") return a.name.localeCompare(b.name, settings.lang);
    return (b.uses || 0) - (a.uses || 0) || a.name.localeCompare(b.name, settings.lang);
  });
}
let cardQuery = "";
VIEWS.cards = root => {
  const filled = Object.values(cards).filter(c => c.number && !c.hidden).length;
  const wrap = h("div", { className: "wrap" });
  const q = h("input", { id: "q", type: "search", placeholder: t("search"), autocomplete: "off", value: cardQuery });
  const search = h("label", { className: "search", htmlFor: "q" }); search.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'; search.append(q);
  const grid = h("main", { className: "grid" });
  const fill = () => {
    grid.textContent = "";
    const qq = cardQuery.trim().toLowerCase();
    const items = allCards().filter(c => !qq || c.name.toLowerCase().includes(qq) || (c.number || "").includes(qq));
    if (!items.length) { grid.append(h("div", { className: "empty", textContent: t("noMatch", qq) })); return; }
    for (const c of items) grid.append(cardTile(c));
  };
  q.oninput = () => { cardQuery = q.value; fill(); };
  wrap.append(h("header", {}, header(t("modCards"), { back: true, options: "cards", count: t("nCards", filled) }), search), grid);
  const hint = h("div", { className: "hint" }); hint.innerHTML = t("deleteHint"); wrap.append(hint);
  fill(); root.append(wrap);
  fab(t("addCard"), () => editCard(null));
};
function cardTile(c) {
  const b = h("button", { type: "button", className: "card" + (c.number ? "" : " todo") });
  styleVars(b, look(c));
  b.append(h("div", { className: "name", textContent: c.name }), h("span", { className: "chip" }), h("div", { className: "num", textContent: c.number ? spaced(c.number) : t("addNumber") }));
  let pressT = null, long = false;
  b.addEventListener("pointerdown", () => { long = false; pressT = setTimeout(() => { long = true; if (navigator.vibrate) navigator.vibrate(15); askDelete(c); }, 550); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, () => clearTimeout(pressT)));
  b.addEventListener("contextmenu", e => e.preventDefault());
  b.onclick = () => { if (long) return; c.number ? showCard(c.id) : editCard(c); };
  return b;
}
function fab(label, onclick) {
  const b = h("button", { type: "button", className: "fab" });
  b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  b.append(" " + label); b.onclick = onclick; $("#fabwrap").append(b);
}

/* Codes : rendu de tous les formats avec bwip-js */
const BCID = { EAN13: "ean13", EAN8: "ean8", UPCA: "upca", UPCE: "upce", CODE128: "code128", CODE39: "code39", CODE93: "code93", ITF: "interleaved2of5", CODABAR: "rationalizedCodabar", QR: "qrcode", AZTEC: "azteccode", DATAMATRIX: "datamatrix", PDF417: "pdf417" };
const FORMAT_LABEL = { EAN13: "EAN-13", EAN8: "EAN-8", UPCA: "UPC-A", UPCE: "UPC-E", CODE128: "Code 128", CODE39: "Code 39", CODE93: "Code 93", ITF: "ITF", CODABAR: "Codabar", QR: "QR code", AZTEC: "Aztec", DATAMATRIX: "Data Matrix", PDF417: "PDF417" };
const TWO_D = ["QR", "AZTEC", "DATAMATRIX", "PDF417"];
function eanOk(n) { const d = n.split("").map(Number), last = d.pop(); let s = 0; d.reverse().forEach((x, i) => s += x * (i % 2 === 0 ? 3 : 1)); return (10 - s % 10) % 10 === last; }
function guessFormat(n) {
  if (/^\d{13}$/.test(n) && eanOk(n)) return "EAN13";
  if (/^\d{8}$/.test(n) && eanOk(n)) return "EAN8";
  return "CODE128";
}
function codeSVG(text, format) {
  const fmt = (!format || format === "AUTO") ? guessFormat(text) : format;
  const tries = [fmt, "CODE128"];
  for (const f of tries) {
    try {
      const opts = { bcid: BCID[f] || "code128", text, scale: 3, paddingwidth: 8, paddingheight: 8, backgroundcolor: "FFFFFF", barcolor: "000000" };
      if (!TWO_D.includes(f)) opts.height = 24;
      if (f === "QR") opts.eclevel = "M";
      return { svg: bwipjs.toSVG(opts), fmt: f };
    } catch (e) { /* format refusé pour ce texte : on essaie le suivant */ }
  }
  return null;
}
function showCard(id) {
  const c = cards[id]; if (!c) return;
  c.uses = (c.uses || 0) + 1; c.lastUsed = Date.now(); saveCard(c);
  openSheet(sh => {
    const band = h("div", { className: "brandband" }); styleVars(band, look(c));
    const box = h("div", { className: "codebox" });
    const r = codeSVG(c.number, c.format);
    if (r) { const holder = h("div"); holder.innerHTML = r.svg; const svg = holder.firstElementChild; if (svg) { svg.removeAttribute("width"); svg.removeAttribute("height"); svg.style.width = TWO_D.includes(r.fmt) ? "min(78vw,300px)" : "100%"; } box.append(holder); }
    box.append(h("div", { className: "digits", textContent: spaced(c.number) }), r ? h("div", { className: "fmt", textContent: FORMAT_LABEL[r.fmt] || "" }) : null);
    sh.append(band, h("h2", { textContent: c.name }), h("p", { className: "sub", textContent: t("showCode") }), box,
      h("p", { className: "tip", textContent: NATIVE && settings.bright ? t("brightTip") : t("brightTipWeb") }));
    const copy = h("button", { type: "button", className: "btn", textContent: t("copyNumber") });
    copy.onclick = async () => { if (NATIVE && NATIVE.copy) { try { NATIVE.copy(c.number); copy.textContent = t("copied"); return; } catch (e) {} } try { await navigator.clipboard.writeText(c.number); copy.textContent = t("copied"); } catch (e) { copy.textContent = t("copyFail"); } };
    const edit = h("button", { type: "button", className: "btn", textContent: t("edit") }); edit.onclick = () => editCard(c);
    const close = h("button", { type: "button", className: "btn primary", textContent: t("close") }); close.onclick = closeSheet;
    sh.append(h("div", { className: "row" }, copy, edit, close), deleteZone(c.name, t("deleteCard"), () => removeCard(c)));
  });
  bright(true);
}
function askDelete(c) {
  openSheet(sh => {
    const band = h("div", { className: "brandband" }); styleVars(band, look(c));
    sh.append(band, h("h2", { textContent: c.name }), h("p", { className: "sub", textContent: c.number ? spaced(c.number) : t("noNumberYet") }));
    const z = deleteZone(c.name, c.number ? t("deleteCard") : t("removeFromList"), () => removeCard(c));
    const edit = h("button", { type: "button", className: "btn", textContent: t("edit") }); edit.onclick = () => editCard(c);
    const close = h("button", { type: "button", className: "btn", textContent: t("cancel") }); close.onclick = closeSheet;
    sh.append(z, h("div", { className: "row" }, edit, close));
    z.querySelector("button").click();
  });
}
function editCard(existing) {
  const draft = existing ? { ...existing } : { brand: null, name: "", number: "", format: "AUTO", color: SWATCHES[0] };
  delete draft.placeholder;
  openSheet(sh => {
    sh.append(h("h2", { textContent: existing && !existing.placeholder ? t("editCard") : (existing ? existing.name : t("newCard")) }), h("p", { className: "sub", textContent: t("cardHelp") }));
    const preWrap = h("div", { className: "presets" });
    const nameIn = h("input", { id: "f-name", value: draft.name, placeholder: t("cardName"), autocomplete: "off" });
    const swWrap = h("div", { className: "colors" });
    const colorBox = h("div", { className: "f" }, h("span", { textContent: t("color") }), swWrap);
    const syncBrand = () => { preWrap.querySelectorAll(".pre").forEach(p => p.setAttribute("aria-pressed", String((p.dataset.id || null) === (draft.brand || null)))); colorBox.hidden = !!draft.brand; };
    [...BRANDS, { id: null, name: t("other"), c1: "var(--line)", ink: "var(--fg)" }].forEach(b => {
      const p = h("button", { type: "button", className: "pre", textContent: b.name });
      p.dataset.id = b.id || ""; p.style.setProperty("--c1", b.c1); p.style.setProperty("--ink", b.ink);
      p.onclick = () => { draft.brand = b.id; if (b.id) { draft.name = b.name; nameIn.value = b.name; } else { nameIn.value = ""; draft.name = ""; nameIn.focus(); } syncBrand(); };
      preWrap.append(p);
    });
    nameIn.oninput = () => { draft.name = nameIn.value; };
    SWATCHES.forEach(col => {
      const s = h("button", { type: "button", className: "sw" }); s.style.setProperty("--c1", col); s.setAttribute("aria-label", col);
      s.setAttribute("aria-pressed", String(draft.color === col));
      s.onclick = () => { draft.color = col; swWrap.querySelectorAll(".sw").forEach(x => x.setAttribute("aria-pressed", String(x === s))); };
      swWrap.append(s);
    });
    const numIn = h("input", { id: "f-number", className: "mono", value: draft.number, placeholder: "2970123456789", autocomplete: "off" });
    const fmtSel = h("select", { id: "f-format" });
    fmtSel.append(h("option", { value: "AUTO", textContent: t("auto") }));
    Object.keys(FORMAT_LABEL).forEach(k => fmtSel.append(h("option", { value: k, textContent: FORMAT_LABEL[k] })));
    fmtSel.value = draft.format || "AUTO";
    const msg = h("div", { className: "msg" });
    const scan = h("button", { type: "button", className: "btn full" });
    scan.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 9v6M10 9v6M13 9v6M17 9v6"/></svg>';
    scan.append(" " + (NATIVE ? t("scanCamera") : t("scanPhoto")));
    const applyScan = r => { numIn.value = r.text; draft.number = r.text; draft.format = r.format || "AUTO"; fmtSel.value = draft.format in FORMAT_LABEL ? draft.format : "AUTO"; msg.className = "msg ok"; msg.textContent = t("found", r.text); };
    scan.onclick = () => {
      if (NATIVE) {
        window.onNativeScan = (text, fmt) => { if (text) applyScan({ text, format: fmt }); else { msg.className = "msg err"; msg.textContent = fmt || t("scanFail"); } };
        msg.className = "msg"; msg.textContent = t("aim"); NATIVE.scan(); return;
      }
      pickPhoto(async file => { try { applyScan(await decodeImage(file)); } catch (e) { msg.className = "msg err"; msg.textContent = t("scanFail"); } });
    };
    const err = h("div", { className: "msg err" });
    const saveBtn = h("button", { type: "button", className: "btn primary", textContent: t("save") });
    const cancel = h("button", { type: "button", className: "btn", textContent: t("cancel") }); cancel.onclick = closeSheet;
    saveBtn.onclick = () => {
      const name = (nameIn.value || "").trim(), number = (numIn.value || "").trim();
      if (!name) { err.textContent = t("needName"); nameIn.focus(); return; }
      if (!number) { err.textContent = t("needNumber"); numIn.focus(); return; }
      const id = draft.id || (draft.brand && (!cards[draft.brand] || cards[draft.brand].hidden) && draft.brand) || ("c" + Date.now().toString(36));
      const fmt = fmtSel.value;
      const c = { ...draft, id, name, number: TWO_D.includes(fmt) ? number : number.replace(/\s+/g, ""), format: fmt, created: draft.created || Date.now() };
      delete c.hidden; if (c.brand) delete c.color;
      saveCard(c); showCard(id);
    };
    sh.append(h("div", { className: "f" }, h("span", { textContent: t("brand") }), preWrap), h("label", { className: "f", htmlFor: "f-name" }, t("name"), nameIn), colorBox,
      h("label", { className: "f", htmlFor: "f-number" }, t("cardNumber"), numIn), h("div", { className: "row" }, scan), msg,
      h("label", { className: "f", htmlFor: "f-format" }, t("codeType"), fmtSel), err, h("div", { className: "row" }, cancel, saveBtn));
    if (existing) sh.append(deleteZone(existing.name, existing.placeholder ? t("removeFromList") : t("deleteCard"), () => removeCard(existing)));
    syncBrand();
  });
}

/* Lecture d'un code depuis une photo (hors appli Android) */
const FMT_MAP = { ean_13: "EAN13", ean_8: "EAN8", upc_a: "UPCA", upc_e: "UPCE", code_128: "CODE128", code_39: "CODE39", code_93: "CODE93", itf: "ITF", codabar: "CODABAR", qr_code: "QR", aztec: "AZTEC", data_matrix: "DATAMATRIX", pdf417: "PDF417",
  EAN_13: "EAN13", EAN_8: "EAN8", UPC_A: "UPCA", UPC_E: "UPCE", CODE_128: "CODE128", CODE_39: "CODE39", CODE_93: "CODE93", ITF: "ITF", CODABAR: "CODABAR", QR_CODE: "QR", AZTEC: "AZTEC", DATA_MATRIX: "DATAMATRIX", PDF_417: "PDF417" };
async function decodeImage(file) {
  if ("BarcodeDetector" in window) {
    try { const res = await new BarcodeDetector().detect(await createImageBitmap(file)); if (res.length) return { text: res[0].rawValue, format: FMT_MAP[res[0].format] || "AUTO" }; } catch (e) {}
  }
  await loadScript("lib/zxing.min.js");
  const url = URL.createObjectURL(file);
  try {
    const hints = new Map(); hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
    const r = await new ZXing.BrowserMultiFormatReader(hints).decodeFromImageUrl(url);
    return { text: r.getText(), format: FMT_MAP[ZXing.BarcodeFormat[r.getBarcodeFormat()]] || "AUTO" };
  } finally { URL.revokeObjectURL(url); }
}
const loaded = {};
function loadScript(src) { return loaded[src] ||= new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.append(s); }); }
function pickGallery(cb) { const f = h("input", { type: "file", accept: "image/*" }); f.onchange = () => { if (f.files[0]) cb(f.files[0]); }; f.click(); }
function pickPhoto(cb) { const f = $("#photo"); f.value = ""; f.onchange = () => { if (f.files[0]) cb(f.files[0]); }; f.click(); }

/* ================= Papiers ================= */
const DOCS_KEY = "sc-docs";
let docs = lsGet(DOCS_KEY, []);
function saveDocs() { lsSet(DOCS_KEY, docs); }
const DOC_TYPES = ["id", "passport", "license", "registration", "insurance", "health", "other"];
function imgSrc(ref) { return !ref ? "" : ref.startsWith("data:") ? ref : "/docs/" + ref; }
function expiryInfo(d) {
  if (!d.expiry) return null;
  const days = Math.ceil((new Date(d.expiry + "T23:59:59") - new Date()) / 86400000);
  if (days < 0) return { cls: "bad", text: t("expired") };
  if (days <= 60) return { cls: "warn", text: t("expiresIn", days) };
  return { cls: "ok", text: t("validUntil", new Date(d.expiry).toLocaleDateString(settings.lang)) };
}
VIEWS.docs = root => {
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(t("docsTitle"), { back: true, options: "docs", count: t("nDocs", docs.length) })));
  const list = h("div", { className: "docs" });
  if (!docs.length) list.append(h("div", { className: "soon" }, h("p", { textContent: t("docsEmpty"), style: "margin:0;color:var(--muted)" })));
  for (const d of docs) {
    const b = h("button", { type: "button", className: "doc" });
    const th = h("div", { className: "thumb" }); if (d.front) th.style.backgroundImage = "url('" + imgSrc(d.front) + "')";
    const meta = h("div", { className: "meta" }, h("b", { textContent: d.name || T().docTypes[d.type] }), h("small", { textContent: [T().docTypes[d.type], d.holder].filter(Boolean).join(" · ") }));
    const ex = expiryInfo(d); if (ex) meta.append(h("span", { className: "pill " + ex.cls, textContent: ex.text }));
    b.append(th, meta); b.onclick = () => showDoc(d.id);
    list.append(b);
  }
  wrap.append(list, h("p", { className: "notice", textContent: t("legal") }));
  root.append(wrap);
  fab(t("addDoc"), () => editDoc(null));
};
function showDoc(id) {
  const d = docs.find(x => x.id === id); if (!d) return;
  openSheet(sh => {
    sh.append(h("h2", { textContent: d.name || T().docTypes[d.type] }), h("p", { className: "sub", textContent: [T().docTypes[d.type], d.holder, d.number].filter(Boolean).join(" · ") }));
    const img = h("img", { alt: "" });
    const view = h("div", { className: "docview" });
    const seg = h("div", { className: "seg" });
    const sides = [["front", t("front")], ["back", t("backSide")]].filter(([k]) => d[k]);
    sides.forEach(([k, label], i) => {
      const b = h("button", { type: "button", textContent: label }); b.setAttribute("aria-pressed", String(i === 0));
      b.onclick = () => { img.src = imgSrc(d[k]); seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); };
      seg.append(b);
    });
    img.src = imgSrc(d.front);
    if (sides.length > 1) view.append(seg);
    view.append(img);
    const ex = expiryInfo(d); if (ex) view.append(h("span", { className: "pill " + ex.cls, textContent: ex.text }));
    sh.append(view);
    const edit = h("button", { type: "button", className: "btn", textContent: t("edit") }); edit.onclick = () => editDoc(d);
    const close = h("button", { type: "button", className: "btn primary", textContent: t("close") }); close.onclick = closeSheet;
    sh.append(h("div", { className: "row" }, edit, close), deleteZone(d.name || T().docTypes[d.type], t("deleteDoc"), () => removeDoc(d)));
  });
  bright(true);
}
function removeDoc(d) {
  [d.front, d.back].forEach(ref => { if (ref && !ref.startsWith("data:") && NATIVE && NATIVE.deleteImage) try { NATIVE.deleteImage(ref); } catch (e) {} });
  docs = docs.filter(x => x.id !== d.id); saveDocs(); if (view === "docs") render();
}
function editDoc(existing) {
  const draft = existing ? { ...existing } : { id: "d" + Date.now().toString(36), type: "id", name: "", holder: "", number: "", expiry: "", front: "", back: "" };
  const original = existing ? { front: existing.front, back: existing.back } : {};
  openSheet(sh => {
    sh.append(h("h2", { textContent: existing ? t("editDoc") : t("newDoc") }), h("p", { className: "sub", textContent: t("scanDocHelp") }));
    const typeSel = h("select", { id: "d-type" });
    DOC_TYPES.forEach(k => typeSel.append(h("option", { value: k, textContent: T().docTypes[k] })));
    typeSel.value = draft.type;
    const shots = h("div", { className: "shots" });
    const shotEl = side => { const s = h("div", { className: "shot" + (draft[side] ? " has" : ""), textContent: (side === "front" ? t("front") : t("backSide")) + " · " + t("tapToAdd") }); if (draft[side]) s.style.backgroundImage = "url('" + imgSrc(draft[side]) + "')"; return s; };
    const drawShots = () => { shots.textContent = ""; shots.append(shotEl("front"), shotEl("back")); };
    drawShots();
    const msg = h("div", { className: "msg" });
    const scanBtn = h("button", { type: "button", className: "btn full" });
    scanBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="8" width="10" height="8" rx="1"/></svg>';
    scanBtn.append(" " + t("scanDoc"));
    scanBtn.onclick = () => {
      if (NATIVE && NATIVE.scanDocument) {
        window.onDocScan = (pages, error) => {
          if (error) { msg.className = "msg err"; msg.textContent = error; return; }
          if (pages[0]) draft.front = pages[0];
          if (pages[1]) draft.back = pages[1];
          drawShots(); msg.className = "msg ok"; msg.textContent = "✓";
        };
        NATIVE.scanDocument(); return;
      }
      // Navigateur : deux photos, réduites pour tenir dans le stockage
      pickPhoto(async f1 => { draft.front = await shrink(f1); drawShots(); pickPhoto(async f2 => { draft.back = await shrink(f2); drawShots(); }); });
    };
    const nameIn = h("input", { id: "d-name", value: draft.name, placeholder: T().docTypes[draft.type] });
    typeSel.onchange = () => { nameIn.placeholder = T().docTypes[typeSel.value]; };
    const holderIn = h("input", { id: "d-holder", value: draft.holder, autocomplete: "off" });
    const numIn = h("input", { id: "d-number", className: "mono", value: draft.number, autocomplete: "off" });
    const expIn = h("input", { id: "d-expiry", type: "date", value: draft.expiry });
    const err = h("div", { className: "msg err" });
    const saveBtn = h("button", { type: "button", className: "btn primary", textContent: t("save") });
    const cancel = h("button", { type: "button", className: "btn", textContent: t("cancel") });
    cancel.onclick = () => { cleanupDraft(draft, original); closeSheet(); };
    saveBtn.onclick = () => {
      if (!draft.front) { err.textContent = t("needPhoto"); return; }
      Object.assign(draft, { type: typeSel.value, name: nameIn.value.trim(), holder: holderIn.value.trim(), number: numIn.value.trim(), expiry: expIn.value });
      // supprime les anciennes photos remplacées
      ["front", "back"].forEach(k => { if (original[k] && original[k] !== draft[k] && NATIVE && NATIVE.deleteImage) try { NATIVE.deleteImage(original[k]); } catch (e) {} });
      const i = docs.findIndex(x => x.id === draft.id);
      if (i >= 0) docs[i] = draft; else docs.unshift(draft);
      saveDocs(); closeSheet(); if (view === "docs") render(); showDoc(draft.id);
    };
    sh.append(h("label", { className: "f", htmlFor: "d-type" }, t("docType"), typeSel), shots, h("div", { className: "row" }, scanBtn), msg,
      h("label", { className: "f", htmlFor: "d-name" }, t("name"), nameIn), h("label", { className: "f", htmlFor: "d-holder" }, t("docHolder"), holderIn),
      h("label", { className: "f", htmlFor: "d-number" }, t("docNumber"), numIn), h("label", { className: "f", htmlFor: "d-expiry" }, t("docExpiry"), expIn),
      err, h("div", { className: "row" }, cancel, saveBtn));
    if (existing) sh.append(deleteZone(existing.name || T().docTypes[existing.type], t("deleteDoc"), () => removeDoc(existing)));
  });
}
function cleanupDraft(draft, original) {
  ["front", "back"].forEach(k => { if (draft[k] && draft[k] !== original[k] && !draft[k].startsWith("data:") && NATIVE && NATIVE.deleteImage) try { NATIVE.deleteImage(draft[k]); } catch (e) {} });
}
function shrink(file) {
  return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, 1000 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .8)); URL.revokeObjectURL(img.src); }; img.src = URL.createObjectURL(file); });
}

/* ================= Options ================= */
let optScope = "home";
function openOptions(scope) { optScope = scope; go("options"); }
VIEWS.options = root => {
  const titles = { home: t("general"), cards: t("modCards"), food: t("modFood"), docs: t("modDocs") };
  for (const m of ctx.modules) titles[m.key] = m.title();
  const wrap = h("div", { className: "wrap" });
  wrap.append(h("header", {}, header(t("optionsOf", titles[optScope]), { back: true })));
  const opts = h("div", { className: "opts" });
  if (optScope === "home") {
    const langs = h("div", { className: "langs" });
    [["fr", "Français"], ["en", "English"], ["es", "Español"]].forEach(([k, l]) => {
      const b = h("button", { type: "button", textContent: l }); b.setAttribute("aria-pressed", String(settings.lang === k));
      b.onclick = () => { settings.lang = k; saveSettings(); render(); }; langs.append(b);
    });
    opts.append(h("div", { className: "optcard" }, h("h3", { textContent: t("language") }), langs));
    const nm = h("input", { id: "o-name", type: "text", value: settings.name || "", placeholder: t("namePh"), autocomplete: "given-name", maxLength: 30 });
    nm.onchange = () => { settings.name = nm.value.trim(); saveSettings(); toast(t("saved")); };
    const zip = h("input", { id: "o-zip", type: "text", inputMode: "numeric", value: settings.zip || "", placeholder: "83600", autocomplete: "postal-code", maxLength: 5 });
    zip.onchange = () => { const v = zip.value.replace(/\D/g, "").slice(0, 5); zip.value = v; settings.zip = v; saveSettings(); toast(t("saved")); };
    const pet = h("input", { id: "o-pet", type: "text", value: settings.petName || "", placeholder: t("acc_petPh"), maxLength: 30 });
    pet.onchange = () => { settings.petName = pet.value.trim(); saveSettings(); toast(t("saved")); };
    const storesBtn = h("button", { type: "button", className: "acrow" }, h("span", { className: "acico", textContent: "🏪" }),
      h("div", { className: "acmeta" }, h("b", { textContent: t("st_title") }), h("small", { textContent: storesSummary() })), h("span", { className: "chev", textContent: "›" }));
    storesBtn.onclick = () => storesSheet(() => render());
    opts.append(h("div", { className: "optcard" }, h("h3", { textContent: t("acc_title") }),
      h("label", { className: "flabel", htmlFor: "o-name", textContent: "👤 " + t("nameTitle") }), h("div", { className: "f", style: "margin:0 0 12px" }, nm),
      h("label", { className: "flabel", htmlFor: "o-zip", textContent: "🏠 " + t("acc_zip") }), h("div", { className: "f", style: "margin:0 0 12px" }, zip),
      h("label", { className: "flabel", htmlFor: "o-pet", textContent: "🐾 " + t("acc_pet") }), h("div", { className: "f", style: "margin:0 0 12px" }, pet),
      storesBtn,
      h("div", { className: "acrow premium" }, h("span", { className: "acico", textContent: "💖" }), h("div", { className: "acmeta" }, h("s", { textContent: t("acc_premium") }), h("small", { textContent: t("acc_free") }))),
      h("p", { className: "sub", style: "margin:8px 0 0", textContent: t("acc_help") })));
    for (const hk of ctx.homeOptions) { try { hk(opts); } catch (e) { console.error(e); } }
    opts.append(themePicker(t("background"), settings.theme, v => { settings.theme = v; saveSettings(); applyTheme(v); render(); }, false));
  } else {
    opts.append(themePicker(t("moduleBg"), settings.modTheme[optScope] || "home", v => { settings.modTheme[optScope] = v; saveSettings(); applyTheme(themeFor(optScope)); render(); }, true));
    if (optScope === "cards") {
      const sel = h("select", { id: "o-sort" });
      [["uses", t("sortUses")], ["alpha", t("sortAlpha")]].forEach(([v, l]) => sel.append(h("option", { value: v, textContent: l })));
      sel.value = settings.cardsSort; sel.onchange = () => { settings.cardsSort = sel.value; saveSettings(); };
      opts.append(h("div", { className: "optcard" }, h("h3", { textContent: t("sortCards") }), h("div", { className: "f", style: "margin:0" }, sel)));
    }
    if (optScope === "food" && ctx.foodOptions) ctx.foodOptions(opts);
    const mod = ctx.modules.find(m => m.key === optScope); if (mod && mod.options) mod.options(opts);
    if (optScope === "cards" || optScope === "docs") {
      const cb = h("input", { type: "checkbox", id: "o-bright", checked: settings.bright }); cb.onchange = () => { settings.bright = cb.checked; saveSettings(); };
      opts.append(h("div", { className: "optcard" }, h("label", { className: "toggle", htmlFor: "o-bright" }, h("span", { textContent: t("brightOption") }), cb)));
    }
  }
  wrap.append(opts, h("p", { className: "version", textContent: t("version", APP_VERSION) }));
  root.append(wrap);
};
/* Enseignes préférées (Options > Compte) */
function storesSummary() {
  const D = window.FoodData, list = (settings.stores || []).map(k => (D.STORES.find(s => s[0] === k) || [])[1]).filter(Boolean);
  return (settings.storeGeo ? "📍 " + t("st_geoOn") + (list.length ? " · " : "") : "") + (list.length ? list.join(", ") : settings.storeGeo ? "" : t("st_none"));
}
function storesSheet(done) {
  const D = window.FoodData;
  openSheet(sh => {
    sh.append(h("h2", { textContent: t("st_title") }), h("p", { className: "sub", textContent: t("st_help") }));
    const geo = h("input", { type: "checkbox", id: "st-geo" }); geo.checked = !!settings.storeGeo;
    geo.onchange = () => { settings.storeGeo = geo.checked; saveSettings(); if (geo.checked && navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {}, () => toast(t("st_geoFail")), { timeout: 15000 }); };
    sh.append(h("div", { className: "optcard" }, h("label", { className: "toggle", htmlFor: "st-geo" }, h("span", { textContent: "📍 " + t("st_geo") }), geo), h("p", { className: "sub", style: "margin:8px 0 0", textContent: t("st_geoHelp") })));
    const sel = new Set(settings.stores || []);
    [["gen", "st_gen"], ["disc", "st_disc"], ["spec", "st_spec"], ["bio", "st_bio"]].forEach(([g, key]) => {
      sh.append(h("h3", { className: "shh", textContent: t(key) }));
      const l = h("div", { className: "stlist" });
      D.STORES.filter(s => s[2] === g).forEach(([k, name, , color]) => {
        const cb = h("input", { type: "checkbox", id: "st-" + k }); cb.checked = sel.has(k);
        cb.onchange = () => { cb.checked ? sel.add(k) : sel.delete(k); settings.stores = [...sel]; saveSettings(); };
        const logo = h("span", { className: "stlogo", textContent: name.replace(/^E\./, "").replace(/^(Système |La |L'|Le )/, "").slice(0, 1).toUpperCase() }); logo.style.background = color;
        l.append(h("label", { className: "strow", htmlFor: "st-" + k }, logo, h("span", { className: "stname", textContent: name }), cb));
      });
      sh.append(l);
    });
    const ok = h("button", { type: "button", className: "btn primary full", style: "margin-top:16px", textContent: t("st_done") }); ok.onclick = () => { closeSheet(); if (done) done(); };
    sh.append(ok);
  });
}
function themeName(n) { return n === "home" ? t("sameAsHome") : n === "photo" ? t("wp_photo") : (T().themes[n] || I18N.fr.themes[n] || ""); }
function themePicker(title, current, onPick, withHome) {
  const card = h("div", { className: "optcard" }, h("h3", { textContent: title }));
  const label = h("p", { className: "sub", style: "margin:10px 0 0", textContent: themeName(current) });
  const swatch = (n, bg) => {
    const b = h("button", { type: "button", className: "sw" });
    b.style.background = bg; b.style.backgroundSize = /^v?p_/.test(n) ? "" : "cover";
    b.setAttribute("aria-label", themeName(n)); b.title = themeName(n);
    b.setAttribute("aria-pressed", String(current === n)); b.onclick = () => onPick(n);
    return b;
  };
  const group = (name, list) => { const sw = h("div", { className: "colors" }); list.forEach(([n, bg]) => sw.append(swatch(n, bg))); card.append(h("p", { className: "wpgroup", textContent: name }), sw); };
  const solids = THEME_ORDER.map(n => [n, n === "auto" ? "linear-gradient(135deg,#f3f1ee 50%,#14161f 50%)" : THEMES[n].bg]);
  if (withHome) solids.unshift(["home", "repeating-linear-gradient(45deg," + resolveTheme(settings.theme).bg + " 0 6px,var(--surface) 6px 12px)"]);
  group(t("wp_colors"), solids);
  group(t("wp_gradients"), WALL_ORDER.filter(n => n.startsWith("g_")).map(n => [n, WALLS[n].wall]));
  group(t("wp_vivid"), WALL_ORDER.filter(n => n.startsWith("v_")).map(n => [n, WALLS[n].wall]));
  group(t("wp_patterns"), WALL_ORDER.filter(n => n.startsWith("p_")).map(n => [n, WALLS[n].wall]));
  group(t("wp_vpatterns"), WALL_ORDER.filter(n => n.startsWith("vp_")).map(n => [n, WALLS[n].wall]));
  // Ma photo (galerie du téléphone)
  const img = lsGet(PHOTO_KEY, null);
  const row = h("div", { className: "colors", style: "align-items:center" });
  if (img) row.append(swatch("photo", "url(" + img + ") center/cover"));
  const pick = h("button", { type: "button", className: "btn", textContent: "🖼️ " + t(img ? "wp_change" : "wp_choose") });
  pick.onclick = () => pickGallery(async file => {
    try { const r = await shrinkWall(file); lsSet(PHOTO_KEY, r.data); if (lsGet(PHOTO_KEY, null) !== r.data) throw new Error("quota"); settings.photoDark = r.dark; saveSettings(); onPick("photo"); }
    catch (e) { toast(t("wp_fail")); }
  });
  row.append(pick);
  card.append(h("p", { className: "wpgroup", textContent: t("wp_photoGroup") }), row, label);
  return card;
}
// Réduit la photo (1080 px de large max) et mesure si elle est plutôt claire ou sombre
function shrinkWall(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1080 / im.width, 1920 / im.height), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const g = c.getContext("2d"); g.drawImage(im, 0, 0, c.width, c.height);
      const m = document.createElement("canvas"); m.width = m.height = 16; const mg = m.getContext("2d"); mg.drawImage(c, 0, 0, 16, 16);
      const px = mg.getImageData(0, 0, 16, 16).data; let L = 0; for (let i = 0; i < px.length; i += 4) L += .2126 * px[i] + .7152 * px[i + 1] + .0722 * px[i + 2];
      URL.revokeObjectURL(url);
      res({ data: c.toDataURL("image/jpeg", 0.8), dark: L / 256 / 255 < 0.5 });
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("image")); };
    im.src = url;
  });
}

/* ================= Feuilles, suppression, luminosité ================= */
let wake = null;
function openSheet(build) {
  closeSheet();
  const scrim = h("div", { className: "scrim" });
  const sh = h("div", { className: "sheet", role: "dialog" }); sh.setAttribute("aria-modal", "true");
  sh.append(h("div", { className: "grab" })); scrim.append(sh); $("#layer").append(scrim);
  scrim.addEventListener("click", e => { if (e.target === scrim) closeSheet(); });
  build(sh);
}
function closeSheet() { $("#layer").textContent = ""; bright(false); }
function bright(on) {
  if (on && !settings.bright) return;
  if (NATIVE && NATIVE.setBright) { try { NATIVE.setBright(on); } catch (e) {} return; }
  if (on && navigator.wakeLock) navigator.wakeLock.request("screen").then(w => wake = w).catch(() => {});
  if (!on && wake) { wake.release().catch(() => {}); wake = null; }
}
function deleteZone(name, label, doDelete) {
  const zone = h("div", { style: "margin-top:12px" });
  const del = h("button", { type: "button", className: "btn danger full" });
  del.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  del.append(" " + label);
  del.onclick = () => {
    zone.textContent = "";
    const yes = h("button", { type: "button", className: "btn danger", textContent: t("yesDelete") });
    const no = h("button", { type: "button", className: "btn", textContent: t("noKeep") });
    yes.onclick = () => { doDelete(); closeSheet(); toast(t("deleted", name)); };
    no.onclick = () => { zone.textContent = ""; zone.append(del); };
    zone.append(h("div", { className: "confirm" }, h("p", { textContent: t("confirmDelete", name) }), h("div", { className: "row" }, no, yes)));
  };
  zone.append(del); return zone;
}
function toast(text) { const el = h("div", { className: "toast", textContent: text, role: "status" }); document.body.append(el); setTimeout(() => el.remove(), 2600); }

window.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyTheme(themeFor(view === "options" ? optScope : view)));
// Liens et presse-papiers (passent par Android quand l'appli tourne sur le téléphone)
function openUrl(url) {
  if (NATIVE && NATIVE.openUrl) { try { if (NATIVE.openUrl(url)) return; } catch (e) {} }
  window.open(url, "_blank", "noopener");
}
async function copyText(text) {
  if (NATIVE && NATIVE.copy) { try { NATIVE.copy(text); toast(t("copied")); return true; } catch (e) {} }
  try { await navigator.clipboard.writeText(text); toast(t("copied")); return true; } catch (e) { toast(t("copyFail")); return false; }
}
function themePickerFor(scope) { return themePicker(t("moduleBg"), settings.modTheme[scope] || "home", v => { settings.modTheme[scope] = v; saveSettings(); applyTheme(themeFor(scope)); render(); }, true); }
const ctx = { h, t, T, settings, saveSettings, go, header, openSheet, closeSheet, VIEWS, fab, lsGet, lsSet, toast, NATIVE, pickPhoto, decodeImage, view: () => view, render,
  modules: [], backHooks: [], productHooks: [], homeHooks: [], homeOptions: [], homeBar: [], applyTheme: n => applyTheme(n), themeFor: v => themeFor(v), viewModule: {}, storesSheet, openUrl, copyText, codeSVG, loadScript, bright, deleteZone, themePickerFor, imgSrc };
if (window.FoodUI) FoodUI.install(ctx);
for (const ext of window.SC_EXT || []) ext(ctx);
applyTheme(settings.theme);
render();
})();
