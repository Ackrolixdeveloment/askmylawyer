import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// What the admin asked the lawyer to fix on this step, shown above the form.
class CorrectionNotice extends StatelessWidget {
  const CorrectionNotice({super.key, required this.notes});

  /// Section name to remark, for this step only.
  final Map<String, String> notes;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        border: Border.all(color: const Color(0xFFFECACA)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.error_outline, size: 18, color: AppColors.negative),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Please update the details below',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.negative,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...notes.entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '${entry.key}: ',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    TextSpan(text: entry.value),
                  ],
                ),
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  color: AppColors.ink,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
