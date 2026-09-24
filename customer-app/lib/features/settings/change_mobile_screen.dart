import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../auth/otp_screen.dart';
import '../home/home_screen.dart';

/// Replaces the customer's mobile number, verifying the new one by OTP.
class ChangeMobileScreen extends StatefulWidget {
  const ChangeMobileScreen({super.key, required this.currentMobile});

  /// The number on file, shown read-only above the new one.
  final String currentMobile;

  @override
  State<ChangeMobileScreen> createState() => _ChangeMobileScreenState();
}

class _ChangeMobileScreenState extends State<ChangeMobileScreen> {
  final _mobile = TextEditingController();

  /// Starts as the number passed in and moves on once one is verified, so
  /// the Current field reflects the change without leaving the screen.
  late String _currentMobile = widget.currentMobile;

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

  String get _entered => _mobile.text.trim();

  /// Indian mobile numbers are ten digits and never start below 6.
  bool get _valid => RegExp(r'^[6-9]\d{9}$').hasMatch(_entered);

  /// Sending to the number already on file would verify nothing.
  bool get _isSameNumber => _entered == _currentMobile;

  bool get _canSend => _valid && !_isSameNumber;

  Future<void> _sendOtp() async {
    final newMobile = _entered;

    // TODO: ask the backend to send the code before opening the screen.
    final verified = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (otpContext) => OtpScreen(
          mobile: newMobile,
          // Verifying here changes the number rather than signing in, so it
          // returns to this screen with the new value instead of going on to
          // the profile.
          onVerified: () {
            // TODO: save the new number to the backend.
            Navigator.of(otpContext).pop(true);
          },
        ),
      ),
    );

    // Backing out of the OTP screen leaves the number unchanged.
    if (verified != true || !mounted) return;
    setState(() => _currentMobile = newMobile);
    _mobile.clear();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Mobile number updated to +91 $newMobile')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final navHeight = shellNavHeight(context);

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.opaque,
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.fromLTRB(20, 8, 20, 24 + navHeight),
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Material(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: () => Navigator.of(context).maybePop(),
                    borderRadius: BorderRadius.circular(10),
                    child: const Padding(
                      padding: EdgeInsets.all(9),
                      child: Icon(
                        Icons.arrow_back,
                        size: 20,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 22),

              const Text(
                'Change Mobile Number',
                style: TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Enter your new number. We’ll verify with OTP for security.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.45,
                  color: AppColors.inkMuted,
                ),
              ),
              const SizedBox(height: 22),

              const _FieldLabel('Current Mobile Number'),
              const SizedBox(height: 8),
              _CurrentNumberField(mobile: _currentMobile),
              const SizedBox(height: 18),

              const _FieldLabel('New Mobile Number'),
              const SizedBox(height: 8),
              _NewNumberField(controller: _mobile),

              // Only worth saying once the number is otherwise valid.
              if (_valid && _isSameNumber) ...[
                const SizedBox(height: 8),
                const Text(
                  'This is already your current number.',
                  style: TextStyle(fontSize: 12, color: AppColors.negative),
                ),
              ],
              const SizedBox(height: 22),

              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _canSend ? _sendOtp : null,
                  child: const Text('Send OTP'),
                ),
              ),
              const SizedBox(height: 14),

              const Text(
                'A 6- digit code will be sent to your new mobile number '
                'via SMS.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  height: 1.5,
                  color: AppColors.inkSubtle,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.ink,
      ),
    );
  }
}

/// The number on file: greyed out, with the Verified badge.
class _CurrentNumberField extends StatelessWidget {
  const _CurrentNumberField({required this.mobile});

  final String mobile;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        // Flat grey rather than white, so it reads as fixed, not editable.
        color: AppColors.line.withValues(alpha: 0.45),
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          const Text(
            '+91',
            style: TextStyle(fontSize: 15, color: AppColors.inkMuted),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              mobile,
              style: const TextStyle(fontSize: 15, color: AppColors.inkMuted),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F6ED),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check, size: 12, color: AppColors.positive),
                SizedBox(width: 4),
                Text(
                  'Verified',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.positive,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Flag, dial code and the ten-digit entry, matching the sign-in field.
class _NewNumberField extends StatelessWidget {
  const _NewNumberField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.line),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Text('🇮🇳', style: TextStyle(fontSize: 20)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Padding(
                  padding: EdgeInsets.only(left: 14, right: 8),
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
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.ink,
                    ),
                    decoration: const InputDecoration(
                      hintText: '1234567890',
                      hintStyle: TextStyle(color: AppColors.inkSubtle),
                      border: InputBorder.none,
                      counterText: '',
                      contentPadding: EdgeInsets.symmetric(vertical: 13),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
