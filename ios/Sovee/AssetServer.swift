import Foundation
import WebKit

/// Sert les fichiers de l'appli (dossier www du bundle) et les photos des papiers (Documents/docs)
/// à l'adresse sovee://app/… — l'équivalent du WebViewAssetLoader d'Android.
final class AssetServer: NSObject, WKURLSchemeHandler {
    static let scheme = "sovee"
    static let host = "app"
    let root: URL
    let docs: URL

    init(root: URL, docs: URL) {
        self.root = root.standardizedFileURL
        self.docs = docs.standardizedFileURL
    }

    static func mime(_ ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js", "mjs": return "application/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "txt": return "text/plain; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "gif": return "image/gif"
        case "ico": return "image/x-icon"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        case "otf": return "font/otf"
        case "wasm": return "application/wasm"
        default: return "application/octet-stream"
        }
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return fail(task, 400) }
        var path = url.path.removingPercentEncoding ?? url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let base: URL
        let rel: String
        if path.hasPrefix("/docs/") { base = docs; rel = String(path.dropFirst(6)) } else { base = root; rel = String(path.dropFirst()) }
        let file = base.appendingPathComponent(rel).standardizedFileURL
        // Pas de sortie du dossier autorisé
        guard file.path.hasPrefix(base.path + "/"), let data = try? Data(contentsOf: file) else { return fail(task, 404) }
        let headers = [
            "Content-Type": AssetServer.mime(file.pathExtension),
            "Content-Length": String(data.count),
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": path.hasPrefix("/docs/") ? "no-store" : "no-cache",
        ]
        let res = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(res)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    private func fail(_ task: WKURLSchemeTask, _ code: Int) {
        let url = task.request.url ?? URL(string: "\(AssetServer.scheme)://\(AssetServer.host)/")!
        let res = HTTPURLResponse(url: url, statusCode: code, httpVersion: "HTTP/1.1", headerFields: ["Content-Length": "0"])!
        task.didReceive(res)
        task.didReceive(Data())
        task.didFinish()
    }
}
