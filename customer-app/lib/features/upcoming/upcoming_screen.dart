import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'call_invite_sheet.dart';
import 'upcoming_data.dart';

/// Consultations that are paid for and still to happen.
class UpcomingScreen extends StatefulWidget {
  const UpcomingScreen({super.key, this.consultations, this.now});

  /// Defaults to the sample list; pass an empty list for the first-run state.
  final List<UpcomingConsultation>? consultations;

  /// Fixes "now" for tests, so the join window does not drift.
  final DateTime? now;

  @override
  State<UpcomingScreen> createState() => _UpcomingScreenState();
}

class _UpcomingScreenState extends State<UpcomingScreen> {
  Timer? _ticker;
  late DateTime _now = widget.now ?? DateTime.now();
  late final List<UpcomingConsultation> _all =
      widget.consultations ?? upcomingSample(_now);

  /// Cards whose invite has already been shown, so the sheet does not
  /// reappear every time the clock ticks.
  final _invited = <String>{};

  @override
  void initState() {
    super.initState();

    // A fixed clock means a test or preview, where nothing should move.
    if (widget.now == null) {
      _ticker = Timer.periodic(const Duration(seconds: 20), (_) {
        if (mounted) setState(() => _now = DateTime.now());
      });
    }
    _offerJoinWhenDue();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  /// Ten minutes out, the client is prompted to join or decline.
  void _offerJoinWhenDue() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;

      for (final consultation in _all) {
        if (!consultation.isJoinable(_now)) continue;
        if (!_invited.add(consultation.id)) continue;

        await showCallInviteSheet(context, consultation: consultation);
        // One prompt at a time: the client deals with this call first.
        break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final sorted = [..._all]..sort((a, b) => a.startsAt.compareTo(b.startsAt));

    if (sorted.isEmpty) return const _EmptyState();

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 108),
      children: [
        const Text(
          'Upcoming',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'Your scheduled consultations',
          style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
        ),
        const SizedBox(height: 14),

        for (final consultation in sorted)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _ConsultationCard(
              consultation: consultation,
              now: _now,
              onJoin: () =>
                  showCallInviteSheet(context, consultation: consultation),
            ),
          ),
      ],
    );
  }
}

/// One booking, with the join action once its window opens.
class _ConsultationCard extends StatelessWidget {
  const _ConsultationCard({
    required this.consultation,
    required this.now,
    required this.onJoin,
  });

  final UpcomingConsultation consultation;
  final DateTime now;
  final VoidCallback onJoin;

  static const _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  String get _slotLabel {
    final at = consultation.startsAt;
    final hour12 = at.hour % 12 == 0 ? 12 : at.hour % 12;
    final minute = at.minute.toString().padLeft(2, '0');
    final meridiem = at.hour < 12 ? 'AM' : 'PM';

    return '${at.day} ${_months[at.month - 1]} . $hour12:$minute $meridiem';
  }

  @override
  Widget build(BuildContext context) {
    final joinable = consultation.isJoinable(now);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(13),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Avatar(initials: consultation.initials),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        consultation.lawyer,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        consultation.practice,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _ChannelBadge(label: consultation.channelLabel),
              ],
            ),
          ),

          const Divider(height: 1, color: AppColors.line),
          Padding(
            padding: const EdgeInsets.fromLTRB(13, 11, 13, 13),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.event_outlined,
                      size: 15,
                      color: AppColors.inkSubtle,
                    ),
                    const SizedBox(width: 7),
                    Expanded(
                      child: Text(
                        _slotLabel,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        consultation.countdownLabel(now),
                        textAlign: TextAlign.right,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: joinable
                              ? AppColors.positive
                              : AppColors.inkSubtle,
                        ),
                      ),
                    ),
                  ],
                ),

                // The button only appears once the call can actually be
                // joined; before that it would do nothing.
                if (joinable) ...[
                  const SizedBox(height: 11),
                  _JoinButton(
                    label: 'Join ${consultation.channelLabel} Call',
                    onTap: onJoin,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.initials});

  final String initials;

  @override
  Widget build(BuildContext context) {
    return MediaQuery.withNoTextScaling(
      child: Container(
        width: 42,
        height: 42,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          color: AppColors.ink,
          shape: BoxShape.circle,
        ),
        child: Text(
          initials,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class _ChannelBadge extends StatelessWidget {
  const _ChannelBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.brandSoft,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.brand,
        ),
      ),
    );
  }
}

class _JoinButton extends StatelessWidget {
  const _JoinButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(9),
      child: Container(
        height: 42,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(9),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_outlined, size: 17, color: Colors.white),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 14,
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

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.schedule_outlined,
              size: 34,
              color: AppColors.inkSubtle,
            ),
            const SizedBox(height: 12),
            const Text(
              'No upcoming consultations',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Book a consultation and it will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          ],
        ),
      ),
    );
  }
}
