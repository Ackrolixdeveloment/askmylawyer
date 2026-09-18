import 'package:flutter/material.dart';

import 'core/app_navigator.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/account_suspended.dart';
import 'features/splash/splash_screen.dart';

void main() {
  installSuspensionHandler();
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
          child: child!,
        );
      },
      home: const SplashScreen(),
    );
  }
}
