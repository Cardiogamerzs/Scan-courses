#!/bin/bash
# Lance Sovée dans le simulateur iPhone, parcourt les modules et prend des captures d'écran.
# Résultats : ios-results.zip (captures + journal JS) et Sovee-ios-simulator.zip (l'appli pour simulateur).
APP="$1"
BID=fr.erwan.sovee
OUT=ios-results
mkdir -p "$OUT"
( cd "$(dirname "$APP")" && zip -qr "$OLDPWD/Sovee-ios-simulator.zip" "$(basename "$APP")" )

# iPhone le plus récent disponible
UDID=$(xcrun simctl list devices available -j | python3 -c '
import json,sys,re
d=json.load(sys.stdin)["devices"]
best=None
for rt,devs in d.items():
    m=re.search(r"iOS-(\d+)-(\d+)",rt)
    if not m: continue
    v=(int(m.group(1)),int(m.group(2)))
    for x in devs:
        if re.match(r"iPhone \d+( Pro)?$",x["name"]) and (best is None or v>best[0]): best=(v,x["udid"],x["name"])
print(best[1]); print(best[2]+" iOS %d.%d"%best[0],file=sys.stderr)
' 2>"$OUT/device.txt")
echo "Simulateur : $(cat $OUT/device.txt) ($UDID)"
xcrun simctl boot "$UDID"
xcrun simctl bootstatus "$UDID" -b
xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState charged --batteryLevel 100 || true
xcrun simctl install "$UDID" "$APP"
xcrun simctl privacy "$UDID" grant location "$BID" || true
xcrun simctl location "$UDID" set 43.433,6.737 || true

shot() { xcrun simctl io "$UDID" screenshot --type=png "$OUT/$1.png" >/dev/null 2>&1; echo "capture $1"; }
run() { # nom, attente, arguments…
  local name=$1 wait=$2; shift 2
  xcrun simctl terminate "$UDID" "$BID" >/dev/null 2>&1
  xcrun simctl launch "$UDID" "$BID" "$@" >/dev/null
  sleep "$wait"; shot "$name"
}

# Premier lancement : ce que voit un nouvel utilisateur
run 01-premier-lancement 15
# Puis avec des réglages de départ, module par module
run 02-accueil 10 -soveeDemo YES
for v in food recipes prices fridge family meds progress cards qr options; do
  run "03-$v" 9 -soveeDemo YES -soveeGo "$v"
done
run 04-fiche-nutella 14 -soveeDemo YES -soveeOpen 3017620422003
run 05-fiche-frites 14 -soveeDemo YES -soveeOpen 8710438123692
run 06-accueil-anglais 12 -soveeDemo YES -soveeLang en
run 07-recettes-anglais 12 -soveeDemo YES -soveeGo recipes
# Mode sombre du système
xcrun simctl ui "$UDID" appearance dark || true
run 08-accueil-sombre 10 -soveeDemo YES
xcrun simctl ui "$UDID" appearance light || true

DATA=$(xcrun simctl get_app_container "$UDID" "$BID" data 2>/dev/null)
cp "$DATA/Documents/js-log.txt" "$OUT/js-log.txt" 2>/dev/null || echo "pas de journal JS" > "$OUT/js-log.txt"
xcrun simctl spawn "$UDID" log show --last 10m --predicate 'process == "Sovee"' --style compact > "$OUT/system-log.txt" 2>/dev/null || true
echo "---- journal JS ----"; cat "$OUT/js-log.txt"
zip -qr ios-results.zip "$OUT"
