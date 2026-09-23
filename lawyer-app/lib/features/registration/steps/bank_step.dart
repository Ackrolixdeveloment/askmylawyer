import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import '../../../core/options.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/upload_field.dart';
import '../document_preview.dart';
import '../registration_repository.dart';

/// Step 4 — the account earnings are paid into.
class BankStep extends StatefulWidget {
  const BankStep({super.key, required this.onChanged, this.initial});

  /// Reports the step's data when complete, or null while something is
  /// missing — the shared footer enables Continue from it.
  final ValueChanged<BankInput?> onChanged;

  /// What was saved before, to prefill the form.
  final RegistrationSnapshot? initial;

  @override
  State<BankStep> createState() => _BankStepState();
}

class _BankStepState extends State<BankStep> {
  static const _banks = LawyerOptions.banks;

  late final _holder = TextEditingController(
    text: widget.initial?.accountHolderName,
  );
  // The account number is stored encrypted and never sent back. Leaving both
  // fields blank keeps whatever is on file.
  final _account = TextEditingController();
  final _confirmAccount = TextEditingController();

  /// Read-only once the admin has approved this section.
  bool get _editable => widget.initial?.canEditSection('Bank Details') ?? true;

  String? get _savedAccount => widget.initial?.accountNumberMasked;
  bool get _keepingSavedAccount =>
      _savedAccount != null && _account.text.trim().isEmpty;
  late final _ifsc = TextEditingController(text: widget.initial?.ifscCode);
  late final _swift = TextEditingController(text: widget.initial?.swiftCode);

  late String? _bank = _banks.contains(widget.initial?.bankName)
      ? widget.initial?.bankName
      : null;
  late PickedDocument? _proof = widget.initial?.bankProof?.toPicked();

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
    _report();
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

  /// Pushes the data up after the frame, so the parent can rebuild safely.
  void _report() {
    if (mounted) setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onChanged(
        _isValid
            ? BankInput(
                accountHolderName: _holder.text.trim(),
                accountNumber: _keepingSavedAccount
                    ? null
                    : _account.text.trim(),
                confirmAccountNumber: _keepingSavedAccount
                    ? null
                    : _confirmAccount.text.trim(),
                ifscCode: _ifsc.text.trim().toUpperCase(),
                bankName: _bank!,
                swiftCode: _swift.text.trim().toUpperCase(),
                proof: _proof!,
              )
            : null,
      );
    });
  }

  /// Re-typing the account number guards against a typo in a field that is
  /// masked to the eye by its own length.
  String? _confirmError(String value) {
    if (_keepingSavedAccount) return null;
    if (value.trim().isEmpty) return 'Re-enter your account number';
    if (value.trim() != _account.text.trim()) {
      return 'Account numbers do not match';
    }
    return null;
  }

  // SWIFT is only needed for international transfers, so it stays optional.
  bool get _isValid =>
      Validators.name(_holder.text) == null &&
      (_keepingSavedAccount ||
          Validators.accountNumber(_account.text) == null) &&
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
          enabled: _editable,
          required: true,
          textCapitalization: TextCapitalization.words,
          validator: Validators.name,
        ),
        const SizedBox(height: 16),

        AppTextField(
          label: 'Account Number',
          hint: 'Enter bank account number',
          controller: _account,
          enabled: _editable,
          keyboardType: TextInputType.number,
          required: true,
          maxLength: 18,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          helper: _savedAccount == null
              ? null
              : _editable
              ? 'Saved: $_savedAccount · leave blank to keep it'
              : 'Saved: $_savedAccount · approved by our team',
          validator: _keepingSavedAccount ? null : Validators.accountNumber,
        ),
        const SizedBox(height: 16),

        AppTextField(
          label: 'Confirm Account Number',
          hint: 'Enter bank account number',
          controller: _confirmAccount,
          enabled: _editable,
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
          enabled: _editable,
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
          onChanged: _editable
              ? (value) {
                  setState(() => _bank = value);
                  _report();
                }
              : null,
        ),
        const SizedBox(height: 16),

        AppTextField(
          label: 'SWIFT Code',
          hint: 'Enter SWIFT code',
          controller: _swift,
          enabled: _editable,
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
          initialFile: _proof,
          readOnly: !_editable,
          onPreview: (file) => openDocumentPreview(
            context,
            title: 'Proof of Bank Account',
            file: file,
            documentType: 'bank_proof',
          ),
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
