import UIKit
import AVFoundation

/// Scanner de codes-barres plein écran (EAN, UPC, QR, Data Matrix…), avec la caméra arrière.
final class ScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onResult: ((String?, String) -> Void)?
    private let session = AVCaptureSession()
    private var preview: AVCaptureVideoPreviewLayer?
    private var done = false
    private let queue = DispatchQueue(label: "sovee.scanner")

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        let close = UIButton(type: .system)
        close.setTitle("Annuler", for: .normal)
        close.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        close.tintColor = .white
        close.backgroundColor = UIColor(white: 0, alpha: 0.55)
        close.layer.cornerRadius = 22
        close.contentEdgeInsets = UIEdgeInsets(top: 10, left: 24, bottom: 10, right: 24)
        close.addTarget(self, action: #selector(cancel), for: .touchUpInside)
        close.translatesAutoresizingMaskIntoConstraints = false

        let hint = UILabel()
        hint.text = "Vise le code-barres"
        hint.textColor = .white
        hint.font = .systemFont(ofSize: 17, weight: .medium)
        hint.translatesAutoresizingMaskIntoConstraints = false

        let frame = UIView()
        frame.layer.borderColor = UIColor.white.cgColor
        frame.layer.borderWidth = 3
        frame.layer.cornerRadius = 18
        frame.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(frame); view.addSubview(hint); view.addSubview(close)
        NSLayoutConstraint.activate([
            frame.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            frame.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            frame.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.78),
            frame.heightAnchor.constraint(equalTo: frame.widthAnchor, multiplier: 0.6),
            hint.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            hint.bottomAnchor.constraint(equalTo: frame.topAnchor, constant: -20),
            close.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            close.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
        ])

        AVCaptureDevice.requestAccess(for: .video) { ok in
            DispatchQueue.main.async { ok ? self.start() : self.finish(nil, "Autorise l'appareil photo dans Réglages > Sovée pour scanner.") }
        }
    }

    private func start() {
        guard let dev = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: dev), session.canAddInput(input) else {
            return finish(nil, "Pas d'appareil photo disponible.")
        }
        session.addInput(input)
        let out = AVCaptureMetadataOutput()
        guard session.canAddOutput(out) else { return finish(nil, "Scanner indisponible.") }
        session.addOutput(out)
        out.setMetadataObjectsDelegate(self, queue: .main)
        let wanted: [AVMetadataObject.ObjectType] = [.ean13, .ean8, .upce, .code128, .code39, .code93, .itf14, .interleaved2of5, .qr, .aztec, .dataMatrix, .pdf417, .codabar]
        out.metadataObjectTypes = wanted.filter { out.availableMetadataObjectTypes.contains($0) }
        if dev.isFocusModeSupported(.continuousAutoFocus) { try? dev.lockForConfiguration(); dev.focusMode = .continuousAutoFocus; dev.unlockForConfiguration() }

        let p = AVCaptureVideoPreviewLayer(session: session)
        p.videoGravity = .resizeAspectFill
        p.frame = view.bounds
        view.layer.insertSublayer(p, at: 0)
        preview = p
        queue.async { self.session.startRunning() }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        preview?.frame = view.bounds
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput objects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !done, let o = objects.first as? AVMetadataMachineReadableCodeObject, let v = o.stringValue, !v.isEmpty else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        // Remarque : iOS lit les UPC-A comme des EAN-13 commençant par 0, ce que la base accepte aussi
        finish(v, ScannerViewController.formatName(o.type))
    }

    static func formatName(_ t: AVMetadataObject.ObjectType) -> String {
        switch t {
        case .ean13: return "EAN13"
        case .ean8: return "EAN8"
        case .upce: return "UPCE"
        case .code128: return "CODE128"
        case .code39: return "CODE39"
        case .code93: return "CODE93"
        case .itf14, .interleaved2of5: return "ITF"
        case .codabar: return "CODABAR"
        case .qr: return "QR"
        case .aztec: return "AZTEC"
        case .dataMatrix: return "DATAMATRIX"
        case .pdf417: return "PDF417"
        default: return "AUTO"
        }
    }

    @objc private func cancel() { finish(nil, "Scan annulé.") }

    private func finish(_ value: String?, _ fmt: String) {
        guard !done else { return }
        done = true
        let s = session
        queue.async { if s.isRunning { s.stopRunning() } }
        dismiss(animated: true) { self.onResult?(value, fmt) }
    }
}
