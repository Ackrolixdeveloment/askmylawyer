import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'call_screen.dart';
import 'consult_draft.dart';
import 'consultation_repository.dart';

/// A lawyer accepted: introduce them and get the client into the call.
class LawyerReadyScreen extends StatelessWidget {
  const LawyerReadyScreen({
    super.key,
    required this.draft,
    required this.consultation,
  });

  final ConsultDraft draft;

  /// The consultation, now with the lawyer who took it.
  final Consultation consultation;

  /// Two initials from the lawyer's name for the avatar.
  String get _initials {
    final parts = (consultation.lawyerName ?? '')
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();

    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  /// Opens the call, and comes back here when it ends.
  Future<void> _join(BuildContext context) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => CallScreen(
          consultationId: consultation.id,
          title: consultation.lawyerName ?? 'Your lawyer',
          planName: consultation.planName,
        ),
      ),
    );

    // The consultation is over once the call ends; there is nothing left on
    // this screen to come back to.
    if (context.mounted) HomeScreen.openTab(context, 0);
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
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
                children: [
                  const Center(child: _SuccessTick()),
                  const SizedBox(height: 16),
                  const Text(
                    'Your lawyer is ready',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 18),

                  _LawyerCard(
                    initials: _initials,
                    name: consultation.lawyerName ?? 'Your lawyer',
                    practice: consultation.lawyerHeadline?.isNotEmpty == true
                        ? consultation.lawyerHeadline!
                        : consultation.category ?? 'Legal advice',
                    plan:
                        '${consultation.planName} · '
                        '${consultation.durationMinutes} min',
                  ),
                  const SizedBox(height: 12),
                  const _BeforeYouJoin(),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: _JoinButton(
                channel: draft.channelLabel,
                onTap: () => _join(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Green circle with a tick, marking the match.
class _SuccessTick extends StatelessWidget {
  const _SuccessTick();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 62,
      height: 62,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: Color(0xFF4CAF7D),
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.check, size: 30, color: Colors.white),
    );
  }
}

/// Who the client has been matched with.
class _LawyerCard extends StatelessWidget {
  const _LawyerCard({
    required this.initials,
    required this.name,
    required this.practice,
    required this.plan,
  });

  final String initials;
  final String name;

  /// What they practise, as far as their profile says.
  final String practice;

  /// The plan and how long it runs for.
  final String plan;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Avatar(initials: initials),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _Pill(
                      label: 'ADVOCATE',
                      background: AppColors.canvas,
                      foreground: AppColors.inkMuted,
                      dense: true,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      practice,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Wraps, so the credentials never run off a narrow phone.
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              const _Pill(
                label: '✓ Verified',
                background: Color(0xFFE7F6EC),
                foreground: Color(0xFF1B8A4B),
              ),
              _Pill(
                label: '⌂ $plan',
                background: const Color(0xFFEAF1FE),
                foreground: AppColors.brand,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Initials badge with the verified check clipped to its corner.
class _Avatar extends StatelessWidget {
  const _Avatar({required this.initials});

  final String initials;

  @override
  Widget build(BuildContext context) {
    return MediaQuery.withNoTextScaling(
      child: SizedBox(
        width: 54,
        height: 54,
        child: Stack(
          children: [
            Container(
              width: 54,
              height: 54,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
              child: Text(
                initials,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
            Positioned(
              right: 0,
              bottom: 2,
              child: Container(
                width: 18,
                height: 18,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.brand,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.surface, width: 2),
                ),
                child: const Icon(Icons.check, size: 9, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Small rounded label.
class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.background,
    required this.foreground,
    this.dense = false,
  });

  final String label;
  final Color background;
  final Color foreground;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: dense ? 7 : 10,
        vertical: dense ? 3 : 6,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(dense ? 5 : 7),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: dense ? 10 : 12,
          fontWeight: FontWeight.w600,
          letterSpacing: dense ? 0.5 : 0,
          color: foreground,
        ),
      ),
    );
  }
}

/// Checklist to settle the client before the call starts.
class _BeforeYouJoin extends StatelessWidget {
  const _BeforeYouJoin();

  static const _steps = [
    (icon: Icons.description_outlined, text: 'Keep case documents ready.'),
    (icon: Icons.wifi, text: 'Find a quiet space with good internet.'),
    (
      icon: Icons.photo_camera_outlined,
      text: 'Allow camera & microphone access when prompted.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Before you join',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 10),
          for (final step in _steps)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(step.icon, size: 16, color: AppColors.inkSubtle),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      step.text,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.35,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _JoinButton extends StatelessWidget {
  const _JoinButton({required this.channel, required this.onTap});

  final String channel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 50,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_outlined, size: 19, color: Colors.white),
            const SizedBox(width: 9),
            // Shrinks rather than overflowing once the label grows.
            Flexible(
              child: Text(
                'Join $channel Call',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
