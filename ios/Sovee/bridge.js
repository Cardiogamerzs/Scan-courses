// Pont iPhone : recrée l'objet window.Android de la version Android, pour que l'appli web tourne sans changement.
// Chaque appel est transmis au code Swift ; les réponses reviennent par les mêmes window.onXxx que sur Android.
(function () {
  "use strict";
  const H = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.sovee;
  if (!H) return;
  const post = (fn, args) => { try { H.postMessage({ fn: fn, args: args || [] }); } catch (e) {} };
  const call = fn => function () { post(fn, Array.prototype.slice.call(arguments)); };
  const URL_OK = /^(https?|tel|mailto|sms|smsto|geo):.+/i;
  window.Android = {
    platform: "ios",
    scan: call("scan"),
    scanDocument: call("scanDocument"),
    deleteImage: call("deleteImage"),
    openUrl(url) { url = String(url || ""); if (!URL_OK.test(url)) return false; post("openUrl", [url]); return true; },
    httpGet: call("httpGet"),
    cutout: call("cutout"),
    share: call("share"),
    saveFile: call("saveFile"),
    openFile: call("openFile"),
    voice: call("voice"),
    remind: call("remind"),
    unremind: call("unremind"),
    copy: call("copy"),
    paste: call("paste"),
    takePhoto: call("takePhoto"),
    ocrPhoto: call("ocrPhoto"),
    ocrUrl: call("ocrUrl"),
    setBars: call("setBars"),
    setBright: call("setBright"),
  };

  // Position : passe par l'iPhone (Core Location) plutôt que par la page
  const geoCb = {};
  let geoN = 0;
  window.__soveeGeo = (id, ok, lat, lon, acc, err) => {
    const c = geoCb[id]; delete geoCb[id];
    if (!c) return;
    if (ok) c[0] && c[0]({ coords: { latitude: lat, longitude: lon, accuracy: acc, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
    else c[1] && c[1]({ code: err || 2, message: err === 1 ? "permission denied" : "position unavailable", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  };
  const geo = {
    getCurrentPosition(ok, ko) { const id = ++geoN; geoCb[id] = [ok, ko]; post("geo", [id]); },
    watchPosition(ok, ko) { this.getCurrentPosition(ok, ko); return 0; },
    clearWatch() {},
  };
  try { Object.defineProperty(navigator, "geolocation", { value: geo, configurable: true }); } catch (e) {}

  // Journal des erreurs JavaScript (utile pour les tests automatiques sur le simulateur)
  const log = (kind, msg) => post("log", [kind, String(msg).slice(0, 2000)]);
  window.addEventListener("error", e => log("error", (e.message || e) + " @" + String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0)));
  window.addEventListener("unhandledrejection", e => log("rejection", e.reason && (e.reason.stack || e.reason.message) || e.reason));
  const ce = console.error.bind(console);
  console.error = function () { log("console", Array.prototype.map.call(arguments, String).join(" ")); ce.apply(null, arguments); };
})();
