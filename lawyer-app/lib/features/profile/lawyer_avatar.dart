import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';

/// The lawyer's photo, falling back to their initials while it loads or when
/// none has been uploaded.
class LawyerAvatar extends StatefulWidget {
  const LawyerAvatar({
    super.key,
    required this.initials,
    this.photoUrl,
    this.size = 46,
    this.verified = false,
  });

  final String initials;
  final String? photoUrl;
  final double size;

  /// Adds the green tick, once the application has been approved.
  final bool verified;

  @override
  State<LawyerAvatar> createState() => _LawyerAvatarState();
}

class _LawyerAvatarState extends State<LawyerAvatar> {
  Uint8List? _photo;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(LawyerAvatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.photoUrl != widget.photoUrl) _load();
  }

  Future<void> _load() async {
    final url = widget.photoUrl;
    if (url == null) return;

    try {
      final bytes = await ApiClient.instance.bytes(url);
      if (mounted) setState(() => _photo = bytes);
    } on ApiException {
      // The initials stand in — a missing photo is not worth an error.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.verified) return _circle();

    // The tick sits on the photo itself, like a verified badge.
    return Stack(
      clipBehavior: Clip.none,
      children: [
        _circle(),
        Positioned(
          right: -1,
          bottom: -1,
          child: Container(
            padding: const EdgeInsets.all(1.5),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.verified,
              size: widget.size / 3,
              color: AppColors.positive,
            ),
          ),
        ),
      ],
    );
  }

  Widget _circle() {
    final photo = _photo;

    return Container(
      width: widget.size,
      height: widget.size,
      alignment: Alignment.center,
      clipBehavior: Clip.antiAlias,
      decoration: const BoxDecoration(
        color: AppColors.ink,
        shape: BoxShape.circle,
      ),
      child: photo == null
          ? Text(
              widget.initials,
              style: TextStyle(
                fontSize: widget.size / 3,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            )
          : Image.memory(
              photo,
              fit: BoxFit.cover,
              width: widget.size,
              height: widget.size,
            ),
    );
  }
}
