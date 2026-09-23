import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'lawyer_avatar.dart';
import 'profile_data.dart';
import 'profile_repository.dart';
import 'profile_edit_sheet.dart';

/// The lawyer's own profile, split into sections they can open and edit.
/// It loads the account itself, so every way in shows the same details.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.badge = 'ADVOCATE'});

  final String badge;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  ProfileData _data = ProfileData();
  LawyerProfile? _profile;
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final profile = await ProfileRepository.instance.load();
      if (!mounted) return;

      setState(() {
        _profile = profile;
        // Seed the editable sections with what is on the account.
        _data = ProfileData(
          aboutMe: profile.about ?? '',
          experience: {?profile.experience},
          languages: profile.languages.toSet(),
          specialization: profile.specialisations.toSet(),
          caseCategories: profile.caseCategories.toSet(),
          consultationType: profile.consultationTypes.toSet(),
        );
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  String get _name => _profile?.fullName ?? '';
  String get _practice => _profile?.headline ?? '';
  String get _initials => _profile?.initials ?? '··';

  Future<void> _edit(ProfileSection section) async {
    final saved = await ProfileEditSheet.show(
      context,
      section: section,
      data: _data,
    );

    // The sheet writes straight into _data; now make it stick on the server.
    if (!saved || !mounted) return;
    setState(() => _saving = true);

    try {
      final profile = await ProfileRepository.instance.update(
        about: section == ProfileSection.aboutMe ? _data.aboutMe : null,
        experience: section == ProfileSection.experience
            ? _data.experience.firstOrNull
            : null,
        languages: section == ProfileSection.languages ? _data.languages : null,
        specialisations: section == ProfileSection.specialization
            ? _data.specialization
            : null,
        caseCategories: section == ProfileSection.caseCategories
            ? _data.caseCategories
            : null,
        consultationTypes: section == ProfileSection.consultationType
            ? _data.consultationType
            : null,
      );
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _saving = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.message)));
      // The server refused it, so go back to what it holds.
      await _load();
    }
  }

  /// Camera or gallery, then straight up to the server.
  Future<void> _changePhoto() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 18, 20, 6),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Profile Photo',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ),
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_camera_outlined,
                color: AppColors.ink,
              ),
              title: const Text('Take a photo', style: TextStyle(fontSize: 14)),
              onTap: () => Navigator.of(sheetContext).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_library_outlined,
                color: AppColors.ink,
              ),
              title: const Text(
                'Choose from gallery',
                style: TextStyle(fontSize: 14),
              ),
              onTap: () => Navigator.of(sheetContext).pop(ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );

    if (source == null) return;

    final picked = await ImagePicker().pickImage(
      source: source,
      // Keeps the upload small; the original is never needed here.
      maxWidth: 1200,
      imageQuality: 85,
    );
    if (picked == null || !mounted) return;

    setState(() => _saving = true);
    try {
      final profile = await ProfileRepository.instance.uploadPhoto(
        File(picked.path).path,
      );
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _saving = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.canvas,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Column(
              children: [
                Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      InkWell(
                        onTap: _saving ? null : _changePhoto,
                        customBorder: const CircleBorder(),
                        child: LawyerAvatar(
                          initials: _initials,
                          photoUrl: _profile?.photoUrl,
                          size: 96,
                          verified: _profile?.isVerified ?? false,
                        ),
                      ),
                      if (_saving)
                        const SizedBox.square(
                          dimension: 96,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Center(
                  child: TextButton(
                    onPressed: _saving ? null : _changePhoto,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Change photo',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

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
                const SizedBox(height: 8),

                Text(
                  _name,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 21,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                if (_error != null)
                  Center(
                    child: TextButton.icon(
                      onPressed: _load,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: Text(
                        _error!,
                        style: const TextStyle(fontSize: 11),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.negative,
                      ),
                    ),
                  )
                else
                  Text(
                    _practice,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                const SizedBox(height: 20),
              ],
            ),
          ),

          // Only this list moves; the photo and name stay in view.
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
              children: [
                for (final section in ProfileSection.values)
                  _SectionRow(
                    label: section.label,
                    summary: _data.summaryFor(section),
                    onTap: _saving ? () {} : () => _edit(section),
                  ),
              ],
            ),
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
