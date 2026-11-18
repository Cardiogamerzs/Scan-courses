# Scan Courses 💳

Appli Android qui regroupe les cartes fidélité : Intermarché, Auchan, Carrefour, Picard, Orchestra… et toutes celles qu'on veut ajouter.

- Scan du code-barres avec la caméra (scanner Google, sans permission caméra)
- Affichage du code en grand, luminosité au maximum, pour la caisse
- Cartes enregistrées sur le téléphone, marche sans réseau

## Installer

Télécharger la dernière version : **[ScanCourses.apk](https://github.com/Cardiogamerzs/scan-courses/releases/latest/download/ScanCourses.apk)**, l'ouvrir sur le téléphone et autoriser l'installation.

Chaque modification poussée sur `main` fabrique un nouvel APK (onglet Actions) et le publie dans les Releases.

## Structure

- `app/src/main/assets/index.html` : l'interface (HTML/CSS/JS, bibliothèques JsBarcode, qrcodejs et ZXing incluses)
- `app/src/main/java/.../MainActivity.kt` : la WebView et le pont natif (scan caméra, luminosité)
