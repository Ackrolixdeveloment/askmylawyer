import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Dark card carrying the flow's title and its step counter. Shared by both
/// steps so the banner stays identical as the client moves through.
class ConsultationHeader extends StatelessWidget {
  const ConsultationHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.step,
    required this.ofSteps,
    this.onBack,
  });

  final String title;
  final String subtitle;
  final int step;
  final int ofSteps;

  /// Shown to the left of the title when given — steps past the first can go
  /// back, the first one has nowhere to return to inside the flow.
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      // Inset card rather than a full-bleed banner, so the canvas shows
      // above and beside it.
      child: Container(
        margin: const EdgeInsets.fromLTRB(10, 6, 10, 0),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
          child: Row(
            children: [
              if (onBack != null) ...[
                InkWell(
                  onTap: onBack,
                  borderRadius: BorderRadius.circular(8),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(
                      Icons.arrow_back,
                      size: 20,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFFB6C0D4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _StepPill(step: step, ofSteps: ofSteps),
            ],
          ),
        ),
      ),
    );
  }
}

/// Circular "1 of 2" progress marker.
class _StepPill extends StatelessWidget {
  const _StepPill({required this.step, required this.ofSteps});

  final int step;
  final int ofSteps;

  @override
  Widget build(BuildContext context) {
    // Never scales with the reader's text setting: the circle is fixed, and
    // a larger label would clip rather than grow it.
    return MediaQuery.withNoTextScaling(
      child: SizedBox(
        width: 42,
        height: 42,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Track plus an arc showing how far through the flow we are.
            SizedBox.expand(
              child: CircularProgressIndicator(
                value: step / ofSteps,
                strokeWidth: 2,
                backgroundColor: Colors.white24,
                valueColor: const AlwaysStoppedAnimation(Colors.white),
              ),
            ),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$step',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  TextSpan(
                    text: ' of $ofSteps',
                    style: const TextStyle(color: Color(0xFF8E9BB3)),
                  ),
                ],
              ),
              style: const TextStyle(fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }
}
