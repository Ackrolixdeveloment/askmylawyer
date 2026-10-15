import '../../core/network/api_client.dart';

/// Whether an earning is the lawyer's to take yet.
enum PayoutState {
  /// Held back until the consultation report is sent.
  held,

  /// Theirs, waiting on a payout.
  available,

  /// Already paid out.
  paidOut,
}

/// What one consultation earned.
class Earning {
  const Earning({
    required this.id,
    required this.reference,
    required this.client,
    required this.planName,
    required this.durationMinutes,
    required this.net,
    required this.state,
    required this.at,
    this.category,
    this.heldReason,
  });

  factory Earning.fromJson(Map<String, dynamic> json) => Earning(
    id: json['id'] as String,
    reference: json['reference'] as String? ?? '',
    client: json['client'] as String? ?? 'Client',
    planName: json['planName'] as String? ?? '',
    durationMinutes: json['durationMinutes'] as int? ?? 0,
    net: json['net'] as int? ?? 0,
    state: switch (json['status'] as String? ?? 'held') {
      'available' => PayoutState.available,
      'paid_out' => PayoutState.paidOut,
      _ => PayoutState.held,
    },
    at: DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ??
        DateTime.now(),
    category: json['category'] as String?,
    heldReason: json['heldReason'] as String?,
  );

  final String id;

  /// "AML-000038", the consultation this came from.
  final String reference;
  final String client;
  final String planName;
  final int durationMinutes;

  /// What the lawyer keeps, after the platform's share.
  final int net;
  final PayoutState state;
  final DateTime at;
  final String? category;

  /// Why it is not theirs yet, in words they can act on.
  final String? heldReason;

  bool get isHeld => state == PayoutState.held;

  /// "12 Jun".
  String get dateLabel {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${at.day} ${months[at.month - 1]}';
  }

  /// "2:30 PM".
  String get timeLabel {
    final hour = at.hour % 12 == 0 ? 12 : at.hour % 12;
    final minute = at.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${at.hour < 12 ? 'AM' : 'PM'}';
  }
}

/// The commission screen's three figures, and the list beneath them.
class CommissionData {
  const CommissionData({
    required this.creditBalance,
    required this.underProcess,
    required this.underProcessCount,
    required this.thisMonth,
    required this.thisMonthSessions,
    required this.recent,
  });

  factory CommissionData.fromJson(Map<String, dynamic> json) => CommissionData(
    creditBalance: json['creditBalance'] as int? ?? 0,
    underProcess: json['underProcess'] as int? ?? 0,
    underProcessCount: json['underProcessCount'] as int? ?? 0,
    thisMonth: json['thisMonth'] as int? ?? 0,
    thisMonthSessions: json['thisMonthSessions'] as int? ?? 0,
    recent: (json['data'] as List<dynamic>? ?? const [])
        .map((item) => Earning.fromJson(item as Map<String, dynamic>))
        .toList(),
  );

  /// Theirs, waiting on a payout.
  final int creditBalance;

  /// Held back until the consultation reports are sent.
  final int underProcess;
  final int underProcessCount;

  final int thisMonth;
  final int thisMonthSessions;

  final List<Earning> recent;
}

/// One earning, broken down.
class EarningDetail {
  const EarningDetail({
    required this.earning,
    required this.gross,
    required this.commission,
    required this.commissionPercent,
    this.bankAccount,
    this.payoutReference,
    this.paidOutAt,
  });

  factory EarningDetail.fromJson(Map<String, dynamic> json) => EarningDetail(
    earning: Earning.fromJson(json),
    gross: json['gross'] as int? ?? 0,
    commission: json['commission'] as int? ?? 0,
    commissionPercent: json['commissionPercent'] as int? ?? 0,
    bankAccount: json['bankAccount'] as String?,
    payoutReference: json['payoutReference'] as String?,
    paidOutAt: DateTime.tryParse(
      json['paidOutAt'] as String? ?? '',
    )?.toLocal(),
  );

  final Earning earning;

  /// What the client paid.
  final int gross;

  /// The platform's share of it.
  final int commission;
  final int commissionPercent;

  /// Null until payouts are built.
  final String? bankAccount;
  final String? payoutReference;
  final DateTime? paidOutAt;
}

class EarningRepository {
  EarningRepository._();

  static final instance = EarningRepository._();

  final _api = ApiClient.instance;

  Future<CommissionData> summary() async {
    final data = await _api.get('/api/v1/lawyer/earnings');
    return CommissionData.fromJson(data);
  }

  Future<EarningDetail> detail(String id) async {
    final data = await _api.get('/api/v1/lawyer/earnings/$id');
    return EarningDetail.fromJson(data);
  }
}
