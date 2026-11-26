import UIKit
import WebKit
import Vision
import VisionKit
import CoreImage
import ImageIO
import CoreLocation
import UserNotifications
import UniformTypeIdentifiers

/// Les 18 fonctions du pont Android, en version iPhone. Les résultats reviennent par les mêmes window.onXxx.
final class NativeBridge: NSObject, WKScriptMessageHandler,
    UIImagePickerControllerDelegate, UINavigationControllerDelegate,
    UIDocumentPickerDelegate, VNDocumentCameraViewControllerDelegate, CLLocationManagerDelegate {

    private weak var vc: WebViewController?
    private let docsDir = WebViewController.docsDir
    private lazy var cutDir: URL = {
        let d = docsDir.appendingPathComponent("cut", isDirectory: true)
        try? FileManager.default.createDirectory(at: d, withIntermediateDirectories: true)
        return d
    }()
    private let cutQueue = DispatchQueue(label: "sovee.cutout", qos: .utility)
    private let ciContext = CIContext()

    init(controller: WebViewController) { vc = controller }

    // MARK: utilitaires

    private func js(_ code: String) { vc?.js(code) }

    /// Texte JavaScript entre guillemets (ou null).
    static func quote(_ s: String?) -> String {
        guard let s = s else { return "null" }
        guard let d = try? JSONSerialization.data(withJSONObject: [s]), var t = String(data: d, encoding: .utf8) else { return "\"\"" }
        t.removeFirst(); t.removeLast()
        return t.replacingOccurrences(of: "\u{2028}", with: "\\u2028").replacingOccurrences(of: "\u{2029}", with: "\\u2029")
    }
    private func q(_ s: String?) -> String { NativeBridge.quote(s) }

    private func str(_ a: [Any], _ i: Int) -> String {
        guard i < a.count else { return "" }
        if let s = a[i] as? String { return s }
        if let n = a[i] as? NSNumber { return n.stringValue }
        return ""
    }
    private func num(_ a: [Any], _ i: Int) -> Double {
        guard i < a.count else { return 0 }
        if let n = a[i] as? NSNumber { return n.doubleValue }
        if let s = a[i] as? String { return Double(s) ?? 0 }
        return 0
    }
    private func bool(_ a: [Any], _ i: Int) -> Bool {
        guard i < a.count else { return false }
        if let b = a[i] as? Bool { return b }
        if let n = a[i] as? NSNumber { return n.boolValue }
        if let s = a[i] as? String { return s == "true" || s == "1" }
        return false
    }

    private lazy var logURL: URL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("js-log.txt")
    func log(_ kind: String, _ msg: String) {
        NSLog("SoveeJS %@ %@", kind, msg)
        let line = "\(Date()) [\(kind)] \(msg)\n"
        if let h = try? FileHandle(forWritingTo: logURL) {
            h.seekToEndOfFile(); h.write(line.data(using: .utf8)!); try? h.close()
        } else {
            try? line.data(using: .utf8)!.write(to: logURL)
        }
    }

    // MARK: messages venant de la page

    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        guard let body = m.body as? [String: Any], let fn = body["fn"] as? String else { return }
        let a = body["args"] as? [Any] ?? []
        DispatchQueue.main.async { self.handle(fn, a) }
    }

    private func handle(_ fn: String, _ a: [Any]) {
        switch fn {
        case "log": log(str(a, 0), str(a, 1))
        case "scan": scan()
        case "scanDocument": scanDocument()
        case "deleteImage": deleteImage(str(a, 0))
        case "openUrl": if let u = URL(string: str(a, 0)) { UIApplication.shared.open(u) }
        case "httpGet": httpGet(id: str(a, 0), url: str(a, 1))
        case "cutout": cutout(code: str(a, 0), url: str(a, 1))
        case "share": share(text: str(a, 0), subject: str(a, 1))
        case "saveFile": saveFile(name: str(a, 0), text: str(a, 1))
        case "openFile": openFile()
        case "voice": voice(lang: str(a, 0))
        case "remind": remind(id: Int(num(a, 0)), at: num(a, 1), title: str(a, 2), text: str(a, 3))
        case "unremind": UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["r\(Int(num(a, 0)))"])
        case "copy": UIPasteboard.general.string = str(a, 0)
        case "paste": js("window.onPaste && window.onPaste(" + q(UIPasteboard.general.string ?? "") + ")")
        case "takePhoto": takePhoto()
        case "ocrPhoto": ocrPhoto(fromGallery: bool(a, 0))
        case "ocrUrl": ocrUrl(code: str(a, 0), url: str(a, 1))
        case "setBars": vc?.setBars(hex: str(a, 0), light: bool(a, 1))
        case "setBright": setBright(bool(a, 0))
        case "geo": geo(id: Int(num(a, 0)))
        default: log("bridge", "fonction inconnue : \(fn)")
        }
    }

    // MARK: scanner de codes-barres

    private func sendScan(_ text: String?, _ formatOrError: String) {
        js("window.onNativeScan && window.onNativeScan(" + q(text ?? "") + "," + q(formatOrError) + ")")
    }

    private func scan() {
        guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
            return sendScan(nil, "Pas d'appareil photo disponible.")
        }
        let s = ScannerViewController()
        s.onResult = { [weak self] value, format in
            if let v = value, !v.isEmpty { self?.sendScan(v, format) } else { self?.sendScan(nil, format.isEmpty ? "Scan annulé." : format) }
        }
        s.modalPresentationStyle = .fullScreen
        vc?.presentTop(s)
    }

    // MARK: scanner de documents (recto, verso)

    private func sendDocs(_ names: [String], _ error: String?) {
        let arr = (try? String(data: JSONSerialization.data(withJSONObject: names), encoding: .utf8)) ?? "[]"
        js("window.onDocScan && window.onDocScan(\(arr)," + q(error) + ")")
    }

    private func scanDocument() {
        guard VNDocumentCameraViewController.isSupported else { return sendDocs([], "Le scanner de documents n'est pas disponible sur cet appareil.") }
        let d = VNDocumentCameraViewController()
        d.delegate = self
        vc?.presentTop(d)
    }

    func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
        var names: [String] = []
        for i in 0..<min(scan.pageCount, 2) { if let n = saveImage(scan.imageOfPage(at: i)) { names.append(n) } }
        controller.dismiss(animated: true)
        if names.isEmpty { sendDocs([], "Aucune page récupérée, réessaie.") } else { sendDocs(names, nil) }
    }

    func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
        controller.dismiss(animated: true)
        sendDocs([], "Scan annulé.")
    }

    func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
        controller.dismiss(animated: true)
        sendDocs([], "Scan impossible, réessaie.")
    }

    /// Copie une image dans le stockage privé de l'appli, réduite à 1800 px max.
    private func saveImage(_ img: UIImage) -> String? {
        let scale = min(1, 1800 / max(img.size.width, img.size.height))
        let size = CGSize(width: floor(img.size.width * scale), height: floor(img.size.height * scale))
        let fmt = UIGraphicsImageRendererFormat(); fmt.scale = 1
        let out = UIGraphicsImageRenderer(size: size, format: fmt).image { _ in img.draw(in: CGRect(origin: .zero, size: size)) }
        guard let data = out.jpegData(compressionQuality: 0.88) else { return nil }
        let name = UUID().uuidString.lowercased() + ".jpg"
        do { try data.write(to: docsDir.appendingPathComponent(name)); return name } catch { return nil }
    }

    private func deleteImage(_ name: String) {
        guard name.range(of: "^[A-Za-z0-9-]+\\.jpg$", options: .regularExpression) != nil else { return }
        try? FileManager.default.removeItem(at: docsDir.appendingPathComponent(name))
    }

    // MARK: lecture des bases ouvertes (sans souci de CORS)

    private static let httpHosts: Set<String> = ["prices.openfoodfacts.org", "world.openfoodfacts.org", "world.openbeautyfacts.org", "world.openpetfoodfacts.org", "data.economie.gouv.fr"]
    private static let session: URLSession = {
        let c = URLSessionConfiguration.default
        c.timeoutIntervalForRequest = 15
        c.httpAdditionalHeaders = ["User-Agent": "Sovee-iOS/4.7"]
        return URLSession(configuration: c)
    }()

    private func httpGet(id: String, url: String) {
        guard url.hasPrefix("https://"), let u = URL(string: url), let host = u.host, NativeBridge.httpHosts.contains(host) else {
            return js("window.onHttp && window.onHttp(" + q(id) + ",0,\"\")")
        }
        NativeBridge.session.dataTask(with: u) { [weak self] data, res, err in
            guard let self = self else { return }
            let code = err == nil ? ((res as? HTTPURLResponse)?.statusCode ?? 0) : 0
            let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            self.js("window.onHttp && window.onHttp(" + self.q(id) + "," + String(code) + "," + self.q(body) + ")")
        }.resume()
    }

    // MARK: détourage des photos de produits (fond blanc)

    private func sendCut(_ code: String, _ path: String?) {
        js("window.onCutout && window.onCutout(" + q(code) + "," + q(path) + ")")
    }

    private func cutout(code: String, url: String) {
        let hosts: Set<String> = ["images.openfoodfacts.org", "images.openbeautyfacts.org", "static.openfoodfacts.org", "static.openbeautyfacts.org"]
        guard url.hasPrefix("https://"), let u = URL(string: url), let h = u.host, hosts.contains(h) else { return sendCut(code, nil) }
        guard #available(iOS 17.0, *) else { return sendCut(code, nil) }
        let safe = String(code.filter { $0.isLetter || $0.isNumber }.prefix(32))
        let out = cutDir.appendingPathComponent("\(safe).jpg")
        if FileManager.default.fileExists(atPath: out.path) { return sendCut(code, "cut/\(safe).jpg") }
        NativeBridge.session.dataTask(with: u) { [weak self] data, _, _ in
            guard let self = self else { return }
            self.cutQueue.async {
                var ok = false
                if #available(iOS 17.0, *), let d = data { ok = self.makeCutout(d, to: out) }
                self.sendCut(code, ok ? "cut/\(safe).jpg" : nil)
            }
        }.resume()
    }

    @available(iOS 17.0, *)
    private func makeCutout(_ data: Data, to out: URL) -> Bool {
        guard let src = CIImage(data: data) else { return false }
        let req = VNGenerateForegroundInstanceMaskRequest()
        let handler = VNImageRequestHandler(ciImage: src)
        do { try handler.perform([req]) } catch { return false }
        guard let res = req.results?.first, !res.allInstances.isEmpty,
              let buf = try? res.generateMaskedImage(ofInstances: res.allInstances, from: handler, croppedToInstancesExtent: true) else { return false }
        let fg = CIImage(cvPixelBuffer: buf)
        let bw = fg.extent.width, bh = fg.extent.height
        if bw * bh < src.extent.width * src.extent.height / 25 { return false }
        let side = max(bw, bh) * 1.12
        let placed = fg.transformed(by: CGAffineTransform(translationX: (side - bw) / 2 - fg.extent.minX, y: (side - bh) / 2 - fg.extent.minY))
        let white = CIImage(color: .white).cropped(to: CGRect(x: 0, y: 0, width: side, height: side))
        var img = placed.composited(over: white).cropped(to: white.extent)
        if side > 480 { img = img.transformed(by: CGAffineTransform(scaleX: 480 / side, y: 480 / side)) }
        guard let cs = CGColorSpace(name: CGColorSpace.sRGB),
              let jpg = ciContext.jpegRepresentation(of: img, colorSpace: cs, options: [CIImageRepresentationOption(rawValue: kCGImageDestinationLossyCompressionQuality as String): 0.88]) else { return false }
        return (try? jpg.write(to: out)) != nil
    }

    // MARK: partage, fichiers

    private func share(text: String, subject: String) {
        let a = UIActivityViewController(activityItems: [text], applicationActivities: nil)
        a.popoverPresentationController?.sourceView = vc?.view
        vc?.presentTop(a)
    }

    private enum PickMode { case save, open }
    private var pickMode: PickMode = .open
    private var saveTemp: URL?

    private func saveFile(name: String, text: String) {
        let clean = name.replacingOccurrences(of: "/", with: "-")
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(clean.isEmpty ? "sovee.json" : clean)
        do { try text.data(using: .utf8)!.write(to: tmp) } catch { return js("window.onFileSaved && window.onFileSaved(false)") }
        saveTemp = tmp
        pickMode = .save
        let p = UIDocumentPickerViewController(forExporting: [tmp], asCopy: true)
        p.delegate = self
        vc?.presentTop(p)
    }

    private func openFile() {
        pickMode = .open
        let p = UIDocumentPickerViewController(forOpeningContentTypes: [.json, .plainText, .data], asCopy: true)
        p.delegate = self
        vc?.presentTop(p)
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        if pickMode == .save {
            cleanSave()
            js("window.onFileSaved && window.onFileSaved(true)")
        } else {
            let txt = urls.first.flatMap { try? String(contentsOf: $0, encoding: .utf8) }
            js("window.onFileText && window.onFileText(" + q(txt) + ")")
        }
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        if pickMode == .save { cleanSave(); js("window.onFileSaved && window.onFileSaved(false)") }
        else { js("window.onFileText && window.onFileText(null)") }
    }

    private func cleanSave() { if let t = saveTemp { try? FileManager.default.removeItem(at: t) }; saveTemp = nil }

    // MARK: voix

    private func voice(lang: String) {
        let v = VoiceViewController(lang: lang.isEmpty ? "fr-FR" : lang)
        v.onResult = { [weak self] text, err in
            self?.js("window.onVoice && window.onVoice(" + NativeBridge.quote(text) + (err != nil ? "," + NativeBridge.quote(err) : "") + ")")
        }
        v.modalPresentationStyle = .pageSheet
        if let s = v.sheetPresentationController { s.detents = [.medium()] }
        vc?.presentTop(v)
    }

    // MARK: rappels (dates de péremption)

    private func remind(id: Int, at: Double, title: String, text: String) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            let c = UNMutableNotificationContent()
            c.title = title; c.body = text; c.sound = .default
            let delay = max(1, at / 1000 - Date().timeIntervalSince1970)
            let req = UNNotificationRequest(identifier: "r\(id)", content: c, trigger: UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false))
            center.add(req)
        }
    }

    // MARK: photos, lecture de texte

    private enum PhotoMode { case photo, ocr }
    private var photoMode: PhotoMode = .photo

    private func takePhoto() {
        guard UIImagePickerController.isSourceTypeAvailable(.camera) else { return js("window.onPhoto && window.onPhoto(null)") }
        photoMode = .photo
        let p = UIImagePickerController()
        p.sourceType = .camera
        p.delegate = self
        vc?.presentTop(p)
    }

    private func sendOcr(_ text: String?, _ err: String?) {
        js("window.onOcr && window.onOcr(" + q(text) + "," + q(err) + ")")
    }

    private func ocrPhoto(fromGallery: Bool) {
        let src: UIImagePickerController.SourceType = fromGallery || !UIImagePickerController.isSourceTypeAvailable(.camera) ? .photoLibrary : .camera
        photoMode = .ocr
        let p = UIImagePickerController()
        p.sourceType = src
        p.delegate = self
        vc?.presentTop(p)
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        let img = info[.originalImage] as? UIImage
        if photoMode == .photo {
            let name = img.flatMap { saveImage($0) }
            js("window.onPhoto && window.onPhoto(" + q(name) + ")")
        } else if let img = img {
            runOcr(img)
        } else {
            sendOcr(nil, "cancel")
        }
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        if photoMode == .photo { js("window.onPhoto && window.onPhoto(null)") } else { sendOcr(nil, "cancel") }
    }

    private func runOcr(_ img: UIImage) {
        guard let cg = img.cgImage else { return sendOcr(nil, "error") }
        let orient = CGImagePropertyOrientation(img.imageOrientation)
        let req = VNRecognizeTextRequest { [weak self] r, err in
            let obs = (r.results as? [VNRecognizedTextObservation]) ?? []
            // Ordre de lecture : de haut en bas puis de gauche à droite
            let lines = obs.sorted { a, b in
                abs(a.boundingBox.midY - b.boundingBox.midY) > 0.01 ? a.boundingBox.midY > b.boundingBox.midY : a.boundingBox.minX < b.boundingBox.minX
            }.compactMap { $0.topCandidates(1).first?.string }
            let text = lines.joined(separator: "\n")
            if let e = err { self?.sendOcr(nil, e.localizedDescription) } else { self?.sendOcr(text, text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "empty" : nil) }
        }
        req.recognitionLevel = .accurate
        req.recognitionLanguages = ["fr-FR", "en-US"]
        req.usesLanguageCorrection = true
        DispatchQueue.global(qos: .userInitiated).async {
            do { try VNImageRequestHandler(cgImage: cg, orientation: orient).perform([req]) } catch { self.sendOcr(nil, error.localizedDescription) }
        }
    }

    /// Lit le texte de la photo « ingrédients » d'Open Food Facts ; résultat par window.onOcrUrl(code, texte, erreur).
    private func ocrUrl(code: String, url: String) {
        let done: (String?, String?) -> Void = { [weak self] text, err in
            self?.js("window.onOcrUrl && window.onOcrUrl(" + NativeBridge.quote(code) + "," + NativeBridge.quote(text) + "," + NativeBridge.quote(err) + ")")
        }
        guard url.hasPrefix("https://"), let u = URL(string: url), let h = u.host, ["images.openfoodfacts.org", "static.openfoodfacts.org"].contains(h) else { return done(nil, "host") }
        NativeBridge.session.dataTask(with: u) { data, _, _ in
            guard let data = data, let img = UIImage(data: data), let cg = img.cgImage else { return done(nil, "image") }
            let req = VNRecognizeTextRequest { r, err in
                let obs = (r.results as? [VNRecognizedTextObservation]) ?? []
                let lines = obs.sorted { a, b in
                    abs(a.boundingBox.midY - b.boundingBox.midY) > 0.01 ? a.boundingBox.midY > b.boundingBox.midY : a.boundingBox.minX < b.boundingBox.minX
                }.compactMap { $0.topCandidates(1).first?.string }
                let text = lines.joined(separator: "\n")
                if let e = err { done(nil, e.localizedDescription) } else { done(text, text.isEmpty ? "empty" : nil) }
            }
            req.recognitionLevel = .accurate
            req.recognitionLanguages = ["fr-FR", "en-US"]
            do { try VNImageRequestHandler(cgImage: cg, orientation: CGImagePropertyOrientation(img.imageOrientation)).perform([req]) } catch { done(nil, "error") }
        }.resume()
    }

    // MARK: luminosité (affichage d'une carte de fidélité)

    private var savedBrightness: CGFloat?
    private func setBright(_ on: Bool) {
        if on {
            if savedBrightness == nil { savedBrightness = UIScreen.main.brightness }
            UIScreen.main.brightness = 1
        } else if let b = savedBrightness {
            UIScreen.main.brightness = b
            savedBrightness = nil
        }
        UIApplication.shared.isIdleTimerDisabled = on
    }

    // MARK: position (module Promos)

    private lazy var loc: CLLocationManager = {
        let m = CLLocationManager()
        m.delegate = self
        m.desiredAccuracy = kCLLocationAccuracyHundredMeters
        return m
    }()
    private var geoWaiting: [Int] = []

    private func geo(id: Int) {
        geoWaiting.append(id)
        switch loc.authorizationStatus {
        case .notDetermined: loc.requestWhenInUseAuthorization()
        case .denied, .restricted: finishGeo(nil, err: 1)
        default: loc.requestLocation()
        }
    }

    private func finishGeo(_ l: CLLocation?, err: Int) {
        let ids = geoWaiting; geoWaiting = []
        for id in ids {
            if let l = l {
                js("window.__soveeGeo && __soveeGeo(\(id),true,\(l.coordinate.latitude),\(l.coordinate.longitude),\(l.horizontalAccuracy))")
            } else {
                js("window.__soveeGeo && __soveeGeo(\(id),false,0,0,0,\(err))")
            }
        }
    }

    func locationManagerDidChangeAuthorization(_ m: CLLocationManager) {
        guard !geoWaiting.isEmpty else { return }
        switch m.authorizationStatus {
        case .notDetermined: break
        case .denied, .restricted: finishGeo(nil, err: 1)
        default: m.requestLocation()
        }
    }

    func locationManager(_ m: CLLocationManager, didUpdateLocations locations: [CLLocation]) { finishGeo(locations.last, err: 0) }
    func locationManager(_ m: CLLocationManager, didFailWithError error: Error) { finishGeo(nil, err: 2) }
}

extension CGImagePropertyOrientation {
    init(_ o: UIImage.Orientation) {
        switch o {
        case .up: self = .up
        case .upMirrored: self = .upMirrored
        case .down: self = .down
        case .downMirrored: self = .downMirrored
        case .left: self = .left
        case .leftMirrored: self = .leftMirrored
        case .right: self = .right
        case .rightMirrored: self = .rightMirrored
        @unknown default: self = .up
        }
    }
}
