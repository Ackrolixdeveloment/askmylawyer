/// Backend location. Override per build, e.g.
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000`
/// and the live URL for store builds — no code change needed.
class ApiConfig {
  const ApiConfig._();

  static const _fromBuild = String.fromEnvironment('API_BASE_URL');

  /// Where the apps talk to by default: the live API. Pass API_BASE_URL to
  /// test against a local backend or a dev tunnel instead.
  static const _liveApi = 'https://api.amlst.in';

  static String get baseUrl {
    final value = _fromBuild.isNotEmpty ? _fromBuild : _liveApi;
    // Every path starts with "/api/v1", and a trailing slash here would make
    // that "//api/v1" — which the server answers with a 404.
    return value.endsWith('/')
        ? value.substring(0, value.length - 1)
        : value;
  }

  static const timeout = Duration(seconds: 20);
}
