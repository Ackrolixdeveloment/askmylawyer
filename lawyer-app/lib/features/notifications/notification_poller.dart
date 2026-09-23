import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/app_navigator.dart';
import '../../core/push/in_app_banner.dart';
import 'notification_repository.dart';
import 'notifications_screen.dart';

/// How often the app asks for anything new while it is open.
const _interval = Duration(seconds: 20);

/// Shows the in-app banner for notifications the lawyer has not seen yet.
///
/// The banner used to hang off the FCM message, which meant nothing appeared
/// when a push could not reach the device — an iPhone with no APNs key, a
/// denied permission, a phone without Google Play services. The list on the
/// server is the source of truth instead: this polls it while the app is
/// open, and an arriving push simply makes the next check immediate.
class NotificationPoller with WidgetsBindingObserver {
  NotificationPoller._();

  static final instance = NotificationPoller._();

  final _notifications = NotificationRepository.instance;

  Timer? _timer;

  /// The newest notification already accounted for; anything later is new.
  DateTime? _seenUpTo;

  bool get _running => _timer != null;

  /// Called once the lawyer is signed in and looking at the app.
  void start() {
    if (_running) return;

    WidgetsBinding.instance.addObserver(this);
    _timer = Timer.periodic(_interval, (_) => checkNow());
    checkNow();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    WidgetsBinding.instance.removeObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Nothing to show while the app is in the background — the system
    // notification covers that — but catch up the moment it returns.
    if (state == AppLifecycleState.resumed && _running) checkNow();
  }

  /// Asks for anything new right away. Safe to call as often as you like.
  Future<void> checkNow() async {
    try {
      final result = await _notifications.load(after: _seenUpTo);
      if (result.items.isEmpty) return;

      final newest = result.items.first;

      // First look of the session: catch up quietly — the bell carries the
      // count, and nobody wants a banner for last week's news.
      if (_seenUpTo == null) {
        _seenUpTo = newest.createdAt;
        return;
      }

      _seenUpTo = newest.createdAt;
      showInAppNotification(
        title: newest.title,
        body: result.items.length == 1
            ? newest.body
            : '${newest.body}\n+${result.items.length - 1} more',
        onTap: _openList,
      );
    } catch (_) {
      // Offline or signed out — the next tick tries again.
    }
  }

  void _openList() {
    appNavigatorKey.currentState?.push(
      MaterialPageRoute<void>(builder: (_) => const NotificationsScreen()),
    );
  }
}
