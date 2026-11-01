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

/// A consultation that is still joinable, for the home screen's rejoin card.
///
/// Hanging up does not end a consultation: the time is paid for, so either
/// side can come back until it runs out. A dropped call looks the same.
class LiveConsultation {
  const LiveConsultation({
    required this.id,
    required this.planName,
    required this.planCode,
    required this.durationMinutes,
    required this.withName,
    required this.started,
    this.expiresAt,
  });

  factory LiveConsultation.fromJson(Map<String, dynamic> json) =>
      LiveConsultation(
        id: json['id'] as String,
        planName: json['planName'] as String,
        planCode: json['planCode'] as String? ?? 'video',
        durationMinutes: json['durationMinutes'] as int? ?? 15,
        withName: json['withName'] as String? ?? '',
        started: json['started'] as bool? ?? false,
        expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? '')
            ?.toLocal(),
      );

  final String id;
  final String planName;
  final String planCode;
  final int durationMinutes;

  /// Who is on the other end.
  final String withName;

  /// False before anyone has joined, which makes it "join" not "rejoin".
  final bool started;

  /// Null until the first person joins and the clock starts.
  final DateTime? expiresAt;

  /// Seconds of paid time left, never below zero.
  int get secondsLeft {
    final endsAt = expiresAt;
    if (endsAt == null) return durationMinutes * 60;

    final left = endsAt.difference(DateTime.now()).inSeconds;
    return left < 0 ? 0 : left;
  }

  bool get isOver => secondsLeft == 0 && expiresAt != null;
}

/// More minutes, asked for by the lawyer and waiting on the customer.
class PendingExtension {
  const PendingExtension({
    required this.id,
    required this.minutes,
    required this.amount,
    required this.promptEndsAt,
  });

  factory PendingExtension.fromJson(Map<String, dynamic> json) =>
      PendingExtension(
        id: json['id'] as String,
        minutes: json['minutes'] as int? ?? 5,
        amount: json['amount'] as int? ?? 0,
        promptEndsAt:
            DateTime.tryParse(json['promptEndsAt'] as String? ?? '')
                ?.toLocal() ??
            DateTime.now(),
      );

  final String id;
  final int minutes;

  /// Rupees, quoted at the moment of asking and held to.
  final int amount;

  /// When the question lapses. Silence is not consent.
  final DateTime promptEndsAt;

  int get secondsLeft {
    final left = promptEndsAt.difference(DateTime.now()).inSeconds;
    return left < 0 ? 0 : left;
  }
}

/// One line typed during a consultation.
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderRole,
    required this.body,
    required this.at,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
    id: json['id'] as String,
    senderRole: json['senderRole'] as String? ?? 'customer',
    body: json['body'] as String? ?? '',
    at:
        DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ??
        DateTime.now(),
  );

  final String id;

  /// "customer" or "lawyer" — which side of the thread it sits on.
  final String senderRole;
  final String body;
  final DateTime at;

  /// "2:30 PM".
  String get timeLabel {
    final hour = at.hour % 12 == 0 ? 12 : at.hour % 12;
    final minute = at.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${at.hour < 12 ? 'AM' : 'PM'}';
  }
}

/// Who is actually in the call right now.
///
/// A lawyer who went offline, closed the app or lost signal is simply
/// absent — there is no way to tell them apart, and no need to.
class CallAttendance {
  const CallAttendance({
    required this.lawyerPresent,
    required this.customerPresent,
    required this.talkedSeconds,
    required this.canEndAndRefund,
    required this.refundIfEndedNow,
    required this.extensionsAgreed,
    required this.extensionOwed,
    required this.canAskForMore,
    required this.messageCount,
    this.pendingExtension,
    this.expiresAt,
    this.ended = false,
  });

  factory CallAttendance.fromJson(Map<String, dynamic> json) => CallAttendance(
    expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? '')?.toLocal(),
    ended: json['ended'] as bool? ?? false,
    lawyerPresent: json['lawyerPresent'] as bool? ?? false,
    customerPresent: json['customerPresent'] as bool? ?? false,
    talkedSeconds: json['talkedSeconds'] as int? ?? 0,
    canEndAndRefund: json['canEndAndRefund'] as bool? ?? false,
    refundIfEndedNow: json['refundIfEndedNow'] as int? ?? 0,
    extensionsAgreed: json['extensionsAgreed'] as int? ?? 0,
    extensionOwed: json['extensionOwed'] as int? ?? 0,
    canAskForMore: json['canAskForMore'] as bool? ?? false,
    messageCount: json['messageCount'] as int? ?? 0,
    pendingExtension: json['pendingExtension'] == null
        ? null
        : PendingExtension.fromJson(
            json['pendingExtension'] as Map<String, dynamic>,
          ),
  );

  final DateTime? expiresAt;
  final bool ended;
  final bool lawyerPresent;
  final bool customerPresent;

  /// Seconds both sides were in the call together — what was delivered.
  final int talkedSeconds;

  /// The customer is alone and may walk away.
  final bool canEndAndRefund;

  /// Rupees back if they do. Zero when nothing was paid.
  final int refundIfEndedNow;

  /// How many extensions the customer has already agreed to, and what they
  /// owe for them — settled with the consultation report, not now.
  final int extensionsAgreed;
  final int extensionOwed;

  /// Whether the lawyer may ask for more time.
  final bool canAskForMore;

  /// How many lines are in the chat, so the button can badge without a
  /// call of its own.
  final int messageCount;

  /// The question in front of the customer right now.
  final PendingExtension? pendingExtension;
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
    this.expiresAt,
  });

  factory CallCredentials.fromJson(Map<String, dynamic> json) =>
      CallCredentials(
        appId: json['appId'] as String,
        channel: json['channel'] as String,
        uid: json['uid'] as int,
        token: json['token'] as String,
        planCode: json['planCode'] as String? ?? 'video',
        durationMinutes: json['durationMinutes'] as int? ?? 15,
        expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? '')
            ?.toLocal(),
      );

  final String appId;
  final String channel;
  final int uid;
  final String token;
  final String planCode;
  final int durationMinutes;

  /// When the paid time runs out. The backend decides it, so both sides
  /// count down to the same moment however late one of them joined.
  final DateTime? expiresAt;

  bool get isVideo => true;
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

  /// When the lawyer has a consultation running, the moment its paid time
  /// ends — otherwise null. Going offline does not end it, so the toggle
  /// needs to say so rather than let them think it did.
  Future<DateTime?> liveConsultationEndsAt() async {
    final data = await _api.get('/api/v1/lawyer/presence');
    return DateTime.tryParse(data['liveConsultationEndsAt'] as String? ?? '')
        ?.toLocal();
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

  /// The consultation that can still be joined, or null. Polled by the home
  /// screen so a rejoin card appears as soon as one exists.
  Future<LiveConsultation?> liveConsultation() async {
    final data = await _api.get('/api/v1/lawyer/consultations/live');
    final live = data['consultation'] as Map<String, dynamic>?;

    return live == null ? null : LiveConsultation.fromJson(live);
  }

  // ---- Chat ----

  /// The thread, oldest first. Pass the last id already shown and only
  /// newer lines come back, so an open panel can poll cheaply.
  Future<List<ChatMessage>> messages(String id, {String? after}) async {
    final data = await _api.get(
      '/api/v1/lawyer/consultations/$id/messages${after == null ? '' : '?after=$after'}',
    );

    return (data['data'] as List<dynamic>)
        .map((item) => ChatMessage.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<ChatMessage> sendMessage(String id, String body) async {
    final data = await _api.post(
      '/api/v1/lawyer/consultations/$id/messages',
      auth: true,
      body: {'body': body},
    );
    return ChatMessage.fromJson(data);
  }

  Future<CallCredentials> callCredentials(String consultationId) async {
    final data = await _api.post(
      '/api/v1/lawyer/consultations/$consultationId/call-token',
      auth: true,
    );
    return CallCredentials.fromJson(data);
  }

  /// Asks the client for more minutes. Nothing changes until they agree.
  Future<PendingExtension> requestExtension(String id) async {
    final data = await _api.post(
      '/api/v1/lawyer/consultations/$id/extend',
      auth: true,
    );
    return PendingExtension.fromJson(data);
  }

  /// Sent every few seconds while in the call. Keeps this side marked
  /// present, and reports who else is there.
  Future<CallAttendance> ping(String id) async {
    final data = await _api.post(
      '/api/v1/lawyer/consultations/$id/ping',
      auth: true,
    );
    return CallAttendance.fromJson(data);
  }

  Future<void> endConsultation(String consultationId) async {
    await _api.post(
      '/api/v1/lawyer/consultations/$consultationId/end',
      auth: true,
    );
  }
}
