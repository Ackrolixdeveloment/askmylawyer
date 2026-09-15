import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/otp_input.dart';

/// Confirms the code sent to the new number, then saves it.
class VerifyMobileScreen extends StatefulWidget {
  const VerifyMobileScreen({super.key, required this.mobile});

  /// The new ten digit number awaiting verification.
  final String mobile;

  @override
  State<VerifyMobileScreen> createState() => _VerifyMobileScreenState();
}

class _VerifyMobileScreenState extends State<VerifyMobileScreen> {
  static const _resendSeconds = 24;

  Timer? _timer;
  int _secondsLeft = _resendSeconds;
  String _code = '';

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    setState(() => _secondsLeft = _resendSeconds);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsLeft <= 1) {
        timer.cancel();
        setState(() => _secondsLeft = 0);
        return;
      }
      setState(() => _secondsLeft -= 1);
    });
  }

  bool get _canSave => _code.length == 6;

  void _save() {
    // Both are looked up before popping: afterwards this route is gone and
    // its context can no longer resolve them.
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    // TODO: verify the code and persist the new number.
    // Unwinds both this screen and the form, back to settings.
    navigator
      ..pop()
      ..pop();

    messenger.showSnackBar(
      const SnackBar(content: Text('Mobile number updated')),
    );
  }

  void _resend() {
    // TODO: request a fresh code.
    _startCountdown();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Verify your new number',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Please enter a 6-digit verification code we sent to you at '
                '+91 ${widget.mobile}',
                style: const TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: AppColors.inkMuted,
                ),
              ),
              const SizedBox(height: 24),

              OtpInput(onChanged: (code) => setState(() => _code = code)),
              const SizedBox(height: 20),

              Align(
                alignment: Alignment.centerLeft,
                child: _secondsLeft > 0
                    ? Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.line,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Resend code in $_secondsLeft s',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.inkMuted,
                          ),
                        ),
                      )
                    : TextButton(
                        onPressed: _resend,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          foregroundColor: AppColors.brand,
                        ),
                        child: const Text('Resend code'),
                      ),
              ),

              const Spacer(),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.line,
                      foregroundColor: AppColors.ink,
                      padding: const EdgeInsets.all(12),
                    ),
                  ),
                  FilledButton(
                    onPressed: _canSave ? _save : null,
                    child: const Text('Save'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
