import 'package:flutter/material.dart';

/// Placeholder coupons. Swap for the API once it exists — both screens
/// already handle an empty list.

/// Each coupon carries its own accent, so the list reads as distinct offers
/// rather than one repeated card. Kept here rather than in AppColors: these
/// are decorative to this feature, not part of the shared palette.
class CouponAccent {
  const CouponAccent({required this.tint, required this.wash});

  final Color tint;

  /// Pale fill behind the icon and the card's leading edge.
  final Color wash;
}

const _violet = CouponAccent(tint: Color(0xFF7C5CFC), wash: Color(0xFFF1EDFF));

const _amber = CouponAccent(tint: Color(0xFFE08A1E), wash: Color(0xFFFDF3E4));

const _green = CouponAccent(tint: Color(0xFF16A34A), wash: Color(0xFFE8F6ED));

class Coupon {
  const Coupon({
    required this.code,
    required this.headline,
    required this.discountLabel,
    required this.condition,
    required this.validTill,
    required this.minimumBooking,
    required this.usageLimit,
    required this.about,
    required this.terms,
    required this.accent,
  });

  /// Shown large on the detail screen, e.g. WELCOME100.
  final String code;

  /// The list card's bold line, e.g. "₹100 OFF" or "20% OFF".
  final String headline;

  /// The badge on the detail hero, e.g. "₹100 OFF".
  final String discountLabel;

  final String condition;
  final String validTill;
  final String minimumBooking;
  final String usageLimit;
  final String about;
  final List<String> terms;
  final CouponAccent accent;
}

const _terms = [
  'Valid only for first consultation.',
  'Minimum booking amount should be ₹499',
  'Coupon can be used only once per customer.',
  'Cannot be combined with other offers.',
  'Coupon is non- transferable and non- refundable.',
];

const couponSample = <Coupon>[
  Coupon(
    code: 'WELCOME100',
    headline: '₹100 OFF',
    discountLabel: '₹100\nOFF',
    condition: 'On your first consultation',
    validTill: '31 Jul 2026',
    minimumBooking: '₹499',
    usageLimit: '1 time only',
    about:
        'Use this coupon to get ₹100 off on your first consultation on Ask '
        'My Lawyer. Valid for all practice areas.',
    terms: _terms,
    accent: _violet,
  ),
  Coupon(
    code: 'SAVE20',
    headline: '20% OFF',
    discountLabel: '20%\nOFF',
    condition: 'On your first consultation',
    validTill: '31 Jul 2026',
    minimumBooking: '₹499',
    usageLimit: '1 time only',
    about:
        'Use this coupon to get 20% off on your first consultation on Ask '
        'My Lawyer. Valid for all practice areas.',
    terms: _terms,
    accent: _amber,
  ),
  Coupon(
    code: 'SAVE30',
    headline: '30% OFF',
    discountLabel: '30%\nOFF',
    condition: 'On your first consultation',
    validTill: '31 Jul 2026',
    minimumBooking: '₹499',
    usageLimit: '1 time only',
    about:
        'Use this coupon to get 30% off on your first consultation on Ask '
        'My Lawyer. Valid for all practice areas.',
    terms: _terms,
    accent: _green,
  ),
];
