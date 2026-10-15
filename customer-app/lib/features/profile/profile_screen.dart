import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'edit_profile_sheets.dart';
import '../../core/network/api_client.dart';
import '../auth/customer_session.dart';
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
  ProfileData? _data;
  String? _error;
  bool _loading = true;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final profile = await CustomerSession.instance.profile();
      if (mounted) setState(() => _data = ProfileData.from(profile));
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _edit(ProfileSection section) async {
    final data = _data;
    if (data == null) return;

    final result = await showProfileEditSheet(
      context: context,
      section: section,
      data: data,
    );
    if (!mounted || result == ProfileEditResult.cancelled) return;

    // A verified change of email or mobile has already been written by its
    // own flow; sending the local copy now would put the old value back.
    if (result == ProfileEditResult.reload) {
      _load();
      return;
    }

    // The sheet writes into the local copy; this makes it stick while the
    // save is in flight.
    setState(() {});

    try {
      await CustomerSession.instance.updateProfile(
        fullName: data.fullName,
        prefix: data.prefix,
        gender: data.gender,
        ageBand: data.ageBand,
        maritalStatus: data.maritalStatus,
        occupation: data.occupation,
        city: data.city,
        state: data.state,
        pincode: data.pincodeValid ? data.pincode : null,
        address: data.address.isEmpty ? null : data.address,
        email: data.email.isEmpty ? null : data.email,
        mobile: data.mobile.isEmpty ? null : data.mobile,
        languages: data.languages.toList(),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      // The edit is still on screen but not saved, so say so and put back
      // what the server actually holds.
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }

    // Either way, the server has the last word on what is still missing.
    if (mounted) _load();
  }

  /// Takes a photo and replaces the one on the account.
  Future<void> _changePhoto() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      // Plenty for an avatar, and small enough to upload on a bad line.
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    if (picked == null || !mounted) return;

    setState(() => _uploading = true);
    try {
      final profile = await CustomerSession.instance.uploadPhoto(picked.path);
      if (mounted) setState(() => _data = ProfileData.from(profile));
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;

    if (data == null) {
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
              Expanded(
                child: Center(
                  child: _loading
                      ? const CircularProgressIndicator()
                      : Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            _error ?? 'Could not load your profile.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.negative,
                            ),
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      );
    }

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
            _Avatar(
              initials: data.initials,
              photoUrl: data.photoUrl,
              busy: _uploading,
              onTap: _changePhoto,
            ),
            const SizedBox(height: 14),
            Text(
              data.fullName.isEmpty ? 'Your profile' : data.fullName,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            if (data.locationLabel.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                data.locationLabel,
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
                      complete: section.isComplete(data),
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

/// The photo, their initials, or a silhouette — whichever we have. Tapping
/// it opens the camera.
class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.initials,
    required this.onTap,
    this.photoUrl,
    this.busy = false,
  });

  final String initials;
  final VoidCallback onTap;
  final String? photoUrl;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final url = photoUrl;

    return Semantics(
      button: true,
      label: 'Change profile photo',
      child: GestureDetector(
        onTap: busy ? null : onTap,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 76,
              height: 76,
              alignment: Alignment.center,
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
              child: url != null
                  ? FutureBuilder<Uint8List>(
                      // The photo is private, so it comes down with the
                      // token rather than through Image.network.
                      future: CustomerSession.instance.photoBytes(url),
                      builder: (context, snapshot) {
                        final bytes = snapshot.data;
                        if (bytes == null) return _fallback();
                        return Image.memory(
                          bytes,
                          width: 76,
                          height: 76,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _fallback(),
                        );
                      },
                    )
                  : _fallback(),
            ),

            if (busy)
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            else
              // Small camera badge, so it reads as something you can tap.
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 26,
                  height: 26,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.canvas, width: 2),
                  ),
                  child: const Icon(
                    Icons.photo_camera_outlined,
                    size: 13,
                    color: AppColors.ink,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _fallback() => initials.isEmpty
      ? const Icon(Icons.person_outline, size: 32, color: Colors.white)
      : Text(
          initials,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        );
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
