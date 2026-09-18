import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'coupon_data.dart';

/// One coupon in full: what it gives, and the rules attached to it.
class CouponDetailScreen extends StatelessWidget {
  const CouponDetailScreen({super.key, required this.coupon});

  final Coupon coupon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.chevron_left, size: 26),
          color: AppColors.ink,
        ),
        title: const Text(
          'Coupon Details',
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
          _HeroCard(coupon: coupon),
          const SizedBox(height: 16),

          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              children: [
                _FactRow(
                  icon: Icons.calendar_today_outlined,
                  label: 'Valid till',
                  value: coupon.validTill,
                ),
                const Divider(height: 1, thickness: 1, color: AppColors.line),
                _FactRow(
                  icon: Icons.sell_outlined,
                  label: 'Minimum booking amount',
                  value: coupon.minimumBooking,
                ),
                const Divider(height: 1, thickness: 1, color: AppColors.line),
                _FactRow(
                  icon: Icons.person_outline,
                  label: 'Usage limit per customer',
                  value: coupon.usageLimit,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const _SectionTitle('About this coupon'),
          Text(
            coupon.about,
            style: const TextStyle(
              fontSize: 12,
              height: 1.55,
              color: AppColors.inkMuted,
            ),
          ),
          const SizedBox(height: 20),

          const _SectionTitle('Terms & Conditions'),
          for (final term in coupon.terms)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 5, right: 8),
                    child: _Bullet(),
                  ),
                  Expanded(
                    child: Text(
                      term,
                      style: const TextStyle(
                        fontSize: 12,
                        height: 1.5,
                        color: AppColors.inkMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 20),

          SizedBox(
            height: 48,
            child: FilledButton(
              // TODO: apply the coupon to the pending consultation.
              onPressed: () {
                // Grab the messenger before popping: afterwards this
                // context is defunct and cannot resolve one.
                final messenger = ScaffoldMessenger.of(context);
                Navigator.of(context).pop();
                messenger.showSnackBar(
                  SnackBar(content: Text('${coupon.code} applied')),
                );
              },
              child: const Text('Apply Coupon'),
            ),
          ),
        ],
      ),
    );
  }
}

/// Coloured banner carrying the code and the saving.
class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.coupon});

  final Coupon coupon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: coupon.accent.tint,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.card_giftcard,
              size: 20,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  coupon.code,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  coupon.headline,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  coupon.condition,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              coupon.discountLabel,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                height: 1.25,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(
        children: [
          Icon(icon, size: 15, color: AppColors.inkSubtle),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
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
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
        ),
      ),
    );
  }
}

class _Bullet extends StatelessWidget {
  const _Bullet();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 4,
      height: 4,
      decoration: const BoxDecoration(
        color: AppColors.inkSubtle,
        shape: BoxShape.circle,
      ),
    );
  }
}
