import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/get_started_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/onboarding/splash_screen.dart';

void main() {
  runApp(const CustomerApp());
}

class CustomerApp extends StatelessWidget {
  const CustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ask My Lawyer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      // A large system font setting would otherwise scale every screen past
      // its layout; allow some growth, but cap it.
      builder: (context, child) {
        final media = MediaQuery.of(context);
        return MediaQuery(
          data: media.copyWith(
            // Honour the reader's own setting, but cap it: past ~1.4 the
            // denser cards start clipping. Never scale below 1.
            textScaler: media.textScaler.clamp(
              minScaleFactor: 1,
              maxScaleFactor: 1.4,
            ),
          ),
          child: child!,
        );
      },
      home: const _Entry(),
    );
  }
}

/// Splash, then onboarding, then sign-in. The stage is held in memory only —
/// nothing persists it yet, so onboarding replays on every cold start.
enum _Stage { splash, onboarding, auth }

class _Entry extends StatefulWidget {
  const _Entry();

  @override
  State<_Entry> createState() => _EntryState();
}

class _EntryState extends State<_Entry> {
  _Stage _stage = _Stage.splash;

  @override
  Widget build(BuildContext context) {
    return switch (_stage) {
      _Stage.splash => SplashScreen(
        onDone: () => setState(() => _stage = _Stage.onboarding),
      ),
      _Stage.onboarding => OnboardingScreen(
        onDone: () => setState(() => _stage = _Stage.auth),
      ),
      _Stage.auth => const GetStartedScreen(),
    };
  }
}
