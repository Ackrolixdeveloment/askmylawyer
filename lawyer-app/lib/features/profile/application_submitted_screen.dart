import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Shown once the application is with the admin team, and again if it is
/// turned down — with the reason the admin gave.
class ApplicationSubmittedScreen extends StatelessWidget {
  const ApplicationSubmittedScreen({
    super.key,
    this.rejected = false,
    this.reason,
  });

  final bool rejected;

  /// The admin's reason, shown on a rejection.
  final String? reason;

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
                  decoration: BoxDecoration(
                    color: rejected
                        ? const Color(0xFFFDECEC)
                        : const Color(0xFFFDF3E3),
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Image.asset(
                    'assets/images/submit-logo.png',
                    filterQuality: FilterQuality.high,
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  rejected
                      ? 'Application Not Approved'
                      : 'Application Submitted!',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  rejected
                      ? reason ??
                            'Our team could not verify your details. Please '
                                'contact support for the next steps.'
                      : 'Your account is under review. Our team will verify '
                            'your details and notify you within 48 hours.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.5,
                    color: AppColors.inkMuted,
                  ),
                ),
                const SizedBox(height: 28),
                // Nothing to do here until an admin decides — the
                // dashboard stays out of reach until the account is approved.
                Text(
                  rejected
                      ? 'Please contact our support team if you need help.'
                      : "We'll notify you",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.inkMuted,
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
