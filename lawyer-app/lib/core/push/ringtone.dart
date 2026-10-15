import 'package:flutter/services.dart';

/// The phone's own ringtone, for an incoming consultation.
///
/// The platform side owns this — see MainActivity.kt and AppDelegate.swift —
/// because neither silent mode, the ring switch, nor the user's chosen tone
/// is reachable from Dart. It keeps ringing until [stop] is called, so every
/// path off the ringing screen has to call it.
class Ringtone {
  const Ringtone._();

  static const _channel = MethodChannel('askmylawyer/sound');

  static Future<void> start() => _invoke('ringStart');

  static Future<void> stop() => _invoke('ringStop');

  static Future<void> _invoke(String method) async {
    try {
      await _channel.invokeMethod<void>(method);
    } on PlatformException {
      // No tone available on this device; the screen still shows.
    } on MissingPluginException {
      // An older build of the app shell, without the ring methods.
    }
  }
}
