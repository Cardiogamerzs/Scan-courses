// Compacte la base hors ligne pour l'APK : les étiquettes répétées (catégories, additifs, enseignes…)
// sont remplacées par des numéros (dictionnaire tags.json), puis chaque fichier est compressé en gzip.
// L'appli décompresse et reconstitue les produits à la lecture (food-data.js).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const here = path.dirname(new URL(import.meta.url).pathname);
const data = path.join(here, "..", "app", "src", "main", "assets", "data");
const SHARD_TAGS = ["cats", "add", "all", "tr", "ana", "lab", "ori", "pack", "st"];
const INDEX_ONE = ["k", "k2", "g"], INDEX_LIST = ["a", "an", "al", "st"];

for (const type of ["food", "beauty"]) {
  const dir = path.join(data, type);
  if (!fs.existsSync(path.join(dir, "index.json"))) continue;
  const dict = [], ids = new Map();
  const id = v => { if (!ids.has(v)) { ids.set(v, dict.length); dict.push(v); } return ids.get(v); };
  const gz = (name, obj) => { fs.writeFileSync(path.join(dir, name), zlib.gzipSync(JSON.stringify(obj), { level: 9 })); };
  let before = 0, after = 0;
  for (let i = 0; i < 100; i++) {
    const f = path.join(dir, String(i).padStart(2, "0") + ".json");
    if (!fs.existsSync(f)) continue;
    before += fs.statSync(f).size;
    const shard = JSON.parse(fs.readFileSync(f, "utf8")), out = {};
    for (const [code, p] of Object.entries(shard)) {
      const q = { ...p }; delete q.code;
      for (const k of SHARD_TAGS) if (Array.isArray(q[k])) q[k] = q[k].map(id);
      out[code] = q;
    }
    gz(path.basename(f).replace(/\.json$/, ".jgz"), out); fs.rmSync(f);
  }
  const fi = path.join(dir, "index.json"); before += fs.statSync(fi).size;
  const rows = JSON.parse(fs.readFileSync(fi, "utf8")).map(r => {
    const q = { ...r };
    for (const k of INDEX_ONE) if (typeof q[k] === "string" && q[k]) q[k] = id(q[k]); else delete q[k];
    for (const k of INDEX_LIST) if (Array.isArray(q[k]) && q[k].length) q[k] = q[k].map(id); else delete q[k];
    return q;
  });
  gz("index.jgz", rows); fs.rmSync(fi);
  gz("tags.jgz", dict);
  for (const f of fs.readdirSync(dir)) after += fs.statSync(path.join(dir, f)).size;
  console.log(type, ": base compactée", Math.round(before / 1e6), "Mo →", Math.round(after / 1e6 * 10) / 10, "Mo (", dict.length, "étiquettes )");
}
