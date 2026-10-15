import '../../core/network/api_client.dart';

/// A report the lawyer still owes, and what it is holding up.
class PendingReport {
  const PendingReport({
    required this.consultationId,
    required this.reference,
    required this.client,
    required this.consultedAt,
    required this.heldAmount,
    required this.overdue,
    this.reviewEndsAt,
  });

  factory PendingReport.fromJson(Map<String, dynamic> json) => PendingReport(
    consultationId: json['consultationId'] as String,
    reference: json['reference'] as String? ?? '',
    client: json['client'] as String? ?? 'Client',
    consultedAt:
        DateTime.tryParse(json['consultedAt'] as String? ?? '')?.toLocal() ??
        DateTime.now(),
    heldAmount: json['heldAmount'] as int? ?? 0,
    overdue: json['overdue'] as bool? ?? false,
    reviewEndsAt: DateTime.tryParse(
      json['reviewEndsAt'] as String? ?? '',
    )?.toLocal(),
  );

  final String consultationId;
  final String reference;
  final String client;
  final DateTime consultedAt;

  /// What this report is holding back, in rupees.
  final int heldAmount;

  /// Past the deadline. The report still sends; the money keeps waiting.
  final bool overdue;
  final DateTime? reviewEndsAt;

  /// "2 hours ago", "yesterday", "3 days ago".
  String get consultedAgo {
    final gap = DateTime.now().difference(consultedAt);

    if (gap.inMinutes < 60) return '${gap.inMinutes} min ago';
    if (gap.inHours < 24) {
      return '${gap.inHours} hour${gap.inHours == 1 ? '' : 's'} ago';
    }
    if (gap.inDays == 1) return 'yesterday';
    return '${gap.inDays} days ago';
  }
}

/// Something that happened, for the activity list.
class ActivityEntry {
  const ActivityEntry({
    required this.id,
    required this.kind,
    required this.title,
    required this.subtitle,
    required this.at,
  });

  factory ActivityEntry.fromJson(Map<String, dynamic> json) => ActivityEntry(
    id: json['id'] as String? ?? '',
    kind: json['kind'] as String? ?? 'consultation',
    title: json['title'] as String? ?? '',
    subtitle: json['subtitle'] as String? ?? '',
    at: DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ??
        DateTime.now(),
  );

  /// Stable across requests, so a page boundary cannot repeat an entry.
  final String id;

  /// "consultation", "report", "payment" or "approval".
  final String kind;
  final String title;
  final String subtitle;
  final DateTime at;

  String get timeAgo {
    final gap = DateTime.now().difference(at);

    if (gap.inMinutes < 1) return 'Just now';
    if (gap.inMinutes < 60) return '${gap.inMinutes} min ago';
    if (gap.inHours < 24) {
      return '${gap.inHours} hour${gap.inHours == 1 ? '' : 's'} ago';
    }
    if (gap.inDays == 1) return 'Yesterday';
    return '${gap.inDays} days ago';
  }
}

/// Everything the dashboard shows.
class HomeData {
  const HomeData({
    required this.greetingName,
    required this.weeklyEarnings,
    required this.earningsSeries,
    required this.pendingReports,
    required this.heldTotal,
    required this.activity,
    this.weeklyChangePercent,
  });

  factory HomeData.fromJson(Map<String, dynamic> json) => HomeData(
    greetingName: json['greetingName'] as String? ?? 'there',
    weeklyEarnings: json['weeklyEarnings'] as int? ?? 0,
    weeklyChangePercent: (json['weeklyChangePercent'] as num?)?.toDouble(),
    earningsSeries: (json['earningsSeries'] as List<dynamic>? ?? const [])
        .map((value) => (value as num).toDouble())
        .toList(),
    pendingReports: (json['pendingReports'] as List<dynamic>? ?? const [])
        .map((item) => PendingReport.fromJson(item as Map<String, dynamic>))
        .toList(),
    heldTotal: json['heldTotal'] as int? ?? 0,
    activity: (json['activity'] as List<dynamic>? ?? const [])
        .map((item) => ActivityEntry.fromJson(item as Map<String, dynamic>))
        .toList(),
  );

  final String greetingName;
  final int weeklyEarnings;

  /// Change against last week; null when there is nothing to compare.
  final double? weeklyChangePercent;

  /// One figure per day, six days ago first and today last.
  final List<double> earningsSeries;

  final List<PendingReport> pendingReports;

  /// What those reports are holding back altogether.
  final int heldTotal;

  final List<ActivityEntry> activity;

  /// A lawyer who has just been approved and done nothing yet.
  bool get isNew =>
      weeklyEarnings == 0 && pendingReports.isEmpty && activity.length <= 1;
}

/// One page of the activity list.
class ActivityPage {
  const ActivityPage({required this.entries, this.nextCursor});

  factory ActivityPage.fromJson(Map<String, dynamic> json) => ActivityPage(
    entries: (json['data'] as List<dynamic>? ?? const [])
        .map((item) => ActivityEntry.fromJson(item as Map<String, dynamic>))
        .toList(),
    nextCursor: json['nextCursor'] as String?,
  );

  final List<ActivityEntry> entries;

  /// Null when there is nothing older left to fetch.
  final String? nextCursor;

  bool get hasMore => nextCursor != null;
}

class HomeRepository {
  HomeRepository._();

  static final instance = HomeRepository._();

  final _api = ApiClient.instance;

  Future<HomeData> dashboard() async {
    final data = await _api.get('/api/v1/lawyer/home');
    return HomeData.fromJson(data);
  }

  /// A page of the full activity list. Pass the previous page's cursor to
  /// carry on from where it left off.
  Future<ActivityPage> activity({String? cursor, int limit = 10}) async {
    final query = <String>[
      'limit=$limit',
      if (cursor != null) 'cursor=${Uri.encodeQueryComponent(cursor)}',
    ].join('&');

    final data = await _api.get('/api/v1/lawyer/home/activity?$query');
    return ActivityPage.fromJson(data);
  }
}
