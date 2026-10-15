import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'call_screen.dart';
import 'consultation_repository.dart';

/// "Rejoin your consultation", on the home screen.
///
/// A consultation is not over when someone hangs up — the time is paid for,
/// so either side can come back until it runs out. This is the way back in,
/// whether the call was ended on purpose or the network dropped it. It hides
/// itself when there is nothing live.
class RejoinCard extends StatefulWidget {
  const RejoinCard({super.key});

  @override
  State<RejoinCard> createState() => _RejoinCardState();
}

class _RejoinCardState extends State<RejoinCard> with WidgetsBindingObserver {
  static const _pollEvery = Duration(seconds: 10);

  final _consultations = ConsultationRepository.instance;

  Timer? _poll;
  Timer? _clock;
  LiveConsultation? _live;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
    _poll = Timer.periodic(_pollEvery, (_) => _refresh());
    // Runs the visible countdown between polls.
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _live != null) setState(() {});
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _poll?.cancel();
    _clock?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Coming back to the app is exactly when someone wants this card.
    if (state == AppLifecycleState.resumed) _refresh();
  }

  Future<void> _refresh() async {
    try {
      final live = await _consultations.liveConsultation();
      if (mounted) setState(() => _live = live);
    } on ApiException {
      // Not worth a message on the home screen; the next poll will do.
    }
  }

  Future<void> _rejoin(LiveConsultation live) async {
    // Root navigator, so the call covers the tab bar.
    await Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute<void>(
        builder: (_) => CallScreen(
          consultationId: live.id,
          title: live.withName,
          planName: live.planName,
        ),
      ),
    );

    if (mounted) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final live = _live;
    if (live == null || live.isOver) return const SizedBox.shrink();

    final left = live.secondsLeft;
    final minutes = (left ~/ 60).toString().padLeft(2, '0');
    final seconds = (left % 60).toString().padLeft(2, '0');

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: Colors.white24,
                shape: BoxShape.circle,
              ),
              child: Icon(
                live.planCode == 'video' ? Icons.videocam : Icons.call,
                size: 20,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    live.started
                        ? 'Consultation in progress'
                        : 'Your client is waiting',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${live.withName} · $minutes:$seconds left',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFFB6C0D4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            FilledButton(
              onPressed: () => _rejoin(live),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.ink,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                textStyle: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: Text(live.started ? 'Rejoin' : 'Join'),
            ),
          ],
        ),
      ),
    );
  }
}
