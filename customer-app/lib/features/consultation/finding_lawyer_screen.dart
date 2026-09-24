import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'consult_draft.dart';
import 'consultation_repository.dart';
import 'lawyer_ready_screen.dart';
import 'no_lawyers_screen.dart';

/// Waits while the backend rings lawyers, counting down as it goes.
///
/// The clock belongs to the backend — `searchEndsAt` on the consultation —
/// so a phone that sleeps or loses the network still shows the real time
/// left when it comes back.
class FindingLawyerScreen extends StatefulWidget {
  const FindingLawyerScreen({
    super.key,
    required this.draft,
    required this.consultation,
  });

  final ConsultDraft draft;

  /// The consultation as it was created, already searching.
  final Consultation consultation;

  @override
  State<FindingLawyerScreen> createState() => _FindingLawyerScreenState();
}

class _FindingLawyerScreenState extends State<FindingLawyerScreen> {
  static const _pollEvery = Duration(seconds: 2);

  final _consultations = ConsultationRepository.instance;

  Timer? _ticker;
  Timer? _poll;
  late Consultation _consultation = widget.consultation;

  /// The whole window, so the ring empties in proportion.
  late int _total = _consultation.secondsLeft;
  late int _remaining = _consultation.secondsLeft;

  bool _leaving = false;
  String? _problem;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    _poll = Timer.periodic(_pollEvery, (_) => _refresh());
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _poll?.cancel();
    super.dispose();
  }

  /// Runs the visible clock down between polls, so it never looks stuck.
  void _tick() {
    if (!mounted) return;
    setState(() => _remaining = _consultation.secondsLeft);
  }

  Future<void> _refresh() async {
    if (_leaving) return;

    try {
      final consultation = await _consultations.detail(_consultation.id);
      if (!mounted || _leaving) return;

      setState(() {
        _consultation = consultation;
        _remaining = consultation.secondsLeft;
        // The search window only grows when a retry restarts it.
        if (_remaining > _total) _total = _remaining;
        _problem = null;
      });

      _handle(consultation);
    } on ApiException catch (error) {
      // A dropped poll is not worth ending the search over; say so quietly
      // and try again on the next tick.
      if (mounted) setState(() => _problem = error.message);
    }
  }

  /// Moves on as soon as the backend has an answer.
  void _handle(Consultation consultation) {
    if (consultation.isMatched) {
      _leave(
        LawyerReadyScreen(draft: widget.draft, consultation: consultation),
      );
      return;
    }

    if (consultation.noLawyerFound) {
      _leave(
        NoLawyersScreen(draft: widget.draft, consultation: consultation),
      );
      return;
    }

    // Cancelled from somewhere else, or refunded: back to the home shell.
    if (!consultation.isSearching) {
      _leaving = true;
      HomeScreen.openTab(context, 0);
    }
  }

  void _leave(Widget screen) {
    _leaving = true;
    _ticker?.cancel();
    _poll?.cancel();

    Navigator.of(
      context,
    ).pushReplacement(MaterialPageRoute<void>(builder: (_) => screen));
  }

  /// Backs out of the search, refunding what was paid.
  Future<void> _cancel() async {
    final confirmed = await showCancelRequestSheet(
      context,
      draft: widget.draft,
    );
    if (confirmed != true || !mounted) return;

    try {
      await _consultations.cancel(_consultation.id);
    } on ApiException catch (error) {
      // Most likely a lawyer accepted while the sheet was open; the next
      // poll will move on to them.
      if (mounted) setState(() => _problem = error.message);
      return;
    }

    if (mounted) {
      _leaving = true;
      HomeScreen.openTab(context, 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final notified = _consultation.lawyersNotified;

    return PopScope(
      // Leaving by the back gesture would abandon a paid search without
      // cancelling it; the button below does it properly.
      canPop: false,
      child: Scaffold(
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
                    Text(
                      notified == null || notified == 0
                          ? 'Usually takes 20-45 seconds during business hours'
                          : '$notified ${notified == 1 ? 'lawyer has' : 'lawyers have'} '
                                'been notified',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                    const SizedBox(height: 24),

                    Center(
                      child: _CountdownRing(
                        remaining: _remaining,
                        total: _total,
                      ),
                    ),
                    const SizedBox(height: 24),

                    _RefundNotice(amount: widget.draft.price),

                    if (_problem != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _problem!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              if (_consultation.canCancel)
                TextButton.icon(
                  onPressed: _cancel,
                  icon: const Icon(Icons.cancel_outlined, size: 18),
                  label: const Text(
                    'Cancel Request',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.negative,
                  ),
                ),
              const SizedBox(height: 8),
            ],
          ),
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
    final seconds = remaining.clamp(0, total == 0 ? remaining : total);

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
                  '${(seconds ~/ 60).toString().padLeft(2, '0')}:'
                  '${(seconds % 60).toString().padLeft(2, '0')}',
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
