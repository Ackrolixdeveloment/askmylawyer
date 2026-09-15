import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/upload_field.dart';

/// Step 4 — the account earnings are paid into.
class BankStep extends StatefulWidget {
  const BankStep({super.key, required this.onValidChanged});

  /// Reports whether the step is complete, so the shared footer can enable
  /// its Continue button.
  final ValueChanged<bool> onValidChanged;

  @override
  State<BankStep> createState() => _BankStepState();
}

class _BankStepState extends State<BankStep> {
  static const _banks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Kotak Mahindra Bank',
    'Canara Bank',
    'Union Bank of India',
    'IndusInd Bank',
  ];

  final _holder = TextEditingController();
  final _account = TextEditingController();
  final _confirmAccount = TextEditingController();
  final _ifsc = TextEditingController();
  final _swift = TextEditingController();

  String? _bank;
  PickedDocument? _proof;

  @override
  void initState() {
    super.initState();
    for (final controller in [
      _holder,
      _account,
      _confirmAccount,
      _ifsc,
      _swift,
    ]) {
      controller.addListener(_report);
    }
  }

  @override
  void dispose() {
    _holder.dispose();
    _account.dispose();
    _confirmAccount.dispose();
    _ifsc.dispose();
    _swift.dispose();
    super.dispose();
  }

  /// Pushes validity up after the frame, so the parent can rebuild safely.
  void _report() {
    setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) widget.onValidChanged(_isValid);
    });
  }

  /// Re-typing the account number guards against a typo in a field that is
  /// masked to the eye by its own length.
  String? _confirmError(String value) {
    if (value.trim().isEmpty) return 'Re-enter your account number';
    if (value.trim() != _account.text.trim()) {
      return 'Account numbers do not match';
    }
    return null;
  }

  // SWIFT is only needed for international transfers, so it stays optional.
  bool get _isValid =>
      Validators.name(_holder.text) == null &&
      Validators.accountNumber(_account.text) == null &&
      _confirmError(_confirmAccount.text) == null &&
      Validators.ifsc(_ifsc.text) == null &&
      _bank != null &&
      _proof != null;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppTextField(
          label: 'Account Holder Name',
          hint: 'Enter account holder name',
          controller: _holder,
          required: true,
          textCapitalization: TextCapitalization.words,
          validator: Validators.name,
        ),
        const SizedBox(height: 16),

        AppTextField(
          label: 'Account Number',
          hint: 'Enter bank account number',
          controller: _account,
          keyboardType: TextInputType.number,
          required: true,
          maxLength: 18,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          validator: Validators.accountNumber,
        ),
        const SizedBox(height: 16),

        AppTextField(
          label: 'Confirm Account Number',
          hint: 'Enter bank account number',
          controller: _confirmAccount,
          keyboardType: TextInputType.number,
          required: true,
          maxLength: 18,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          validator: _confirmError,
        ),
        const SizedBox(height: 16),

        AppTextField(
          label: 'IFSC Code',
          hint: 'Enter IFSC code',
          controller: _ifsc,
          required: true,
          maxLength: 11,
          textCapitalization: TextCapitalization.characters,
          inputFormatters: [UpperCaseTextFormatter()],
          validator: Validators.ifsc,
        ),
        const SizedBox(height: 16),

        AppSelectField(
          label: 'Bank Name',
          required: true,
          options: _banks,
          value: _bank,
          onChanged: (value) {
            setState(() => _bank = value);
            _report();
          },
        ),
        const SizedBox(height: 16),

        AppTextField(
          label: 'SWIFT Code',
          hint: 'Enter SWIFT code',
          controller: _swift,
          maxLength: 11,
          textCapitalization: TextCapitalization.characters,
          inputFormatters: [UpperCaseTextFormatter()],
        ),
        const SizedBox(height: 16),

        UploadField(
          label: 'Proof of Bank Account',
          required: true,
          placeholder: 'Upload Cancelled Cheque',
          helper: 'Max Size 2 MB (PNG or JPEG)',
          maxSizeMb: 2,
          onChanged: (file) {
            setState(() => _proof = file);
            _report();
          },
        ),
        const SizedBox(height: 8),

        const Text(
          'We send ₹1 to confirm the account, then reverse it.',
          style: TextStyle(fontSize: 10, color: AppColors.inkSubtle),
        ),
      ],
    );
  }
}
