import '../../core/network/api_client.dart';

/// One reason-to-trust tile in the "Why Ask My Lawyer" grid.
class HomeFeature {
  const HomeFeature({required this.title, required this.body});

  final String title;
  final String body;
}

/// One of the last few consultations, as the Your Activity card shows it.
class RecentConsultation {
  const RecentConsultation({
    required this.id,
    required this.reference,
    required this.planName,
    required this.status,
    required this.amount,
    required this.at,
    this.lawyerName,
    this.reportStatus,
  });

  factory RecentConsultation.fromJson(Map<String, dynamic> json) =>
      RecentConsultation(
        id: json['id'] as String,
        reference: json['reference'] as String? ?? '',
        planName: json['planName'] as String? ?? 'Consultation',
        status: json['status'] as String? ?? '',
        amount: (json['amount'] as num?)?.toInt() ?? 0,
        at: DateTime.parse(json['at'] as String).toLocal(),
        lawyerName: json['lawyerName'] as String?,
        reportStatus: json['reportStatus'] as String?,
      );

  final String id;
  final String reference;
  final String planName;
  final String status;
  final int amount;
  final DateTime at;
  final String? lawyerName;
  final String? reportStatus;

  /// What the row says under the lawyer's name.
  String get statusLabel => switch (status) {
    'searching' => 'Finding a lawyer',
    'assigned' || 'active' => 'In progress',
    'completed' => reportStatus == 'delivered' ? 'Report ready' : 'Completed',
    'cancelled' => 'Cancelled',
    'no_lawyer' => 'No lawyer was available',
    _ => status,
  };
}

/// Everything the customer home tab renders.
class HomeData {
  const HomeData({
    this.greetingName,
    this.lawyersOnline = false,
    this.recent = const [],
  });

  factory HomeData.fromJson(Map<String, dynamic> json) => HomeData(
    greetingName: json['greetingName'] as String?,
    lawyersOnline: json['lawyersOnline'] as bool? ?? false,
    recent: ((json['recent'] as List<dynamic>?) ?? const [])
        .map((item) => RecentConsultation.fromJson(item as Map<String, dynamic>))
        .toList(),
  );

  /// Their first name, or null before the profile has one — the greeting
  /// falls back to "there" rather than inventing a name.
  final String? greetingName;

  /// Drives the "LAWYERS ONLINE" pill on the consult card.
  final bool lawyersOnline;

  /// The last three consultations, newest first.
  final List<RecentConsultation> recent;

  bool get hasConsultations => recent.isNotEmpty;
}

/// What the home tab shows before the first load returns.
const emptyHome = HomeData();

/// Fixed for now — these never vary per customer.
const homeFeatures = <HomeFeature>[
  HomeFeature(title: 'Verified Lawyers', body: 'Hand - picked legal experts'),
  HomeFeature(title: 'Secure Payment', body: 'Encrypted transactions.'),
  HomeFeature(title: 'Consultation Reports', body: 'Detailed case summaries.'),
  HomeFeature(title: 'Audio , Video & Chat', body: 'Talk your way'),
];

/// Reads the home summary: who they are, whether anyone is online, and the
/// last few consultations — one call, because this is the first screen after
/// sign-in.
class HomeRepository {
  HomeRepository._();

  static final instance = HomeRepository._();

  Future<HomeData> load() async {
    final data = await ApiClient.instance.get('/api/v1/customer/consultations/home');
    return HomeData.fromJson(data);
  }
}
