import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/otp_input.dart';
import '../profile/complete_profile_screen.dart';

/// Verifies the code sent to the customer's mobile number.
class OtpScreen extends StatefulWidget {
  const OtpScreen({
    super.key,
    required this.mobile,
    this.name,
    this.onVerified,
  });

  /// Ten digit number, shown back with the country code.
  final String mobile;

  /// Greeting name, once we know it. Falls back to a neutral title.
  final String? name;

  /// What a correct code leads to. Null means signing in, which continues to
  /// the profile; changing a number supplies its own step instead.
  final VoidCallback? onVerified;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  static const _resendSeconds = 24;

  /// Stand-in until the backend verifies codes for real.
  static const _validCode = '123456';

  Timer? _timer;
  int _secondsLeft = _resendSeconds;
  String _code = '';
  bool _wrongCode = false;

  /// Bumped on a wrong code to rebuild [OtpInput] from scratch: it owns its
  /// controllers, so a new key is what empties the boxes for another try.
  int _attempt = 0;

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

  /// Submits itself as soon as the sixth digit lands, so there is nothing to
  /// press on the happy path.
  void _handleCode(String code) {
    setState(() {
      _code = code;
      // Clear the previous complaint while they are correcting it.
      if (code.length < 6) _wrongCode = false;
    });

    if (code.length != 6) return;

    // OtpInput calls setState on itself right after this callback returns, so
    // navigating synchronously would leave it rebuilding a dead widget.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _submit();
    });
  }

  void _submit() {
    if (_code != _validCode) {
      // Clear the boxes too, so there is always a way to try again now that
      // there is no button to press.
      setState(() {
        _wrongCode = true;
        _code = '';
        _attempt += 1;
      });
      return;
    }

    // TODO: verify the code with the backend before moving on.
    final onVerified = widget.onVerified;
    if (onVerified != null) {
      onVerified();
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const CompleteProfileScreen()),
    );
  }

  void _resend() {
    // TODO: request a fresh code.
    setState(() => _wrongCode = false);
    _startCountdown();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.name == null
        ? 'Verify your number'
        : 'Welcome , ${widget.name}';

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Back sits at the top now, so the footer holds nothing but the
              // fallback button.
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  icon: const Icon(Icons.arrow_back, size: 20),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.line,
                    foregroundColor: AppColors.ink,
                    padding: const EdgeInsets.all(12),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Text(
                title,
                style: const TextStyle(
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

              OtpInput(key: ValueKey(_attempt), onChanged: _handleCode),

              if (_wrongCode) ...[
                const SizedBox(height: 10),
                const Text(
                  'That code is incorrect. Please check and try again.',
                  style: TextStyle(fontSize: 12, color: AppColors.negative),
                ),
              ],
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
            ],
          ),
        ),
      ),
    );
  }
}
