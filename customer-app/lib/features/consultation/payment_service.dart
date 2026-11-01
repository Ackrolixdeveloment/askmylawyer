import 'dart:async';

import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../core/network/api_client.dart';
import 'consultation_repository.dart';

/// How a trip through the checkout sheet ended.
enum PaymentOutcome {
  /// The gateway confirmed it to our backend; the search has started.
  paid,

  /// The customer closed the sheet, or the payment was turned down.
  notPaid,

  /// We could not reach our own backend or the gateway.
  problem,
}

class PaymentResult {
  const PaymentResult(this.outcome, {this.consultation, this.message});

  final PaymentOutcome outcome;

  /// The consultation as the backend now sees it, when we managed to ask.
  final Consultation? consultation;

  /// What to tell the customer, when something went wrong.
  final String? message;

  bool get paid => outcome == PaymentOutcome.paid;
}

/// Opens Razorpay's checkout, then asks our backend what really happened.
///
/// The SDK's own callback is only a hint — it says the sheet closed, not that
/// money moved. Nothing is treated as paid until the backend has checked with
/// Razorpay, so a tampered app cannot talk its way into a free consultation.
class PaymentService {
  PaymentService._();

  static final instance = PaymentService._();

  final _consultations = ConsultationRepository.instance;
  final _gateway = Razorpay();

  /// Completed by the SDK callbacks; recreated for each attempt.
  Completer<void>? _sheet;

  /// Set up once, because the SDK holds its callbacks statically.
  bool _wired = false;

  Future<PaymentResult> payFor(Consultation consultation) async {
    _wire();

    final PaymentSession session;
    try {
      session = await _consultations.paymentSession(consultation.id);
    } on ApiException catch (error) {
      return PaymentResult(PaymentOutcome.problem, message: error.message);
    }

    // Nothing to pay: the backend settled it and the search has already
    // started, so there is no checkout sheet to open. Go straight to
    // asking the backend where things stand.
    final sessionId = session.sessionId;
    if (sessionId == null) return _confirm(consultation);

    final sheet = _sheet = Completer<void>();

    try {
      _gateway.open({
        'key': sessionId,
        'order_id': session.orderId,
        'amount': session.amount * 100,
        'currency': 'INR',
        'name': 'Ask My Lawyer',
        'description': 'Consultation',
        'theme': {'color': '#1B2A41'},
      });
    } catch (_) {
      _sheet = null;
      return const PaymentResult(
        PaymentOutcome.problem,
        message: 'The payment screen could not be opened.',
      );
    }

    // Waits for the sheet to close, whichever way it went.
    await sheet.future;
    _sheet = null;

    // The backend is the judge of this, not the sheet.
    try {
      return await _confirm(consultation);
    } on ApiException catch (error) {
      return PaymentResult(PaymentOutcome.problem, message: error.message);
    }
  }

  Future<bool> payExtension(String consultationId, String extensionId) async {
    _wire();
    final path =
        '/api/v1/customer/consultations/$consultationId/extension/$extensionId';
    final session = await ApiClient.instance.post(
      '$path/payment-session',
      auth: true,
    );
    final key = session['keyId'] as String?;
    if (key != null) {
      final sheet = _sheet = Completer<void>();
      try {
        _gateway.open({
          'key': key,
          'order_id': session['orderId'],
          'amount': (session['amount'] as int) * 100,
          'currency': 'INR',
          'name': 'Ask My Lawyer',
          'description': 'Consultation extension',
          'theme': {'color': '#1B2A41'},
        });
        await sheet.future;
      } finally {
        _sheet = null;
      }
    }
    final result = await ApiClient.instance.post(
      '$path/payment/verify',
      auth: true,
    );
    return result['added'] == true;
  }

  /// Asks the backend how the payment went. It is the judge of this, not
  /// the sheet — and when there was no sheet, it is the only judge.
  Future<PaymentResult> _confirm(Consultation consultation) async {
    try {
      final result = await _consultations.verifyPayment(consultation.id);
      if (result.consultation.status == 'cancelled' && result.paid) {
        return PaymentResult(
          PaymentOutcome.notPaid,
          consultation: result.consultation,
          message: 'This booking expired or was cancelled. Your payment is queued for refund.',
        );
      }
      return PaymentResult(
        result.paid ? PaymentOutcome.paid : PaymentOutcome.notPaid,
        consultation: result.consultation,
        message: result.paid ? null : result.failureReason,
      );
    } on ApiException catch (error) {
      return PaymentResult(PaymentOutcome.problem, message: error.message);
    }
  }

  void _wire() {
    if (_wired) return;
    _wired = true;

    // Both callbacks do the same thing: let go of the wait. What actually
    // happened is decided by the backend a moment later.
    _gateway.on(
      Razorpay.EVENT_PAYMENT_SUCCESS,
      (PaymentSuccessResponse _) => _finish(),
    );
    _gateway.on(
      Razorpay.EVENT_PAYMENT_ERROR,
      (PaymentFailureResponse _) => _finish(),
    );
    _gateway.on(
      Razorpay.EVENT_EXTERNAL_WALLET,
      (ExternalWalletResponse _) => _finish(),
    );
  }

  void _finish() {
    if (_sheet?.isCompleted == false) _sheet!.complete();
  }
}
