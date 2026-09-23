import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../auth/auth_repository.dart';
import '../auth/get_started_screen.dart';
import '../profile/lawyer_avatar.dart';
import '../profile/profile_repository.dart';
import '../profile/profile_screen.dart';
import '../referral/referral_screen.dart';
import '../support/help_faq_screen.dart';
import 'change_mobile_screen.dart';
import 'manage_bank_screen.dart';
import 'delete_account_dialog.dart';
import 'logout_dialog.dart';

/// Profile, preferences and account actions, opened from the home menu.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, this.onEditProfile});

  /// Switches the home shell to the Profile tab. Without it the row falls
  /// back to pushing the profile on top of settings.
  final VoidCallback? onEditProfile;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  LawyerProfile? _profile;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// Opens the change-number flow, then picks up the new number.
  Future<void> _changeMobile() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => ChangeMobileScreen(
          currentNumber: (_profile?.mobile ?? '').replaceFirst('+91', ''),
        ),
      ),
    );

    if (changed == true) await _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final profile = await ProfileRepository.instance.load();
      if (mounted) setState(() => _profile = profile);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

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

            _ProfileCard(profile: _profile, error: _error, onRetry: _load),
            const SizedBox(height: 20),

            const _SectionLabel('Account Setting'),
            _Group(
              rows: [
                _Row(
                  icon: Icons.person_outline,
                  title: 'Edit Profile',
                  subtitle: 'Edit Profile information',
                  onTap:
                      widget.onEditProfile ??
                      () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => Scaffold(
                            backgroundColor: AppColors.canvas,
                            body: SafeArea(
                              bottom: false,
                              child: const ProfileScreen(),
                            ),
                          ),
                        ),
                      ),
                ),
                _Row(
                  icon: Icons.smartphone_outlined,
                  title: 'Change Mobile Number',
                  subtitle: 'Verified by an OTP on the new number',
                  onTap: _profile == null ? null : _changeMobile,
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
                  onTap: () => _logout(context, _profile),
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
Future<void> _logout(BuildContext context, LawyerProfile? profile) async {
  final confirmed = await LogoutDialog.show(
    context,
    name: profile?.fullName ?? 'Your account',
    initials: profile?.initials ?? '··',
    detail: [
      profile?.mobileDisplay,
      profile?.headline.isNotEmpty ?? false ? profile!.headline : null,
    ].whereType<String>().join(' · '),
  );
  if (!confirmed) return;

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
  const _ProfileCard({
    required this.profile,
    required this.error,
    required this.onRetry,
  });

  final LawyerProfile? profile;
  final String? error;
  final VoidCallback onRetry;

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
          LawyerAvatar(
            initials: profile?.initials ?? '··',
            photoUrl: profile?.photoUrl,
            verified: profile?.isVerified ?? false,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile?.fullName ??
                      (error == null ? 'Loading…' : 'Your account'),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                if (error != null)
                  Text(
                    error!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.negative,
                    ),
                  )
                else if (profile != null && profile!.lawyerId.isNotEmpty)
                  _LawyerIdChip(lawyerId: profile!.lawyerId),
              ],
            ),
          ),
          // Only the retry sits opposite the name; the verified tick is on
          // the photo.
          if (error != null)
            TextButton(
              onPressed: onRetry,
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Retry', style: TextStyle(fontSize: 11)),
            ),
        ],
      ),
    );
  }
}

/// The lawyer's reference number, with a one-tap copy.
class _LawyerIdChip extends StatelessWidget {
  const _LawyerIdChip({required this.lawyerId});

  final String lawyerId;

  Future<void> _copy(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: lawyerId));
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Lawyer ID copied'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Flexible(
          child: Text(
            lawyerId,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
              color: AppColors.inkMuted,
            ),
          ),
        ),
        const SizedBox(width: 4),
        InkWell(
          onTap: () => _copy(context),
          borderRadius: BorderRadius.circular(6),
          child: const Padding(
            padding: EdgeInsets.all(4),
            child: Icon(
              Icons.copy_rounded,
              size: 13,
              color: AppColors.inkSubtle,
            ),
          ),
        ),
      ],
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
