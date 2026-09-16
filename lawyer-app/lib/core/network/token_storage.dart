import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Session tokens, kept in the Keychain (iOS) / Keystore (Android).
class TokenStorage {
  TokenStorage._();

  static final instance = TokenStorage._();

  static const _accessKey = 'aml_lawyer_access_token';
  static const _refreshKey = 'aml_lawyer_refresh_token';

  final _storage = const FlutterSecureStorage();

  Future<String?> get accessToken => _storage.read(key: _accessKey);
  Future<String?> get refreshToken => _storage.read(key: _refreshKey);

  Future<void> save({required String access, required String refresh}) async {
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
