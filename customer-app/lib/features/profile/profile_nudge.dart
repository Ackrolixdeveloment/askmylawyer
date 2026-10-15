import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../auth/customer_session.dart';
import '../home/home_screen.dart';

/// The same amber as the incomplete dot on the profile rows.
const _amber = Color(0xFFF59E0B);

/// Profile is the fourth destination in the shell's bottom nav.
const _profileTab = 3;

/// A quiet reminder of what the profile is still missing.
///
/// A customer may book and pay with nothing filled in, which is deliberate;
/// the catch is that the report is held back until we can address it to
/// someone and reach them. Saying so on the home screen is kinder than
/// saying it for the first time after the call, with the money already
/// spent. It renders nothing at all once the profile is complete.
class ProfileNudge extends StatefulWidget {
  const ProfileNudge({super.key});

  @override
  State<ProfileNudge> createState() => _ProfileNudgeState();
}

class _ProfileNudgeState extends State<ProfileNudge> {
  List<String> _missing = const [];

  @override
  void initState() {
    super.initState();
    _check();
    // Saving any section notifies the session, so the card can drop away
    // as soon as the last thing is filled in rather than on the next visit.
    CustomerSession.instance.addListener(_check);
  }

  @override
  void dispose() {
    CustomerSession.instance.removeListener(_check);
    super.dispose();
  }

  Future<void> _check() async {
    try {
      final profile = await CustomerSession.instance.profile();
      if (mounted) setState(() => _missing = profile.missing);
    } on ApiException {
      // Nothing to nag about if we cannot tell; the report screen still
      // catches it later.
    }
  }

  /// Switches to the Profile tab rather than pushing the profile over the
  /// home screen — the bottom nav should follow where you have been sent.
  void _open() => HomeScreen.openTab(context, _profileTab);

  @override
  Widget build(BuildContext context) {
    if (_missing.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: _open,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _amber.withValues(alpha: 0.14),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.person_outline,
                    size: 18,
                    color: _amber,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Finish your profile',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'We need ${_asList(_missing)} before we can send '
                        'you a consultation report.',
                        style: const TextStyle(
                          fontSize: 12,
                          height: 1.35,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: AppColors.inkSubtle,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// "a, b and c" — the list read aloud rather than punctuated.
String _asList(List<String> items) {
  if (items.length == 1) return items.first;
  return '${items.take(items.length - 1).join(', ')} and ${items.last}';
}
