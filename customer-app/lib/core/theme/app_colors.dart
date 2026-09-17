import 'package:flutter/material.dart';

/// Palette shared with the admin panel, so both surfaces stay in step.
abstract final class AppColors {
  static const ink = Color(0xFF010E23);
  static const inkMuted = Color(0xFF64748B);
  static const inkSubtle = Color(0xFF94A3B8);

  static const surface = Color(0xFFFFFFFF);
  static const canvas = Color(0xFFF2F6FB);
  static const line = Color(0xFFE8EDF4);

  static const brand = Color(0xFF2563EB);
  static const brandSoft = Color(0xFFEFF4FF);

  static const positive = Color(0xFF16A34A);
  static const negative = Color(0xFFDC2626);
}
