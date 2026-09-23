/// Backend location. Override per build, e.g.
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000`
/// and the live URL for store builds — no code change needed.
class ApiConfig {
  const ApiConfig._();

  static const _fromBuild = String.fromEnvironment('API_BASE_URL');

  /// The development backend: a tunnel to the machine running the API, so a
  /// phone on mobile data reaches it without being on the same Wi-Fi.
  static const _devTunnel = 'https://f194n1ll-4000.inc1.devtunnels.ms';

  static String get baseUrl {
    if (_fromBuild.isNotEmpty) return _fromBuild;
    return _devTunnel;
  }

  static const timeout = Duration(seconds: 20);
}
