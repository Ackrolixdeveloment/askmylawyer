import 'package:flutter/material.dart';

import '../home/home_screen.dart';
import '../profile/application_submitted_screen.dart';
import '../registration/registration_screen.dart';
import 'auth_repository.dart';

/// Opens the right screen after any sign-in method and clears the auth flow
/// from the back stack: registration while the application is a draft, home
/// once approved, and the "submitted" status screen in between.
void openPostLoginScreen(
  BuildContext context,
  LawyerAccount lawyer, {
  String? mobile,
}) {
  final Widget next = switch (lawyer.onboardingStatus) {
    // A correction reopens the form so the flagged sections can be fixed.
    'draft' || 'correction_requested' => RegistrationScreen(mobile: mobile),
    'approved' => const HomeScreen(),
    'rejected' => ApplicationSubmittedScreen(
      rejected: true,
      reason: lawyer.rejectionReason,
    ),
    _ => const ApplicationSubmittedScreen(),
  };

  Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
    MaterialPageRoute<void>(builder: (_) => next),
    (_) => false,
  );
}
