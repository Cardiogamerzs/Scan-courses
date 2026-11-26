#!/bin/bash
# Test de Sovée sur un vrai Android (émulateur de la CI) : installation, lancement, parcours de tous les écrans,
# erreurs JavaScript, notifications, widget. Résultats dans emu-out/.
set -x
export ADB_TIMEOUT=30
OUT=emu-out; mkdir -p $OUT
PKG=fr.erwan.scancourses
adb install -r Sovee.apk
adb shell pm grant $PKG android.permission.POST_NOTIFICATIONS || true
adb logcat -c
adb shell am start -n $PKG/.MainActivity
sleep 20
adb shell screencap -p /sdcard/s.png && adb pull /sdcard/s.png $OUT/01-lancement.png
PID=$(adb shell pidof $PKG | tr -d '\r')
echo "PID=$PID"
SOCK=$(adb shell cat /proc/net/unix | tr -d '\r' | grep -ao "webview_devtools_remote_$PID" | head -1)
echo "SOCK=$SOCK"
adb forward tcp:9222 localabstract:$SOCK
(adb logcat -s SoveeJS:* AndroidRuntime:E ActivityManager:W > $OUT/logcat-live.txt &)
timeout 1200 node tools/emulator-cdp.mjs $OUT || echo "CDP_FAILED"
adb devices
# Widget : l'action « scanner » doit ouvrir le scanner
adb shell am start -a fr.erwan.scancourses.SCAN -n $PKG/.MainActivity
sleep 6
adb shell screencap -p /sdcard/s.png && adb pull /sdcard/s.png $OUT/90-widget-scan.png
adb shell input keyevent KEYCODE_BACK; sleep 2
adb shell dumpsys notification --noredact | grep -a -i -E "sov|peremption|consommer" | head -20 > $OUT/notifications.txt
adb shell screencap -p /sdcard/s.png && adb pull /sdcard/s.png $OUT/91-apres.png
timeout 30 adb logcat -d -s SoveeJS:* AndroidRuntime:E chromium:E > $OUT/logcat.txt
grep -c "FATAL EXCEPTION" $OUT/logcat.txt && echo "CRASH" || echo "no crash"
cat $OUT/report.json 2>/dev/null | head -c 20000
echo; tail -60 $OUT/logcat-live.txt 2>/dev/null
(cd $OUT && zip -q -r ../emulator-results.zip .)
exit 0
