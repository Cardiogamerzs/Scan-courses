// Construit la base hors ligne de l'appli à partir des exports Open Food Facts / Open Beauty Facts (JSON Lines).
// Usage : node tools/build-db.mjs food.jsonl beauty.jsonl
// Écrit app/src/main/assets/data/{food,beauty}/{00..99}.json et index.json
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import readline from "node:readline";

const here = path.dirname(new URL(import.meta.url).pathname);
const assets = path.join(here, "..", "app", "src", "main", "assets");
for (const f of ["cosmetic-db.js", "food-rules.js", "food-data.js"]) vm.runInThisContext(fs.readFileSync(path.join(assets, f), "utf8"), { filename: f });
const { normFood, normBeauty, indexRow, shardOf } = globalThis.FoodData;

const { looksNonFood, looksFood, asBeauty, scoreFood } = { ...globalThis.FoodData, scoreFood: globalThis.FoodRules.scoreFood };
const W = globalThis.FoodRules.DEFAULT_WEIGHTS;
const stats = { moved: 0, dropped: 0, noInfo: 0, beautyNoInci: 0 };
const moved = []; // cosmétiques trouvés dans la base alimentaire

async function build(file, type, norm, extra = []) {
  if (!file || !fs.existsSync(file)) { console.log("absent :", type); return; }
  const out = path.join(assets, "data", type);
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const shards = {}, index = [], seen = new Set();
  const put = p => {
    seen.add(p.code);
    if (type === "beauty" && !p.inci) stats.beautyNoInci++;
    if (type === "food") { const n = p.n || {}; if (scoreFood(p, W).score == null && [n.kcal, n.fat, n.sug, n.salt, n.prot].every(v => v == null) && !p.ing && !(p.add || []).length) stats.noInfo++; }
    delete p.type; // le type est donné par le dossier
    (shards[shardOf(p.code)] ||= {})[p.code] = p;
    index.push(indexRow({ ...p, type }));
  };
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let raw; try { raw = JSON.parse(line); } catch { continue; }
    if (!raw.code || seen.has(String(raw.code))) continue;
    let p = norm(raw);
    if (!p.name) continue;
    if (type === "food" && looksNonFood(p)) { moved.push(asBeauty(p)); stats.moved++; continue; }
    if (type === "beauty" && looksFood(p)) { stats.dropped++; continue; }
    put(p);
  }
  for (const p of extra) if (!seen.has(p.code)) put(p);
  for (let i = 0; i < 100; i++) { const k = String(i).padStart(2, "0"); fs.writeFileSync(path.join(out, k + ".json"), JSON.stringify(shards[k] || {})); }
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index));
  console.log(type, ":", index.length, "produits");
}
await build(process.argv[2], "food", normFood);
await build(process.argv[3], "beauty", normBeauty, moved);
console.log("Cosmétiques retirés de la base alimentaire et analysés comme cosmétiques :", stats.moved);
console.log("Aliments retirés de la base cosmétique :", stats.dropped);
console.log("Aliments sans aucune donnée (fiche « informations insuffisantes ») :", stats.noInfo);
console.log("Cosmétiques sans composition (fiche « composition inconnue ») :", stats.beautyNoInci);
