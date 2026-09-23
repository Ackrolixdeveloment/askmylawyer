import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/correction_notice.dart';
import '../../core/widgets/step_header.dart';
import '../auth/auth_repository.dart';
import '../auth/get_started_screen.dart';
import '../profile/application_submitted_screen.dart';
import '../profile/professional_profile_screen.dart';
import 'registration_repository.dart';
import 'steps/bank_step.dart';
import 'steps/kyc_step.dart';
import 'steps/personal_step.dart';
import 'steps/professional_step.dart';

/// Four-step registration the lawyer completes after verifying their number.
/// Each step is saved to the backend on Continue, so the flow resumes where
/// the lawyer left off, on any device.
class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key, this.mobile});

  /// Carried over from the OTP screen and shown read-only.
  final String? mobile;

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  static const _steps = [
    'Personal Information',
    'KYC Verification',
    'Professional Verification',
    'Bank Details',
  ];

  /// Backend step keys, in the same order as [_steps].
  static const _stepKeys = ['personal', 'kyc', 'professional', 'bank'];

  /// Which step holds each section an admin can flag for correction.
  /// "Professional Profile" lives on the profile screen after step 4.
  static const _blockSteps = {
    'Personal Information': 0,
    'Aadhar Card': 1,
    'PAN Card': 1,
    'Certificate': 2,
    'Bank Details': 3,
    'Professional Profile': 4,
  };

  /// The admin's notes for the step on screen, in the order they were flagged.
  Map<String, String> get _notesForStep => {
    for (final entry in _data!.correctionNotes.entries)
      if (_blockSteps[entry.key] == _step) entry.key: entry.value,
  };

  final _repository = RegistrationRepository.instance;

  int _step = 0;

  RegistrationSnapshot? _data;
  bool _loading = true;
  String? _loadError;
  bool _saving = false;

  /// The step on screen's data once it is complete; null disables Continue.
  /// Reset on every move, so a completed step never leaves the next enabled.
  Object? _input;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });

    try {
      final data = await _repository.load();
      if (!mounted) return;

      if (!data.canEdit) {
        // Submitted while the form was open, or turned down since.
        _replaceWith(
          ApplicationSubmittedScreen(
            rejected: data.onboardingStatus == 'rejected',
            reason: data.rejectionReason,
          ),
        );
        return;
      }

      final firstOpen = _stepKeys.indexWhere(
        (key) => !data.completedSteps.contains(key),
      );

      // An application sent back for correction opens straight on the first
      // section the admin flagged, so the lawyer lands on the right form.
      final flaggedStep = _firstFlaggedStep(data);

      if (flaggedStep == null && firstOpen == -1) {
        // All four steps are saved — carry on with the profile.
        _replaceWith(_profileScreen(data));
        return;
      }
      if (flaggedStep == _steps.length) {
        // Only the professional profile needs fixing.
        _replaceWith(_profileScreen(data));
        return;
      }

      setState(() {
        _data = data;
        _step = flaggedStep ?? (firstOpen == -1 ? 0 : firstOpen);
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = error.message;
      });
    }
  }

  Future<void> _next() async {
    final input = _input;
    if (input == null || _saving) return;

    setState(() => _saving = true);
    try {
      final data = await switch (input) {
        PersonalInput() => _repository.savePersonal(input),
        KycInput() => _repository.saveKyc(input),
        ProfessionalInput() => _repository.saveProfessional(input),
        BankInput() => _repository.saveBank(input),
        _ => throw StateError('Unknown step input: $input'),
      };
      if (!mounted) return;

      if (_step < _steps.length - 1) {
        setState(() {
          _data = data;
          _step += 1;
          _input = null;
          _saving = false;
        });
        return;
      }

      setState(() {
        _data = data;
        _saving = false;
      });
      Navigator.of(context)
          .push(MaterialPageRoute<void>(builder: (_) => _profileScreen(data)));
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _back() async {
    if (_saving) return;

    // Registration is the first screen after signing in, so there is nothing
    // behind step one — going back means leaving the account.
    if (_step == 0) {
      await _leave();
      return;
    }
    setState(() {
      _step -= 1;
      _input = null;
    });
  }

  /// Signs out and returns to the sign-in screen. Saved steps stay on the
  /// server, so signing in again picks the form back up.
  Future<void> _leave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Leave registration?'),
        content: const Text(
          'Your saved steps are kept. You will need to sign in again to '
          'finish your application.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Stay'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.negative),
            child: const Text('Log out'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    await AuthRepository.instance.logout();
    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const GetStartedScreen()),
      (_) => false,
    );
  }

  void _setInput(Object? input) {
    if (!identical(input, _input)) setState(() => _input = input);
  }

  /// The earliest step carrying admin feedback, or null when there is none.
  int? _firstFlaggedStep(RegistrationSnapshot data) {
    final steps = data.correctionNotes.keys
        .map((block) => _blockSteps[block])
        .nonNulls
        .toList();
    if (steps.isEmpty) return null;

    return steps.reduce((a, b) => a < b ? a : b);
  }

  Widget _profileScreen(RegistrationSnapshot data) =>
      ProfessionalProfileScreen(displayName: data.fullName, initial: data);

  void _replaceWith(Widget screen) {
    Navigator.of(context)
        .pushReplacement(MaterialPageRoute<void>(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _loadError != null) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        body: SafeArea(
          child: Center(
            child: _loading
                ? const CircularProgressIndicator()
                : Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _loadError!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.inkMuted,
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: _load,
                          child: const Text('Try again'),
                        ),
                      ],
                    ),
                  ),
          ),
        ),
      );
    }

    // The header always points at what comes next, so the lawyer knows the
    // shape of the whole flow. The profile screen is the fifth step.
    final nextLabel = _step < _steps.length - 1
        ? 'Next - ${_steps[_step + 1]}'
        : 'Next - Professional Profile';

    return PopScope(
      // Handled below: earlier steps go back one, step one asks to log out.
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Column(
          children: [
            StepHeader(
              title: _steps[_step],
              subtitle: nextLabel,
              step: _step + 1,
              total: totalOnboardingSteps,
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                // Keyed by step so each one starts with its own fresh state,
                // prefilled from what was last saved.
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_notesForStep.isNotEmpty) ...[
                      CorrectionNotice(notes: _notesForStep),
                      const SizedBox(height: 16),
                    ],
                    switch (_step) {
                      0 => PersonalStep(
                        key: const ValueKey('personal'),
                        mobile: widget.mobile,
                        initial: _data,
                        onChanged: _setInput,
                      ),
                      1 => KycStep(
                        key: const ValueKey('kyc'),
                        initial: _data,
                        onChanged: _setInput,
                      ),
                      2 => ProfessionalStep(
                        key: const ValueKey('professional'),
                        initial: _data,
                        onChanged: _setInput,
                      ),
                      _ => BankStep(
                        key: const ValueKey('bank'),
                        initial: _data,
                        onChanged: _setInput,
                      ),
                    },
                  ],
                ),
              ),
            ),

            // Shared footer: Back on the left, Continue once the step is done.
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: _saving ? null : _back,
                    icon: const Icon(Icons.arrow_back, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.line,
                      foregroundColor: AppColors.ink,
                      padding: const EdgeInsets.all(12),
                    ),
                  ),
                  FilledButton(
                    onPressed: _input != null && !_saving ? _next : null,
                    child: _saving
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(
                            _step == _steps.length - 1 ? 'Submit' : 'Continue',
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
