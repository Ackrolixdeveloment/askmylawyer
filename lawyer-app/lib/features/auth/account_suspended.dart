import 'package:flutter/material.dart';

import '../../core/app_navigator.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'get_started_screen.dart';

/// Only one notice at a time, however many calls fail together.
bool _showing = false;

/// Signs the lawyer out and explains why, wherever in the app they are. The
/// API client calls this the moment the backend reports a suspension — on a
/// login attempt, or on the first call after an admin suspends the account.
void installSuspensionHandler() {
  ApiClient.instance.onAccountSuspended = (message) async {
    if (_showing) return;
    final navigator = appNavigatorKey.currentState;
    if (navigator == null) return;

    _showing = true;

    // Back to sign-in first, so the notice sits over the right screen and
    // nothing behind it is still showing account data.
    navigator.pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const GetStartedScreen()),
      (_) => false,
    );

    await showDialog<void>(
      context: navigator.context,
      barrierDismissible: false,
      builder: (context) => _SuspendedDialog(message: message),
    );

    _showing = false;
  };
}

class _SuspendedDialog extends StatelessWidget {
  const _SuspendedDialog({required this.message});

  /// The backend's message, carrying the admin's reason when one was given.
  final String message;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      icon: Container(
        width: 46,
        height: 46,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.negative.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.block, size: 24, color: AppColors.negative),
      ),
      title: const Text(
        'Account suspended',
        style: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
        ),
      ),
      content: Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 13,
          height: 1.5,
          color: AppColors.inkMuted,
        ),
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        SizedBox(
          width: double.infinity,
          height: 46,
          child: FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ),
      ],
    );
  }
}
