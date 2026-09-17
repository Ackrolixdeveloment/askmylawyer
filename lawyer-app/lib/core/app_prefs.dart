import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Small on-device flags that survive sign-out and reinstall-free updates.
class AppPrefs {
  AppPrefs._();

  static final instance = AppPrefs._();

  static const _onboardingSeenKey = 'aml_lawyer_onboarding_seen';

  final _storage = const FlutterSecureStorage();

  /// The intro carousel is a first-run tour — it is never shown twice.
  Future<bool> get hasSeenOnboarding async =>
      await _storage.read(key: _onboardingSeenKey) == 'true';

  Future<void> markOnboardingSeen() =>
      _storage.write(key: _onboardingSeenKey, value: 'true');
}
