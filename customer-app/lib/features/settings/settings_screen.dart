import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../auth/customer_session.dart';
import '../auth/get_started_screen.dart';
import '../coupons/coupons_screen.dart';
import '../profile/profile_screen.dart';
import '../profile/verify_contact_sheet.dart';
import '../support/support_screen.dart';
import '../referral/referral_screen.dart';
import 'about_screen.dart';
import 'legal_links.dart';
import 'logout_dialog.dart';

/// Profile, preferences and account actions, opened from the home menu.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(14, 16, 14, 28),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Sits level with the heading, nudged left to align with the
                // cards below.
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
                        'Legal & Support',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Manage your profile, preferences & account',
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
            const SizedBox(height: 16),

            const _ProfileCard(),
            const SizedBox(height: 20),

            const _SectionLabel('Account Setting'),
            _Group(
              rows: [
                _Row(
                  icon: Icons.person_outline,
                  title: 'Edit Profile',
                  subtitle: 'Edit Profile information',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (routeContext) => ProfileScreen(
                        onClose: () => Navigator.of(routeContext).pop(),
                      ),
                    ),
                  ),
                ),
                _Row(
                  icon: Icons.smartphone_outlined,
                  title: 'Change Mobile Number',
                  subtitle: 'Confirmed with a code sent to the new number',
                  onTap: () => _changeMobile(context),
                ),
              ],
            ),
            const SizedBox(height: 20),

            const _SectionLabel('Refer & Earn'),
            _Group(
              rows: [
                _Row(
                  icon: Icons.card_giftcard,
                  title: 'Refer & Earn',
                  subtitle: 'Invite friends, both get ₹500 in wallet',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const ReferralScreen(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _Group(
              rows: [
                _Row(
                  icon: Icons.confirmation_number_outlined,
                  title: 'Coupon',
                  subtitle: 'Apply a coupon and save on your consultation',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const CouponsScreen(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            const _SectionLabel('Support & Information'),
            _Group(
              rows: [
                _Row(
                  icon: Icons.help_outline,
                  title: 'Help / FAQ',
                  subtitle: 'Find answers to common questions',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const SupportScreen(),
                    ),
                  ),
                ),
                // Hidden until the pages exist; a row that opens nothing
                // reads as a broken app.
                if (LegalLinks.terms.isNotEmpty)
                  _Row(
                    icon: Icons.description_outlined,
                    title: 'Terms of Service',
                    subtitle: 'Read our terms and conditions',
                    onTap: () => _open(context, LegalLinks.terms),
                  ),
                if (LegalLinks.privacy.isNotEmpty)
                  _Row(
                    icon: Icons.shield_outlined,
                    title: 'Privacy Policy',
                    subtitle: 'Learn how we protect your data',
                    onTap: () => _open(context, LegalLinks.privacy),
                  ),
                if (LegalLinks.refunds.isNotEmpty)
                  _Row(
                    icon: Icons.currency_rupee,
                    title: 'Refund Policy',
                    subtitle: 'Understand refund eligibility and timelines',
                    onTap: () => _open(context, LegalLinks.refunds),
                  ),
                _Row(
                  icon: Icons.info_outline,
                  title: 'About Ask My Lawyer',
                  subtitle: 'App version and licences',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const AboutScreen()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            const _SectionLabel('Account Actions'),
            _Group(
              rows: [
                _Row(
                  icon: Icons.logout,
                  title: 'Logout',
                  subtitle: 'Log out of Ask My Lawyer',
                  onTap: () => _logout(context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Confirms, ends the session, and drops back to the sign-in screen.
Future<void> _logout(BuildContext context) async {
  if (!await LogoutDialog.show(context)) return;

  await CustomerSession.instance.signOut();

  // From the root navigator, so the whole signed-in shell goes with it.
  appNavigatorKey.currentState?.pushAndRemoveUntil(
    MaterialPageRoute<void>(builder: (_) => const GetStartedScreen()),
    (route) => false,
  );
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

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

class _ProfileCard extends StatelessWidget {
  const _ProfileCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.ink,
              shape: BoxShape.circle,
            ),
            child: const Text(
              'SS',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sanjana Singh',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'singhsanjana21@gmail.com',
                  style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A card holding a run of rows, divided by hairlines.
class _Group extends StatelessWidget {
  const _Group({required this.rows});

  final List<_Row> rows;

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
            rows[i],
          ],
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  /// Null until the row's destination or action exists.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppColors.canvas,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 17, color: AppColors.ink),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      height: 1.4,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right,
              size: 18,
              color: AppColors.inkSubtle,
            ),
          ],
        ),
      ),
    );
  }
}


/// Opens the verified change-of-number flow — the same one the profile
/// screen uses, so there is one way to change a contact and it always asks
/// for a code.
Future<void> _changeMobile(BuildContext context) async {
  final profile = await CustomerSession.instance.profile();
  if (!context.mounted) return;

  final changed = await showVerifyContactSheet(
    context: context,
    isEmail: false,
    current: profile.mobile.isEmpty ? 'not set' : profile.mobile,
  );
  if (changed && context.mounted) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Mobile number updated')));
  }
}

/// Opens a policy page in the browser.
Future<void> _open(BuildContext context, String url) async {
  final opened = await launchUrl(
    Uri.parse(url),
    mode: LaunchMode.externalApplication,
  );
  if (!opened && context.mounted) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Could not open that page')));
  }
}
