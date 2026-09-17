import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Backend location. Set per build, e.g.
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000`
/// and the live URL for store builds — no code change needed.
class ApiConfig {
  const ApiConfig._();

  static const _fromBuild = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_fromBuild.isNotEmpty) return _fromBuild;
    // The Android emulator reaches the host machine through 10.0.2.2.
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:4000';
    return 'http://localhost:4000';
  }

  static const timeout = Duration(seconds: 20);
}
