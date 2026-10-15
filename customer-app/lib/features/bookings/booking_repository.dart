import '../../core/network/api_client.dart';

/// How a consultation was held.
enum CallMode { audio, video, chat }

/// One of the customer's past consultations.
class Booking {
  const Booking({
    required this.id,
    required this.reference,
    required this.mode,
    required this.planName,
    required this.durationMinutes,
    required this.amount,
    required this.status,
    required this.at,
    this.lawyer,
    this.category,
    this.reportStatus,
  });

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
    id: json['id'] as String,
    reference: json['reference'] as String? ?? '',
    mode: switch (json['planCode'] as String? ?? 'video') {
      'audio' => CallMode.audio,
      'chat' => CallMode.chat,
      _ => CallMode.video,
    },
    planName: json['planName'] as String? ?? '',
    durationMinutes: json['durationMinutes'] as int? ?? 0,
    amount: json['amount'] as int? ?? 0,
    status: json['status'] as String? ?? '',
    at: DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ??
        DateTime.now(),
    lawyer: json['lawyerName'] as String?,
    category: json['category'] as String?,
    reportStatus: json['reportStatus'] as String?,
  );

  final String id;

  /// "AML-000038", quoted to support.
  final String reference;
  final CallMode mode;
  final String planName;
  final int durationMinutes;
  final int amount;

  /// The backend's own word: completed, cancelled, refunded, no_lawyer…
  final String status;
  final DateTime at;

  /// Null when nobody ever took it.
  final String? lawyer;
  final String? category;

  /// Null when there is no report for this consultation.
  final String? reportStatus;

  bool get reportReady => reportStatus == 'delivered';

  /// True while the lawyer still has it.
  bool get reportPending => reportStatus != null && !reportReady;

  String get modeLabel => switch (mode) {
    CallMode.audio => 'Audio',
    CallMode.video => 'Video',
    CallMode.chat => 'Chat',
  };

  /// Words a customer understands, rather than the backend's own.
  String get statusLabel => switch (status) {
    'completed' => 'Completed',
    'cancelled' => 'Cancelled',
    'refunded' => 'Refunded',
    'no_lawyer' => 'No lawyer found',
    'searching' || 'pending_payment' => 'In progress',
    'assigned' || 'active' => 'In progress',
    _ => status,
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

/// One consultation in full, for the detail screen.
class BookingDetail {
  const BookingDetail({
    required this.id,
    required this.reference,
    required this.planName,
    required this.totalMinutes,
    required this.status,
    required this.at,
    required this.paid,
    required this.owedForExtraTime,
    this.lawyer,
    this.category,
    this.description,
    this.reportStatus,
  });

  factory BookingDetail.fromJson(Map<String, dynamic> json) {
    final lawyer = json['lawyer'] as Map<String, dynamic>?;
    final report = json['report'] as Map<String, dynamic>?;
    final payment = json['payment'] as Map<String, dynamic>?;

    return BookingDetail(
      id: json['id'] as String,
      reference: json['reference'] as String? ?? '',
      planName: json['planName'] as String? ?? '',
      totalMinutes:
          json['totalMinutes'] as int? ?? json['durationMinutes'] as int? ?? 0,
      status: json['status'] as String? ?? '',
      at: DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
          DateTime.now(),
      paid: payment?['paid'] as int? ?? 0,
      owedForExtraTime: payment?['owedForExtraTime'] as int? ?? 0,
      lawyer: lawyer?['name'] as String?,
      category: json['category'] as String?,
      description: json['description'] as String?,
      reportStatus: report?['status'] as String?,
    );
  }

  final String id;
  final String reference;
  final String planName;

  /// The paid minutes, plus any added mid-call.
  final int totalMinutes;
  final String status;
  final DateTime at;

  /// What was charged for the consultation itself.
  final int paid;

  /// Still owed for extra call time, settled with the report.
  final int owedForExtraTime;

  final String? lawyer;
  final String? category;

  /// What the customer wrote when booking.
  final String? description;

  final String? reportStatus;

  bool get hasReport => reportStatus != null;
  bool get reportReady => reportStatus == 'delivered';

  String get dateLabel {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${at.day} ${months[at.month - 1]} ${at.year}';
  }
}

/// The customer's booking history.
class BookingRepository {
  BookingRepository._();

  static final instance = BookingRepository._();

  final _api = ApiClient.instance;

  Future<List<Booking>> history() async {
    final data = await _api.get('/api/v1/customer/consultations');

    return (data['data'] as List<dynamic>)
        .map((item) => Booking.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<BookingDetail> detail(String id) async {
    final data = await _api.get('/api/v1/customer/consultations/$id');
    return BookingDetail.fromJson(data);
  }
}
