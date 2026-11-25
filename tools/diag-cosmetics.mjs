// Contrôle de la base cosmétique embarquée : combien de fiches ont une composition, et quelle part des ingrédients est reconnue.
// Usage : node tools/diag-cosmetics.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const here = path.dirname(new URL(import.meta.url).pathname);
const assets = path.join(here, "..", "app", "src", "main", "assets");
for (const f of ["cosmetic-db.js", "food-rules.js"]) vm.runInThisContext(fs.readFileSync(path.join(assets, f), "utf8"), { filename: f });
const C = globalThis.CosmeticDB, R = globalThis.FoodRules;
let n = 0, withInci = 0, scored = 0, ings = 0, known = 0, oneBlob = 0; const samples = [];
for (let i = 0; i < 100; i++) {
  const f = path.join(assets, "data", "beauty", String(i).padStart(2, "0") + ".json");
  if (!fs.existsSync(f)) continue;
  for (const p of Object.values(JSON.parse(fs.readFileSync(f, "utf8")))) {
    n++; if (!p.inci) continue; withInci++;
    const comp = C.composition(p.inci); ings += comp.length; known += comp.filter(x => x.entry).length;
    if (comp.length <= 2 && p.inci.length > 60) oneBlob++;
    if (R.scoreCosmetic({ ...p, type: "beauty" }).score != null) scored++;
    if (samples.length < 12 && Math.random() < 0.02) samples.push(p.name + " — " + comp.length + " ingrédients, " + comp.filter(x => x.entry).length + " reconnus, " + comp.filter(x => ["low", "mod", "high"].includes(x.lv)).length + " à risque");
  }
}
console.log("Cosmétiques embarqués :", n, "| avec composition :", withInci, "| notés :", scored);
console.log("Ingrédients analysés :", ings, "| reconnus :", known, "(" + Math.round(known / Math.max(1, ings) * 100) + " %) | listes mal découpées :", oneBlob);
samples.forEach(s => console.log("  •", s));
