package fr.erwan.scancourses

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
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
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)
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
