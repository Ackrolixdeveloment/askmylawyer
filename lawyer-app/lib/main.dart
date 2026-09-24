import 'package:flutter/material.dart';

import 'core/app_navigator.dart';
import 'core/push/device_repository.dart';
import 'core/push/push_service.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/account_suspended.dart';
import 'features/consultations/offer_watcher.dart';
import 'features/notifications/notification_poller.dart';
import 'features/notifications/notifications_screen.dart';
import 'features/splash/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  installSuspensionHandler();

  // The backend needs the device token to reach this phone. A token that
  // arrives before sign-in is registered again once the session exists.
  PushService.instance.onToken = DeviceRepository.instance.register;

  // A push that does arrive just brings the next check forward; the banner
  // itself comes from the poller, so it shows even where push cannot reach.
  PushService.instance.onMessage = () {
    // A consultation offer has seconds to live, so look straight away.
    OfferWatcher.instance.checkNow();
    NotificationPoller.instance.checkNow();
  };
  PushService.instance.onOpened = (_) {
    appNavigatorKey.currentState?.push(
      MaterialPageRoute<void>(builder: (_) => const NotificationsScreen()),
    );
  };

  // Notifications must not hold up the first frame; if Firebase is missing
  // its config the app still runs, just without push.
  PushService.instance.start().catchError((Object error) {
    debugPrint('[push] not started: $error');
  });

  runApp(const LawyerApp());
}

class LawyerApp extends StatelessWidget {
  const LawyerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ask My Lawyer',
      navigatorKey: appNavigatorKey,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      // A large system font setting would otherwise scale every screen past
      // its layout; allow some growth, but cap it.
      builder: (context, child) {
        final media = MediaQuery.of(context);
        return MediaQuery(
          data: media.copyWith(
            textScaler: media.textScaler.clamp(
              minScaleFactor: 1,
              maxScaleFactor: 1.15,
            ),
          ),
          // A tap on anything that is not a field puts the keyboard away.
          // iOS has no back gesture for that, so every screen needs it.
          child: GestureDetector(
            onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
            behavior: HitTestBehavior.translucent,
            child: child!,
          ),
        );
      },
      home: const SplashScreen(),
    );
  }
}
