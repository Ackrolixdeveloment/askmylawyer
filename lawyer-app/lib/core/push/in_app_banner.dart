import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app_navigator.dart';
import '../theme/app_colors.dart';

/// How long a banner stays before sliding back up.
const _visibleFor = Duration(seconds: 4);

OverlayEntry? _current;

/// Drops a notification in from the top of the screen while the app is open,
/// the way the system banner would if the app were in the background.
void showInAppNotification({
  required String title,
  required String body,
  VoidCallback? onTap,
}) {
  final overlay = appNavigatorKey.currentState?.overlay;
  if (overlay == null) return;

  // Only one at a time; a new message replaces the one on screen.
  _current?.remove();
  _current = null;

  late final OverlayEntry entry;
  entry = OverlayEntry(
    builder: (context) => _Banner(
      title: title,
      body: body,
      onTap: onTap,
      onDismissed: () {
        if (_current == entry) _current = null;
        if (entry.mounted) entry.remove();
      },
    ),
  );

  _current = entry;
  overlay.insert(entry);
  _alert();
}

/// Plays the device's notification sound and a short buzz, so a banner drawn
/// inside the app announces itself the way a system one would. The platform
/// handles silent mode and Do Not Disturb; see MainActivity.kt and
/// AppDelegate.swift.
const _sound = MethodChannel('askmylawyer/sound');

Future<void> _alert() async {
  try {
    await _sound.invokeMethod<void>('notification');
  } on PlatformException {
    // No tone available on this device — the buzz still lands.
  } on MissingPluginException {
    // Older build of the app shell; nothing to play.
  }
  await HapticFeedback.mediumImpact();
}

class _Banner extends StatefulWidget {
  const _Banner({
    required this.title,
    required this.body,
    required this.onDismissed,
    this.onTap,
  });

  final String title;
  final String body;
  final VoidCallback onDismissed;
  final VoidCallback? onTap;

  @override
  State<_Banner> createState() => _BannerState();
}

class _BannerState extends State<_Banner> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 320),
    reverseDuration: const Duration(milliseconds: 220),
  );

  late final Animation<Offset> _slide = Tween<Offset>(
    begin: const Offset(0, -1.2),
    end: Offset.zero,
  ).animate(CurvedAnimation(
    parent: _controller,
    // A little overshoot, so it lands like a real notification.
    curve: Curves.easeOutBack,
    reverseCurve: Curves.easeInCubic,
  ));

  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _controller.forward();
    _timer = Timer(_visibleFor, _dismiss);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _dismiss() async {
    _timer?.cancel();
    if (!mounted) return;
    await _controller.reverse();
    widget.onDismissed();
  }

  void _open() {
    _timer?.cancel();
    widget.onTap?.call();
    _dismiss();
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;

    return Positioned(
      top: topInset + 8,
      left: 12,
      right: 12,
      child: SlideTransition(
        position: _slide,
        child: FadeTransition(
          opacity: _controller,
          child: Material(
            color: Colors.transparent,
            child: Dismissible(
              key: const ValueKey('in-app-notification'),
              direction: DismissDirection.up,
              onDismissed: (_) => widget.onDismissed(),
              child: _card(context),
            ),
          ),
        ),
      ),
    );
  }

  Widget _card(BuildContext context) {
    return InkWell(
      onTap: _open,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.line),
          boxShadow: [
            BoxShadow(
              color: AppColors.ink.withValues(alpha: 0.16),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 22,
                  height: 22,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.brand,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.notifications,
                    size: 13,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Ask My Lawyer',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.inkMuted,
                  ),
                ),
                const Spacer(),
                const Text(
                  'now',
                  style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              widget.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              widget.body,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                height: 1.45,
                color: AppColors.inkSubtle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
