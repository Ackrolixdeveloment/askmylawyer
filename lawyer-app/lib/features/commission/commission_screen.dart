import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'commission_data.dart';
import 'earning_detail_screen.dart';
import 'withdraw_sheet.dart';

/// Earnings summary plus the recent consultation payouts.
class CommissionScreen extends StatefulWidget {
  const CommissionScreen({super.key, this.data = commissionSample});

  final CommissionData data;

  @override
  State<CommissionScreen> createState() => _CommissionScreenState();
}

class _CommissionScreenState extends State<CommissionScreen> {
  final _search = TextEditingController();

  /// History splits into what came in and what was taken out.
  bool _showWithdraws = false;

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<Earning> get _visible {
    final query = _search.text.trim().toLowerCase();
    if (query.isEmpty) return widget.data.recent;

    return widget.data.recent
        .where((item) => item.client.toLowerCase().contains(query))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final visible = _visible;

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 24),
      children: [
        const Text(
          'Commission & Earnings',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'Track your consultation income',
          style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
        ),
        const SizedBox(height: 14),

        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _search,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search by client name or booking ID...',
                  hintStyle: const TextStyle(
                    fontSize: 13,
                    color: AppColors.inkSubtle,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 18,
                    color: AppColors.inkSubtle,
                  ),
                  filled: true,
                  fillColor: AppColors.surface,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.line),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.brand),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.ink,
                borderRadius: BorderRadius.circular(10),
              ),
              // TODO: open the earnings filters.
              child: const Icon(Icons.tune, size: 18, color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Balance leads, so the amount that can be withdrawn is the first
        // thing read.
        SizedBox(
          height: 108,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _BalanceCard(
                  amount: data.creditBalance,
                  onWithdraw: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          WithdrawSheet(available: data.creditBalance),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  label: 'Under Process',
                  amount: data.underProcess,
                  amountColor: AppColors.negative,
                  caption: '${data.underProcessCount} consultations',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  label: 'This Month',
                  amount: data.thisMonth,
                  amountColor: AppColors.positive,
                  caption: '${data.thisMonthSessions} sessions',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        Row(
          children: [
            const Expanded(
              child: Text(
                'History',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
            ),
            if (widget.data.recent.isNotEmpty)
              const Text(
                'View All',
                style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
              ),
          ],
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            _HistoryTab(
              label: 'Earnings',
              selected: !_showWithdraws,
              onTap: () => setState(() => _showWithdraws = false),
            ),
            const SizedBox(width: 8),
            _HistoryTab(
              label: 'Withdraws',
              selected: _showWithdraws,
              onTap: () => setState(() => _showWithdraws = true),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (_showWithdraws)
          const Padding(
            padding: EdgeInsets.only(top: 40),
            child: Text(
              'No withdrawals yet.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          )
        else if (visible.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 40),
            child: Text(
              'No earnings to show yet.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          )
        else
          for (final earning in visible) _EarningCard(earning: earning),
      ],
    );
  }
}

/// Pill tab switching the history list between earnings and withdrawals.
class _HistoryTab extends StatelessWidget {
  const _HistoryTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.ink : AppColors.line),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: selected ? Colors.white : AppColors.inkMuted,
          ),
        ),
      ),
    );
  }
}

/// The dark card: what the lawyer can actually take out.
class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.amount, required this.onWithdraw});

  final double amount;
  final VoidCallback onWithdraw;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Credit  balance',
            style: TextStyle(fontSize: 11, color: Color(0xFFB6C0D4)),
          ),
          Text(
            '₹${_thousands(amount)}',
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          InkWell(
            onTap: onWithdraw,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Withdraw',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.amount,
    required this.amountColor,
    required this.caption,
  });

  final String label;
  final double amount;
  final Color amountColor;
  final String caption;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.inkMuted),
          ),
          Text(
            '₹${_thousands(amount)}',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: amountColor,
            ),
          ),
          Text(
            caption,
            style: const TextStyle(fontSize: 10, color: AppColors.inkSubtle),
          ),
        ],
      ),
    );
  }
}

class _EarningCard extends StatelessWidget {
  const _EarningCard({required this.earning});

  final Earning earning;

  @override
  Widget build(BuildContext context) {
    final paid = earning.state == PayoutState.paidOut;

    return InkWell(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => EarningDetailScreen(earning: earning),
        ),
      ),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.line),
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 34,
                  height: 34,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.canvas,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    earning.initials,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        earning.client,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Text(
                            earning.practice,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.inkSubtle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.videocam_outlined,
                            size: 12,
                            color: AppColors.inkSubtle,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            earning.medium,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.inkSubtle,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // A paid-out amount is money in hand, so it reads green.
                Text(
                  paid
                      ? '+₹${_thousands(earning.amount)}'
                      : _thousands(earning.amount),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: paid ? AppColors.positive : AppColors.ink,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  '${earning.date} . ${earning.time}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '${earning.durationMinutes} min',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
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
              ],
            ),
          ],
        ),
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
