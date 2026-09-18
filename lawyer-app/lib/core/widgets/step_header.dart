import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Onboarding runs over five steps: the four registration forms, then the
/// professional profile.
const totalOnboardingSteps = 5;

/// The dark banner every onboarding step wears: what this step is, what comes
/// next, and how far through the flow the lawyer is.
class StepHeader extends StatelessWidget {
  const StepHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.step,
    required this.total,
  });

  final String title;

  /// Usually `Next - <step name>`, or "Last step" at the end.
  final String subtitle;

  final int step;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 8),
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: const BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(18)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFFB6C0D4),
                  ),
                ),
              ],
            ),
          ),
          _StepProgressRing(step: step, total: total),
        ],
      ),
    );
  }
}

/// Step counter drawn as a ring that fills as the lawyer moves through the
/// form, so progress is readable at a glance.
class _StepProgressRing extends StatelessWidget {
  const _StepProgressRing({required this.step, required this.total});

  final int step;
  final int total;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      height: 48,
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: step / total),
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOut,
            builder: (context, value, _) => SizedBox.expand(
              child: CircularProgressIndicator(
                value: value,
                strokeWidth: 3,
                strokeCap: StrokeCap.round,
                backgroundColor: Colors.white.withValues(alpha: 0.28),
                valueColor: const AlwaysStoppedAnimation(Colors.white),
              ),
            ),
          ),
          Text(
            '$step of $total',
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
