import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../account/account_repository.dart';
import '../../core/validators.dart';
import 'verify_mobile_screen.dart';

/// Swaps the account's mobile number, verified by OTP on the new one.
class ChangeMobileScreen extends StatefulWidget {
  const ChangeMobileScreen({super.key, required this.currentNumber});

  /// Shown read-only; it is already verified.
  final String currentNumber;

  @override
  State<ChangeMobileScreen> createState() => _ChangeMobileScreenState();
}

class _ChangeMobileScreenState extends State<ChangeMobileScreen> {
  final _mobile = TextEditingController();
  bool _sending = false;

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

  String? get _error => Validators.mobile(_mobile.text);

  /// The new number must be valid and actually different.
  bool get _canSend =>
      _error == null &&
      !_sending &&
      _mobile.text.trim() != widget.currentNumber;

  Future<void> _sendOtp() async {
    final mobile = _mobile.text.trim();
    setState(() => _sending = true);

    int? resendAfter;
    try {
      resendAfter = await AccountRepository.instance.sendMobileOtp(mobile);
    } on ApiException catch (error) {
      // A code sent moments ago is still valid, so carry on with it.
      if (error.code != 'OTP_COOLDOWN') {
        if (!mounted) return;
        setState(() => _sending = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
        return;
      }
    }

    if (!mounted) return;
    setState(() => _sending = false);

    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => VerifyMobileScreen(
          mobile: mobile,
          resendAfterSeconds: resendAfter ?? 24,
        ),
      ),
    );

    // The number is saved — hand the result back to settings.
    if (changed == true && mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: InkWell(
                onTap: () => Navigator.of(context).maybePop(),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: const Icon(
                    Icons.arrow_back,
                    size: 18,
                    color: AppColors.ink,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'Change Mobile Number',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              "Enter your new number. We'll verify with OTP for security.",
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppColors.inkSubtle,
              ),
            ),
            const SizedBox(height: 20),

            const _Label('Current Mobile Number'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
              decoration: BoxDecoration(
                // Greyed out, since it cannot be edited here.
                color: const Color(0xFFE9EDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  Text(
                    '+91  ${widget.currentNumber}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.inkMuted,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.positive.withValues(alpha: 0.12),
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
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.positive,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            const _Label('New Mobile Number'),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: const Text('🇮🇳', style: TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  // The code sits outside the field: as a prefixText it only
                  // appears once the field has focus.
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.line),
                    ),
                    child: Row(
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(left: 12, right: 8),
                          child: Text(
                            '+91',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.inkMuted,
                            ),
                          ),
                        ),
                        Expanded(
                          child: TextField(
                            controller: _mobile,
                            keyboardType: TextInputType.phone,
                            maxLength: 10,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.ink,
                            ),
                            decoration: const InputDecoration(
                              hintText: '1234567890',
                              hintStyle: TextStyle(
                                fontSize: 14,
                                color: AppColors.inkSubtle,
                              ),
                              border: InputBorder.none,
                              counterText: '',
                              isDense: true,
                              contentPadding: EdgeInsets.symmetric(
                                vertical: 14,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Only nag once enough digits are in to judge the number.
            if (_mobile.text.length >= 10 && _error != null) ...[
              const SizedBox(height: 6),
              Text(
                _error!,
                style: const TextStyle(fontSize: 11, color: AppColors.negative),
              ),
            ],
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: _canSend ? _sendOtp : null,
                child: _sending
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Send OTP'),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'A 6- digit code will be sent to your\nnew mobile number via SMS.',
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
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
        ),
      ),
    );
  }
}
