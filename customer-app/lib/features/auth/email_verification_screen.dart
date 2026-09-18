import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/validators.dart';
import '../../core/widgets/otp_input.dart';
import '../profile/complete_profile_screen.dart';

/// Email sign-in: collect the address, then verify the code sent to it.
class EmailVerificationScreen extends StatefulWidget {
  const EmailVerificationScreen({super.key});

  @override
  State<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  static const _expirySeconds = 5 * 60;

  /// Stand-in until the backend verifies codes for real.
  static const _validCode = '123456';

  final _email = TextEditingController();
  bool _codeSent = false;
  String _code = '';
  bool _wrongCode = false;

  /// Bumped on a wrong code to rebuild [OtpInput] from scratch: it owns its
  /// controllers, so a new key is what empties the boxes for another try.
  int _attempt = 0;
  Timer? _timer;
  int _secondsLeft = _expirySeconds;

  @override
  void initState() {
    super.initState();
    _email.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _email.dispose();
    _timer?.cancel();
    super.dispose();
  }

  /// Good enough to catch typos; the real check is the code itself.
  bool get _emailLooksValid => Validators.email(_email.text) == null;

  String get _expiry {
    final minutes = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final seconds = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  void _sendCode() {
    // TODO: request the verification email.
    setState(() => _codeSent = true);
    _startExpiry();
  }

  void _startExpiry() {
    setState(() => _secondsLeft = _expirySeconds);
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
      if (mounted) _verify();
    });
  }

  void _resend() {
    // TODO: request a fresh code.
    setState(() => _wrongCode = false);
    _startExpiry();
  }

  void _verify() {
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
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const CompleteProfileScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        // Back sits at the top of the content now, and the sixth digit
        // submits, so nothing is pinned to the bottom.
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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

              const Text(
                "What's your email address?",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "We'll send a 6-digit verification code to confirm it's you.",
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: AppColors.inkMuted,
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Email Address',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),

              // Once the code is out, the address locks behind a Change link.
              if (_codeSent) _lockedEmail() else _emailField(),

              if (!_codeSent) ...[
                const SizedBox(height: 6),
                const Text(
                  'Use an email you check regularly',
                  style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _emailLooksValid ? _sendCode : null,
                  child: const Text('Send Code  →'),
                ),
              ],

              if (_codeSent) ...[
                const SizedBox(height: 24),
                const Text(
                  'Verification Code',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 8),
                OtpInput(
                  key: ValueKey(_attempt),
                  filled: true,
                  onChanged: _handleCode,
                ),

                if (_wrongCode) ...[
                  const SizedBox(height: 10),
                  const Text(
                    'That code is incorrect. Please check and try '
                    'again.',
                    style: TextStyle(fontSize: 12, color: AppColors.negative),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text.rich(
                      TextSpan(
                        text: 'Expires in ',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkMuted,
                        ),
                        children: [
                          TextSpan(
                            text: _expiry,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: _resend,
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Resend Code',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _emailField() {
    return TextField(
      controller: _email,
      keyboardType: TextInputType.emailAddress,
      autocorrect: false,
      style: const TextStyle(fontSize: 15, color: AppColors.ink),
      decoration: InputDecoration(
        hintText: 'you@example.com',
        hintStyle: const TextStyle(color: AppColors.inkSubtle),
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.brand),
        ),
      ),
    );
  }

  Widget _lockedEmail() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              _email.text.trim(),
              style: const TextStyle(fontSize: 15, color: AppColors.ink),
            ),
          ),
          TextButton(
            onPressed: () => setState(() {
              _codeSent = false;
              _code = '';
              _wrongCode = false;
              _timer?.cancel();
            }),
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              foregroundColor: AppColors.ink,
            ),
            child: const Text('Change', style: TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
