import UIKit
import WebKit

/// Écran unique : la WebView qui affiche l'appli Sovée (les mêmes fichiers que sur Android).
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private(set) var web: WKWebView!
    private var bridge: NativeBridge!
    private var statusStyle: UIStatusBarStyle = .darkContent
    private var pageReady = false

    static let docsDir: URL = {
        let d = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("docs", isDirectory: true)
        try? FileManager.default.createDirectory(at: d, withIntermediateDirectories: true)
        return d
    }()

    override var preferredStatusBarStyle: UIStatusBarStyle { statusStyle }

    override func viewDidLoad() {
        super.viewDidLoad()
        let bg = UIColor(red: 1, green: 0.973, blue: 0.976, alpha: 1)
        view.backgroundColor = bg

        let cfg = WKWebViewConfiguration()
        let root = Bundle.main.resourceURL!.appendingPathComponent("www", isDirectory: true)
        cfg.setURLSchemeHandler(AssetServer(root: root, docs: WebViewController.docsDir), forURLScheme: AssetServer.scheme)
        cfg.websiteDataStore = .default()
        cfg.allowsInlineMediaPlayback = true
        cfg.preferences.javaScriptCanOpenWindowsAutomatically = false

        let ucc = WKUserContentController()
        if let u = Bundle.main.url(forResource: "bridge", withExtension: "js"), let src = try? String(contentsOf: u, encoding: .utf8) {
            ucc.addUserScript(WKUserScript(source: src, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        // Tests sur simulateur : réglages de départ pour passer l'accueil de première utilisation
        if UserDefaults.standard.bool(forKey: "soveeDemo") {
            let seed = """
            (function(){var s={};try{s=JSON.parse(localStorage.getItem('sc-settings')||'{}')||{}}catch(e){}if(!s.lang)s.lang='fr';if(!s.food||!s.food.setup)s.food={setup:true,preset:'balanced',weights:{nutrition:3,additives:2,processing:1,environment:1,organic:1},diets:[]};localStorage.setItem('sc-settings',JSON.stringify(s));})();
            """
            ucc.addUserScript(WKUserScript(source: seed, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        cfg.userContentController = ucc

        web = WKWebView(frame: .zero, configuration: cfg)
        web.isOpaque = false
        web.backgroundColor = bg
        web.scrollView.backgroundColor = bg
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsBackForwardNavigationGestures = false
        web.navigationDelegate = self
        web.uiDelegate = self
        if #available(iOS 16.4, *) { web.isInspectable = true }
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        bridge = NativeBridge(controller: self)
        web.configuration.userContentController.add(WeakHandler(bridge), name: "sovee")

        // Retour : glisser depuis le bord gauche ferme la fenêtre ouverte ou revient à l'accueil
        let edge = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(edgeBack(_:)))
        edge.edges = .left
        view.addGestureRecognizer(edge)

        web.load(URLRequest(url: URL(string: "\(AssetServer.scheme)://\(AssetServer.host)/index.html")!))
    }

    @objc private func edgeBack(_ g: UIScreenEdgePanGestureRecognizer) {
        if g.state == .ended { js("window.onBack && window.onBack()") }
    }

    func js(_ code: String) {
        DispatchQueue.main.async { self.web.evaluateJavaScript(code, completionHandler: nil) }
    }

    /// Couleur des barres assortie au fond choisi par l'appli (mode clair / sombre).
    func setBars(hex: String, light: Bool) {
        guard let c = UIColor(hex: hex) else { return }
        view.backgroundColor = c
        web.backgroundColor = c
        web.scrollView.backgroundColor = c
        statusStyle = light ? .darkContent : .lightContent
        setNeedsStatusBarAppearanceUpdate()
    }

    // MARK: navigation

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if pageReady { return }
        pageReady = true
        bridge.log("info", "page chargée")
        let diag = "JSON.stringify({secure:window.isSecureContext,ds:typeof DecompressionStream,ls:(()=>{try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return true}catch(e){return false}})(),ua:navigator.userAgent})"
        webView.evaluateJavaScript(diag) { r, _ in self.bridge.log("diag", r as? String ?? "?") }
        // Tests sur simulateur : ouvrir directement un écran (-soveeGo recipes) ou un produit (-soveeOpen 301762…)
        let d = UserDefaults.standard
        if let v = d.string(forKey: "soveeGo"), v.range(of: "^[a-z]+$", options: .regularExpression) != nil {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { self.js("window.SoveeTest && SoveeTest.go('\(v)')") }
        }
        if let c = d.string(forKey: "soveeOpen"), c.range(of: "^[0-9]+$", options: .regularExpression) != nil {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { self.js("window.SoveeTest && SoveeTest.open('\(c)')") }
        }
        if let l = d.string(forKey: "soveeLang"), ["fr", "en", "es"].contains(l) {
            webView.evaluateJavaScript("(()=>{const s=JSON.parse(localStorage.getItem('sc-settings')||'{}');if(s.lang!=='\(l)'){s.lang='\(l)';localStorage.setItem('sc-settings',JSON.stringify(s));location.reload();}})()", completionHandler: nil)
            pageReady = false
            d.removeObject(forKey: "soveeLang")
        }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        pageReady = false
        webView.reload()
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if url.scheme == AssetServer.scheme || url.scheme == "about" || url.scheme == "blob" || url.scheme == "data" {
            return decisionHandler(.allow)
        }
        // Les liens vers l'extérieur s'ouvrent dans Safari (ou l'appli concernée)
        UIApplication.shared.open(url)
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url, url.scheme != AssetServer.scheme { UIApplication.shared.open(url) }
        return nil
    }

    // Boîtes de dialogue JavaScript (alert, confirm, prompt)
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Annuler", style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        a.addTextField { $0.text = defaultText }
        a.addAction(UIAlertAction(title: "Annuler", style: .cancel) { _ in completionHandler(nil) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(a.textFields?.first?.text) })
        present(a, animated: true)
    }

    /// Présente un écran par-dessus ce qui est déjà affiché.
    func presentTop(_ vc: UIViewController) {
        var top: UIViewController = self
        while let p = top.presentedViewController { top = p }
        top.present(vc, animated: true)
    }
}

/// Évite le cycle de rétention WKUserContentController → gestionnaire.
final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ t: WKScriptMessageHandler) { target = t }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) { target?.userContentController(c, didReceive: m) }
}

extension UIColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        if s.count == 3 { s = s.map { "\($0)\($0)" }.joined() }
        guard s.count == 6 || s.count == 8, let v = UInt64(s, radix: 16) else { return nil }
        let a, r, g, b: CGFloat
        if s.count == 8 {
            a = CGFloat((v >> 24) & 0xff) / 255; r = CGFloat((v >> 16) & 0xff) / 255; g = CGFloat((v >> 8) & 0xff) / 255; b = CGFloat(v & 0xff) / 255
        } else {
            a = 1; r = CGFloat((v >> 16) & 0xff) / 255; g = CGFloat((v >> 8) & 0xff) / 255; b = CGFloat(v & 0xff) / 255
        }
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}
