import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Bottom-sheet chrome shared by the account dialogs: a rounded panel with a
/// close button floating just above it.
class SheetShell extends StatelessWidget {
  const SheetShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 16, bottom: 10),
          child: InkWell(
            onTap: () => Navigator.of(context).pop(false),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 18, color: AppColors.ink),
            ),
          ),
        ),

        Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
              child: child,
            ),
          ),
        ),
      ],
    );
  }
}
