import UIKit
import Speech
import AVFoundation

/// Recherche vocale : écoute, affiche le texte reconnu en direct, renvoie le texte final.
final class VoiceViewController: UIViewController {
    var onResult: ((String?, String?) -> Void)?
    private let lang: String
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var text: String?
    private var sent = false
    private let label = UILabel()

    init(lang: String) { self.lang = lang; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError() }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        let title = UILabel()
        title.text = "🎙️ Sovée t'écoute…"
        title.font = .systemFont(ofSize: 22, weight: .bold)
        label.text = "Parle maintenant"
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.textAlignment = .center
        label.font = .systemFont(ofSize: 18)
        let ok = UIButton(type: .system)
        ok.setTitle("Terminé", for: .normal)
        ok.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        ok.addTarget(self, action: #selector(stopTap), for: .touchUpInside)
        let st = UIStackView(arrangedSubviews: [title, label, ok])
        st.axis = .vertical; st.spacing = 22; st.alignment = .center
        st.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(st)
        NSLayoutConstraint.activate([
            st.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            st.topAnchor.constraint(equalTo: view.topAnchor, constant: 40),
            st.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
        ])
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                guard status == .authorized else { return self.finish(nil, "none") }
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    DispatchQueue.main.async { granted ? self.start() : self.finish(nil, "none") }
                }
            }
        }
    }

    private func start() {
        guard let rec = SFSpeechRecognizer(locale: Locale(identifier: lang)), rec.isAvailable else { return finish(nil, "none") }
        do {
            let s = AVAudioSession.sharedInstance()
            try s.setCategory(.record, mode: .measurement, options: .duckOthers)
            try s.setActive(true, options: .notifyOthersOnDeactivation)
            let req = SFSpeechAudioBufferRecognitionRequest()
            req.shouldReportPartialResults = true
            request = req
            let input = engine.inputNode
            input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buf, _ in req.append(buf) }
            engine.prepare()
            try engine.start()
            task = rec.recognitionTask(with: req) { [weak self] r, err in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if let r = r {
                        self.text = r.bestTranscription.formattedString
                        self.label.text = self.text
                        self.label.textColor = .label
                        if r.isFinal { self.finish(self.text, nil) }
                    } else if err != nil {
                        self.finish(self.text, self.text == nil ? "none" : nil)
                    }
                }
            }
        } catch {
            finish(nil, "none")
        }
    }

    @objc private func stopTap() { finish(text, text == nil ? "cancel" : nil) }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        finish(text, text == nil ? "cancel" : nil)
    }

    private func finish(_ t: String?, _ err: String?) {
        if engine.isRunning { engine.stop(); engine.inputNode.removeTap(onBus: 0) }
        request?.endAudio(); task?.cancel(); task = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        guard !sent else { return }
        sent = true
        onResult?(t, err)
        if presentingViewController != nil && !isBeingDismissed { dismiss(animated: true) }
    }
}
