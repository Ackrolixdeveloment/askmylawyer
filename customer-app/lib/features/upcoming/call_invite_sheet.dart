import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'upcoming_data.dart';

/// What the client chose when the call was offered.
enum CallInviteChoice { join, reject }

/// Prompts the client ten minutes before a scheduled consultation, so they
/// can join early or hand the slot back.
Future<CallInviteChoice?> showCallInviteSheet(
  BuildContext context, {
  required UpcomingConsultation consultation,
}) {
  return showModalBottomSheet<CallInviteChoice>(
    context: context,
    backgroundColor: AppColors.surface,
    isScrollControlled: true,
    // Deliberate: the client should answer rather than dismiss by accident.
    isDismissible: false,
    enableDrag: false,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (_) => _CallInviteSheet(consultation: consultation),
  );
}

class _CallInviteSheet extends StatelessWidget {
  const _CallInviteSheet({required this.consultation});

  final UpcomingConsultation consultation;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Grab handle centred, with the dismiss cross pinned to the
            // corner so it never shifts the handle off-centre. The row is
            // tall enough to hold the cross without clipping it.
            SizedBox(
              height: 32,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 38,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.line,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(16),
                      child: const Padding(
                        padding: EdgeInsets.all(6),
                        child: Icon(
                          Icons.close,
                          size: 20,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),

            Center(child: _Avatar(initials: consultation.initials)),
            const SizedBox(height: 12),

            Text(
              'Your consultation starts soon',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              '${consultation.lawyer} is ready for your '
              '${consultation.channelLabel.toLowerCase()} consultation.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppColors.inkSubtle,
              ),
            ),
            const SizedBox(height: 16),

            _Countdown(label: consultation.countdownLabel(DateTime.now())),
            const SizedBox(height: 18),

            _JoinButton(
              label: 'Join ${consultation.channelLabel} Call',
              // TODO: open the call once the video SDK is wired up.
              onTap: () => Navigator.of(context).pop(CallInviteChoice.join),
            ),
            TextButton(
              onPressed: () =>
                  Navigator.of(context).pop(CallInviteChoice.reject),
              style: TextButton.styleFrom(foregroundColor: AppColors.negative),
              child: const Text(
                'Reject',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
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
    return MediaQuery.withNoTextScaling(
      child: Container(
        width: 58,
        height: 58,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          color: AppColors.ink,
          shape: BoxShape.circle,
        ),
        child: Text(
          initials,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

/// Green strip repeating how long until the slot.
class _Countdown extends StatelessWidget {
  const _Countdown({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFE7F6EC),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.schedule, size: 16, color: Color(0xFF1B8A4B)),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1B8A4B),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _JoinButton extends StatelessWidget {
  const _JoinButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 48,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_outlined, size: 18, color: Colors.white),
            const SizedBox(width: 9),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
