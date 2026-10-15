import '../../core/network/api_client.dart';

/// The consultation report, as the client sees it.
///
/// Nothing to read until the lawyer has checked and sent it — and, when
/// extra call time was charged for, until that is settled.
class CustomerReport {
  const CustomerReport({
    required this.status,
    required this.lawyerName,
    required this.owed,
    required this.profileComplete,
    required this.missingDetails,
    this.message,
    this.submittedAt,
    this.caseSummary,
    this.legalGuidance,
    this.nextSteps,
  });

  factory CustomerReport.fromJson(Map<String, dynamic> json) {
    final report = json['report'] as Map<String, dynamic>?;

    return CustomerReport(
      status: json['status'] as String,
      lawyerName: json['lawyerName'] as String? ?? 'Your lawyer',
      owed: json['owed'] as int? ?? 0,
      profileComplete: json['profileComplete'] as bool? ?? true,
      missingDetails: ((json['missingDetails'] as List<dynamic>?) ?? const [])
          .map((value) => value as String)
          .toList(),
      message: json['message'] as String?,
      submittedAt: DateTime.tryParse(
        json['submittedAt'] as String? ?? '',
      )?.toLocal(),
      caseSummary: report?['caseSummary'] as String?,
      legalGuidance: report?['legalGuidance'] as String?,
      nextSteps: report?['nextSteps'] as String?,
    );
  }

  final String status;
  final String lawyerName;

  /// Rupees still owed for extra call time. Zero means nothing to pay.
  final int owed;

  /// The report carries the client's name and goes to them as a legal
  /// document, so it waits until they have told us who they are.
  final bool profileComplete;

  /// What is still missing, in words — "your full name", "a mobile number".
  final List<String> missingDetails;

  /// Plain words while it is not ready yet.
  final String? message;
  final DateTime? submittedAt;

  final String? caseSummary;
  final String? legalGuidance;
  final String? nextSteps;

  /// The lawyer has sent it, but there is a bill in the way.
  bool get needsPayment => status == 'delivered' && owed > 0;

  /// Written and paid for, but waiting on the client's own details.
  bool get needsDetails =>
      status == 'delivered' && owed == 0 && !profileComplete;

  bool get isReady => caseSummary != null;
}

class ReportRepository {
  ReportRepository._();

  static final instance = ReportRepository._();

  final _api = ApiClient.instance;

  Future<CustomerReport> forConsultation(String consultationId) async {
    final data = await _api.get(
      '/api/v1/customer/consultations/$consultationId/report',
    );
    return CustomerReport.fromJson(data);
  }
}
