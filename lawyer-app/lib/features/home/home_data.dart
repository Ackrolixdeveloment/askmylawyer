// Placeholder dashboard data. Swap for the API once it exists — the widgets
// already handle empty lists, so the first-run state comes for free.

class UpcomingConsultation {
  const UpcomingConsultation({
    required this.name,
    required this.matter,
    required this.day,
    required this.time,
    required this.startsInMinutes,
    required this.isVideo,
  });

  final String name;
  final String matter;
  final String day;
  final String time;
  final int startsInMinutes;
  final bool isVideo;

  String get initials => name
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();
}

enum BookingState { confirmed, pending }

class ScheduleEntry {
  const ScheduleEntry({
    required this.name,
    required this.time,
    required this.slotMinutes,
    required this.state,
  });

  final String name;
  final String time;
  final int slotMinutes;
  final BookingState state;

  String get initials => name
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();
}

class AvailabilitySlot {
  const AvailabilitySlot({required this.from, required this.to});

  final String from;
  final String to;
}

class PendingReport {
  const PendingReport({required this.client, required this.consultedAgo});

  final String client;
  final String consultedAgo;
}

enum ActivityKind { booking, consultation, report, payment, approval }

class ActivityEntry {
  const ActivityEntry({
    required this.kind,
    required this.title,
    required this.subtitle,
    required this.timeAgo,
  });

  final ActivityKind kind;
  final String title;
  final String subtitle;
  final String timeAgo;
}

class HomeData {
  const HomeData({
    required this.greetingName,
    required this.isOnline,
    required this.weeklyEarnings,
    required this.weeklyChangePercent,
    required this.earningsSeries,
    required this.upcoming,
    required this.schedule,
    required this.availability,
    required this.pendingReports,
    required this.activity,
  });

  final String greetingName;
  final bool isOnline;
  final double weeklyEarnings;

  /// Change against last week; null when there is nothing to compare.
  final double? weeklyChangePercent;

  /// One value per day, Monday first.
  final List<double> earningsSeries;

  final UpcomingConsultation? upcoming;
  final List<ScheduleEntry> schedule;
  final List<AvailabilitySlot> availability;
  final List<PendingReport> pendingReports;
  final List<ActivityEntry> activity;
}

/// A lawyer who has just been approved — every section is still empty.
const emptyHome = HomeData(
  greetingName: 'Adv Sarah M.',
  isOnline: true,
  weeklyEarnings: 0,
  weeklyChangePercent: null,
  earningsSeries: [0, 0, 0, 0, 0, 0, 0],
  upcoming: null,
  schedule: [],
  availability: [],
  pendingReports: [],
  activity: [
    ActivityEntry(
      kind: ActivityKind.approval,
      title: 'Account Approved',
      subtitle:
          'Your profile has been verified. You are ready to receive '
          'consultation requests.',
      timeAgo: 'Just now',
    ),
  ],
);

/// A working week, used until the API is wired up.
const activeHome = HomeData(
  greetingName: 'Adv Sarah M.',
  isOnline: true,
  weeklyEarnings: 4020,
  weeklyChangePercent: 18.4,
  earningsSeries: [420, 780, 560, 900, 640, 480, 240],
  upcoming: UpcomingConsultation(
    name: 'Rahul Sharma',
    matter: 'Civil Law . Property Dispute',
    day: 'Today',
    time: '10:30 AM',
    startsInMinutes: 42,
    isVideo: true,
  ),
  schedule: [
    ScheduleEntry(
      name: 'Rahul Sharma',
      time: '10:30 AM',
      slotMinutes: 15,
      state: BookingState.confirmed,
    ),
    ScheduleEntry(
      name: 'Rahul Sharma',
      time: '10:30 AM',
      slotMinutes: 15,
      state: BookingState.pending,
    ),
    ScheduleEntry(
      name: 'Rahul Sharma',
      time: '10:30 AM',
      slotMinutes: 15,
      state: BookingState.confirmed,
    ),
  ],
  availability: [
    AvailabilitySlot(from: '09:00 AM', to: '01:00 PM'),
    AvailabilitySlot(from: '09:00 AM', to: '01:00 PM'),
  ],
  pendingReports: [
    PendingReport(client: 'Rahul Sharma', consultedAgo: '02:00 min ago'),
    PendingReport(client: 'Rahul Sharma', consultedAgo: '02:00 min ago'),
  ],
  activity: [
    ActivityEntry(
      kind: ActivityKind.booking,
      title: 'New booking',
      subtitle: 'Anita Desai . Family Law',
      timeAgo: '12m',
    ),
    ActivityEntry(
      kind: ActivityKind.consultation,
      title: 'Consultation completed',
      subtitle: 'Anita Desai . Family Law',
      timeAgo: '1h',
    ),
    ActivityEntry(
      kind: ActivityKind.report,
      title: 'Report submitted',
      subtitle: 'Case #AML-2418',
      timeAgo: '3h',
    ),
    ActivityEntry(
      kind: ActivityKind.payment,
      title: 'Payment credited',
      subtitle: '₹4,500 to HDFC ..4521',
      timeAgo: 'Yesterday',
    ),
  ],
);
