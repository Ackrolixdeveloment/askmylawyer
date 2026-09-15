import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import 'referral_data.dart';

/// Invite other lawyers and track what those referrals have earned.
class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key, this.data = activeReferral});

  /// Pass [freshReferral] for an account that has not referred anyone yet.
  final ReferralData data;

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  final _search = TextEditingController();

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

  List<ReferralEarning> get _visible {
    final query = _search.text.trim().toLowerCase();
    if (query.isEmpty) return widget.data.earnings;

    return widget.data.earnings
        .where(
          (earning) =>
              earning.lawyer.toLowerCase().contains(query) ||
              earning.referralId.toLowerCase().contains(query),
        )
        .toList();
  }

  void _copyLink() {
    Clipboard.setData(ClipboardData(text: widget.data.inviteLink));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Invite link copied')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.data;

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
          'Referral',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 4, 14, 24),
        children: data.isFresh ? _invite(data) : _earnings(data),
      ),
    );
  }

  /// First run: explain the scheme and hand over the link.
  List<Widget> _invite(ReferralData data) {
    return [
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Invite . Collaborate .\nEarn Rewards.',
              style: TextStyle(
                fontSize: 22,
                height: 1.35,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'For every lawyer who joins and completes their first '
              'consultation.',
              style: TextStyle(
                fontSize: 11,
                height: 1.5,
                color: Color(0xFFB6C0D4),
              ),
            ),
            const SizedBox(height: 22),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'EARN',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFFB6C0D4),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '₹${data.rewardPerReferral}',
                        // Amounts sit a step below the headings.
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Per Successful Referral',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFFB6C0D4),
                        ),
                      ),
                    ],
                  ),
                ),
                // Faded so it reads as a watermark behind the reward.
                Opacity(
                  opacity: 0.45,
                  child: Image.asset(
                    'assets/images/justice-emblem.png',
                    width: 56,
                    height: 56,
                    filterQuality: FilterQuality.high,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      const SizedBox(height: 14),

      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'How it works',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 14),
            _Step(icon: Icons.person_outline, label: 'Share your invite link'),
            _Step(
              icon: Icons.check_circle_outline,
              label: 'Lawyer completes registration & KYC',
            ),
            _Step(
              icon: Icons.assignment_outlined,
              label: 'Lawyer completes first consultation',
            ),
            _Step(
              icon: Icons.currency_rupee,
              label: '₹${data.rewardPerReferral} credited to your wallet',
              last: true,
            ),
          ],
        ),
      ),
      const SizedBox(height: 14),

      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your Invite Link',
              style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.fromLTRB(12, 6, 6, 6),
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      data.inviteLink,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.inkMuted,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _copyLink,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 9,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.ink,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Copy',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 46,
              // TODO: open the platform share sheet.
              child: FilledButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.send_outlined, size: 16),
                label: const Text('Share'),
              ),
            ),
          ],
        ),
      ),
    ];
  }

  /// Once referrals have paid out: the total, the counts, and the list.
  List<Widget> _earnings(ReferralData data) {
    final visible = _visible;

    return [
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'EARNED',
                    style: TextStyle(fontSize: 11, color: Color(0xFFB6C0D4)),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '₹${data.earned}',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            Opacity(
              opacity: 1.0,
              child: Image.asset(
                'assets/images/justice-emblem.png',
                width: 66,
                height: 66,
                filterQuality: FilterQuality.high,
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 12),

      Row(
        children: [
          Expanded(
            child: _CountCard(
              value: '${data.totalReferrals}',
              label: 'Total Referrals',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _CountCard(
              value: '${data.activeLawyers}',
              label: 'Active Lawyers',
            ),
          ),
        ],
      ),
      const SizedBox(height: 14),

      TextField(
        controller: _search,
        style: const TextStyle(fontSize: 13),
        decoration: InputDecoration(
          hintText: 'Search by lawyer name or referral ID',
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
      const SizedBox(height: 16),

      const Text(
        'Referral Earnings',
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
        ),
      ),
      const SizedBox(height: 10),

      if (visible.isEmpty)
        const Padding(
          padding: EdgeInsets.only(top: 30),
          child: Text(
            'No referrals match your search.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
          ),
        )
      else
        for (final earning in visible) _EarningCard(earning: earning),
    ];
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.icon, required this.label, this.last = false});

  final IconData icon;
  final String label;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 14),
      child: Row(
        children: [
          Icon(icon, size: 17, color: AppColors.inkSubtle),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.inkSubtle),
            ),
          ),
        ],
      ),
    );
  }
}

class _CountCard extends StatelessWidget {
  const _CountCard({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFE9EDF4),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.inkMuted),
          ),
        ],
      ),
    );
  }
}

class _EarningCard extends StatelessWidget {
  const _EarningCard({required this.earning});

  final ReferralEarning earning;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Referral Reward',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.inkMuted,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '₹${earning.amount}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.positive,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: earning.lawyer,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const TextSpan(text: '  '),
                TextSpan(
                  text: '(${earning.referralId})',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  earning.status,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ),
              Text(
                earning.when,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.inkSubtle,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
