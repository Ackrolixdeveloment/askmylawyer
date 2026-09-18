import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/theme/app_colors.dart';
import 'referral_data.dart';
import 'track_invites_screen.dart';

/// The invite pitch: share a code, both sides earn once the friend's first
/// consultation completes.
class ReferralScreen extends StatelessWidget {
  const ReferralScreen({super.key, this.data = activeReferral});

  final ReferralData data;

  static const _steps = [
    (icon: Icons.person_add_alt, label: 'Share your invite link'),
    (
      icon: Icons.verified_outlined,
      label: 'Lawyer completes registration & KYC',
    ),
    (
      icon: Icons.assignment_outlined,
      label: 'Lawyer completes first consultation',
    ),
    (icon: Icons.paid_outlined, label: '₹500 credited to your wallet'),
  ];

  void _copy(BuildContext context) {
    Clipboard.setData(ClipboardData(text: data.inviteCode));
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Invite code copied')));
  }

  /// Opens the platform share sheet — UIActivityViewController on iOS,
  /// ACTION_SEND on Android.
  Future<void> _invite(BuildContext context) async {
    final message =
        'Get legal help on Ask My Lawyer. Use my code ${data.inviteCode} '
        'and we both get ₹${data.rewardPerReferral} after your first '
        'consultation.';

    // iPad anchors the sheet to the tapped widget; without a rect it throws.
    final box = context.findRenderObject() as RenderBox?;
    final origin = box == null
        ? null
        : box.localToGlobal(Offset.zero) & box.size;

    await SharePlus.instance.share(
      ShareParams(
        text: message,
        subject: 'Ask My Lawyer invite',
        sharePositionOrigin: origin,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _Hero(reward: data.rewardPerReferral),

                // Pulled up over the hero so the curve cuts into the dark
                // band rather than sitting below it.
                Transform.translate(
                  offset: const Offset(0, -20),
                  child: Container(
                    decoration: const BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(22),
                      ),
                    ),
                    padding: const EdgeInsets.fromLTRB(16, 22, 16, 16),
                    child: Column(
                      children: [
                        const Text(
                          'Your personal link',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 14),

                        _CodeField(
                          code: data.inviteCode,
                          onCopy: () => _copy(context),
                        ),
                        const SizedBox(height: 12),

                        SizedBox(
                          width: double.infinity,
                          height: 46,
                          child: FilledButton.icon(
                            onPressed: () => _invite(context),
                            icon: const Icon(Icons.send_outlined, size: 16),
                            label: const Text('Invite'),
                          ),
                        ),
                        const SizedBox(height: 18),

                        Container(
                          padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.line),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'How it works',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink,
                                ),
                              ),
                              const SizedBox(height: 4),
                              for (var i = 0; i < _steps.length; i++) ...[
                                _StepRow(
                                  icon: _steps[i].icon,
                                  label: _steps[i].label,
                                ),
                                if (i < _steps.length - 1)
                                  const Divider(
                                    height: 1,
                                    thickness: 1,
                                    color: AppColors.line,
                                  ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Pinned so both actions stay reachable however long the page runs.
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.line)),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => TrackInvitesScreen(data: data),
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.ink,
                          side: const BorderSide(color: AppColors.line),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text('Track Invites'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: FilledButton.icon(
                        onPressed: () => _invite(context),
                        icon: const Icon(Icons.share_outlined, size: 16),
                        label: const Text('Invite'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Dark banner carrying the headline offer.
class _Hero extends StatelessWidget {
  const _Hero({required this.reward});

  final int reward;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppColors.ink,
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.of(context).maybePop(),
                icon: const Icon(Icons.chevron_left, size: 26),
                color: Colors.white,
              ),
              const Expanded(
                child: Text(
                  'Invite & Earn',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
              // Balances the leading icon so the title stays centred.
              const SizedBox(width: 48),
            ],
          ),
          const SizedBox(height: 10),
          Padding(
            // Extra bottom room: the sheet above overlaps this band by 20.
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 44),
            child: Column(
              children: [
                Text(
                  'Invite Friends &\nEarn ₹$reward Each',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    height: 1.3,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Both you and your friend receive ₹$reward after their '
                  'first completed consultation.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.5,
                    color: Color(0xFFB6C0D4),
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

/// Read-only code with a dark Copy button tucked inside it.
class _CodeField extends StatelessWidget {
  const _CodeField({required this.code, required this.onCopy});

  final String code;
  final VoidCallback onCopy;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 6, 6, 6),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              code,
              style: const TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          ),
          InkWell(
            onTap: onCopy,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
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
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.inkSubtle),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
            ),
          ),
        ],
      ),
    );
  }
}
