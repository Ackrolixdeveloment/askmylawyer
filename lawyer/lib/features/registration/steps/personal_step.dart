import 'package:flutter/material.dart';

import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';

/// Step 1 — name and contact details.
class PersonalStep extends StatefulWidget {
  const PersonalStep({super.key, required this.onValidChanged, this.mobile});

  /// Reports whether the step is complete, so the shared footer can enable
  /// its Continue button.
  final ValueChanged<bool> onValidChanged;
  final String? mobile;

  @override
  State<PersonalStep> createState() => _PersonalStepState();
}

class _PersonalStepState extends State<PersonalStep> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  late final TextEditingController _phone;

  @override
  void initState() {
    super.initState();
    _phone = TextEditingController(text: widget.mobile ?? '1234567890');
    _name.addListener(_report);
    _email.addListener(_report);
  }

  /// Pushes validity up after the frame, so the parent can rebuild safely.
  void _report() {
    setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) widget.onValidChanged(_isValid);
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  bool get _isValid =>
      Validators.name(_name.text) == null &&
      Validators.email(_email.text) == null;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppTextField(
          label: 'Full Name',
          hint: 'Enter your full name',
          controller: _name,
          textCapitalization: TextCapitalization.words,
          validator: Validators.name,
        ),
        const SizedBox(height: 16),
        // The number is already verified, so it cannot be edited here.
        AppTextField(
          label: 'Phone',
          hint: '',
          controller: _phone,
          enabled: false,
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Email Address',
          hint: 'Enter your email Address',
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          validator: Validators.email,
        ),
      ],
    );
  }
}
