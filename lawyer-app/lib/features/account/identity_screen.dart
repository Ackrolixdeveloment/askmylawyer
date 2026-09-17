import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/validators.dart';
import '../../core/widgets/otp_input.dart';
import 'account_repository.dart';

enum IdentityKind { mobile, email }

/// Adds or changes the mobile number / email on the account: enter the new
/// value, then confirm the code sent to it. Pops `true` once it is verified.
class IdentityScreen extends StatefulWidget {
  const IdentityScreen({super.key, required this.kind, this.current});

  final IdentityKind kind;

  /// What is on the account today, if anything.
  final String? current;

  @override
  State<IdentityScreen> createState() => _IdentityScreenState();
}

class _IdentityScreenState extends State<IdentityScreen> {
  final _value = TextEditingController();

  bool _codeSent = false;
  bool _busy = false;
  String? _error;
  String _code = '';
  int _secondsLeft = 0;
  Timer? _timer;

  bool get _isMobile => widget.kind == IdentityKind.mobile;
  String get _entered => _value.text.trim();
  bool get _hasValue => widget.current != null && widget.current!.isNotEmpty;

  String get _title {
    final verb = _hasValue ? 'Change' : 'Add';
    return _isMobile ? '$verb mobile number' : '$verb email address';
  }

  @override
  void initState() {
    super.initState();
    _value.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _value.dispose();
    _timer?.cancel();
    super.dispose();
  }

  String? get _valueError =>
      _isMobile ? Validators.mobile(_entered) : Validators.email(_entered);

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

  Future<void> _sendCode() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final repository = AccountRepository.instance;
      final wait = _isMobile
          ? await repository.sendMobileOtp(_entered)
          : await repository.sendEmailOtp(_entered);
      if (!mounted) return;

      setState(() => _codeSent = true);
      _startCountdown(wait);
    } on ApiException catch (error) {
      // A code sent moments ago is still valid, so carry on with it.
      if (error.code == 'OTP_COOLDOWN' && !_codeSent) {
        setState(() => _codeSent = true);
        _startCountdown(0);
      } else if (mounted) {
        setState(() => _error = error.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final repository = AccountRepository.instance;
      if (_isMobile) {
        await repository.verifyMobile(_entered, _code);
      } else {
        await repository.verifyEmail(_entered, _code);
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = error.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        title: Text(
          _title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _codeSent
                    ? 'Enter the 6-digit code sent to ${_isMobile ? '+91 $_entered' : _entered}.'
                    : _isMobile
                    ? "We'll send a 6-digit code to confirm the number is yours."
                    : "We'll send a 6-digit code to confirm the address is yours.",
                style: const TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: AppColors.inkMuted,
                ),
              ),
              const SizedBox(height: 20),

              if (_codeSent)
                OtpInput(
                  filled: true,
                  onChanged: (code) => setState(() {
                    _code = code;
                    _error = null;
                  }),
                )
              else
                _valueField(),

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

              if (_codeSent) ...[
                const SizedBox(height: 14),
                Align(
                  alignment: Alignment.centerLeft,
                  child: _secondsLeft > 0
                      ? Text(
                          'Resend code in $_secondsLeft s',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.inkMuted,
                          ),
                        )
                      : TextButton(
                          onPressed: _busy ? null : _sendCode,
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            foregroundColor: AppColors.brand,
                          ),
                          child: const Text('Resend code'),
                        ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _busy
                      ? null
                      : () => setState(() {
                          _codeSent = false;
                          _code = '';
                          _error = null;
                        }),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    alignment: Alignment.centerLeft,
                    foregroundColor: AppColors.inkMuted,
                  ),
                  child: Text(
                    _isMobile
                        ? 'Use a different number'
                        : 'Use a different address',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],

              const Spacer(),

              FilledButton(
                onPressed:
                    _busy ||
                        (_codeSent ? _code.length != 6 : _valueError != null)
                    ? null
                    : (_codeSent ? _verify : _sendCode),
                child: _busy
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(_codeSent ? 'Verify' : 'Send Code'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _valueField() {
    if (!_isMobile) {
      return TextField(
        controller: _value,
        keyboardType: TextInputType.emailAddress,
        autocorrect: false,
        autofocus: true,
        style: const TextStyle(fontSize: 15, color: AppColors.ink),
        decoration: _decoration('you@example.com'),
      );
    }

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.line),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Text(
            '+91',
            style: TextStyle(fontSize: 15, color: AppColors.inkMuted),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: TextField(
            controller: _value,
            keyboardType: TextInputType.phone,
            maxLength: 10,
            autofocus: true,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: const TextStyle(fontSize: 15, color: AppColors.ink),
            decoration: _decoration('1234567890').copyWith(counterText: ''),
          ),
        ),
      ],
    );
  }

  InputDecoration _decoration(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: AppColors.inkSubtle),
    filled: true,
    fillColor: AppColors.surface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppColors.line),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppColors.brand),
    ),
  );
}
