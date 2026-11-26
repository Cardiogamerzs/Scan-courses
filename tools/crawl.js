// Parcours automatique de tous les écrans de Sovée (dans un navigateur ou une WebView Android).
// S'exécute dans la page : window.__crawl(lang) renvoie la liste des écrans visités et des problèmes trouvés.
window.__crawl = async function (lang) {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const out = { screens: [], issues: [] };
  const BAD = /\bundefined\b|\bNaN\b|\[object |\b(?:[a-z]{1,3}|ch|bd|rp|fm|hp|pet|sh|dm|bk|sl|bu|ex|ag|rc|ba|md|cp|dy|vo|fr|acc|st|pr|qr|wp)_[a-zA-Z0-9_]+\b/;
  const check = name => {
    const txt = document.getElementById("app").innerText + " " + (document.getElementById("layer") || { innerText: "" }).innerText;
    const m = BAD.exec(txt);
    out.screens.push(name);
    if (m) out.issues.push(name + " → « " + txt.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, " ") + " »");
  };
  const home = async () => { for (let i = 0; i < 6 && window.onBack(); i++) await wait(120); await wait(200); };
  if (lang) { const s = JSON.parse(localStorage.getItem("sc-settings")); s.lang = lang; localStorage.setItem("sc-settings", JSON.stringify(s)); }
  await home();
  check("home");
  const n = document.querySelectorAll("button.module").length;
  for (let i = 0; i < n; i++) {
    await home();
    const m = document.querySelectorAll("button.module")[i]; if (!m) continue;
    const title = m.querySelector("b").innerText;
    m.click(); await wait(700);
    check(title);
    const segs = [...document.querySelectorAll("#app .seg button")].map(b => b.innerText);
    for (const s of segs) {
      const b = [...document.querySelectorAll("#app .seg button")].find(x => x.innerText === s); if (!b) continue;
      b.click(); await wait(600); check(title + " / " + s);
      const segs2 = [...document.querySelectorAll("#app .seg button")].map(x => x.innerText).filter(x => !segs.includes(x));
      for (const s2 of segs2.slice(0, 6)) { const b2 = [...document.querySelectorAll("#app .seg button")].find(x => x.innerText === s2); if (b2) { b2.click(); await wait(500); check(title + " / " + s + " / " + s2); } }
    }
    const tabs = [...document.querySelectorAll(".tabbar button")];
    for (let j = 0; j < tabs.length; j++) { const tb = document.querySelectorAll(".tabbar button")[j]; if (tb) { tb.click(); await wait(600); check(title + " / onglet " + (j + 1)); } }
  }
  await home();
  const opt = document.querySelector(".homebar button:last-child"); if (opt) { opt.click(); await wait(500); check("options"); }
  await home();
  return out;
};
