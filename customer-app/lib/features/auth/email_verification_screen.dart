import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/validators.dart';
import '../../core/widgets/otp_input.dart';
import '../../core/network/api_client.dart';
import '../home/home_screen.dart';
import '../profile/complete_profile_screen.dart';
import 'customer_session.dart';

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

  final _email = TextEditingController();
  bool _codeSent = false;
  String _code = '';

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
  final _session = CustomerSession.instance;

  /// True while a request is in flight, and what went wrong if one did.
  bool _busy = false;
  String? _problem;

  bool get _emailLooksValid => Validators.email(_email.text) == null && !_busy;

  String get _expiry {
    final minutes = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final seconds = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Future<void> _sendCode() async {
    setState(() {
      _busy = true;
      _problem = null;
    });

    try {
      await _session.sendEmailOtp(_email.text.trim());
      if (!mounted) return;
      setState(() => _codeSent = true);
      _startExpiry();
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
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
      if (code.length < 6) _problem = null;
    });

    if (code.length != 6) return;

    // OtpInput calls setState on itself right after this callback returns, so
    // navigating synchronously would leave it rebuilding a dead widget.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _verify();
    });
  }

  Future<void> _resend() async {
    setState(() {
      _problem = null;
    });
    _startExpiry();

    try {
      await _session.sendEmailOtp(_email.text.trim());
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    }
  }

  Future<void> _verify() async {
    if (_busy) return;
    setState(() => _busy = true);

    final bool isNewUser;
    try {
      isNewUser = await _session.verifyEmailOtp(_email.text.trim(), _code);
    } on ApiException catch (error) {
      // Clear the boxes too, so there is always a way to try again now that
      // there is no button to press.
      if (mounted) {
        setState(() {
          _problem = error.message;
          _busy = false;
          _code = '';
          _attempt += 1;
        });
      }
      return;
    }

    if (!mounted) return;

    // The profile form is offered to a new account, never forced — it has a
    // Skip, and the details are only really needed to download a report.
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(
        builder: (_) =>
            isNewUser ? const CompleteProfileScreen() : const HomeScreen(),
      ),
      (route) => false,
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
                  child: Text(_busy ? 'Sending…' : 'Send Code  →'),
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

                if (_problem != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    _problem!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.negative,
                    ),
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
