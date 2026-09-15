import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/validators.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/upload_field.dart';

/// Replaces the payout account. Mirrors the registration bank step, so the
/// same details are collected and checked the same way.
class ChangeBankScreen extends StatefulWidget {
  const ChangeBankScreen({super.key});

  @override
  State<ChangeBankScreen> createState() => _ChangeBankScreenState();
}

class _ChangeBankScreenState extends State<ChangeBankScreen> {
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
      controller.addListener(() => setState(() {}));
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

  /// Re-typing the account number guards against a typo in a field that is
  /// long enough to mis-read.
  String? _confirmError(String value) {
    if (value.trim().isEmpty) return 'Re-enter your account number';
    if (value.trim() != _account.text.trim()) {
      return 'Account numbers do not match';
    }
    return null;
  }

  bool get _canContinue =>
      Validators.name(_holder.text) == null &&
      Validators.accountNumber(_account.text) == null &&
      _confirmError(_confirmAccount.text) == null &&
      Validators.ifsc(_ifsc.text) == null &&
      _bank != null &&
      _proof != null;

  void _submit() {
    // Captured before popping: afterwards this route's context is gone.
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    // TODO: save the new account through the backend.
    navigator.pop();
    messenger.showSnackBar(
      const SnackBar(content: Text('Bank account updated')),
    );
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
              'Change Bank',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Enter your new bank details.',
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
            const SizedBox(height: 20),

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
              onChanged: (value) => setState(() => _bank = value),
            ),
            const SizedBox(height: 16),

            // Only needed for international transfers, so it stays optional.
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
              helper: 'Max Size 2 MB (PNG oe JPEG)',
              maxSizeMb: 2,
              onChanged: (file) => setState(() => _proof = file),
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: _canContinue ? _submit : null,
                child: const Text('Continue'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
