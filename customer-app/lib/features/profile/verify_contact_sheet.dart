import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/validators.dart';
import '../../core/widgets/form_fields.dart';
import '../auth/customer_session.dart';

/// Changes the email address or mobile number already on the account.
///
/// The code goes to the new one, never the old: being able to read the new
/// inbox is the whole proof. Returns true once the change has gone through.
Future<bool> showVerifyContactSheet({
  required BuildContext context,
  required bool isEmail,
  required String current,
}) async {
  final changed = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    // Same reason as the edit sheets: the tab's own navigator sits under
    // the bottom nav, which would otherwise paint over the buttons.
    useRootNavigator: true,
    builder: (_) => _VerifySheet(isEmail: isEmail, current: current),
  );
  return changed ?? false;
}

class _VerifySheet extends StatefulWidget {
  const _VerifySheet({required this.isEmail, required this.current});

  final bool isEmail;
  final String current;

  @override
  State<_VerifySheet> createState() => _VerifySheetState();
}

class _VerifySheetState extends State<_VerifySheet> {
  final _value = TextEditingController();
  final _otp = TextEditingController();

  /// False while they are typing the new address, true once a code is out.
  bool _codeSent = false;
  bool _busy = false;
  String? _error;

  /// Seconds until another code may be asked for.
  int _resendIn = 0;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    // The button enables itself as they type, so both fields have to
    // repaint it.
    for (final field in [_value, _otp]) {
      field.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _value.dispose();
    _otp.dispose();
    super.dispose();
  }

  String get _noun => widget.isEmail ? 'email address' : 'mobile number';

  String? get _valueError => widget.isEmail
      ? Validators.email(_value.text)
      : Validators.mobile(_value.text);

  void _countdown(int seconds) {
    _ticker?.cancel();
    setState(() => _resendIn = seconds);
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return timer.cancel();
      setState(() => _resendIn -= 1);
      if (_resendIn <= 0) timer.cancel();
    });
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    final value = _value.text.trim();
    try {
      await CustomerSession.instance.sendContactOtp(
        email: widget.isEmail ? value : null,
        mobile: widget.isEmail ? null : value,
      );
      if (!mounted) return;
      setState(() => _codeSent = true);
      _countdown(20);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    final value = _value.text.trim();
    try {
      await CustomerSession.instance.verifyContactOtp(
        otp: _otp.text.trim(),
        email: widget.isEmail ? value : null,
        mobile: widget.isEmail ? null : value,
      );
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final inset = media.viewInsets.bottom;
    final safeBottom = inset > 0 ? 0.0 : media.padding.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: inset),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 12, 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Change ${widget.isEmail ? 'Email' : 'Mobile Number'}',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close, size: 20),
                    color: AppColors.ink,
                  ),
                ],
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + safeBottom),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _codeSent
                        ? 'We sent a 6-digit code to ${_value.text.trim()}. '
                              'Enter it to finish the change.'
                        : 'Your $_noun is currently ${widget.current}. '
                              'We will send a code to the new one to confirm '
                              'it reaches you.',
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                  const SizedBox(height: 18),

                  if (!_codeSent)
                    AppTextField(
                      label: 'New ${widget.isEmail ? 'Email Address' : 'Mobile Number'}',
                      hint: widget.isEmail
                          ? 'Enter your new email address'
                          : 'Enter your new 10-digit number',
                      controller: _value,
                      required: true,
                      keyboardType: widget.isEmail
                          ? TextInputType.emailAddress
                          : TextInputType.phone,
                      inputFormatters: widget.isEmail
                          ? null
                          : [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(10),
                            ],
                      validator: (value) => value.trim().isEmpty
                          ? null
                          : (widget.isEmail
                                ? Validators.email(value)
                                : Validators.mobile(value)),
                    )
                  else
                    AppTextField(
                      label: 'Verification Code',
                      hint: '6-digit code',
                      controller: _otp,
                      required: true,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(6),
                      ],
                    ),

                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.negative,
                      ),
                    ),
                  ],

                  if (_codeSent) ...[
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: _busy || _resendIn > 0 ? null : _send,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(0, 32),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          _resendIn > 0
                              ? 'Resend code in ${_resendIn}s'
                              : 'Resend code',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 18),
                  SizedBox(
                    height: 52,
                    child: FilledButton(
                      onPressed: _busy || !_ready ? null : (_codeSent ? _verify : _send),
                      child: _busy
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(_codeSent ? 'Confirm' : 'Send code'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool get _ready => _codeSent
      ? _otp.text.trim().length == 6
      : _value.text.trim().isNotEmpty && _valueError == null;
}
