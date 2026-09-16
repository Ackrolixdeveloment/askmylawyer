import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
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
    'Professional Profile': 4,
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

  Future<void> _load({bool keepStep = false}) async {
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
        if (!keepStep) {
          _step = flaggedStep ?? (firstOpen == -1 ? 0 : firstOpen);
        }
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

  void _back() {
    if (_saving) return;
    if (_step == 0) {
      Navigator.of(context).maybePop();
      return;
    }
    setState(() {
      _step -= 1;
      _input = null;
    });
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
    // shape of the whole flow.
    final nextLabel = _step < _steps.length - 1
        ? 'Next - ${_steps[_step + 1]}'
        : 'Last step';

    return PopScope(
      canPop: _step == 0 && !_saving,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Column(
          children: [
            _StepHeader(
              title: _steps[_step],
              subtitle: nextLabel,
              step: _step + 1,
              total: _steps.length,
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                // Keyed by step so each one starts with its own fresh state,
                // prefilled from what was last saved.
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_data!.correctionNotes.isNotEmpty) ...[
                      _CorrectionNotice(notes: _data!.correctionNotes),
                      const SizedBox(height: 16),
                    ],
                    switch (_step) {
                      0 => PersonalStep(
                        key: ValueKey(
                          'personal-${_data!.mobile}-${_data!.email}',
                        ),
                        mobile: widget.mobile,
                        initial: _data,
                        onChanged: _setInput,
                        onIdentityChanged: () => _load(keepStep: true),
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

class _StepHeader extends StatelessWidget {
  const _StepHeader({
    required this.title,
    required this.subtitle,
    required this.step,
    required this.total,
  });

  final String title;
  final String subtitle;
  final int step;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 8),
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: const BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(18)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFFB6C0D4),
                  ),
                ),
              ],
            ),
          ),
          _StepProgressRing(step: step, total: total),
        ],
      ),
    );
  }
}

/// Step counter drawn as a ring that fills as the lawyer moves through the
/// form, so progress is readable at a glance.
class _StepProgressRing extends StatelessWidget {
  const _StepProgressRing({required this.step, required this.total});

  final int step;
  final int total;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      height: 48,
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: step / total),
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOut,
            builder: (context, value, _) => SizedBox.expand(
              child: CircularProgressIndicator(
                value: value,
                strokeWidth: 3,
                strokeCap: StrokeCap.round,
                backgroundColor: Colors.white.withValues(alpha: 0.28),
                valueColor: const AlwaysStoppedAnimation(Colors.white),
              ),
            ),
          ),
          Text(
            '$step of $total',
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

/// What the admin asked the lawyer to fix, shown above the form.
class _CorrectionNotice extends StatelessWidget {
  const _CorrectionNotice({required this.notes});

  final Map<String, String> notes;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        border: Border.all(color: const Color(0xFFFED7AA)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.error_outline, size: 18, color: Color(0xFFC2410C)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Please update the details below',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFC2410C),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...notes.entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '${entry.key}: ',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    TextSpan(text: entry.value),
                  ],
                ),
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  color: AppColors.ink,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
