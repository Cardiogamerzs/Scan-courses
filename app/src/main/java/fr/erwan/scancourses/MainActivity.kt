package fr.erwan.scancourses

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import com.google.android.gms.tasks.Tasks
import java.util.concurrent.Executors
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread
import java.util.UUID

class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private val docsDir by lazy { File(filesDir, "docs").apply { mkdirs() } }

    // Résultat du scanner de documents de Google (recto, verso)
    private val docScanLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { res ->
        if (res.resultCode != Activity.RESULT_OK) {
            sendDocs(emptyList(), "Scan annulé.")
            return@registerForActivityResult
        }
        val result = GmsDocumentScanningResult.fromActivityResultIntent(res.data)
        val names = result?.pages?.mapNotNull { saveImage(it.imageUri) } ?: emptyList()
        if (names.isEmpty()) sendDocs(emptyList(), "Aucune page récupérée, réessaie.")
        else sendDocs(names, null)
    }

    // Photo d'assiette (module Calories)
    private var shotUri: Uri? = null
    private val takePicture = registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        val uri = shotUri
        val name = if (ok && uri != null) saveImage(uri) else null
        js("window.onPhoto && window.onPhoto(" + (if (name == null) "null" else JSONObject.quote(name)) + ")")
    }

    // Lecture du texte d'une photo (liste d'ingrédients d'un cosmétique), sur le téléphone
    private var ocrUri: Uri? = null
    private val ocrCamera = registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        val uri = ocrUri
        if (ok && uri != null) runOcr(uri) else sendOcr(null, "cancel")
    }
    private val ocrGallery = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) runOcr(uri) else sendOcr(null, "cancel")
    }
    private fun sendOcr(text: String?, err: String?) {
        js("window.onOcr && window.onOcr(" + (if (text == null) "null" else JSONObject.quote(text)) + "," + (if (err == null) "null" else JSONObject.quote(err)) + ")")
    }
    private fun runOcr(uri: Uri) {
        try {
            val image = InputImage.fromFilePath(this, uri)
            TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS).process(image)
                .addOnSuccessListener { res -> sendOcr(res.text, if (res.text.isBlank()) "empty" else null) }
                .addOnFailureListener { e -> sendOcr(null, e.message ?: "error") }
        } catch (e: Exception) {
            sendOcr(null, e.message ?: "error")
        }
    }

    // Sélecteur d'image pour les <input type=file> (QR code depuis une photo, etc.)
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val pickImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        fileCallback?.onReceiveValue(if (uri != null) arrayOf(uri) else null)
        fileCallback = null
    }

    // Position pour le module Promos
    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null
    private val askLocation = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { res ->
        geoCallback?.invoke(geoOrigin, res.values.any { it }, false)
        geoCallback = null
    }

    private fun hasLocation() =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    private fun openExternal(url: String): Boolean = try {
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
    } catch (e: Exception) {
        false
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Les fichiers de l'appli (assets/) et les photos des papiers (/docs/)
        // sont servis depuis une adresse https locale.
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/docs/", WebViewAssetLoader.InternalStoragePathHandler(this, docsDir))
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            setBackgroundColor(getColor(R.color.bg))
            settings.setGeolocationEnabled(true)
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)

                // Les liens vers l'extérieur s'ouvrent dans le navigateur (ou l'appli concernée)
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val url = request.url
                    if (url.host == "appassets.androidplatform.net") return false
                    openExternal(url.toString())
                    return true
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    view: WebView,
                    callback: ValueCallback<Array<Uri>>,
                    params: WebChromeClient.FileChooserParams
                ): Boolean {
                    fileCallback?.onReceiveValue(null)
                    fileCallback = callback
                    return try {
                        pickImage.launch("image/*"); true
                    } catch (e: Exception) {
                        fileCallback = null; false
                    }
                }

                override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
                    if (hasLocation()) {
                        callback.invoke(origin, true, false)
                    } else {
                        geoOrigin = origin
                        geoCallback = callback
                        askLocation.launch(arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION))
                    }
                }
            }
            addJavascriptInterface(Bridge(), "Android")
        }
        setContentView(web)

        if (savedInstanceState == null) {
            web.loadUrl("https://appassets.androidplatform.net/index.html")
        } else {
            web.restoreState(savedInstanceState)
        }

        // Retour : ferme d'abord la fenêtre ouverte, puis revient à l'accueil, sinon quitte.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.onBack && window.onBack()) || false") { handled ->
                    if (handled != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    // Détourage des photos de produits (fond blanc), une à la fois, sur le téléphone
    private val cutPool = Executors.newSingleThreadExecutor()
    private val cutDir by lazy { File(docsDir, "cut").apply { mkdirs() } }
    private val segmenter by lazy {
        SubjectSegmentation.getClient(SubjectSegmenterOptions.Builder().enableForegroundBitmap().build())
    }
    private fun sendCut(code: String, path: String?) {
        js("window.onCutout && window.onCutout(" + JSONObject.quote(code) + "," + (if (path == null) "null" else JSONObject.quote(path)) + ")")
    }
    private fun makeCutout(code: String, url: String) {
        val safe = code.filter { it.isLetterOrDigit() }.take(32)
        val out = File(cutDir, "$safe.jpg")
        if (out.exists()) { sendCut(code, "cut/$safe.jpg"); return }
        val c = URL(url).openConnection() as HttpURLConnection
        c.connectTimeout = 12000; c.readTimeout = 15000
        c.setRequestProperty("User-Agent", "Sovee-Android/4.4")
        val src = c.inputStream.use { BitmapFactory.decodeStream(it) } ?: throw Exception("image")
        c.disconnect()
        val res = Tasks.await(segmenter.process(InputImage.fromBitmap(src, 0)))
        val fg = res.foregroundBitmap ?: throw Exception("segmentation")
        // Cadre serré autour du produit
        val w = fg.width; val h = fg.height
        val px = IntArray(w * h); fg.getPixels(px, 0, w, 0, 0, w, h)
        var minX = w; var minY = h; var maxX = -1; var maxY = -1
        for (y in 0 until h) for (x in 0 until w) if ((px[y * w + x] ushr 24) > 40) {
            if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y
        }
        if (maxX < 0 || (maxX - minX) * (maxY - minY) < w * h / 25) throw Exception("vide")
        val bw = maxX - minX + 1; val bh = maxY - minY + 1
        val side = (maxOf(bw, bh) * 1.12f).toInt()
        val sq = Bitmap.createBitmap(side, side, Bitmap.Config.ARGB_8888)
        val cv = android.graphics.Canvas(sq)
        cv.drawColor(Color.WHITE)
        cv.drawBitmap(fg, android.graphics.Rect(minX, minY, maxX + 1, maxY + 1),
            android.graphics.Rect((side - bw) / 2, (side - bh) / 2, (side - bw) / 2 + bw, (side - bh) / 2 + bh), android.graphics.Paint(android.graphics.Paint.FILTER_BITMAP_FLAG))
        val fin = if (side > 480) Bitmap.createScaledBitmap(sq, 480, 480, true) else sq
        FileOutputStream(out).use { fin.compress(Bitmap.CompressFormat.JPEG, 88, it) }
        sendCut(code, "cut/$safe.jpg")
    }

    private fun js(code: String) = runOnUiThread { web.evaluateJavascript(code, null) }

    private fun sendScan(text: String?, formatOrError: String) {
        js("window.onNativeScan && window.onNativeScan(" + JSONObject.quote(text ?: "") + "," + JSONObject.quote(formatOrError) + ")")
    }

    private fun sendDocs(names: List<String>, error: String?) {
        val arr = JSONArray(names).toString()
        js("window.onDocScan && window.onDocScan($arr," + (if (error == null) "null" else JSONObject.quote(error)) + ")")
    }

    /** Copie une page scannée dans le stockage privé de l'appli, réduite à 1800 px max. */
    private fun saveImage(uri: Uri): String? = try {
        val src = contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) } ?: return null
        val scale = minOf(1f, 1800f / maxOf(src.width, src.height))
        val bmp = if (scale < 1f) Bitmap.createScaledBitmap(src, (src.width * scale).toInt(), (src.height * scale).toInt(), true) else src
        val name = UUID.randomUUID().toString() + ".jpg"
        FileOutputStream(File(docsDir, name)).use { bmp.compress(Bitmap.CompressFormat.JPEG, 88, it) }
        name
    } catch (e: Exception) {
        null
    }

    private fun formatName(format: Int): String = when (format) {
        Barcode.FORMAT_EAN_13 -> "EAN13"
        Barcode.FORMAT_EAN_8 -> "EAN8"
        Barcode.FORMAT_UPC_A -> "UPCA"
        Barcode.FORMAT_UPC_E -> "UPCE"
        Barcode.FORMAT_CODE_128 -> "CODE128"
        Barcode.FORMAT_CODE_39 -> "CODE39"
        Barcode.FORMAT_CODE_93 -> "CODE93"
        Barcode.FORMAT_ITF -> "ITF"
        Barcode.FORMAT_CODABAR -> "CODABAR"
        Barcode.FORMAT_QR_CODE -> "QR"
        Barcode.FORMAT_AZTEC -> "AZTEC"
        Barcode.FORMAT_DATA_MATRIX -> "DATAMATRIX"
        Barcode.FORMAT_PDF417 -> "PDF417"
        else -> "AUTO"
    }

    inner class Bridge {
        /** Scanner caméra de Google (tous formats, aucune permission caméra à donner). */
        @JavascriptInterface
        fun scan() {
            runOnUiThread {
                GmsBarcodeScanning.getClient(this@MainActivity)
                    .startScan()
                    .addOnSuccessListener { code ->
                        val value = code.rawValue
                        if (value.isNullOrEmpty()) sendScan(null, "Code illisible, réessaie.")
                        else sendScan(value, formatName(code.format))
                    }
                    .addOnCanceledListener { sendScan(null, "Scan annulé.") }
                    .addOnFailureListener {
                        sendScan(null, "Le scanner se prépare (il se télécharge la première fois). Réessaie dans quelques secondes.")
                    }
            }
        }

        /** Scanner de documents de Google : détecte les bords et recadre (recto puis verso). */
        @JavascriptInterface
        fun scanDocument() {
            runOnUiThread {
                val options = GmsDocumentScannerOptions.Builder()
                    .setGalleryImportAllowed(true)
                    .setPageLimit(2)
                    .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
                    .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
                    .build()
                GmsDocumentScanning.getClient(options)
                    .getStartScanIntent(this@MainActivity)
                    .addOnSuccessListener { sender ->
                        docScanLauncher.launch(IntentSenderRequest.Builder(sender).build())
                    }
                    .addOnFailureListener {
                        sendDocs(emptyList(), "Le scanner de documents se prépare (il se télécharge la première fois). Réessaie dans quelques secondes.")
                    }
            }
        }

        /** Supprime une photo de papier devenue inutile. */
        @JavascriptInterface
        fun deleteImage(name: String) {
            if (name.matches(Regex("^[A-Za-z0-9-]+\\.jpg$"))) File(docsDir, name).delete()
        }

        /** Ouvre un lien, un numéro, une adresse e-mail ou un lieu dans l'appli adaptée. */
        @JavascriptInterface
        fun openUrl(url: String): Boolean {
            val ok = Regex("^(https?|tel|mailto|sms|smsto|geo):.+", RegexOption.IGNORE_CASE).matches(url)
            if (!ok) return false
            runOnUiThread { openExternal(url) }
            return true
        }

        /** Lecture d'une API publique sans souci de CORS (bases ouvertes Open Food Facts / Open Prices uniquement).
         *  La réponse revient par window.onHttp(id, statut, texte). */
        @JavascriptInterface
        fun httpGet(id: String, url: String) {
            val allowed = setOf("prices.openfoodfacts.org", "world.openfoodfacts.org", "world.openbeautyfacts.org")
            val host = try { URL(url).host } catch (e: Exception) { "" }
            if (!url.startsWith("https://") || host !in allowed) {
                js("window.onHttp && window.onHttp(" + JSONObject.quote(id) + ",0,\"\")"); return
            }
            thread {
                var code = 0
                var body = ""
                try {
                    val c = URL(url).openConnection() as HttpURLConnection
                    c.connectTimeout = 12000; c.readTimeout = 15000
                    c.setRequestProperty("User-Agent", "ScanCourses-Android/3.0")
                    code = c.responseCode
                    body = (if (code in 200..299) c.inputStream else c.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
                    c.disconnect()
                } catch (e: Exception) {
                    code = 0
                }
                js("window.onHttp && window.onHttp(" + JSONObject.quote(id) + "," + code + "," + JSONObject.quote(body) + ")")
            }
        }

        /** Détoure la photo d'un produit (Open Food/Beauty Facts) sur fond blanc ; résultat par window.onCutout(code, chemin). */
        @JavascriptInterface
        fun cutout(code: String, url: String) {
            val host = try { URL(url).host } catch (e: Exception) { "" }
            if (!url.startsWith("https://") || host !in setOf("images.openfoodfacts.org", "images.openbeautyfacts.org", "static.openfoodfacts.org", "static.openbeautyfacts.org")) { sendCut(code, null); return }
            cutPool.execute { try { makeCutout(code, url) } catch (e: Exception) { sendCut(code, null) } }
        }

        /** Copie un texte dans le presse-papiers. */
        @JavascriptInterface
        fun copy(text: String) {
            runOnUiThread {
                val cm = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
                cm.setPrimaryClip(ClipData.newPlainText("Sovée", text))
            }
        }

        /** Lit le presse-papiers ; résultat par window.onPaste(texte). */
        @JavascriptInterface
        fun paste() {
            runOnUiThread {
                val txt = try {
                    val cm = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
                    cm.primaryClip?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.coerceToText(this@MainActivity)?.toString() ?: ""
                } catch (e: Exception) { "" }
                web.evaluateJavascript("window.onPaste && window.onPaste(" + JSONObject.quote(txt) + ")", null)
            }
        }

        /** Prend une photo avec l'appareil photo ; le nom du fichier revient par window.onPhoto(nom). */
        @JavascriptInterface
        fun takePhoto() {
            runOnUiThread {
                try {
                    val dir = File(cacheDir, "shots").apply { mkdirs() }
                    val f = File(dir, "shot.jpg")
                    val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", f)
                    shotUri = uri
                    takePicture.launch(uri)
                } catch (e: Exception) {
                    js("window.onPhoto && window.onPhoto(null)")
                }
            }
        }

        /** Photographie (ou choisit dans la galerie) un texte et le lit ; résultat par window.onOcr(texte, erreur). */
        @JavascriptInterface
        fun ocrPhoto(fromGallery: Boolean) {
            runOnUiThread {
                try {
                    if (fromGallery) ocrGallery.launch("image/*")
                    else {
                        val dir = File(cacheDir, "shots").apply { mkdirs() }
                        val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", File(dir, "ocr.jpg"))
                        ocrUri = uri
                        ocrCamera.launch(uri)
                    }
                } catch (e: Exception) {
                    sendOcr(null, e.message ?: "error")
                }
            }
        }

        /** Couleur des barres système assortie au fond choisi. */
        @JavascriptInterface
        fun setBars(hex: String, lightBars: Boolean) {
            runOnUiThread {
                try {
                    val c = Color.parseColor(hex)
                    @Suppress("DEPRECATION")
                    window.statusBarColor = c
                    @Suppress("DEPRECATION")
                    window.navigationBarColor = c
                    web.setBackgroundColor(c)
                    @Suppress("DEPRECATION")
                    var flags = window.decorView.systemUiVisibility
                    @Suppress("DEPRECATION")
                    flags = if (lightBars) flags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR else flags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
                    @Suppress("DEPRECATION")
                    window.decorView.systemUiVisibility = flags
                } catch (_: Exception) {
                }
            }
        }

        /** Luminosité au max + écran toujours allumé pendant l'affichage d'un code. */
        @JavascriptInterface
        fun setBright(on: Boolean) {
            runOnUiThread {
                val lp = window.attributes
                lp.screenBrightness = if (on) 1f else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                window.attributes = lp
                if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }
}
