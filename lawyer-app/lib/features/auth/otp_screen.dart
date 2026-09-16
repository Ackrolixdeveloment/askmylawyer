import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/otp_input.dart';
import 'auth_repository.dart';
import 'post_login_route.dart';

/// Verifies the code sent to the lawyer's mobile number.
class OtpScreen extends StatefulWidget {
  const OtpScreen({
    super.key,
    required this.mobile,
    this.name,
    this.resendAfterSeconds = defaultResendSeconds,
  });

  static const defaultResendSeconds = 24;

  /// Ten digit number, shown back with the country code.
  final String mobile;

  /// Greeting name, once we know it. Falls back to a neutral title.
  final String? name;

  /// Wait before "Resend code" unlocks, as told by the backend.
  final int resendAfterSeconds;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  Timer? _timer;
  late int _secondsLeft = widget.resendAfterSeconds;
  String _code = '';
  String? _error;
  bool _verifying = false;
  bool _resending = false;

  @override
  void initState() {
    super.initState();
    _startCountdown(widget.resendAfterSeconds);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdown(int seconds) {
    setState(() => _secondsLeft = seconds);
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

  bool get _canSubmit => _code.length == 6 && !_verifying;

  Future<void> _submit() async {
    setState(() {
      _verifying = true;
      _error = null;
    });

    try {
      final result = await AuthRepository.instance.verifyOtp(
        widget.mobile,
        _code,
      );
      if (!mounted) return;
      openPostLoginScreen(context, result.lawyer, mobile: widget.mobile);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _verifying = false;
        _error = error.message;
      });
    }
  }

  Future<void> _resend() async {
    setState(() {
      _resending = true;
      _error = null;
    });

    try {
      final seconds = await AuthRepository.instance.sendOtp(widget.mobile);
      if (!mounted) return;
      _startCountdown(seconds);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('A new code has been sent')));
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
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
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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

              OtpInput(
                onChanged: (code) => setState(() {
                  _code = code;
                  _error = null;
                }),
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(
                  _error!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.negative,
                  ),
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
                        onPressed: _resending ? null : _resend,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          foregroundColor: AppColors.brand,
                        ),
                        child: Text(_resending ? 'Sending…' : 'Resend code'),
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
                    onPressed: _canSubmit ? _submit : null,
                    child: _verifying
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Next'),
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
