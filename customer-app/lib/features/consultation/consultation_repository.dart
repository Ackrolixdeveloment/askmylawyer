import '../../core/network/api_client.dart';

/// One of the plans the admin team has put on sale.
class ServicePlan {
  const ServicePlan({
    required this.code,
    required this.type,
    required this.amount,
    required this.gst,
    required this.payable,
    required this.durationMinutes,
  });

  factory ServicePlan.fromJson(Map<String, dynamic> json) => ServicePlan(
    code: json['code'] as String,
    type: json['type'] as String,
    amount: json['amount'] as int,
    gst: json['gst'] as int? ?? 0,
    payable: json['payable'] as int? ?? json['amount'] as int,
    durationMinutes: json['durationMinutes'] as int? ?? 15,
  );

  /// "audio", "video" or "chat".
  final String code;

  /// The label the admin team gave it, e.g. "Video Call".
  final String type;

  /// Before tax, in rupees.
  final int amount;
  final int gst;

  /// What the customer actually pays.
  final int payable;
  final int durationMinutes;
}

/// A consultation as the customer's screens see it.
class Consultation {
  const Consultation({
    required this.id,
    required this.planCode,
    required this.planName,
    required this.amount,
    required this.durationMinutes,
    required this.status,
    required this.canCancel,
    this.category,
    this.searchEndsAt,
    this.lawyerName,
    this.lawyerHeadline,
    this.lawyersNotified,
    this.sessionReady = false,
  });

  factory Consultation.fromJson(Map<String, dynamic> json) {
    final lawyer = json['lawyer'] as Map<String, dynamic>?;
    final session = json['session'] as Map<String, dynamic>?;

    return Consultation(
      id: json['id'] as String,
      planCode: json['planCode'] as String,
      planName: json['planName'] as String,
      amount: json['amount'] as int,
      durationMinutes: json['durationMinutes'] as int? ?? 15,
      status: json['status'] as String,
      canCancel: json['canCancel'] as bool? ?? true,
      category: json['category'] as String?,
      searchEndsAt: DateTime.tryParse(
        json['searchEndsAt'] as String? ?? '',
      )?.toLocal(),
      lawyerName: lawyer?['name'] as String?,
      lawyerHeadline: lawyer?['headline'] as String?,
      lawyersNotified: json['lawyersNotified'] as int?,
      sessionReady: session != null && session['endedAt'] == null,
    );
  }

  final String id;
  final String planCode;
  final String planName;
  final int amount;
  final int durationMinutes;

  /// "pending_payment", "searching", "assigned", "active", "no_lawyer",
  /// "completed", "cancelled" or "refunded".
  final String status;
  final bool canCancel;
  final String? category;

  /// When the search gives up. Null until the search starts.
  final DateTime? searchEndsAt;
  final String? lawyerName;
  final String? lawyerHeadline;

  /// How many lawyers have been rung, when the admin panel allows showing it.
  final int? lawyersNotified;
  final bool sessionReady;

  bool get isSearching => status == 'searching' || status == 'pending_payment';

  /// A lawyer has taken it and the call can be joined.
  bool get isMatched => status == 'assigned' || status == 'active';

  /// The search ran out with nobody available.
  bool get noLawyerFound => status == 'no_lawyer';

  /// Seconds until the search gives up, never below zero.
  int get secondsLeft {
    final endsAt = searchEndsAt;
    if (endsAt == null) return 0;

    final left = endsAt.difference(DateTime.now()).inSeconds;
    return left < 0 ? 0 : left;
  }
}

/// What both sides need to join the Agora channel.
class CallCredentials {
  const CallCredentials({
    required this.appId,
    required this.channel,
    required this.uid,
    required this.token,
    required this.planCode,
    required this.durationMinutes,
  });

  factory CallCredentials.fromJson(Map<String, dynamic> json) => CallCredentials(
    appId: json['appId'] as String,
    channel: json['channel'] as String,
    uid: json['uid'] as int,
    token: json['token'] as String,
    planCode: json['planCode'] as String? ?? 'video',
    durationMinutes: json['durationMinutes'] as int? ?? 15,
  );

  final String appId;
  final String channel;
  final int uid;
  final String token;
  final String planCode;
  final int durationMinutes;

  bool get isVideo => planCode == 'video';
}

/// Asking for a consultation, following the search, and joining the call.
class ConsultationRepository {
  ConsultationRepository._();

  static final instance = ConsultationRepository._();

  final _api = ApiClient.instance;

  /// Cached for the session: the price list rarely changes while the app is
  /// open, and the booking flow reads it on more than one screen.
  List<ServicePlan>? _plans;

  Future<List<ServicePlan>> plans({bool refresh = false}) async {
    if (_plans != null && !refresh) return _plans!;

    final data = await _api.get('/api/v1/plans', auth: false);
    return _plans = (data['data'] as List<dynamic>)
        .map((item) => ServicePlan.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// The plan for a consultation channel, or null if it is not on sale.
  Future<ServicePlan?> plan(String code) async {
    for (final plan in await plans()) {
      if (plan.code == code) return plan;
    }
    return null;
  }

  Future<Consultation> create({
    required String planCode,
    String? category,
    String? description,
    double? latitude,
    double? longitude,
  }) async {
    final data = await _api.post(
      '/api/v1/customer/consultations',
      auth: true,
      body: {
        'planCode': planCode,
        'category': ?category,
        if (description != null && description.trim().isNotEmpty)
          'description': description.trim(),
        'latitude': ?latitude,
        'longitude': ?longitude,
      },
    );

    return Consultation.fromJson(data);
  }

  /// What the waiting screen polls.
  Future<Consultation> detail(String id) async {
    final data = await _api.get('/api/v1/customer/consultations/$id');
    return Consultation.fromJson(data);
  }

  Future<Consultation> cancel(String id) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/cancel',
      auth: true,
    );
    return Consultation.fromJson(data);
  }

  /// Nobody accepted: take the money back, or search again.
  Future<Consultation> resolve(String id, {required String choice}) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/resolve',
      auth: true,
      body: {'choice': choice},
    );
    return Consultation.fromJson(data);
  }

  Future<CallCredentials> callCredentials(String id) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/call-token',
      auth: true,
    );
    return CallCredentials.fromJson(data);
  }

  Future<void> endConsultation(String id) async {
    await _api.post('/api/v1/customer/consultations/$id/end', auth: true);
  }
}
