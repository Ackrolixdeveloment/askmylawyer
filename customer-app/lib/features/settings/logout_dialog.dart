import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'sheet_shell.dart';

/// Confirms signing out, showing which account is being left.
class LogoutDialog extends StatelessWidget {
  const LogoutDialog({
    super.key,
    this.name = 'Sanjana Singh',
    this.initials = 'SS',
    this.detail = 'singhsanjana21@gmail.com',
  });

  final String name;
  final String initials;
  final String detail;

  /// Returns true when the customer confirms. Callers clear the session.
  static Future<bool> show(BuildContext context) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      // The close button sits above the sheet, so it must not be clipped.
      clipBehavior: Clip.none,
      builder: (_) => const LogoutDialog(),
    );
    return confirmed ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return SheetShell(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Log out of your account?',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            "You'll need to sign in again with your mobile number and OTP "
            'to access your account.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              height: 1.5,
              color: AppColors.inkMuted,
            ),
          ),
          const SizedBox(height: 18),

          // Names the account being left, so there is no doubt.
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.line),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.canvas,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    initials,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        detail,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Log Out'),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () => Navigator.of(context).pop(false),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.ink,
                side: const BorderSide(color: AppColors.line),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text('Cancel'),
            ),
          ),
        ],
      ),
    );
  }
}
