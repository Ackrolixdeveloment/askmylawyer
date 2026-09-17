import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../auth/auth_repository.dart';
import '../auth/get_started_screen.dart';
import '../referral/referral_screen.dart';
import '../support/help_faq_screen.dart';
import 'change_mobile_screen.dart';
import 'manage_bank_screen.dart';
import 'delete_account_dialog.dart';
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Settings & Account',
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
                ),
                _Row(
                  icon: Icons.smartphone_outlined,
                  title: 'Change Mobile Number',
                  subtitle: 'OTP verification on old + new number',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const ChangeMobileScreen(),
                    ),
                  ),
                ),
                _Row(
                  icon: Icons.account_balance_outlined,
                  title: 'Manage Bank Account',
                  subtitle: 'View or update your bank details',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const ManageBankScreen(),
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
                      builder: (_) => const HelpFaqScreen(),
                    ),
                  ),
                ),
                _Row(
                  icon: Icons.description_outlined,
                  title: 'Terms of Service',
                  subtitle: 'Read our terms and conditions',
                ),
                _Row(
                  icon: Icons.shield_outlined,
                  title: 'Privacy Policy',
                  subtitle: 'Learn how we protect your data',
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
                _Row(
                  icon: Icons.delete_outline,
                  title: 'Delete Account',
                  subtitle:
                      'Initiates 30-day-soft-delete with admin review\n'
                      'Pending consultations must be closed first',
                  destructive: true,
                  // TODO: call the delete endpoint once it exists.
                  onTap: () => DeleteAccountDialog.show(context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Ends the session on the server, clears the tokens and returns to sign-in.
Future<void> _logout(BuildContext context) async {
  if (!await LogoutDialog.show(context)) return;

  await AuthRepository.instance.logout();
  if (!context.mounted) return;

  Navigator.of(context).pushAndRemoveUntil(
    MaterialPageRoute<void>(builder: (_) => const GetStartedScreen()),
    (_) => false,
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
              'SM',
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
                  'Adv. Sanjh M',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Family Law Specialist',
                  style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
                ),
              ],
            ),
          ),
          // The badge sits opposite the name rather than under it.
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.positive.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check, size: 12, color: AppColors.positive),
                SizedBox(width: 4),
                Text(
                  'Verified Lawyer',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.positive,
                  ),
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
    this.destructive = false,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  /// Null until the row's destination or action exists.
  final VoidCallback? onTap;

  /// Delete Account reads in red, with a tinted icon.
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final tint = destructive ? AppColors.negative : AppColors.ink;

    return InkWell(
      // TODO: wire the remaining destinations as their screens are built.
      onTap: onTap ?? () {},
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: destructive
                    ? AppColors.negative.withValues(alpha: 0.08)
                    : AppColors.canvas,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 17, color: tint),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: tint,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      height: 1.4,
                      color: destructive
                          ? AppColors.negative.withValues(alpha: 0.7)
                          : AppColors.inkSubtle,
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
