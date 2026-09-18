import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'referral_data.dart';

/// Who has signed up on your code, and what each one earned.
class TrackInvitesScreen extends StatelessWidget {
  const TrackInvitesScreen({super.key, required this.data});

  final ReferralData data;

  @override
  Widget build(BuildContext context) {
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
          'Track your invites',
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
        children: [
          _EarnedCard(amount: data.earned),
          const SizedBox(height: 14),

          SizedBox(
            height: 46,
            child: OutlinedButton.icon(
              // Returns to the invite screen behind this one.
              onPressed: () => Navigator.of(context).maybePop(),
              icon: const Icon(Icons.share_outlined, size: 16),
              label: const Text('Invite more friends'),
              style: OutlinedButton.styleFrom(
                backgroundColor: AppColors.surface,
                foregroundColor: AppColors.ink,
                side: const BorderSide(color: AppColors.line),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),

          if (data.invites.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 60),
              child: Text(
                'No invites yet. Share your code to get started.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
              ),
            )
          else
            for (final invite in data.invites) _InviteRow(invite: invite),
        ],
      ),
    );
  }
}

/// Dark total with the brand emblem watermarked behind it.
class _EarnedCard extends StatelessWidget {
  const _EarnedCard({required this.amount});

  final int amount;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Earned Till Date',
                  style: TextStyle(fontSize: 12, color: Color(0xFFB6C0D4)),
                ),
                const SizedBox(height: 8),
                Text(
                  '₹$amount',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Opacity(
            opacity: 0.22,
            child: Image.asset(
              'assets/images/justice-emblem.png',
              width: 54,
              height: 54,
              fit: BoxFit.contain,
              // The emblem is dark, so invert it onto the dark card.
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _InviteRow extends StatelessWidget {
  const _InviteRow({required this.invite});

  final ReferralInvite invite;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.ink,
              shape: BoxShape.circle,
            ),
            child: Text(
              invite.initials,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  invite.name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Signed up on ${invite.signedUpOn}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.positive.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Earned ₹${invite.amount}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.positive,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
