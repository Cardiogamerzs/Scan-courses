// Sovée, la mascotte : un cœur tout rond qui sourit.
// SoveeMascot.svg(humeur, taille) renvoie le dessin SVG ; humeurs : happy, wink, love, wow.
(function () {
"use strict";
let uid = 0;
const HEART = "M60 104C30 86 6 66 6 38C6 20 20 6 37 6C47 6 55 11 60 19C65 11 73 6 83 6C100 6 114 20 114 38C114 66 90 86 60 104Z";
const INK = "#3a1020";
function eye(x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="5.2" ry="6.6" fill="' + INK + '"/><circle cx="' + (x + 1.8) + '" cy="' + (y - 2.4) + '" r="1.9" fill="#fff"/>'; }
function closedEye(x, y) { return '<path d="M' + (x - 6) + ' ' + y + 'q6 6 12 0" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>'; }
function loveEye(x, y) { return '<path transform="translate(' + (x - 7) + ' ' + (y - 7) + ') scale(.12)" d="' + HEART + '" fill="#e8335a" stroke="#fff" stroke-width="10"/>'; }
// Mascotte dessinée (image fournie par Erwan) ; l'ancien cœur SVG reste en secours
function img(size) {
  const s = size || 120;
  return '<img class="mascot" src="img/' + (s <= 48 ? "mascot-sm" : "mascot") + '.webp" width="' + s + '" height="' + s + '" alt="" draggable="false">';
}
function svg(mood, size) { return img(size); }
function heartSvg(mood, size) {
  const id = "sv" + (++uid);
  const s = size || 120;
  let eyes;
  if (mood === "wink") eyes = eye(44, 50) + closedEye(76, 51);
  else if (mood === "love") eyes = loveEye(44, 50) + loveEye(76, 50);
  else eyes = eye(44, 50) + eye(76, 50);
  const mouth = mood === "wow"
    ? '<ellipse cx="60" cy="68" rx="6" ry="7" fill="' + INK + '"/>'
    : '<path d="M48 61Q60 78 72 61Q60 66 48 61Z" fill="' + INK + '"/><ellipse cx="60" cy="69.5" rx="5" ry="2.6" fill="#ff8fa3"/>';
  return '<svg class="mascot" width="' + s + '" height="' + Math.round(s * 110 / 120) + '" viewBox="0 0 120 110" aria-hidden="true">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#ff7a93"/><stop offset="1" stop-color="#e8335a"/></linearGradient></defs>' +
    '<path d="' + HEART + '" fill="url(#' + id + ')"/>' +
    '<ellipse cx="33" cy="24" rx="12" ry="7" transform="rotate(-25 33 24)" fill="#fff" opacity=".45"/>' +
    '<ellipse cx="31" cy="63" rx="7.5" ry="4.6" fill="#ffb3c1" opacity=".9"/><ellipse cx="89" cy="63" rx="7.5" ry="4.6" fill="#ffb3c1" opacity=".9"/>' +
    eyes + mouth + '</svg>';
}
window.SoveeMascot = { svg, img, heartSvg, HEART };
})();
