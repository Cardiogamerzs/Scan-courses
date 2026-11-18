package fr.erwan.scancourses

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Sert les fichiers de l'appli (assets/) depuis une adresse https locale,
        // pour que le stockage des cartes fonctionne normalement.
        val loader = WebViewAssetLoader.Builder()
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

        // Retour : ferme d'abord la carte ouverte, sinon quitte l'appli.
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

    private fun sendScan(text: String?, formatOrError: String) {
        val js = "window.onNativeScan && window.onNativeScan(" +
            JSONObject.quote(text ?: "") + "," + JSONObject.quote(formatOrError) + ")"
        web.evaluateJavascript(js, null)
    }

    private fun formatName(format: Int): String = when (format) {
        Barcode.FORMAT_EAN_13 -> "EAN13"
        Barcode.FORMAT_EAN_8 -> "EAN8"
        Barcode.FORMAT_CODE_128 -> "CODE128"
        Barcode.FORMAT_QR_CODE -> "QR"
        else -> "AUTO"
    }

    inner class Bridge {
        /** Ouvre le scanner caméra de Google (aucune permission caméra à donner). */
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
                        sendScan(
                            null,
                            "Le scanner se prépare (il se télécharge la première fois). Réessaie dans quelques secondes."
                        )
                    }
            }
        }

        /** Luminosité au max + écran toujours allumé pendant l'affichage d'un code. */
        @JavascriptInterface
        fun setBright(on: Boolean) {
            runOnUiThread {
                val lp = window.attributes
                lp.screenBrightness =
                    if (on) 1f else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                window.attributes = lp
                if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }
}
