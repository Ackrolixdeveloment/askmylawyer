import AudioToolbox
import Flutter
import UIKit

/// Lets the in-app notification banner use the system alert sound.
private let soundChannelName = "askmylawyer/sound"

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
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

    channel.setMethodCallHandler { call, result in
      guard call.method == "notification" else {
        result(FlutterMethodNotImplemented)
        return
      }

      // iOS gives apps no access to the user's chosen tone, so this is the
      // standard system alert. It stays silent when the ring switch is off.
      AudioServicesPlaySystemSound(1007)
      result(nil)
    }
  }
}
