import 'dart:io';

import 'package:flutter/foundation.dart';

import '../network/api_client.dart';
import 'push_service.dart';

/// Tells the backend which phone this lawyer is signed in on, so admin
/// notifications can reach them.
class DeviceRepository {
  DeviceRepository._();

  static final instance = DeviceRepository._();

  static const _path = '/api/v1/lawyer/devices';

  /// Safe to call at any time: without a token or a session it does nothing.
  Future<void> register([String? token]) async {
    final value = token ?? PushService.instance.token;
    if (value == null) return;

    try {
      await ApiClient.instance.post(
        _path,
        body: {'token': value, 'platform': Platform.isIOS ? 'ios' : 'android'},
        auth: true,
      );
    } on ApiException catch (error) {
      // Not signed in yet, or offline — it is registered again after login.
      debugPrint('[push] device not registered: ${error.code}');
    }
  }

  /// Called before logout clears the session, so this phone stops receiving
  /// the account's notifications.
  Future<void> unregister() async {
    final token = PushService.instance.token;
    if (token == null) return;

    try {
      await ApiClient.instance.put(
        _path,
        body: {'token': token},
        method: 'DELETE',
      );
    } on ApiException {
      // Signing out locally is enough; the token is replaced on next login.
    }
  }
}
