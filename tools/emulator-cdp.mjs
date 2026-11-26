// Pilote la WebView de Sovée sur l'émulateur Android (protocole DevTools) : parcours des écrans, captures, erreurs JS.
import fs from "node:fs";
import { execSync } from "node:child_process";
const OUT = process.argv[2] || "emu-out";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const adb = c => { try { return execSync("adb " + c).toString(); } catch (e) { return ""; } };
const report = { errors: [], console: [], steps: [], crawl: {} };
let pages = [];
for (let i = 0; i < 20 && !pages.length; i++) { try { pages = (await (await fetch("http://localhost:9222/json")).json()).filter(p => p.type === "page"); } catch (e) {} if (!pages.length) await sleep(2000); }
if (!pages.length) { console.log("Aucune page WebView trouvée"); process.exit(1); }
const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
let seq = 0; const pend = {};
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; return; }
  if (m.method === "Runtime.exceptionThrown") { const d = m.params.exceptionDetails; report.errors.push((d.exception && d.exception.description || d.text) + " @" + d.url + ":" + d.lineNumber); }
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) report.console.push(m.params.type + ": " + m.params.args.map(a => a.value ?? a.description).join(" "));
};
const send = (method, params = {}) => new Promise(ok => { const id = ++seq; pend[id] = ok; ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr, ms = 0) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (ms) await sleep(ms); if (r.result && r.result.exceptionDetails) report.errors.push("eval: " + expr.slice(0, 60) + " → " + (r.result.exceptionDetails.exception || {}).description); return r.result && r.result.result ? r.result.result.value : undefined; };
let shotN = 10;
const shot = async name => {
  const m = await send("Page.getLayoutMetrics");
  const cs = (m.result && (m.result.cssContentSize || m.result.contentSize)) || { width: 400, height: 900 };
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: cs.width, height: Math.min(cs.height, 4000), scale: 1 } });
  if (r.result && r.result.data) fs.writeFileSync(OUT + "/" + (shotN++) + "-" + name + ".png", Buffer.from(r.result.data, "base64"));
  else { adb("shell screencap -p /sdcard/s.png"); adb("pull /sdcard/s.png " + OUT + "/" + (shotN++) + "-" + name + ".png"); }
};
const step = async (name, fn) => { const t0 = Date.now(); try { await fn(); report.steps.push(name + " ✓ " + (Date.now() - t0) + " ms"); } catch (e) { report.steps.push(name + " ✗ " + e.message); } };
const crawlSrc = fs.readFileSync("tools/crawl.js", "utf8");
const setSettings = async patch => { await ev(`(()=>{const s=JSON.parse(localStorage.getItem('sc-settings')||'{}');Object.assign(s,${JSON.stringify(patch)});localStorage.setItem('sc-settings',JSON.stringify(s));location.reload();})()`); await sleep(7000); await send("Runtime.enable"); };
const click = (sel, txt) => ev(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(sel)})].find(x=>x.innerText.includes(${JSON.stringify(txt)}));if(b){b.click();return true}return false})()`);

await send("Runtime.enable"); await send("Page.enable");
await step("démarrage", async () => { report.version = await ev("document.querySelector('.version')&&document.querySelector('.version').innerText"); report.loadMs = await ev("performance.timing.loadEventEnd-performance.timing.navigationStart"); await shot("accueil"); });
await step("réglages de test", async () => { await setSettings({ lang: "fr", meds: ["statin", "abx"], petName: "Minou", food: Object.assign({ setup: true, preset: "balanced", weights: { nutrition: 3, additives: 2, processing: 1, environment: 1, organic: 1 }, diets: [], pregnancy: true, baby: true, pregMode: true }, {}) }); });
for (const L of ["fr", "en", "es"]) await step("parcours " + L, async () => { await ev(crawlSrc); report.crawl[L] = await ev(`window.__crawl(${JSON.stringify(L)})`); if (L !== "fr") { await setSettings({ lang: "fr" }); } });
await step("fiche Nutella", async () => { await ev(crawlSrc); await ev("SoveeTest.open('3017620422003')", 7000); report.product = await ev("document.getElementById('app').innerText.slice(0,600)"); await shot("fiche-nutella"); });
await step("fiche Skyr", async () => { await ev("SoveeTest.open('3033492056603')", 6000); report.product2 = await ev("(document.querySelector('.medalert')||{}).innerText||'pas d alerte medicament'"); await shot("fiche-skyr"); });
await step("comparateur", async () => { await ev("SoveeTest.compare('3017620422003','3033492056603')", 5000); await shot("comparateur"); });
await step("rappels réels", async () => { await ev("SoveeTest.go('fridge')", 1000); await click("#app .seg button", "Rappels"); await sleep(12000); report.recalls = await ev("document.getElementById('app').innerText.slice(0,1500)"); await ev("(()=>{const c=document.querySelectorAll('.rccard .prow');if(c[0])c[0].click()})()", 500); await shot("rappels"); });
await step("anti-gaspi", async () => { await click("#app .seg button", "Anti-gaspi"); await sleep(800); await ev("[...document.querySelectorAll('.agchips button')].slice(0,3).forEach(b=>b.click())", 800); await shot("anti-gaspi"); });
await step("promos réelles", async () => { await ev("SoveeTest.go('prices')", 9000); report.prices = await ev("document.getElementById('app').innerText.slice(0,500)"); await shot("promos"); });
await step("recherche", async () => { await ev("SoveeTest.go('food')", 800); await ev("(()=>{const t=document.querySelectorAll('.tabbar button');t[2]&&t[2].click()})()", 800); await ev("(()=>{const q=document.getElementById('f-q');if(q){q.value='nutella';q.dispatchEvent(new Event('input'))}})()", 3000); report.search = await ev("document.querySelectorAll('.prow').length"); await shot("recherche"); });
for (const v of ["bathroom", "meds", "progress", "family", "recipes", "balance", "plate", "qr", "cards"]) await step("écran " + v, async () => { await ev(`SoveeTest.go('${v}')`, 1500); await shot(v); });
await step("mode sombre", async () => { await setSettings({ dark: "on" }); await shot("accueil-sombre"); await ev("SoveeTest.open('3017620422003')", 6000); await shot("fiche-sombre"); await setSettings({ dark: "off" }); });
await step("notification", async () => { await ev("Android.remind(4242, Date.now()+6000, '⏰ À consommer aujourd\\'hui', 'Test : notification de péremption Sovée')"); await sleep(12000); adb("shell screencap -p /sdcard/n.png"); adb("pull /sdcard/n.png " + OUT + "/80-notification.png"); });
await step("sauvegarde (sélecteur de fichier)", async () => { await ev("Android.saveFile('sovee-test.json','{}')", 5000); adb("shell screencap -p /sdcard/f.png"); adb("pull /sdcard/f.png " + OUT + "/81-sauvegarde.png"); adb("shell input keyevent KEYCODE_BACK"); await sleep(2000); });
await step("voix", async () => { await ev("window.onVoice=(t,e)=>{window.__voice=[t,e]};Android.voice('fr-FR')", 5000); adb("shell screencap -p /sdcard/v.png"); adb("pull /sdcard/v.png " + OUT + "/82-voix.png"); adb("shell input keyevent KEYCODE_BACK"); await sleep(2000); report.voice = await ev("JSON.stringify(window.__voice||null)"); });
await step("partage", async () => { await ev("Android.share('Test de partage Sovée','Liste')", 4000); adb("shell screencap -p /sdcard/p.png"); adb("pull /sdcard/p.png " + OUT + "/83-partage.png"); adb("shell input keyevent KEYCODE_BACK"); await sleep(1500); });
fs.writeFileSync(OUT + "/report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ errors: report.errors, console: report.console.slice(0, 30), steps: report.steps, crawl: Object.fromEntries(Object.entries(report.crawl).map(([k, v]) => [k, v && { n: v.screens.length, issues: v.issues }])) }, null, 2));
ws.close(); process.exit(0);
