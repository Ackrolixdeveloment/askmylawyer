import '../../core/network/api_client.dart';

/// The consultation report, as the lawyer sees it before sending.
class ConsultationReport {
  const ConsultationReport({
    required this.status,
    required this.caseSummary,
    required this.legalGuidance,
    required this.nextSteps,
    required this.canAskForLonger,
    required this.extensionMinutes,
    required this.clientName,
    required this.planName,
    this.problem,
    this.transcript,
    this.reviewEndsAt,
    this.earningNet,
    this.earningStatus,
  });

  factory ConsultationReport.fromJson(Map<String, dynamic> json) {
    final earning = json['earning'] as Map<String, dynamic>?;

    return ConsultationReport(
      status: json['status'] as String,
      caseSummary: json['caseSummary'] as String? ?? '',
      legalGuidance: json['legalGuidance'] as String? ?? '',
      nextSteps: json['nextSteps'] as String? ?? '',
      canAskForLonger: json['canAskForLonger'] as bool? ?? false,
      extensionMinutes: json['extensionMinutes'] as int? ?? 30,
      clientName: json['clientName'] as String? ?? 'Client',
      planName: json['planName'] as String? ?? '',
      problem: json['problem'] as String?,
      transcript: json['transcript'] as String?,
      reviewEndsAt: DateTime.tryParse(
        json['reviewEndsAt'] as String? ?? '',
      )?.toLocal(),
      earningNet: earning?['net'] as int?,
      earningStatus: earning?['status'] as String?,
    );
  }

  /// "generating", "awaiting_review", "failed" or "delivered".
  final String status;
  final String caseSummary;
  final String legalGuidance;
  final String nextSteps;

  /// Whether the lawyer may ask for longer, and how much longer they get.
  final bool canAskForLonger;
  final int extensionMinutes;

  final String clientName;
  final String planName;

  /// Why there is no draft, when there is none.
  final String? problem;

  /// What there is to work from — the chat typed during the call, and
  /// later the spoken transcript too.
  final String? transcript;

  /// The deadline. Past it the report still sends — the earnings wait.
  final DateTime? reviewEndsAt;

  /// What this consultation is worth, and whether it is theirs yet.
  final int? earningNet;
  final String? earningStatus;

  bool get isDrafting => status == 'generating';
  bool get isSent => status == 'delivered';

  /// True when there was no transcript and the lawyer starts from nothing.
  bool get writeFromScratch => status == 'failed';

  /// Seconds until the deadline, never below zero.
  int get secondsLeft {
    final endsAt = reviewEndsAt;
    if (endsAt == null) return 0;

    final left = endsAt.difference(DateTime.now()).inSeconds;
    return left < 0 ? 0 : left;
  }

  bool get overdue => reviewEndsAt != null && secondsLeft == 0;
}

/// Reading, editing and sending the consultation report.
class ReportRepository {
  ReportRepository._();

  static final instance = ReportRepository._();

  final _api = ApiClient.instance;

  /// Polled by the waiting screen until the draft is ready.
  Future<ConsultationReport> forConsultation(String consultationId) async {
    final data = await _api.get(
      '/api/v1/lawyer/consultations/$consultationId/report',
    );
    return ConsultationReport.fromJson(data);
  }

  /// Keeps the lawyer's edits without sending them.
  Future<ConsultationReport> save(
    String consultationId, {
    required String caseSummary,
    required String legalGuidance,
    required String nextSteps,
  }) async {
    final data = await _api.put(
      '/api/v1/lawyer/consultations/$consultationId/report',
      body: {
        'caseSummary': caseSummary,
        'legalGuidance': legalGuidance,
        'nextSteps': nextSteps,
      },
    );
    return ConsultationReport.fromJson(data);
  }

  /// Sends it to the client, and releases the lawyer's earnings.
  Future<ConsultationReport> submit(
    String consultationId, {
    required String caseSummary,
    required String legalGuidance,
    required String nextSteps,
  }) async {
    final data = await _api.post(
      '/api/v1/lawyer/consultations/$consultationId/report/submit',
      auth: true,
      body: {
        'caseSummary': caseSummary,
        'legalGuidance': legalGuidance,
        'nextSteps': nextSteps,
      },
    );
    return ConsultationReport.fromJson(data);
  }

  Future<ConsultationReport> askForLonger(String consultationId) async {
    final data = await _api.post(
      '/api/v1/lawyer/consultations/$consultationId/report/more-time',
      auth: true,
    );
    return ConsultationReport.fromJson(data);
  }
}
