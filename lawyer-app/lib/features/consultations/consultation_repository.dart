import '../../core/network/api_client.dart';

/// A consultation request ringing on this lawyer's phone.
class ConsultationOffer {
  const ConsultationOffer({
    required this.id,
    required this.requestId,
    required this.planName,
    required this.planCode,
    required this.amount,
    required this.durationMinutes,
    required this.customerName,
    required this.expiresAt,
    required this.live,
    this.category,
    this.description,
  });

  factory ConsultationOffer.fromJson(Map<String, dynamic> json) {
    final request = json['request'] as Map<String, dynamic>;

    return ConsultationOffer(
      id: json['id'] as String,
      requestId: request['id'] as String,
      planName: request['planName'] as String,
      planCode: request['planCode'] as String,
      amount: request['amount'] as int,
      durationMinutes: request['durationMinutes'] as int,
      customerName: request['customerName'] as String? ?? 'Customer',
      category: request['category'] as String?,
      description: request['description'] as String?,
      expiresAt:
          DateTime.tryParse(json['expiresAt'] as String? ?? '')?.toLocal() ??
          DateTime.now(),
      live: json['live'] as bool? ?? false,
    );
  }

  final String id;
  final String requestId;
  final String planName;

  /// "audio", "video" or "chat".
  final String planCode;
  final int amount;
  final int durationMinutes;
  final String customerName;
  final String? category;
  final String? description;

  /// When the ring gives up.
  final DateTime expiresAt;

  /// False once it has been taken, declined or run out.
  final bool live;

  /// Seconds left on the countdown, never below zero.
  int get secondsLeft {
    final left = expiresAt.difference(DateTime.now()).inSeconds;
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

/// Being available, answering offers, and joining the call.
class ConsultationRepository {
  ConsultationRepository._();

  static final instance = ConsultationRepository._();

  final _api = ApiClient.instance;

  // ---- Availability ----

  /// Tells the backend the lawyer is here, and where. Returns how long to
  /// wait before the next check-in.
  Future<int> heartbeat({
    required bool isOnline,
    double? latitude,
    double? longitude,
    double? accuracy,
  }) async {
    final body = <String, dynamic>{'isOnline': isOnline};
    if (latitude != null) body['latitude'] = latitude;
    if (longitude != null) body['longitude'] = longitude;
    if (accuracy != null) body['accuracy'] = accuracy;

    final data = await _api.post(
      '/api/v1/lawyer/presence/heartbeat',
      auth: true,
      body: body,
    );

    return data['heartbeatSeconds'] as int? ?? 45;
  }

  Future<bool> isOnline() async {
    final data = await _api.get('/api/v1/lawyer/presence');
    return data['isOnline'] as bool? ?? false;
  }

  Future<void> goOffline() async {
    await _api.post('/api/v1/lawyer/presence/offline', auth: true);
  }

  // ---- Offers ----

  /// Anything still ringing — used when the app reopens, and as a safety net
  /// if a push never arrived.
  Future<List<ConsultationOffer>> pendingOffers() async {
    final data = await _api.get('/api/v1/lawyer/offers');

    return (data['data'] as List<dynamic>)
        .map((item) => ConsultationOffer.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<ConsultationOffer> offer(String offerId) async {
    final data = await _api.get('/api/v1/lawyer/offers/$offerId');
    return ConsultationOffer.fromJson(data);
  }

  /// Returns the consultation id once it is theirs.
  Future<String> accept(String offerId) async {
    final data = await _api.post(
      '/api/v1/lawyer/offers/$offerId/accept',
      auth: true,
    );
    return data['requestId'] as String;
  }

  Future<void> decline(String offerId) async {
    await _api.post('/api/v1/lawyer/offers/$offerId/decline', auth: true);
  }

  // ---- The call ----

  Future<CallCredentials> callCredentials(String consultationId) async {
    final data = await _api.post(
      '/api/v1/lawyer/consultations/$consultationId/call-token',
      auth: true,
    );
    return CallCredentials.fromJson(data);
  }

  Future<void> endConsultation(String consultationId) async {
    await _api.post(
      '/api/v1/lawyer/consultations/$consultationId/end',
      auth: true,
    );
  }
}
