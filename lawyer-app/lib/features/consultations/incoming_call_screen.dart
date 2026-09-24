import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'call_screen.dart';
import 'consultation_repository.dart';

/// The full-screen ring: a consultation is waiting to be answered.
///
/// It counts down on its own and closes when the window passes, so a phone
/// left on a table never rings for a consultation somebody else has taken.
class IncomingCallScreen extends StatefulWidget {
  const IncomingCallScreen({super.key, required this.offer});

  final ConsultationOffer offer;

  @override
  State<IncomingCallScreen> createState() => _IncomingCallScreenState();
}

class _IncomingCallScreenState extends State<IncomingCallScreen> {
  final _consultations = ConsultationRepository.instance;

  late int _secondsLeft = widget.offer.secondsLeft;
  Timer? _countdown;
  Timer? _watch;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();

    _countdown = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _secondsLeft = widget.offer.secondsLeft);
      if (_secondsLeft == 0) _close();
    });

    // Someone else may take it first; the server is the one that knows.
    _watch = Timer.periodic(const Duration(seconds: 3), (_) => _checkStillLive());
  }

  @override
  void dispose() {
    _countdown?.cancel();
    _watch?.cancel();
    super.dispose();
  }

  Future<void> _checkStillLive() async {
    try {
      final latest = await _consultations.offer(widget.offer.id);
      if (!latest.live && mounted) _close(taken: true);
    } on ApiException {
      // Offline for a moment; the countdown still protects us.
    }
  }

  void _close({bool taken = false}) {
    _countdown?.cancel();
    _watch?.cancel();
    if (!mounted) return;

    Navigator.of(context).pop();
    if (taken) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This consultation was just taken')),
      );
    }
  }

  Future<void> _accept() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final consultationId = await _consultations.accept(widget.offer.id);
      if (!mounted) return;

      _countdown?.cancel();
      _watch?.cancel();
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => CallScreen(
            consultationId: consultationId,
            title: widget.offer.customerName,
            planName: widget.offer.planName,
          ),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      // Usually "just taken" — say so and get out of the way.
      setState(() {
        _busy = false;
        _error = error.message;
      });
      Future<void>.delayed(const Duration(seconds: 2), _close);
    }
  }

  Future<void> _decline() async {
    setState(() => _busy = true);

    try {
      await _consultations.decline(widget.offer.id);
    } on ApiException {
      // It has gone anyway.
    }
    _close();
  }

  @override
  Widget build(BuildContext context) {
    final offer = widget.offer;

    return PopScope(
      // Answer it one way or the other; do not swipe it away.
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.ink,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  'Incoming ${offer.planName}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.4,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 28),

                CircleAvatar(
                  radius: 44,
                  backgroundColor: Colors.white24,
                  child: Text(
                    offer.customerName.isNotEmpty
                        ? offer.customerName[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                Text(
                  offer.customerName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '₹${offer.amount} · ${offer.durationMinutes} min',
                  style: const TextStyle(fontSize: 14, color: Colors.white70),
                ),

                if (offer.category != null) ...[
                  const SizedBox(height: 18),
                  _Chip(text: offer.category!),
                ],

                if (offer.description != null) ...[
                  const SizedBox(height: 14),
                  Text(
                    offer.description!,
                    textAlign: TextAlign.center,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: Colors.white70,
                    ),
                  ),
                ],

                const Spacer(),

                Text(
                  '$_secondsLeft s',
                  style: const TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'to answer',
                  style: TextStyle(fontSize: 12, color: Colors.white54),
                ),

                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: Colors.white),
                  ),
                ],

                const SizedBox(height: 28),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _Action(
                      icon: Icons.call_end,
                      label: 'Reject',
                      colour: AppColors.negative,
                      onTap: _busy ? null : _decline,
                    ),
                    _Action(
                      icon: Icons.call,
                      label: 'Accept',
                      colour: AppColors.positive,
                      onTap: _busy ? null : _accept,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white12,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 12, color: Colors.white),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({
    required this.icon,
    required this.label,
    required this.colour,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color colour;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: onTap == null ? colour.withValues(alpha: 0.4) : colour,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 28, color: Colors.white),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.white70),
        ),
      ],
    );
  }
}
