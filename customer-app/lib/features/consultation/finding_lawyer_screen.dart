import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'consult_draft.dart';
import 'lawyer_ready_screen.dart';
import 'no_lawyers_screen.dart';

/// Searches for an available lawyer, counting down while it waits.
class FindingLawyerScreen extends StatefulWidget {
  const FindingLawyerScreen({
    super.key,
    required this.draft,
    this.searchSeconds = 45,
    this.outcome,
  });

  final ConsultDraft draft;

  /// How long to look before giving up.
  final int searchSeconds;

  /// Forces the result instead of waiting out the clock. Only for tests and
  /// previews — in the app the backend decides.
  final bool? outcome;

  @override
  State<FindingLawyerScreen> createState() => _FindingLawyerScreenState();
}

class _FindingLawyerScreenState extends State<FindingLawyerScreen> {
  Timer? _ticker;
  late int _remaining = widget.searchSeconds;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;

      setState(() => _remaining--);

      if (_remaining <= 0) {
        timer.cancel();
        _finish();
      }
    });
  }

  /// TODO: the backend decides this once matching is live. Until then the
  /// search always times out, unless a caller forces the outcome.
  void _finish() {
    final matched = widget.outcome ?? false;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => matched
            ? LawyerReadyScreen(draft: widget.draft)
            : NoLawyersScreen(
                draft: widget.draft,
                searchedSeconds: widget.searchSeconds,
              ),
      ),
    );
  }

  /// Backs out of the search, refunding what was paid.
  Future<void> _cancel() async {
    final confirmed = await showCancelRequestSheet(
      context,
      draft: widget.draft,
    );

    if (confirmed == true && mounted) {
      HomeScreen.openTab(context, 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
                children: [
                  const _SearchingAvatars(),
                  const SizedBox(height: 20),
                  const Text(
                    'Finding your lawyer',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Usually takes 20-45 seconds during business hours',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                  const SizedBox(height: 24),

                  Center(
                    child: _CountdownRing(
                      remaining: _remaining,
                      total: widget.searchSeconds,
                    ),
                  ),
                  const SizedBox(height: 24),

                  _RefundNotice(amount: widget.draft.price),
                ],
              ),
            ),

            TextButton.icon(
              onPressed: _cancel,
              icon: const Icon(Icons.cancel_outlined, size: 18),
              label: const Text(
                'Cancel Request',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              style: TextButton.styleFrom(foregroundColor: AppColors.negative),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

/// Three overlapping lawyer avatars, the middle one pulsing while we look.
class _SearchingAvatars extends StatelessWidget {
  const _SearchingAvatars();

  static const _people = [
    (initials: 'PS', color: Color(0xFF8B5CF6)),
    (initials: 'RK', color: AppColors.ink),
    (initials: 'AM', color: Color(0xFF22C55E)),
  ];

  @override
  Widget build(BuildContext context) {
    return MediaQuery.withNoTextScaling(
      child: SizedBox(
        height: 46,
        child: Stack(
          alignment: Alignment.center,
          children: [
            for (var i = 0; i < _people.length; i++)
              Transform.translate(
                // Overlap them slightly, centred on the middle avatar.
                offset: Offset((i - 1) * 30.0, 0),
                child: Container(
                  width: i == 1 ? 44 : 38,
                  height: i == 1 ? 44 : 38,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _people[i].color,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.canvas, width: 2),
                  ),
                  child: Text(
                    _people[i].initials,
                    style: TextStyle(
                      fontSize: i == 1 ? 14 : 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Ring that empties as the search runs out of time.
class _CountdownRing extends StatelessWidget {
  const _CountdownRing({required this.remaining, required this.total});

  final int remaining;
  final int total;

  @override
  Widget build(BuildContext context) {
    final seconds = remaining.clamp(0, total);

    return SizedBox(
      width: 132,
      height: 132,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox.expand(
            child: CircularProgressIndicator(
              value: total == 0 ? 0 : seconds / total,
              strokeWidth: 4,
              strokeCap: StrokeCap.round,
              backgroundColor: AppColors.line,
              valueColor: const AlwaysStoppedAnimation(AppColors.ink),
            ),
          ),
          // The ring is a fixed circle, so its label must not grow past it.
          MediaQuery.withNoTextScaling(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '00:${seconds.toString().padLeft(2, '0')}',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'seconds remaining',
                  style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Reassurance that the money comes back if nobody picks the case up.
class _RefundNotice extends StatelessWidget {
  const _RefundNotice({required this.amount});

  final double amount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.canvas,
              shape: BoxShape.circle,
            ),
            child: const Text(
              '!',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.inkMuted,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  const TextSpan(
                    text: 'If no lawyer accepts, ',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  TextSpan(
                    text:
                        "we'll refund ₹${amount.toStringAsFixed(0)} instantly "
                        'and help you schedule with a specialist for later.',
                  ),
                ],
              ),
              style: const TextStyle(
                fontSize: 12,
                height: 1.45,
                color: AppColors.inkSubtle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
