import '../consultation/case_details_screen.dart';

/// A consultation the client has paid for and is waiting on.
class UpcomingConsultation {
  const UpcomingConsultation({
    required this.id,
    required this.lawyer,
    required this.practice,
    required this.initials,
    required this.channel,
    required this.startsAt,
    required this.amount,
  });

  final String id;
  final String lawyer;
  final String practice;
  final String initials;
  final CallChannel channel;
  final DateTime startsAt;
  final double amount;

  String get channelLabel => switch (channel) {
    CallChannel.audio => 'Audio',
    CallChannel.video => 'Video',
    CallChannel.chat => 'Chat',
  };

  /// The call opens ten minutes ahead of the slot, which is also when the
  /// client is notified.
  static const joinWindow = Duration(minutes: 10);

  Duration timeUntil(DateTime now) => startsAt.difference(now);

  /// True once we are inside the join window and the slot has not passed.
  bool isJoinable(DateTime now) {
    final until = timeUntil(now);
    return until <= joinWindow && !until.isNegative;
  }

  /// "Starts in 8 min", "Starts now", or the wait in hours or days.
  String countdownLabel(DateTime now) {
    final until = timeUntil(now);
    if (until.isNegative) return 'Starting now';

    if (until.inMinutes < 1) return 'Starts in less than a minute';
    if (until.inMinutes < 60) return 'Starts in ${until.inMinutes} min';
    if (until.inHours < 24) return 'Starts in ${until.inHours} hr';
    return 'Starts in ${until.inDays} day${until.inDays == 1 ? '' : 's'}';
  }
}

/// Sample bookings, anchored to [now] so the join window can be seen without
/// waiting for a real slot to come round.
List<UpcomingConsultation> upcomingSample(DateTime now) => [
  UpcomingConsultation(
    id: 'AML-20841',
    lawyer: 'Adv. Rahul Sharma',
    practice: 'Family Law . Property Disputes',
    initials: 'RS',
    channel: CallChannel.video,
    // Inside the ten-minute window, so this one can be joined.
    startsAt: now.add(const Duration(minutes: 8)),
    amount: 399,
  ),
  UpcomingConsultation(
    id: 'AML-20855',
    lawyer: 'Adv. Priyanshu Sharma',
    practice: 'Criminal Law',
    initials: 'PS',
    channel: CallChannel.audio,
    startsAt: now.add(const Duration(hours: 3)),
    amount: 399,
  ),
  UpcomingConsultation(
    id: 'AML-20871',
    lawyer: 'Adv. Anjali Mehta',
    practice: 'Corporate & Business',
    initials: 'AM',
    channel: CallChannel.chat,
    startsAt: now.add(const Duration(days: 2)),
    amount: 599,
  ),
];
