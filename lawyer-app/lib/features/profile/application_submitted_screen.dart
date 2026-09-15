import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';

/// Shown once the application is with the admin team for review.
class ApplicationSubmittedScreen extends StatelessWidget {
  const ApplicationSubmittedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFDF3E3),
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Image.asset(
                    'assets/images/submit-logo.png',
                    filterQuality: FilterQuality.high,
                  ),
                ),
                const SizedBox(height: 28),
                const Text(
                  'Application Submitted!',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Your account is under review. Our team will verify your '
                  'details and notify you within 48 hours.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.5,
                    color: AppColors.inkMuted,
                  ),
                ),
                const SizedBox(height: 28),
                // Not an action to take — just reassurance, so it reads as
                // text rather than a button.
                InkWell(
                  // TODO: enable push notifications here too, and switch to
                  // the empty dashboard for a freshly approved lawyer.
                  onTap: () => Navigator.of(context).pushReplacement(
                    MaterialPageRoute<void>(builder: (_) => const HomeScreen()),
                  ),
                  child: const Text(
                    "We'll notify you",
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.inkMuted,
                      decoration: TextDecoration.underline,
                      decorationColor: AppColors.inkMuted,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
