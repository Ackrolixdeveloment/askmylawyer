import 'dart:async';

import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfwebcheckoutpayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfsession/cfsession.dart';
import 'package:flutter_cashfree_pg_sdk/api/cftheme/cftheme.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfenums.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfexceptions.dart';

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

/// Opens Cashfree's checkout, then asks our backend what really happened.
///
/// The SDK's own callback is only a hint — it says the sheet closed, not that
/// money moved. Nothing is treated as paid until the backend has checked with
/// Cashfree, so a tampered app cannot talk its way into a free consultation.
class PaymentService {
  PaymentService._();

  static final instance = PaymentService._();

  final _consultations = ConsultationRepository.instance;
  final _gateway = CFPaymentGatewayService();

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

    final sheet = _sheet = Completer<void>();

    try {
      final cfSession = CFSessionBuilder()
          .setEnvironment(
            session.isProduction
                ? CFEnvironment.PRODUCTION
                : CFEnvironment.SANDBOX,
          )
          .setOrderId(session.orderId)
          .setPaymentSessionId(session.sessionId)
          .build();

      _gateway.doPayment(
        CFWebCheckoutPaymentBuilder()
            .setSession(cfSession)
            .setTheme(_theme)
            .build(),
      );
    } on CFException catch (error) {
      _sheet = null;
      return PaymentResult(
        PaymentOutcome.problem,
        message: error.message.isEmpty
            ? 'The payment screen could not be opened.'
            : error.message,
      );
    }

    // Waits for the sheet to close, whichever way it went.
    await sheet.future;
    _sheet = null;

    // The backend is the judge of this, not the sheet.
    try {
      final result = await _consultations.verifyPayment(consultation.id);
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
    _gateway.setCallback(
      (_) => _finish(),
      (CFErrorResponse _, String _) => _finish(),
    );
  }

  void _finish() {
    if (_sheet?.isCompleted == false) _sheet!.complete();
  }

  /// Keeps the sheet close to the rest of the app.
  static final _theme = CFThemeBuilder()
      .setNavigationBarBackgroundColorColor('#1B2A41')
      .setNavigationBarTextColor('#FFFFFF')
      .setButtonBackgroundColor('#1B2A41')
      .setButtonTextColor('#FFFFFF')
      .setPrimaryTextColor('#111827')
      .setSecondaryTextColor('#6B7280')
      .build();
}
