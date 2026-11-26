// Liste tous les textes français du contenu de l'appli (recettes, ingrédients, fiches…) à traduire en anglais.
// Usage : node tools/extract-strings.mjs > tools/tr-strings.json
import fs from "node:fs";
import vm from "node:vm";
const A = "app/src/main/assets/";
const win = { console };
win.window = win; win.globalThis = win;
const sandbox = vm.createContext(win);
for (const f of ["kitchen-data.js", "recipes-hand.js", "recipes-more.js", "recipes-gen.js", "additives-db.js", "cosmetic-db.js", "plus-data.js", "lang-en.js"]) vm.runInContext(fs.readFileSync(A + f, "utf8"), sandbox, { filename: f });
// Contenus de extras-ui.js (grossesse, bébé) : on lit les tableaux directement dans le fichier
const ex = fs.readFileSync(A + "extras-ui.js", "utf8");
const content = {};
for (const name of ["PREG", "PREG_GOOD", "BABY", "BABY_NO"]) { const m = ex.match(new RegExp("const " + name + " = (\\[[\\s\\S]*?\\n\\]);")); if (m) content[name] = vm.runInNewContext(m[1]); }
win.SoveeContent = content;
const set = new Set(win.SoveeTr.collect(win).map(([o, k]) => o[k]));
const P = win.SoveePlus;
for (const r of (P.XMAS || []).concat(P.REGION_RECIPES || [])) { set.add(r[0]); r[7].split("|").forEach(s => set.add(s)); }
Object.values(P.XMAS_ING || {}).forEach(v => set.add(v[0]));
const list = [...set].filter(win.SoveeTr.isText).sort();
process.stdout.write(JSON.stringify(list, null, 0));
console.error(list.length + " textes, " + list.reduce((s, x) => s + x.length, 0) + " caractères");
