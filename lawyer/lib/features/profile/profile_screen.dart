import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'profile_data.dart';
import 'profile_edit_sheet.dart';

/// The lawyer's own profile, split into sections they can open and edit.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    this.name = 'Adv. Aashish Kumar',
    this.badge = 'ADVOCATE',
    this.practice = 'Criminal Lawyer .  Family Lawyer',
    this.photoUrl,
    this.onClose,
  });

  final String name;
  final String badge;
  final String practice;

  /// Falls back to initials until a photo has been uploaded.
  final String? photoUrl;

  /// Shown as a close button when the screen is pushed over another.
  final VoidCallback? onClose;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _data = ProfileData();

  String get _initials => widget.name
      .replaceAll(RegExp(r'^Adv\.?\s*'), '')
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();

  Future<void> _edit(ProfileSection section) async {
    final saved = await ProfileEditSheet.show(
      context,
      section: section,
      data: _data,
    );

    // The sheet writes straight into _data, so a save just needs a repaint.
    if (saved && mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.canvas,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: InkWell(
              onTap: widget.onClose ?? () => Navigator.of(context).maybePop(),
              borderRadius: BorderRadius.circular(20),
              child: const Padding(
                padding: EdgeInsets.all(6),
                child: Icon(Icons.close, size: 20, color: AppColors.ink),
              ),
            ),
          ),
          const SizedBox(height: 4),

          Center(
            child: Container(
              width: 96,
              height: 96,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
                image: widget.photoUrl == null
                    ? null
                    : DecorationImage(
                        image: NetworkImage(widget.photoUrl!),
                        fit: BoxFit.cover,
                      ),
              ),
              child: widget.photoUrl != null
                  ? null
                  : Text(
                      _initials,
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 12),

          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.line),
              ),
              child: Text(
                widget.badge,
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  color: AppColors.inkMuted,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          Text(
            widget.name,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.practice,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: AppColors.inkSubtle),
          ),
          const SizedBox(height: 20),

          for (final section in ProfileSection.values)
            _SectionRow(
              label: section.label,
              summary: _data.summaryFor(section),
              onTap: () => _edit(section),
            ),
        ],
      ),
    );
  }
}

class _SectionRow extends StatelessWidget {
  const _SectionRow({
    required this.label,
    required this.summary,
    required this.onTap,
  });

  final String label;

  /// Current value, shown under the name once something has been entered.
  final String summary;

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.ink,
                      ),
                    ),
                    if (summary.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        summary,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 10),
              const Icon(
                Icons.chevron_right,
                size: 18,
                color: AppColors.inkSubtle,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
