import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/app_navigator.dart';
import 'consultation_repository.dart';
import 'incoming_call_screen.dart';

/// How often the app asks whether anything is ringing, when a push has not
/// arrived. Short, because a consultation offer expires in seconds.
const _pollEvery = Duration(seconds: 5);

/// Puts the incoming-call screen up when a consultation is offered.
///
/// A push wakes it instantly; the poll is the safety net for a phone with
/// notifications denied, a missing token, or a push that was simply slow.
class OfferWatcher {
  OfferWatcher._();

  static final instance = OfferWatcher._();

  final _consultations = ConsultationRepository.instance;

  Timer? _timer;

  /// The offer on screen, so the same ring is never shown twice.
  String? _showing;

  /// Offers already answered or missed in this session.
  final _handled = <String>{};

  void start() {
    _timer ??= Timer.periodic(_pollEvery, (_) => check());
    check();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Called by the push handler the moment an offer arrives.
  Future<void> checkNow() => check();

  Future<void> check() async {
    if (_showing != null) return;

    try {
      final offers = await _consultations.pendingOffers();
      final next = offers
          .where((offer) => offer.live && !_handled.contains(offer.id))
          .firstOrNull;
      if (next == null) return;

      await _ring(next);
    } catch (_) {
      // Signed out, or offline; the next tick tries again.
    }
  }

  Future<void> _ring(ConsultationOffer offer) async {
    final navigator = appNavigatorKey.currentState;
    if (navigator == null) return;

    _showing = offer.id;
    _handled.add(offer.id);

    await navigator.push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => IncomingCallScreen(offer: offer),
      ),
    );

    _showing = null;
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
