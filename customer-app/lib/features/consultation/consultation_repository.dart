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

  /// Waiting on the customer to pay before anyone is rung.
  bool get needsPayment => status == 'pending_payment';

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

/// What the app needs to open the gateway's checkout sheet.
///
/// The keys stay on the backend; this session id is good for one order.
class PaymentSession {
  const PaymentSession({
    required this.orderId,
    required this.sessionId,
    required this.amount,
    required this.environment,
  });

  factory PaymentSession.fromJson(Map<String, dynamic> json) => PaymentSession(
    orderId: json['orderId'] as String,
    sessionId: json['sessionId'] as String,
    amount: json['amount'] as int,
    environment: json['environment'] as String? ?? 'sandbox',
  );

  final String orderId;
  final String sessionId;

  /// What will be charged, all in.
  final int amount;

  /// "sandbox" or "production" — the checkout sheet needs to know which.
  final String environment;

  bool get isProduction => environment == 'production';
}

/// What our backend says after checking the payment with the gateway.
class PaymentResultData {
  const PaymentResultData({
    required this.paid,
    required this.consultation,
    this.failureReason,
  });

  factory PaymentResultData.fromJson(Map<String, dynamic> json) {
    final payment = json['payment'] as Map<String, dynamic>?;

    return PaymentResultData(
      paid: json['paid'] as bool? ?? false,
      consultation: Consultation.fromJson(
        json['consultation'] as Map<String, dynamic>,
      ),
      failureReason: payment?['failureReason'] as String?,
    );
  }

  final bool paid;

  /// Already searching, if the money landed.
  final Consultation consultation;
  final String? failureReason;
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
        expiresAt: DateTime.tryParse(
          json['expiresAt'] as String? ?? '',
        )?.toLocal(),
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
            DateTime.tryParse(json['promptEndsAt'] as String? ?? '')?.toLocal() ??
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
    at: DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ??
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
  });

  factory CallAttendance.fromJson(Map<String, dynamic> json) => CallAttendance(
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

  factory CallCredentials.fromJson(Map<String, dynamic> json) => CallCredentials(
    appId: json['appId'] as String,
    channel: json['channel'] as String,
    uid: json['uid'] as int,
    token: json['token'] as String,
    planCode: json['planCode'] as String? ?? 'video',
    durationMinutes: json['durationMinutes'] as int? ?? 15,
    expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? '')?.toLocal(),
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
    /// Left out normally: the backend books whichever consultation is on
    /// sale, so the app does not have to know its code.
    String? planCode,
    String? category,
    String? description,
    double? latitude,
    double? longitude,
  }) async {
    final data = await _api.post(
      '/api/v1/customer/consultations',
      auth: true,
      body: {
        'planCode': ?planCode,
        'category': ?category,
        if (description != null && description.trim().isNotEmpty)
          'description': description.trim(),
        'latitude': ?latitude,
        'longitude': ?longitude,
      },
    );

    return Consultation.fromJson(data);
  }

  // ---- Paying ----

  /// Opens the order at the gateway. Asking twice returns the same order.
  Future<PaymentSession> paymentSession(String id) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/payment-session',
      auth: true,
    );
    return PaymentSession.fromJson(data);
  }

  /// Asks the backend to check with the gateway. This — not the checkout
  /// sheet — is what decides whether the consultation has been paid for.
  Future<PaymentResultData> verifyPayment(String id) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/payment/verify',
      auth: true,
    );
    return PaymentResultData.fromJson(data);
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

  /// The consultation that can still be joined, or null. Polled by the home
  /// screen so a rejoin card appears as soon as one exists.
  Future<LiveConsultation?> liveConsultation() async {
    final data = await _api.get('/api/v1/customer/consultations/live');
    final live = data['consultation'] as Map<String, dynamic>?;

    return live == null ? null : LiveConsultation.fromJson(live);
  }

  // ---- Chat ----

  /// The thread, oldest first. Pass the last id already shown and only
  /// newer lines come back, so an open panel can poll cheaply.
  Future<List<ChatMessage>> messages(String id, {String? after}) async {
    final data = await _api.get(
      '/api/v1/customer/consultations/$id/messages${after == null ? '' : '?after=$after'}',
    );

    return (data['data'] as List<dynamic>)
        .map((item) => ChatMessage.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<ChatMessage> sendMessage(String id, String body) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/messages',
      auth: true,
      body: {'body': body},
    );
    return ChatMessage.fromJson(data);
  }

  Future<CallCredentials> callCredentials(String id) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/call-token',
      auth: true,
    );
    return CallCredentials.fromJson(data);
  }

  /// Sent every few seconds while in the call. Keeps this side marked
  /// present, and reports who else is there.
  Future<CallAttendance> ping(String id) async {
    final data = await _api.post('/api/v1/customer/consultations/$id/ping', auth: true);
    return CallAttendance.fromJson(data);
  }

  /// Yes or no to more minutes. Agreeing moves the clock at once; the
  /// charge waits for the consultation report.
  Future<void> answerExtension(
    String id,
    String extensionId, {
    required bool accept,
  }) async {
    await _api.post(
      '/api/v1/customer/consultations/$id/extension/$extensionId/'
      '${accept ? 'accept' : 'decline'}',
      auth: true,
    );
  }

  /// The lawyer never came back. Closes the consultation and puts the
  /// unused time back on the card.
  Future<({int refundAmount, String reason})> endAbandoned(String id) async {
    final data = await _api.post(
      '/api/v1/customer/consultations/$id/end-abandoned',
      auth: true,
    );

    return (
      refundAmount: data['refundAmount'] as int? ?? 0,
      reason: data['reason'] as String? ?? '',
    );
  }

  Future<void> endConsultation(String id) async {
    await _api.post('/api/v1/customer/consultations/$id/end', auth: true);
  }
}
