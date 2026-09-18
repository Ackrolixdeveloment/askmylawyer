import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'coupon_data.dart';
import 'coupon_detail_screen.dart';

/// Coupons the customer can apply to a consultation.
class CouponsScreen extends StatefulWidget {
  const CouponsScreen({super.key, this.coupons = couponSample});

  /// Pass an empty list to see the first-run state.
  final List<Coupon> coupons;

  @override
  State<CouponsScreen> createState() => _CouponsScreenState();
}

class _CouponsScreenState extends State<CouponsScreen> {
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

  List<Coupon> get _visible {
    final query = _search.text.trim().toLowerCase();
    if (query.isEmpty) return widget.coupons;

    return widget.coupons
        .where(
          (coupon) =>
              coupon.code.toLowerCase().contains(query) ||
              coupon.headline.toLowerCase().contains(query),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visible;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 24),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    onTap: () => Navigator.of(context).maybePop(),
                    borderRadius: BorderRadius.circular(6),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(
                        Icons.arrow_back,
                        size: 20,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                ),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Available Coupons',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Apply a coupon and save on your consultation.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _search,
              style: const TextStyle(fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search coupon code',
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
            const SizedBox(height: 14),

            if (visible.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 60),
                child: Text(
                  'No coupons match that code.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
                ),
              )
            else
              for (final coupon in visible) _CouponCard(coupon: coupon),
          ],
        ),
      ),
    );
  }
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({required this.coupon});

  final Coupon coupon;

  void _open(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => CouponDetailScreen(coupon: coupon),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.line),
      ),
      // Clip so the accent stripe follows the rounded leading corners.
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          children: [
            Container(
              width: 4,
              decoration: BoxDecoration(
                color: coupon.accent.tint,
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(9),
                ),
              ),
            ),
            Expanded(
              child: InkWell(
                onTap: () => _open(context),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              coupon.headline,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: coupon.accent.tint,
                              ),
                            ),
                          ),
                          _ApplyButton(
                            tint: coupon.accent.tint,
                            onTap: () => _open(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        coupon.condition,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkMuted,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 12,
                            color: coupon.accent.tint,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            'Valid till ${coupon.validTill}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.inkSubtle,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Text(
                            'Min. booking ${coupon.minimumBooking}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.inkSubtle,
                            ),
                          ),
                        ],
                      ),
                    ],
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

class _ApplyButton extends StatelessWidget {
  const _ApplyButton({required this.tint, required this.onTap});

  final Color tint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: tint),
        ),
        child: Text(
          'Apply',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: tint,
          ),
        ),
      ),
    );
  }
}
