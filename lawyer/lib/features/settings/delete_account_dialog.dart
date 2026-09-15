import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'sheet_shell.dart';

/// Confirms permanent deletion. Typing the word guards against a stray tap on
/// something that cannot be undone.
class DeleteAccountDialog extends StatefulWidget {
  const DeleteAccountDialog({super.key});

  static const _phrase = 'DELETE';

  /// Returns true when the lawyer confirms.
  static Future<bool> show(BuildContext context) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      // The close button sits above the sheet, so it must not be clipped.
      clipBehavior: Clip.none,
      // The typed confirmation needs room above the keyboard.
      isScrollControlled: true,
      builder: (_) => const DeleteAccountDialog(),
    );
    return confirmed ?? false;
  }

  @override
  State<DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<DeleteAccountDialog> {
  final _input = TextEditingController();

  @override
  void initState() {
    super.initState();
    _input.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  bool get _canDelete => _input.text.trim() == DeleteAccountDialog._phrase;

  @override
  Widget build(BuildContext context) {
    return SheetShell(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Delete your account?',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 10),

          // The irreversible part is the bit that must be read.
          const Text.rich(
            TextSpan(
              style: TextStyle(
                fontSize: 13,
                height: 1.5,
                color: AppColors.inkMuted,
              ),
              children: [
                TextSpan(text: 'This is '),
                TextSpan(
                  text: 'permanent and cannot be undone',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.negative,
                  ),
                ),
                TextSpan(
                  text: '. Please review what happens before you continue.',
                ),
              ],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          const Text.rich(
            TextSpan(
              style: TextStyle(fontSize: 13, color: AppColors.inkMuted),
              children: [
                TextSpan(text: 'Type '),
                TextSpan(
                  text: DeleteAccountDialog._phrase,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                TextSpan(text: ' to confirm'),
              ],
            ),
          ),
          const SizedBox(height: 10),

          TextField(
            controller: _input,
            textAlign: TextAlign.center,
            textCapitalization: TextCapitalization.characters,
            autocorrect: false,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
            decoration: InputDecoration(
              hintText: DeleteAccountDialog._phrase,
              hintStyle: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.inkSubtle,
              ),
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.line),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.negative),
              ),
            ),
          ),
          const SizedBox(height: 14),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              onPressed: _canDelete
                  ? () => Navigator.of(context).pop(true)
                  : null,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.negative,
                disabledBackgroundColor: AppColors.negative.withValues(
                  alpha: 0.45,
                ),
                disabledForegroundColor: Colors.white,
              ),
              child: const Text('Permanently Delete Account'),
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
