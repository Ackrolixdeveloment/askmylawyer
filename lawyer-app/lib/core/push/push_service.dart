import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// Runs in its own isolate when a message arrives with the app closed. It has
/// to be a top-level function, and Firebase is not yet started in there.
@pragma('vm:entry-point')
Future<void> _onBackgroundMessage(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[push] background message ${message.messageId}');
}

/// Push notifications for the lawyer app: permission, the device token and
/// what to do with a message in each app state.
class PushService {
  PushService._();

  static final instance = PushService._();

  /// The FCM token for this install. Null until permission is granted.
  String? token;

  /// Called whenever the token appears or is rotated, so it can be sent to
  /// the backend. Set this before [start].
  void Function(String token)? onToken;

  /// Called when a message arrives while the app is open. The app draws its
  /// own banner from the server's list, so this only asks it to look now.
  VoidCallback? onMessage;

  /// Called when a notification is tapped — in the banner below, or in the
  /// system tray while the app was away.
  void Function(Map<String, dynamic> data)? onOpened;

  Future<void> start() async {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_onBackgroundMessage);

    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission();
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('[push] notifications declined');
      return;
    }

    // The app draws its own banner while it is open, so iOS should not put
    // one on top of it as well.
    await messaging.setForegroundNotificationPresentationOptions(
      alert: false,
      badge: true,
      sound: false,
    );

    _saveToken(await messaging.getToken());
    messaging.onTokenRefresh.listen(_saveToken);

    FirebaseMessaging.onMessage.listen(_showWhileOpen);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleOpen);

    // The app was started by tapping a notification.
    final initial = await messaging.getInitialMessage();
    if (initial != null) _handleOpen(initial);
  }

  void _saveToken(String? value) {
    if (value == null || value == token) return;
    token = value;
    debugPrint('[push] token $value');
    onToken?.call(value);
  }

  /// A message that lands while the app is open never reaches the system
  /// tray, so the app shows its own banner — see [NotificationPoller], which
  /// this nudges into checking straight away.
  void _showWhileOpen(RemoteMessage message) {
    debugPrint('[push] foreground message ${message.messageId}');
    onMessage?.call();
  }

  void _handleOpen(RemoteMessage message) => onOpened?.call(message.data);
}
