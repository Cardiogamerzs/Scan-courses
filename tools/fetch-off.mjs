// Télécharge les produits français les plus scannés depuis Open Food Facts et Open Beauty Facts.
// Usage : node tools/fetch-off.mjs <dossier de sortie> [nb aliments] [nb cosmétiques]
// Respecte la limite de l'API de recherche (10 requêtes par minute).
import fs from "node:fs";
import path from "node:path";

const out = process.argv[2] || "offdata";
const FOOD_MAX = parseInt(process.argv[3] || "50000", 10);
const BEAUTY_MAX = parseInt(process.argv[4] || "8000", 10);
fs.mkdirSync(out, { recursive: true });
const UA = "ScanCourses/2.0 (application personnelle, github.com/Cardiogamerzs/Scan-courses)";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const KEEP = ["energy-kcal_100g", "fat_100g", "saturated-fat_100g", "sugars_100g", "salt_100g", "fiber_100g", "proteins_100g"];

const FOOD_FIELDS = "code,product_name_fr,product_name,generic_name_fr,brands,quantity,categories_tags,pnns_groups_1,pnns_groups_2,nutriscore_grade,nutriscore_score,nova_group,ecoscore_grade,ecoscore_score,environmental_score_grade,environmental_score_score,nutriments,additives_tags,allergens_tags,traces_tags,ingredients_analysis_tags,labels_tags,origins_tags,packaging_tags,ingredients_text_fr,unique_scans_n,image_front_small_url";
const BEAUTY_FIELDS = "code,product_name,product_name_fr,brands,quantity,categories_tags,ingredients_tags,ingredients_text,labels_tags,unique_scans_n,image_front_small_url";

async function page(host, fields, n, size) {
  const url = `https://${host}/api/v2/search?countries_tags=en:france&sort_by=unique_scans_n&page_size=${size}&page=${n}&fields=${fields}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 429 || r.status >= 500) throw new Error("HTTP " + r.status);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return (await r.json()).products || [];
    } catch (e) {
      console.log(`  ${host} page ${n} : ${e.message}, nouvel essai dans 60 s`);
      await sleep(60000);
    }
  }
  return null;
}
async function grab(host, fields, file, max, clean) {
  const fd = fs.openSync(path.join(out, file), "w");
  const seen = new Set(); let n = 0, total = 0;
  const size = 1000;
  while (total < max && n < 200) {
    n++;
    const items = await page(host, fields, n, size);
    if (!items || !items.length) break;
    for (const p of items) {
      if (!p.code || seen.has(p.code)) continue;
      seen.add(p.code); total++;
      fs.writeSync(fd, JSON.stringify(clean(p)) + "\n");
    }
    console.log(`${host} page ${n} : ${total} produits`);
    await sleep(7000);
  }
  fs.closeSync(fd);
  return total;
}
const food = await grab("world.openfoodfacts.org", FOOD_FIELDS, "food.jsonl", FOOD_MAX, p => {
  const nu = p.nutriments || {}; p.nutriments = Object.fromEntries(KEEP.filter(k => nu[k] != null).map(k => [k, nu[k]])); return p;
});
const beauty = await grab("world.openbeautyfacts.org", BEAUTY_FIELDS, "beauty.jsonl", BEAUTY_MAX, p => p);
console.log("Total :", food, "aliments,", beauty, "cosmétiques");
if (food < 1000) { console.error("Trop peu de produits alimentaires récupérés"); process.exit(1); }
