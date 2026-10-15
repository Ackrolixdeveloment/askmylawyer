import AudioToolbox
import Flutter
import UIKit

/// Sounds the app cannot make on its own: the system alert for an in-app
/// banner, and a repeating ring when a consultation comes in.
private let soundChannelName = "askmylawyer/sound"

/// How often the ring repeats. iOS gives no looping system sound, so this is
/// close to the cadence of an incoming call.
private let ringInterval: TimeInterval = 2.5

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  /// Keeps ringing until the call is answered or gone.
  private var ringTimer: Timer?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)

    let channel = FlutterMethodChannel(
      name: soundChannelName,
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )

    channel.setMethodCallHandler { [weak self] call, result in
      switch call.method {
      case "notification":
        // iOS gives apps no access to the user's chosen tone, so this is the
        // standard system alert. It stays silent when the ring switch is off.
        AudioServicesPlaySystemSound(1007)
        result(nil)
      case "ringStart":
        self?.startRinging()
        result(nil)
      case "ringStop":
        self?.stopRinging()
        result(nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  /// A ring and a buzz, repeating. The ring switch silences the tone; the
  /// vibration still lands, which is how any other call behaves.
  private func startRinging() {
    stopRinging()
    ring()

    let timer = Timer(timeInterval: ringInterval, repeats: true) { [weak self] _ in
      self?.ring()
    }
    // Common mode, so it keeps ringing while a scroll is in flight.
    RunLoop.main.add(timer, forMode: .common)
    ringTimer = timer
  }

  private func stopRinging() {
    ringTimer?.invalidate()
    ringTimer = nil
  }

  private func ring() {
    AudioServicesPlaySystemSound(1005)
    AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
  }
}
