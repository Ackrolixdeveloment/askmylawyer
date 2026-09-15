import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/validators.dart';

import '../../core/theme/app_colors.dart';
import 'email_verification_screen.dart';
import 'otp_screen.dart';

/// Sign-up entry point: mobile number first, with social options underneath.
class GetStartedScreen extends StatefulWidget {
  const GetStartedScreen({super.key});

  @override
  State<GetStartedScreen> createState() => _GetStartedScreenState();
}

class _GetStartedScreenState extends State<GetStartedScreen> {
  final _mobile = TextEditingController();

  @override
  void initState() {
    super.initState();
    _mobile.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _mobile.dispose();
    super.dispose();
  }

  /// Apple sign-in is an iOS-only option; Android shows Google and Email.
  /// `kIsWeb` is checked first because `Platform` throws on web.
  bool get _showApple => !kIsWeb && Platform.isIOS;

  /// Indian mobile numbers are ten digits starting 6-9.
  String? get _mobileError => Validators.mobile(_mobile.text);
  bool get _canContinue => _mobileError == null;

  void _continue() {
    // TODO: request the OTP from the backend before opening this screen.
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => OtpScreen(mobile: _mobile.text.trim()),
      ),
    );
  }

  void _continueWithEmail() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const EmailVerificationScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 64,
                  filterQuality: FilterQuality.high,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Get Started with Ask My Lawyer',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Join a trusted network of verified legal professionals.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.inkMuted),
              ),
              const SizedBox(height: 32),

              const Text(
                'Mobile Number',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              _MobileField(controller: _mobile),
              // Only nag once enough digits are in to judge the number.
              if (_mobile.text.length >= 10 && _mobileError != null) ...[
                const SizedBox(height: 6),
                Text(
                  _mobileError!,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.negative,
                  ),
                ),
              ],
              const SizedBox(height: 16),

              FilledButton(
                onPressed: _canContinue ? _continue : null,
                child: const Text('Continue'),
              ),
              const SizedBox(height: 24),

              const _OrDivider(),
              const SizedBox(height: 20),

              // TODO: wire each provider once the auth backend is ready.
              if (_showApple) ...[
                _SocialButton(
                  icon: const Icon(Icons.apple, size: 20, color: AppColors.ink),
                  label: 'Continue with Apple',
                  onPressed: () {},
                ),
                const SizedBox(height: 12),
              ],
              _SocialButton(
                icon: const _GoogleMark(),
                label: 'Continue with Google',
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              _SocialButton(
                icon: const Icon(
                  Icons.mail_outline,
                  size: 20,
                  color: AppColors.ink,
                ),
                label: 'Continue with Email',
                onPressed: _continueWithEmail,
              ),
              const SizedBox(height: 28),

              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.lock_outline,
                    size: 13,
                    color: AppColors.inkSubtle,
                  ),
                  SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      'Your information is encrypted and securely verified.',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.inkSubtle,
                      ),
                    ),
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

class _MobileField extends StatelessWidget {
  const _MobileField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            decoration: const BoxDecoration(
              border: Border(right: BorderSide(color: AppColors.line)),
            ),
            child: const Text('🇮🇳', style: TextStyle(fontSize: 18)),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              '+91',
              style: TextStyle(fontSize: 15, color: AppColors.inkMuted),
            ),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(fontSize: 15, color: AppColors.ink),
              decoration: const InputDecoration(
                hintText: '1234567890',
                hintStyle: TextStyle(color: AppColors.inkSubtle),
                border: InputBorder.none,
                counterText: '',
                contentPadding: EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          const SizedBox(width: 12),
        ],
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: Divider(color: AppColors.line)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'or',
            style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
          ),
        ),
        Expanded(child: Divider(color: AppColors.line)),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final Widget icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: icon,
        label: Text(label),
        style: OutlinedButton.styleFrom(
          backgroundColor: AppColors.canvas,
          foregroundColor: AppColors.ink,
          side: const BorderSide(color: AppColors.line),
          // Font and size come from the theme's outlined-button style.
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}

/// Google's wordmark initial, drawn in text so no extra asset is needed.
class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'G',
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: Color(0xFF4285F4),
      ),
    );
  }
}
