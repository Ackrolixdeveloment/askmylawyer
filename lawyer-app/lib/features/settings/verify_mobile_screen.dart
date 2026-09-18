import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/otp_input.dart';
import '../account/account_repository.dart';

/// Confirms the code sent to the new number, then saves it.
class VerifyMobileScreen extends StatefulWidget {
  const VerifyMobileScreen({
    super.key,
    required this.mobile,
    this.resendAfterSeconds = 24,
  });

  /// The new ten digit number awaiting verification.
  final String mobile;

  /// Wait before "Resend code" unlocks, as told by the backend.
  final int resendAfterSeconds;

  @override
  State<VerifyMobileScreen> createState() => _VerifyMobileScreenState();
}

class _VerifyMobileScreenState extends State<VerifyMobileScreen> {
  Timer? _timer;
  late int _secondsLeft = widget.resendAfterSeconds;
  String _code = '';
  String? _error;
  bool _saving = false;

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

  bool get _canSave => _code.length == 6 && !_saving;

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await AccountRepository.instance.verifyMobile(widget.mobile, _code);
      if (!mounted) return;

      // Looked up before popping: afterwards this route is gone and its
      // context can no longer resolve the messenger.
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop(true);
      messenger.showSnackBar(
        const SnackBar(content: Text('Mobile number updated')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = error.message;
      });
    }
  }

  Future<void> _resend() async {
    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final wait = await AccountRepository.instance.sendMobileOtp(
        widget.mobile,
      );
      if (!mounted) return;
      _startCountdown(wait);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('A new code has been sent')));
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
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
                    child: _saving
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save'),
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
