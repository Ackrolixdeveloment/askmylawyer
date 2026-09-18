import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Brand screen shown while the app boots, then hands over to onboarding.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.onDone});

  final VoidCallback onDone;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // TODO: replace the delay with the real session / bootstrap check.
    _timer = Timer(const Duration(seconds: 2), () {
      if (mounted) widget.onDone();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
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
