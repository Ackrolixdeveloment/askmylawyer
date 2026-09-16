import 'package:flutter/material.dart';

import '../../core/app_prefs.dart';
import '../../core/network/api_client.dart';
import '../../core/network/token_storage.dart';
import '../../core/theme/app_colors.dart';
import '../auth/auth_repository.dart';
import '../auth/post_login_route.dart';
import '../auth/get_started_screen.dart';
import '../onboarding/onboarding_screen.dart';

/// Brand screen shown while the app boots, then hands over to onboarding.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  /// The brand mark stays up at least this long, however fast the check is.
  static const _minimumWait = Duration(milliseconds: 1200);

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  /// A signed-in lawyer resumes wherever their application stands. Everyone
  /// else signs in, and only a brand new device sees the intro tour.
  Future<void> _bootstrap() async {
    final wait = Future<void>.delayed(_minimumWait);
    LawyerAccount? lawyer;

    if (await TokenStorage.instance.refreshToken != null) {
      try {
        lawyer = await AuthRepository.instance.me();
      } on ApiException {
        // Session gone or server unreachable — sign in again.
        lawyer = null;
      }
    }

    final seenTour = await AppPrefs.instance.hasSeenOnboarding;

    await wait;
    if (!mounted) return;

    if (lawyer != null) {
      openPostLoginScreen(context, lawyer);
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) =>
            seenTour ? const GetStartedScreen() : const OnboardingScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/logo.png',
              width: 96,
              filterQuality: FilterQuality.high,
            ),
            const SizedBox(height: 24),
            const Text(
              'LEGAL HELP, ON DEMAND',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 10),
            const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.verified_user_outlined,
                  size: 14,
                  color: AppColors.inkMuted,
                ),
                SizedBox(width: 6),
                Text(
                  'Bar Council verified advocates',
                  style: TextStyle(fontSize: 12, color: AppColors.inkMuted),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
