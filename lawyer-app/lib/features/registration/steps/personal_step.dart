import 'package:flutter/material.dart';

import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../registration_repository.dart';

/// Step 1 — name and contact details.
class PersonalStep extends StatefulWidget {
  const PersonalStep({
    super.key,
    required this.onChanged,
    this.initial,
    this.mobile,
  });

  /// Reports the step's data when complete, or null while something is
  /// missing — the shared footer enables Continue from it.
  final ValueChanged<PersonalInput?> onChanged;

  /// What was saved before, to prefill the form.
  final RegistrationSnapshot? initial;

  /// Ten digit number carried over from the OTP screen.
  final String? mobile;

  @override
  State<PersonalStep> createState() => _PersonalStepState();
}

class _PersonalStepState extends State<PersonalStep> {
  late final _name = TextEditingController(text: widget.initial?.fullName);
  late final _email = TextEditingController(text: widget.initial?.email);
  late final TextEditingController _phone;

  /// A verified number cannot be edited here; email / Google / Apple sign-ups
  /// have none yet, so they type it in.
  late final bool _phoneLocked;

  @override
  void initState() {
    super.initState();
    final saved = widget.initial?.mobile?.replaceFirst('+91', '');
    final known = saved ?? widget.mobile;
    _phoneLocked = known != null && known.isNotEmpty;
    _phone = TextEditingController(text: known);

    for (final controller in [_name, _email, _phone]) {
      controller.addListener(_report);
    }
    _report();
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  /// Pushes the data up after the frame, so the parent can rebuild safely.
  void _report() {
    if (mounted) setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onChanged(
        _isValid
            ? PersonalInput(
                fullName: _name.text.trim(),
                email: _email.text.trim(),
                mobile: _phoneLocked ? null : _phone.text.trim(),
              )
            : null,
      );
    });
  }

  bool get _correction => widget.initial?.isCorrection ?? false;

  /// A filled-in detail is read-only while the application is back for
  /// correction; a blank one can still be completed.
  bool _editable(String? saved) => !_correction || (saved ?? '').isEmpty;

  bool get _isValid =>
      Validators.name(_name.text) == null &&
      Validators.email(_email.text) == null &&
      (_phoneLocked || Validators.mobile(_phone.text) == null);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppTextField(
          label: 'Full Name',
          hint: 'Enter your full name',
          controller: _name,
          enabled: _editable(widget.initial?.fullName),
          textCapitalization: TextCapitalization.words,
          validator: Validators.name,
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Phone',
          hint: 'Enter your mobile number',
          controller: _phone,
          enabled: !_phoneLocked,
          keyboardType: TextInputType.phone,
          maxLength: 10,
          validator: _phoneLocked ? null : Validators.mobile,
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Email Address',
          hint: 'Enter your email Address',
          controller: _email,
          enabled: _editable(widget.initial?.email),
          keyboardType: TextInputType.emailAddress,
          validator: Validators.email,
        ),
      ],
    );
  }
}
