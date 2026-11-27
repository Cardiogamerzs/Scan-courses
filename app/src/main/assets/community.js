// Compositions partagées entre utilisateurs de Sovée (serveur Supabase, voir supabase/community.sql).
// Toutes les règles (contrôle du texte, validation par plusieurs personnes, verrouillage,
// signalements, bannissement) sont appliquées par le serveur ; l'appli refait les mêmes
// contrôles avant d'envoyer pour expliquer tout de suite ce qui ne va pas.
// L'adresse du serveur et sa clé publique viennent de community-config.js, écrit au build
// depuis les secrets GitHub (absent = fonction désactivée, l'appli marche comme avant).
(function () {
const CFG = window.SOVEE_COMMUNITY || null;
const CACHE_KEY = "sc-comm", AUTH_KEY = "sc-comm-auth";
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let cache = lsGet(CACHE_KEY, {});
const enabled = () => !!(CFG && CFG.url && CFG.key && window.fetch);

async function call(path, body, token, ms) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), ms || 8000);
  try {
    const headers = { apikey: CFG.key, "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    const r = await fetch(CFG.url.replace(/\/$/, "") + path, { method: "POST", headers, body: JSON.stringify(body || {}), signal: ctl.signal });
    const j = await r.json().catch(() => null);
    if (!r.ok) { const e = new Error((j && (j.msg || j.message || j.error_description)) || String(r.status)); e.status = r.status; throw e; }
    return j;
  } finally { clearTimeout(tm); }
}

/* Compte anonyme (aucune donnée personnelle) : créé au premier envoi seulement */
async function session(create) {
  let a = lsGet(AUTH_KEY, null);
  const now = Date.now() / 1000;
  if (a && a.access && a.exp - 60 > now) return a.access;
  if (a && a.refresh) {
    try {
      const j = await call("/auth/v1/token?grant_type=refresh_token", { refresh_token: a.refresh });
      a = { access: j.access_token, refresh: j.refresh_token, exp: now + (j.expires_in || 3600) }; lsSet(AUTH_KEY, a); return a.access;
    } catch (e) { if (e.status !== 400 && e.status !== 401 && e.status !== 403) return null; }
  }
  if (!create) return null;
  const j = await call("/auth/v1/signup", { data: {} });
  a = { access: j.access_token, refresh: j.refresh_token, exp: now + (j.expires_in || 3600) }; lsSet(AUTH_KEY, a);
  return a.access;
}

const rpc = async (fn, args, create) => call("/rest/v1/rpc/" + fn, args, await session(create).catch(() => null));

function store(code, r) {
  const prev = JSON.stringify(cache[code] || null);
  if (!r || r.status === "none" && !r.pending) delete cache[code];
  else cache[code] = { s: r.status, t: r.text || "", p: r.people || 0, n: r.need || 2, q: r.pending || 0, rep: !!r.reported, at: Date.now() };
  lsSet(CACHE_KEY, cache);
  return prev !== JSON.stringify(cache[code] || null);
}

/* Contrôle du texte : le même que comm_check côté serveur */
const RUDE = /(^|[ ,])(merde|putain|pute|salope|connard|connasse|encule|enculer|nique|niquer|ntm|fdp|batard|bite|couille|couilles|chatte|cul|pd|pede|tapette|negre|bougnoule|youpin|nazi|hitler|caca|pipi|zizi|branleur|branlette|fuck|fucking|shit|bitch|asshole|dick|cock|pussy|cunt|nigger|whore|puta|mierda|cabron|gilipollas)($|[ ,])/;
const FOOD = /^(ingredients?|ingredientes|zutaten|ingredienti|sucres?|sel|eau|farines?|ble|huiles?|lait|laits|oeufs?|amidon|amidons|aromes?|arome|naturels?|naturel|sirop|glucose|fructose|dextrose|beurre|cacao|chocolat|levure|levures|creme|fromage|riz|mais|soja|colza|tournesol|palme|olive|noisettes?|amandes?|arachides?|tomates?|oignons?|ail|epices?|poivre|vinaigre|moutarde|gelifiant|emulsifiants?|epaississant|conservateurs?|antioxydant|acidifiant|colorants?|correcteur|acidite|stabilisant|lecithines?|gelatine|pectine|gomme|xanthane|citrique|ascorbique|lactose|lactoserum|proteines?|fibres?|viande|porc|boeuf|poulet|dinde|poisson|thon|saumon|legumes?|fruits?|pommes?|fraises?|orange|citron|vanilline?|vanille|miel|avoine|orge|seigle|epeautre|gluten|malt|fecule|pomme|terre|carottes?|petits?|pois|lentilles?|haricots?|concentre|jus|puree|extrait|extraits|poudre|ecreme|entier|vegetale?s?|vegetal|graisse|graisses|sirop|cannelle|gingembre|basilic|persil|herbes?|plantes?|cafe|the|biere|vin|alcool|sugar|salt|water|flour|wheat|oil|milk|eggs?|starch|flavou?rings?|butter|cocoa|yeast|cream|cheese|rice|corn|sunflower|rapeseed|palm|hazelnuts?|almonds?|peanuts?|spices?|pepper|vinegar|mustard|e[0-9]{3,4}[a-z]?|acide|acid|sodium|potassium|calcium|magnesium|carbonate|phosphates?|nitrite|sulfites?|mono|diglycerides|azucar|harina|aceite|leche|agua)$/;
function norm(p) {
  return (p || "").toLowerCase().replace(/œ/g, "o").replace(/æ/g, "a").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%,]+/g, " ").replace(/\s+/g, " ").trim();
}
function check(p) {
  p = (p || "").replace(/\s+/g, " ").trim();
  const n = norm(p);
  if (p.length < 25) return "short";
  if (p.length > 2500) return "long";
  if ((p.match(/,/g) || []).length < 2) return "commas";
  const nonspace = p.replace(/\s/g, "").length, letters = p.toLowerCase().replace(/[^a-zàâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ]/g, "").length;
  if (!nonspace || letters / nonspace < 0.6) return "gibberish";
  if (/(https?:|www\.|\.(com|fr|net|org|io)\b|@|#)/i.test(p)) return "link";
  if (/\d[\d .-]{7,}\d/.test(p)) return "number";
  if (RUDE.test(n)) return "rude";
  const words = n.replace(/[,%0-9]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length < 4) return "short";
  if (words.some(w => w.length > 30)) return "gibberish";
  const cnt = {}; let top = 0; words.forEach(w => { if (w.length > 2) top = Math.max(top, cnt[w] = (cnt[w] || 0) + 1); });
  if (words.length >= 6 && top / words.length > 0.4) return "repeat";
  const food = words.filter(w => FOOD.test(w)).length;
  if (food < 2 && !/e ?[0-9]{3}/.test(n)) return "not_food";
  return null;
}
/* Ressemblance entre deux textes (trigrammes, comme pg_trgm) : sert à savoir si le texte
   envoyé est bien celui lu sur la photo, à quelques corrections près */
function trigrams(s) {
  const out = new Set();
  norm(s).replace(/[,%]/g, " ").split(/\s+/).filter(Boolean).forEach(w => { const x = "  " + w + " "; for (let i = 0; i < x.length - 2; i++) out.add(x.slice(i, i + 3)); });
  return out;
}
function similarity(a, b) {
  const A = trigrams(a), B = trigrams(b); if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach(x => { if (B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
}

window.Community = {
  enabled, check, similarity,
  cached: code => enabled() ? cache[code] || null : null,
  // Composition communautaire du produit (validée, ou la sienne en attente). Renvoie true si elle a changé.
  async refresh(code) {
    if (!enabled()) return false;
    try { return store(code, await rpc("comm_get", { p_code: String(code) }, false)); } catch (e) { return false; }
  },
  async submit(code, text, name) {
    if (!enabled()) return { ok: false, error: "off" };
    const bad = check(text); if (bad) return { ok: false, error: "bad_text:" + bad };
    try {
      const r = await rpc("comm_submit", { p_code: String(code), p_text: text.replace(/\s+/g, " ").trim(), p_name: name || "" }, true);
      this.refresh(code);
      return r || { ok: false, error: "net" };
    } catch (e) { return { ok: false, error: e.status === 422 || /anonymous/i.test(e.message) ? "off" : "net" }; }
  },
  async report(code, reason) {
    if (!enabled()) return { ok: false, error: "off" };
    try {
      const r = await rpc("comm_report", { p_code: String(code), p_reason: reason || "" }, true);
      if (r && r.ok) { if (cache[code]) { cache[code].rep = true; if (r.result === "review") cache[code].s = "review"; lsSet(CACHE_KEY, cache); } }
      return r || { ok: false, error: "net" };
    } catch (e) { return { ok: false, error: "net" }; }
  }
};

/* Textes */
const add = (lang, o) => window.I18N && window.I18N[lang] && Object.assign(window.I18N[lang], o);
add("fr", {
  cm_share: "Partager avec la communauté Sovée (anonyme)",
  cm_shareHelp: "Seules les listes lues sur une photo de l'étiquette sont partagées. Elles deviennent visibles par tous quand une autre personne a photographié la même étiquette.",
  cm_notPhoto: "Liste tapée ou collée : elle reste sur ton téléphone. Pour la partager, prends l'étiquette en photo.",
  cm_tooEdited: "Le texte a été trop modifié par rapport à la photo : il reste sur ton téléphone.",
  cm_byCommunity: n => "Composition ajoutée par la communauté Sovée, lue sur l'étiquette par " + n + " personnes différentes",
  cm_pending: (p, n) => "À vérifier : ta liste sera visible par tous dès qu'une autre personne aura photographié la même étiquette (" + p + "/" + n + ").",
  cm_review: "Une composition de ce produit a été signalée et est en cours de revérification. Photographie l'étiquette pour aider !",
  cm_others: "Quelqu'un a déjà proposé la composition de ce produit : photographie l'étiquette pour la confirmer et la rendre visible par tous 👍",
  cm_error: "Erreur ?", cm_reported: "Merci ! Signalement envoyé.",
  cm_reportTitle: "Signaler une erreur", cm_reportHelp: "Quand plusieurs personnes signalent la même liste, elle est retirée et revérifiée.",
  cm_r_product: "Ce n'est pas ce produit", cm_r_read: "Texte mal lu", cm_r_recipe: "La recette a changé", cm_r_fake: "Liste fausse ou blague",
  cm_sent_created: "📤 Liste envoyée ! Elle sera publique quand une autre personne l'aura confirmée.",
  cm_sent_confirmed: "👥 Merci ! Ta photo confirme une liste en attente.",
  cm_sent_validated: "🎉 Liste confirmée par plusieurs personnes : elle est maintenant visible par tous !",
  cm_sent_already: "Tu as déjà envoyé cette liste.", cm_sent_locked: "Ce produit a déjà une composition vérifiée : elle n'est pas modifiable.",
  cm_e_limit: "Tu as beaucoup envoyé aujourd'hui : réessaie demain 🙂", cm_e_banned: "Partage désactivé pour ce téléphone.",
  cm_e_net: "Pas de connexion au partage : la liste reste sur ton téléphone.", cm_e_off: "Partage indisponible pour le moment.",
  cm_e_too_many: "Trop de propositions en attente pour ce produit.",
  cm_bad_short: "La liste paraît trop courte.", cm_bad_long: "La liste est trop longue.", cm_bad_commas: "Il faut des ingrédients séparés par des virgules.",
  cm_bad_gibberish: "Le texte ne ressemble pas à une liste d'ingrédients.", cm_bad_link: "Retire l'adresse de site ou le @ du texte.",
  cm_bad_number: "Retire le numéro de téléphone du texte.", cm_bad_rude: "Le texte contient un mot grossier.",
  cm_bad_repeat: "Le même mot est répété en boucle.", cm_bad_not_food: "Le texte ne ressemble pas à une liste d'ingrédients alimentaires.",
  cm_notShared: "Non partagée : "
});
add("en", {
  cm_share: "Share with the Sovée community (anonymous)",
  cm_shareHelp: "Only lists read from a photo of the label are shared. They become visible to everyone once another person has photographed the same label.",
  cm_notPhoto: "Typed or pasted list: it stays on your phone. To share it, take a photo of the label.",
  cm_tooEdited: "The text was changed too much from the photo: it stays on your phone.",
  cm_byCommunity: n => "Ingredients added by the Sovée community, read from the label by " + n + " different people",
  cm_pending: (p, n) => "To be checked: your list will be visible to everyone once another person has photographed the same label (" + p + "/" + n + ").",
  cm_review: "This product's ingredient list was reported and is being re-checked. Photograph the label to help!",
  cm_others: "Someone already suggested this product's ingredients: photograph the label to confirm them and make them visible to everyone 👍",
  cm_error: "Wrong?", cm_reported: "Thanks! Report sent.",
  cm_reportTitle: "Report a mistake", cm_reportHelp: "When several people report the same list, it is removed and re-checked.",
  cm_r_product: "Not this product", cm_r_read: "Text misread", cm_r_recipe: "The recipe changed", cm_r_fake: "Fake list or joke",
  cm_sent_created: "📤 List sent! It will be public once another person confirms it.",
  cm_sent_confirmed: "👥 Thanks! Your photo confirms a pending list.",
  cm_sent_validated: "🎉 List confirmed by several people: it's now visible to everyone!",
  cm_sent_already: "You already sent this list.", cm_sent_locked: "This product already has verified ingredients: they can't be changed.",
  cm_e_limit: "You've sent a lot today: try again tomorrow 🙂", cm_e_banned: "Sharing is disabled on this phone.",
  cm_e_net: "Can't reach sharing: the list stays on your phone.", cm_e_off: "Sharing is unavailable right now.",
  cm_e_too_many: "Too many pending suggestions for this product.",
  cm_bad_short: "The list looks too short.", cm_bad_long: "The list is too long.", cm_bad_commas: "Ingredients should be separated by commas.",
  cm_bad_gibberish: "The text doesn't look like an ingredient list.", cm_bad_link: "Remove the website address or @ from the text.",
  cm_bad_number: "Remove the phone number from the text.", cm_bad_rude: "The text contains a rude word.",
  cm_bad_repeat: "The same word is repeated over and over.", cm_bad_not_food: "The text doesn't look like a food ingredient list.",
  cm_notShared: "Not shared: "
});
add("es", {
  cm_share: "Compartir con la comunidad Sovée (anónimo)",
  cm_shareHelp: "Solo se comparten las listas leídas en una foto de la etiqueta. Son visibles para todos cuando otra persona ha fotografiado la misma etiqueta.",
  cm_notPhoto: "Lista escrita o pegada: se queda en tu teléfono. Para compartirla, fotografía la etiqueta.",
  cm_tooEdited: "El texto se ha cambiado demasiado respecto a la foto: se queda en tu teléfono.",
  cm_byCommunity: n => "Composición añadida por la comunidad Sovée, leída en la etiqueta por " + n + " personas distintas",
  cm_pending: (p, n) => "Por verificar: tu lista será visible para todos cuando otra persona haya fotografiado la misma etiqueta (" + p + "/" + n + ").",
  cm_review: "La composición de este producto fue señalada y se está revisando. ¡Fotografía la etiqueta para ayudar!",
  cm_others: "Alguien ya propuso la composición de este producto: fotografía la etiqueta para confirmarla 👍",
  cm_error: "¿Error?", cm_reported: "¡Gracias! Aviso enviado.",
  cm_reportTitle: "Señalar un error", cm_reportHelp: "Cuando varias personas señalan la misma lista, se retira y se revisa.",
  cm_r_product: "No es este producto", cm_r_read: "Texto mal leído", cm_r_recipe: "La receta ha cambiado", cm_r_fake: "Lista falsa o broma",
  cm_sent_created: "📤 ¡Lista enviada! Será pública cuando otra persona la confirme.",
  cm_sent_confirmed: "👥 ¡Gracias! Tu foto confirma una lista pendiente.",
  cm_sent_validated: "🎉 Lista confirmada por varias personas: ¡ya es visible para todos!",
  cm_sent_already: "Ya enviaste esta lista.", cm_sent_locked: "Este producto ya tiene una composición verificada: no se puede cambiar.",
  cm_e_limit: "Has enviado mucho hoy: inténtalo mañana 🙂", cm_e_banned: "Compartir está desactivado en este teléfono.",
  cm_e_net: "Sin conexión para compartir: la lista se queda en tu teléfono.", cm_e_off: "Compartir no está disponible ahora.",
  cm_e_too_many: "Demasiadas propuestas pendientes para este producto.",
  cm_bad_short: "La lista parece demasiado corta.", cm_bad_long: "La lista es demasiado larga.", cm_bad_commas: "Los ingredientes van separados por comas.",
  cm_bad_gibberish: "El texto no parece una lista de ingredientes.", cm_bad_link: "Quita la dirección web o la @ del texto.",
  cm_bad_number: "Quita el número de teléfono del texto.", cm_bad_rude: "El texto contiene una palabrota.",
  cm_bad_repeat: "La misma palabra se repite una y otra vez.", cm_bad_not_food: "El texto no parece una lista de ingredientes alimentarios.",
  cm_notShared: "No compartida: "
});
})();
