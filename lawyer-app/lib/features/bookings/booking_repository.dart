import '../../core/network/api_client.dart';

/// How a consultation was held.
enum CallMode { audio, video, chat }

/// One row of the lawyer's call history.
///
/// Covers both what they took and what they turned down: a declined offer
/// is the only trace that the consultation was ever put to them.
class Booking {
  const Booking({
    required this.id,
    required this.reference,
    required this.client,
    required this.mode,
    required this.durationMinutes,
    required this.at,
    required this.accepted,
    this.caseTag,
    this.reportStatus,
  });

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
    id: json['id'] as String,
    reference: json['reference'] as String? ?? '',
    client: json['clientName'] as String? ?? 'Client',
    mode: switch (json['planCode'] as String? ?? 'video') {
      'audio' => CallMode.audio,
      'chat' => CallMode.chat,
      _ => CallMode.video,
    },
    durationMinutes: json['durationMinutes'] as int? ?? 0,
    at: DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ??
        DateTime.now(),
    accepted: json['accepted'] as bool? ?? true,
    caseTag: json['category'] as String?,
    reportStatus: json['reportStatus'] as String?,
  );

  final String id;

  /// "AML-000123", quoted by the client and by support.
  final String reference;
  final String client;
  final CallMode mode;
  final int durationMinutes;
  final DateTime at;

  /// False when the lawyer declined the call.
  final bool accepted;

  /// What the client said it was about.
  final String? caseTag;

  /// Null when there is no report — a declined call, or one nobody joined.
  final String? reportStatus;

  /// True while the report is still the lawyer's to send.
  bool get reportOutstanding =>
      reportStatus != null && reportStatus != 'delivered';

  String get initials => client
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();

  String get modeLabel => switch (mode) {
    CallMode.audio => 'Audio',
    CallMode.video => 'Video',
    CallMode.chat => 'Chat',
  };

  /// "12 Jun 2026".
  String get dateLabel {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${at.day} ${months[at.month - 1]} ${at.year}';
  }

  /// "2:30 PM".
  String get timeLabel {
    final hour = at.hour % 12 == 0 ? 12 : at.hour % 12;
    final minute = at.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${at.hour < 12 ? 'AM' : 'PM'}';
  }
}

/// The three figures above the list.
class BookingStats {
  const BookingStats({
    required this.accepted,
    required this.declined,
    required this.thisMonth,
  });

  factory BookingStats.fromJson(Map<String, dynamic> json) => BookingStats(
    accepted: json['accepted'] as int? ?? 0,
    declined: json['declined'] as int? ?? 0,
    thisMonth: json['thisMonth'] as int? ?? 0,
  );

  final int accepted;
  final int declined;

  /// Released earnings this month. Money still held is not theirs yet.
  final int thisMonth;
}

class BookingData {
  const BookingData({required this.stats, required this.calls});

  final BookingStats stats;
  final List<Booking> calls;
}

/// One consultation in full, for the detail screen.
class BookingDetail {
  const BookingDetail({
    required this.id,
    required this.reference,
    required this.client,
    required this.planName,
    required this.durationMinutes,
    required this.at,
    required this.status,
    this.caseTag,
    this.description,
    this.reportStatus,
    this.reportSummary,
    this.reportSubmittedAt,
    this.earningNet,
    this.earningStatus,
    this.earningHeldReason,
  });

  factory BookingDetail.fromJson(Map<String, dynamic> json) {
    final report = json['report'] as Map<String, dynamic>?;
    final earning = json['earning'] as Map<String, dynamic>?;

    return BookingDetail(
      id: json['id'] as String,
      reference: json['reference'] as String? ?? '',
      client: json['clientName'] as String? ?? 'Client',
      planName: json['planName'] as String? ?? '',
      durationMinutes: json['durationMinutes'] as int? ?? 0,
      at: DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ??
          DateTime.now(),
      status: json['status'] as String? ?? '',
      caseTag: json['category'] as String?,
      description: json['description'] as String?,
      reportStatus: report?['status'] as String?,
      reportSummary: report?['summary'] as String?,
      reportSubmittedAt: DateTime.tryParse(
        report?['submittedAt'] as String? ?? '',
      )?.toLocal(),
      earningNet: earning?['net'] as int?,
      earningStatus: earning?['status'] as String?,
      earningHeldReason: earning?['heldReason'] as String?,
    );
  }

  final String id;
  final String reference;
  final String client;
  final String planName;

  /// The paid minutes, plus anything the client agreed to add.
  final int durationMinutes;
  final DateTime at;
  final String status;

  final String? caseTag;

  /// What the client wrote when booking.
  final String? description;

  final String? reportStatus;
  final String? reportSummary;
  final DateTime? reportSubmittedAt;

  final int? earningNet;
  final String? earningStatus;
  final String? earningHeldReason;

  bool get hasReport => reportStatus != null;
  bool get reportSent => reportStatus == 'delivered';

  String get dateLabel {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${at.day} ${months[at.month - 1]} ${at.year}';
  }
}

/// The lawyer's call history.
class BookingRepository {
  BookingRepository._();

  static final instance = BookingRepository._();

  final _api = ApiClient.instance;

  Future<BookingData> history() async {
    final data = await _api.get('/api/v1/lawyer/consultations');

    return BookingData(
      stats: BookingStats.fromJson(
        data['stats'] as Map<String, dynamic>? ?? const {},
      ),
      calls: (data['data'] as List<dynamic>)
          .map((item) => Booking.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<BookingDetail> detail(String id) async {
    final data = await _api.get('/api/v1/lawyer/consultations/$id');
    return BookingDetail.fromJson(data);
  }
}
