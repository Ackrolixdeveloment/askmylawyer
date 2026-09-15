import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'commission_data.dart';

/// Full breakdown of a single consultation payout.
class EarningDetailScreen extends StatelessWidget {
  const EarningDetailScreen({super.key, required this.earning});

  final Earning earning;

  @override
  Widget build(BuildContext context) {
    final paid = earning.state == PayoutState.paidOut;
    final lawyerEarnings = earning.customerPaid - earning.platformFee;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.chevron_left, size: 26),
          color: AppColors.ink,
        ),
        title: const Text(
          'Earnings details',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 4, 14, 0),
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 22),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: paid ? AppColors.ink : AppColors.canvas,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          paid ? 'Paid out' : 'Pending',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: paid ? Colors.white : AppColors.inkMuted,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        '₹${_thousands(earning.amount)}',
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${earning.date} . ${earning.time}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                const _SectionTitle('Consultation Information'),
                _DetailCard(
                  rows: [
                    ('Client Name', earning.client, null),
                    ('Category', earning.practice, null),
                    ('Case Tag', earning.caseTag, null),
                    ('Mode', 'Video Consultation', null),
                    ('Duration', '${earning.durationMinutes} min', null),
                  ],
                ),
                const SizedBox(height: 18),

                const _SectionTitle('Commission Breakdown'),
                _DetailCard(
                  rows: [
                    (
                      'Customer Paid',
                      '₹${_thousands(earning.customerPaid)}',
                      null,
                    ),
                    // The platform's cut comes off, so it reads as a deduction.
                    (
                      'Platform fee (${earning.platformFeePercent}%)',
                      '-₹${_thousands(earning.platformFee)}',
                      AppColors.negative,
                    ),
                    ('Lawyer Earnings', '₹${_thousands(lawyerEarnings)}', null),
                  ],
                ),
                const SizedBox(height: 18),

                const _SectionTitle('Payout Information'),
                _DetailCard(
                  rows: [
                    ('Status', paid ? 'Paid Out' : 'Pending', null),
                    ('Bank Account', earning.bankAccount, null),
                    ('Reference ID', earning.reference, null),
                    ('Payout Date', earning.payoutDate, null),
                  ],
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 16),
            child: SizedBox(
              width: double.infinity,
              // TODO: generate and save the invoice.
              child: FilledButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.download, size: 18),
                label: const Text('Download Invoice'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
        ),
      ),
    );
  }
}

/// Label/value rows in a card, divided by hairlines. The optional colour
/// highlights a value such as a deduction.
class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.rows});

  final List<(String, String, Color?)> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0)
              const Divider(height: 1, thickness: 1, color: AppColors.line),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      rows[i].$1,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ),
                  Text(
                    rows[i].$2,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: rows[i].$3 ?? AppColors.ink,
                    ),
                  ),
                ],
              ),
            ),
          ],
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
