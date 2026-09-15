import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../profile/professional_profile_screen.dart';
import 'steps/bank_step.dart';
import 'steps/kyc_step.dart';
import 'steps/personal_step.dart';
import 'steps/professional_step.dart';

/// Four-step registration the lawyer completes after verifying their number.
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

  int _step = 0;

  /// Whether the step on screen has everything it needs. Reset on every move,
  /// so a completed step never leaves the next one enabled.
  bool _stepValid = false;

  void _next() {
    if (!_stepValid) return;

    if (_step < _steps.length - 1) {
      setState(() {
        _step += 1;
        _stepValid = false;
      });
      return;
    }
    // TODO: save the application before moving on.
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => const ProfessionalProfileScreen(),
      ),
    );
  }

  void _back() {
    if (_step == 0) {
      Navigator.of(context).maybePop();
      return;
    }
    setState(() {
      _step -= 1;
      _stepValid = false;
    });
  }

  void _setValid(bool valid) {
    if (valid != _stepValid) setState(() => _stepValid = valid);
  }

  @override
  Widget build(BuildContext context) {
    // The header always points at what comes next, so the lawyer knows the
    // shape of the whole flow.
    final nextLabel = _step < _steps.length - 1
        ? 'Next - ${_steps[_step + 1]}'
        : 'Last step';

    return PopScope(
      canPop: _step == 0,
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
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                // Keyed by step so each one starts with its own fresh state.
                child: switch (_step) {
                  0 => PersonalStep(
                    key: const ValueKey('personal'),
                    mobile: widget.mobile,
                    onValidChanged: _setValid,
                  ),
                  1 => KycStep(
                    key: const ValueKey('kyc'),
                    onValidChanged: _setValid,
                  ),
                  2 => ProfessionalStep(
                    key: const ValueKey('professional'),
                    onValidChanged: _setValid,
                  ),
                  _ => BankStep(
                    key: const ValueKey('bank'),
                    onValidChanged: _setValid,
                  ),
                },
              ),
            ),

            // Shared footer: Back on the left, Continue once the step is done.
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: _back,
                    icon: const Icon(Icons.arrow_back, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.line,
                      foregroundColor: AppColors.ink,
                      padding: const EdgeInsets.all(12),
                    ),
                  ),
                  FilledButton(
                    onPressed: _stepValid ? _next : null,
                    child: Text(
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
