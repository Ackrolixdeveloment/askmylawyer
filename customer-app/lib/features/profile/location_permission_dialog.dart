import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// iOS-style permission prompt shown before we try to fill City / State from
/// the device's location.
///
/// Returns true when the customer allows it.
Future<bool> showLocationPermissionDialog(BuildContext context) async {
  final allowed = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => const _LocationPermissionDialog(),
  );
  return allowed ?? false;
}

class _LocationPermissionDialog extends StatelessWidget {
  const _LocationPermissionDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.surface,
      insetPadding: const EdgeInsets.symmetric(horizontal: 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
            child: Column(
              children: [
                const Text(
                  'Allow "Ask My Lawyer" to use your location?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Your location will be used to match you with lawyers '
                  'licensed in your area.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.45,
                    color: AppColors.inkMuted,
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: AppColors.line),

          // Two equal actions split by a hairline, as in the mockup.
          IntrinsicHeight(
            child: Row(
              children: [
                Expanded(
                  child: _DialogAction(
                    label: "Don't Allow",
                    onPressed: () => Navigator.of(context).pop(false),
                  ),
                ),
                const VerticalDivider(width: 1, color: AppColors.line),
                Expanded(
                  child: _DialogAction(
                    label: 'Allow',
                    onPressed: () => Navigator.of(context).pop(true),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DialogAction extends StatelessWidget {
  const _DialogAction({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor: AppColors.ink,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: const RoundedRectangleBorder(),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    );
  }
}
