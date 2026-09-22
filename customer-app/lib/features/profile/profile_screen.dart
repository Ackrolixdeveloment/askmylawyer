import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'edit_profile_sheets.dart';
import 'profile_data.dart';

/// The customer's profile: avatar, name, and the four editable sections.
///
/// Each row opens its own bottom sheet and shows a green dot once that
/// section is filled in, amber while something is still missing.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.onClose});

  /// Fired by the cross in the top right. Pushed over another screen this
  /// pops the route; from the Profile tab it returns to Home, which has no
  /// route to pop.
  final VoidCallback? onClose;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // TODO: load the saved profile from the backend instead of seeding it.
  final _data = ProfileData(
    prefix: 'Ms.',
    fullName: 'Priya Krishnan',
    gender: 'Female',
    ageBand: '35-39',
    maritalStatus: 'Married',
    occupation: 'Salaried',
    stateCity: 'Gurugram, Haryana',
    pincode: '122001',
    address: 'Flat 402, Sector 44, Near Cyber Hub, Gurugram',
  );

  Future<void> _edit(ProfileSection section) async {
    final saved = await showProfileEditSheet(
      context: context,
      section: section,
      data: _data,
    );
    // The sheet writes straight into _data, so a save just needs a repaint.
    if (saved && mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                onPressed: widget.onClose,
                icon: const Icon(Icons.close, size: 22),
                color: AppColors.ink,
                tooltip: 'Close',
              ),
            ),

            const SizedBox(height: 8),
            _Avatar(initials: _data.initials),
            const SizedBox(height: 14),
            Text(
              _data.fullName.isEmpty ? 'Your profile' : _data.fullName,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            if (_data.locationLabel.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                _data.locationLabel,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.inkSubtle,
                ),
              ),
            ],
            const SizedBox(height: 24),

            Expanded(
              child: ListView(
                // Room for the shell's floating nav, which paints over this.
                padding: EdgeInsets.fromLTRB(
                  16,
                  0,
                  16,
                  24 + shellNavHeight(context),
                ),
                children: [
                  for (final section in ProfileSection.values) ...[
                    _SectionRow(
                      title: section.rowTitle,
                      complete: section.isComplete(_data),
                      onTap: () => _edit(section),
                    ),
                    const SizedBox(height: 12),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.initials});

  final String initials;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 76,
      height: 76,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: AppColors.ink,
        shape: BoxShape.circle,
      ),
      child: initials.isEmpty
          ? const Icon(Icons.person_outline, size: 32, color: Colors.white)
          : Text(
              initials,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
    );
  }
}

/// One tappable row: title, completion dot, chevron.
class _SectionRow extends StatelessWidget {
  const _SectionRow({
    required this.title,
    required this.complete,
    required this.onTap,
  });

  final String title;
  final bool complete;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
              ),
              _StatusDot(complete: complete),
              const SizedBox(width: 10),
              const Icon(
                Icons.chevron_right,
                size: 20,
                color: AppColors.inkSubtle,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Green tick once the section is filled in, amber while it is not.
class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.complete});

  final bool complete;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: complete ? AppColors.positive : const Color(0xFFF59E0B),
        shape: BoxShape.circle,
      ),
      child: complete
          ? const Icon(Icons.check, size: 12, color: Colors.white)
          : null,
    );
  }
}
