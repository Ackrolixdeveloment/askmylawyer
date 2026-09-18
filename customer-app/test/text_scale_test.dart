import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:customer_app/core/theme/app_theme.dart';
import 'package:customer_app/core/widgets/upload_field.dart';
import 'package:customer_app/features/bookings/bookings_screen.dart';
import 'package:customer_app/features/consultation/case_details_screen.dart';
import 'package:customer_app/features/consultation/booking_confirmed_screen.dart';
import 'package:customer_app/features/consultation/choose_time_screen.dart';
import 'package:customer_app/features/consultation/consult_draft.dart';
import 'package:customer_app/features/consultation/consult_preview_screen.dart';
import 'package:customer_app/features/consultation/consultation_screen.dart';
import 'package:customer_app/features/consultation/finding_lawyer_screen.dart';
import 'package:customer_app/features/consultation/lawyer_ready_screen.dart';
import 'package:customer_app/features/consultation/no_lawyers_screen.dart';
import 'package:customer_app/features/home/home_screen.dart';
import 'package:customer_app/features/settings/settings_screen.dart';
import 'package:customer_app/features/upcoming/upcoming_screen.dart';

/// Renders a screen at the largest scale the app allows, on a small phone,
/// so any overflow shows up as a test failure rather than on a device.
Future<void> _pumpAtMaxScale(WidgetTester tester, Widget screen) async {
  tester.view.physicalSize = const Size(360 * 3, 640 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light,
      home: MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(1.4)),
        // Some screens are bare scroll views meant to sit inside the shell's
        // scaffold, so supply one here.
        child: Scaffold(body: screen),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('home lays out at the maximum text scale', (tester) async {
    await _pumpAtMaxScale(tester, const HomeScreen());
  });

  testWidgets('bookings lays out at the maximum text scale', (tester) async {
    await _pumpAtMaxScale(tester, const BookingsScreen());
  });

  testWidgets('settings lays out at the maximum text scale', (tester) async {
    await _pumpAtMaxScale(tester, const SettingsScreen());
  });

  testWidgets('consultation lays out at the maximum text scale', (
    tester,
  ) async {
    await _pumpAtMaxScale(tester, const ConsultationScreen());
  });

  testWidgets('case details lays out at the maximum text scale', (
    tester,
  ) async {
    await _pumpAtMaxScale(
      tester,
      const CaseDetailsScreen(mode: ConsultMode.now),
    );
  });

  testWidgets('choose a time lays out at the maximum text scale', (
    tester,
  ) async {
    // Fixed date, so the day labels do not shift with the calendar.
    await _pumpAtMaxScale(tester, ChooseTimeScreen(now: DateTime(2026, 9, 15)));
  });

  testWidgets('consult preview lays out at the maximum text scale', (
    tester,
  ) async {
    // The document row is the widest, so include one.
    await _pumpAtMaxScale(
      tester,
      ConsultPreviewScreen(
        draft: ConsultDraft(
          mode: ConsultMode.scheduled,
          channel: CallChannel.audio,
          location: 'Delhi',
          caseTag: 'Civil',
          slot: DateTime(2026, 6, 12, 14, 30),
          document: const PickedDocument(
            name: 'Legal Notice .pdf',
            bytes: 2516582,
          ),
        ),
      ),
    );
  });

  testWidgets('finding a lawyer lays out at the maximum text scale', (
    tester,
  ) async {
    await _pumpAtMaxScale(tester, FindingLawyerScreen(draft: _draft));
    // The countdown runs on a timer; stop it before the test ends.
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('lawyer ready lays out at the maximum text scale', (
    tester,
  ) async {
    await _pumpAtMaxScale(tester, LawyerReadyScreen(draft: _draft));
  });

  testWidgets('no lawyers lays out at the maximum text scale', (tester) async {
    await _pumpAtMaxScale(
      tester,
      NoLawyersScreen(draft: _draft, searchedSeconds: 45),
    );
  });

  testWidgets('booking confirmed lays out at the maximum text scale', (
    tester,
  ) async {
    await _pumpAtMaxScale(
      tester,
      BookingConfirmedScreen(
        draft: ConsultDraft(
          mode: ConsultMode.scheduled,
          channel: CallChannel.video,
          location: 'Gurugram, Haryana',
          caseTag: 'Family Law',
          slot: DateTime(2026, 6, 12, 14, 30),
        ),
      ),
    );
  });

  testWidgets('upcoming lays out at the maximum text scale', (tester) async {
    // A fixed clock keeps the join window — and so the card's layout —
    // the same on every run.
    await _pumpAtMaxScale(
      tester,
      UpcomingScreen(now: DateTime(2026, 6, 12, 14, 0)),
    );
  });
}

/// Shared stand-in booking for the screens that only render a draft.
final _draft = ConsultDraft(
  mode: ConsultMode.now,
  channel: CallChannel.audio,
  location: 'Gurugram, Haryana',
  caseTag: 'Family Law',
  document: const PickedDocument(name: 'Legal Notice .pdf', bytes: 2516582),
);
