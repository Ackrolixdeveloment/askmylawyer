import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';

/// The success tick, scaled in with a slight overshoot so the confirmation
/// lands rather than just appearing.
class _AnimatedTick extends StatefulWidget {
  const _AnimatedTick();

  @override
  State<_AnimatedTick> createState() => _AnimatedTickState();
}

class _AnimatedTickState extends State<_AnimatedTick>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 600),
  );

  late final Animation<double> _scale = CurvedAnimation(
    parent: _controller,
    curve: Curves.elasticOut,
  );

  @override
  void initState() {
    super.initState();
    // Held back until the page transition ends, otherwise the tick has
    // finished growing before the screen is even visible.
    Future<void>.delayed(const Duration(milliseconds: 250), () {
      if (!mounted) return;

      // Sound and buzz land with the tick, so the confirmation is felt as
      // well as seen.
      SystemSound.play(SystemSoundType.alert);
      HapticFeedback.mediumImpact();
      _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: Container(
        width: 64,
        height: 64,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          color: AppColors.positive,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check, size: 36, color: Colors.white),
      ),
    );
  }
}

/// Confirmation shown once a withdrawal request goes through.
class WithdrawSuccessScreen extends StatelessWidget {
  const WithdrawSuccessScreen({
    super.key,
    required this.amount,
    required this.bankName,
    required this.accountNumber,
    required this.reference,
  });

  final String amount;
  final String bankName;
  final String accountNumber;
  final String reference;

  @override
  Widget build(BuildContext context) {
    final rows = <(String, String)>[
      ('Bank Account Name', bankName),
      ('Bank Account No', accountNumber),
      ('Requested ID', reference),
      ('Status', 'Processing'),
    ];

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            // Fills the space above the buttons so the content can centre,
            // while a short screen can still scroll.
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - 24,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const _AnimatedTick(),
                        const SizedBox(height: 20),
                        const Text(
                          'Withdraw Amount',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          amount,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: AppColors.positive,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Your withdraw request has been submitted successfully.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.inkSubtle,
                          ),
                        ),
                        const SizedBox(height: 28),

                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.canvas,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Column(
                            children: [
                              for (final (label, value) in rows)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 10,
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          label,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: AppColors.inkSubtle,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        value,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.ink,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      // Back to the commission tab the request started from.
                      onPressed: () => Navigator.of(context).maybePop(),
                      child: const Text('Done'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // TODO: open the withdrawal history tab.
                  const Text(
                    'View Withdraw history',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.positive,
                      decoration: TextDecoration.underline,
                      decorationColor: AppColors.positive,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
