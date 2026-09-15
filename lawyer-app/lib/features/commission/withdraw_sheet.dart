import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import 'withdraw_success_screen.dart';

/// Transfer the available balance to the registered bank account.
class WithdrawSheet extends StatefulWidget {
  const WithdrawSheet({super.key, required this.available});

  final double available;

  @override
  State<WithdrawSheet> createState() => _WithdrawSheetState();
}

class _WithdrawSheetState extends State<WithdrawSheet> {
  static const _minimum = 500.0;
  static const _processingFee = 50.0;

  final _amount = TextEditingController();

  @override
  void initState() {
    super.initState();
    _amount.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  double get _entered => double.tryParse(_amount.text.trim()) ?? 0;

  /// The fee comes off the top, so this is what actually lands in the bank.
  double get _receivable =>
      _entered <= 0 ? 0 : (_entered - _processingFee).clamp(0, _entered);

  bool get _canSubmit => _entered >= _minimum && _entered <= widget.available;

  void _submit() {
    final amount = _entered;

    // TODO: request the withdrawal through the backend.
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => WithdrawSuccessScreen(
          amount: '₹${_thousands(amount)}',
          bankName: 'HDFC Bank',
          accountNumber: '**** **** 1234',
          reference: 'TNX-45676234',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Withdraw Earnings',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Transfer your available earning to your '
                                'register bank account.',
                                style: TextStyle(
                                  fontSize: 11,
                                  height: 1.4,
                                  color: AppColors.inkSubtle,
                                ),
                              ),
                            ],
                          ),
                        ),
                        InkWell(
                          onTap: () => Navigator.of(context).maybePop(),
                          borderRadius: BorderRadius.circular(20),
                          child: const Padding(
                            padding: EdgeInsets.all(4),
                            child: Icon(
                              Icons.close,
                              size: 18,
                              color: AppColors.inkMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.canvas,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Available to withdraw',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.inkMuted,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '₹${_thousands(widget.available)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.positive,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Withdraw amount',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _amount,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.ink,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Enter amount',
                        hintStyle: const TextStyle(
                          fontSize: 14,
                          color: AppColors.inkSubtle,
                        ),
                        filled: true,
                        fillColor: AppColors.surface,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 14,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.line),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.brand),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Minimum ₹${_thousands(_minimum)} · '
                      'Maximum ₹${_thousands(widget.available)}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Bank Account',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.account_balance,
                            size: 18,
                            color: AppColors.negative,
                          ),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'HDFC Bank  **** 5421',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.ink,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Rajesh Kumar',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppColors.inkSubtle,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Text(
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
                    const SizedBox(height: 16),

                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: Column(
                        children: [
                          const Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Withdraw Summary',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          _SummaryRow(
                            label: 'Withdraw amount',
                            value: '₹${_thousands(_entered)}',
                          ),
                          _SummaryRow(
                            label: 'Processing fee',
                            value: '₹${_thousands(_processingFee)}',
                          ),
                          const Divider(height: 18, color: AppColors.line),
                          _SummaryRow(
                            label: "You'll receive",
                            value: '₹${_thousands(_receivable)}',
                            emphasise: true,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.brandSoft,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.info_outline,
                            size: 14,
                            color: AppColors.brand,
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Amount will be transferred to your registered '
                              'bank account. Processing may take 3-7 business '
                              'days.',
                              style: TextStyle(
                                fontSize: 10,
                                height: 1.5,
                                color: AppColors.inkMuted,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _canSubmit ? _submit : null,
                  child: Text(
                    _entered > 0
                        ? 'Withdraw ₹${_thousands(_entered)}'
                        : 'Withdraw',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.emphasise = false,
  });

  final String label;
  final String value;
  final bool emphasise;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: emphasise ? FontWeight.w600 : FontWeight.w400,
                color: emphasise ? AppColors.ink : AppColors.inkMuted,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: emphasise ? 13 : 11,
              fontWeight: emphasise ? FontWeight.w700 : FontWeight.w500,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

/// 12450 -> "12,450". Amounts here are whole rupees.
String _thousands(double value) {
  final digits = value.round().toString();
  final buffer = StringBuffer();

  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write(',');
    buffer.write(digits[i]);
  }

  return buffer.toString();
}
