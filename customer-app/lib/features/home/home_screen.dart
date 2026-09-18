import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../bookings/bookings_screen.dart';
import '../consultation/consultation_screen.dart';
import '../notifications/notifications_screen.dart';
import '../settings/settings_screen.dart';
import '../upcoming/upcoming_screen.dart';
import 'home_data.dart';

/// Shell holding the four bottom-nav destinations.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.data = emptyHome});

  final HomeData data;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  /// Four destinations; the consult button sits between the second and
  /// third rather than being a tab of its own.
  static const _destinations = [
    (icon: Icons.home_outlined, label: 'Home'),
    (icon: Icons.assignment_outlined, label: 'Bookings'),
    (icon: Icons.schedule_outlined, label: 'Upcoming'),
    (icon: Icons.person_outline, label: 'Profile'),
  ];

  /// One navigator per tab, so a push from inside a tab lands under the
  /// bottom nav instead of covering it.
  final _navigators = List.generate(
    _destinations.length,
    (_) => GlobalKey<NavigatorState>(),
  );

  /// Rebuilds the shell whenever a tab's stack changes, so `canPop` below is
  /// never stale — without this the system back gesture reads last frame's
  /// answer and escapes the tab.
  late final _stackObserver = _StackObserver(
    onChanged: () {
      if (mounted) setState(() {});
    },
  );

  GlobalKey<NavigatorState> get _activeNavigator => _navigators[_tab];

  /// The system back gesture reaches the root navigator, which would tear
  /// down the whole tab. Give the tab's own stack the first chance, then
  /// fall back to the home tab before letting the app close.
  void _handleSystemBack() {
    final navigator = _activeNavigator.currentState;

    if (navigator != null && navigator.canPop()) {
      navigator.pop();
      return;
    }
    if (_tab != 0) setState(() => _tab = 0);
  }

  /// Wraps a tab's content in its own navigator.
  Widget _tabNavigator(int index, Widget child) {
    return Navigator(
      key: _navigators[index],
      observers: [_stackObserver],
      onGenerateRoute: (settings) =>
          MaterialPageRoute<void>(settings: settings, builder: (_) => child),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Back is handled in-app while the tab can pop, or while a tab other
    // than home is showing; only then may it close the app.
    final handledInApp =
        (_activeNavigator.currentState?.canPop() ?? false) || _tab != 0;

    return PopScope(
      canPop: !handledInApp,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleSystemBack();
      },
      child: Scaffold(
        backgroundColor: AppColors.canvas,
        // The nav floats, so content runs underneath it rather than stopping
        // at its top edge. Each tab pads its own scroll view to compensate.
        extendBody: true,
        // Every tab is wrapped, so pushes from any of them stay inside the
        // tab and the bottom nav survives.
        body: switch (_tab) {
          0 => _tabNavigator(0, _HomeTab(data: widget.data)),
          // Has its own scroll view, so it just needs the status-bar inset.
          1 => _tabNavigator(
            1,
            const SafeArea(bottom: false, child: BookingsScreen()),
          ),
          // Has its own scroll view, so it just needs the status-bar inset.
          2 => _tabNavigator(
            2,
            const SafeArea(bottom: false, child: UpcomingScreen()),
          ),
          _ => _tabNavigator(
            3,
            const _PlaceholderTab(icon: Icons.person_outline, title: 'Profile'),
          ),
        },
        // Built by hand rather than with NavigationBar, which imposes its own
        // selected colours and pill indicator.
        bottomNavigationBar: _BottomNav(
          destinations: _destinations,
          current: _tab,
          onSelect: (index) => setState(() => _tab = index),
          // Pushed on the root navigator so the flow covers the bar: it is a
          // task to finish, not a tab to browse.
          onConsult: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const ConsultationScreen()),
          ),
        ),
      ),
    );
  }
}

/// Reports every push and pop, so the shell can re-read whether the active
/// tab still has somewhere to go back to.
class _StackObserver extends NavigatorObserver {
  _StackObserver({required this.onChanged});

  final VoidCallback onChanged;

  void _notify() {
    // The stack settles after the current frame; reading it earlier gives
    // the value from before this push or pop.
    WidgetsBinding.instance.addPostFrameCallback((_) => onChanged());
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _notify();

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) => _notify();

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _notify();

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) =>
      _notify();
}

/// Full-width bar with a notch cut for the raised consult button.
class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.destinations,
    required this.current,
    required this.onSelect,
    required this.onConsult,
  });

  final List<({IconData icon, String label})> destinations;
  final int current;
  final ValueChanged<int> onSelect;
  final VoidCallback onConsult;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final bottomInset = media.padding.bottom;
    // Grow with the reader's text setting: at larger scales the icon and
    // label no longer fit a fixed 76.
    final barHeight = 76 * media.textScaler.scale(1).clamp(1.0, 1.4);

    return SizedBox(
      // Room above the bar for the button to rise into: it overhangs by 31,
      // plus a little for its ring and shadow.
      height: barHeight + bottomInset + 38,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          Align(
            alignment: Alignment.bottomCenter,
            child: PhysicalShape(
              clipper: const _NotchedBarClipper(),
              color: AppColors.surface,
              elevation: 8,
              shadowColor: AppColors.ink.withValues(alpha: 0.28),
              child: SizedBox(
                // The inset is padded inside, so the bar's white reaches
                // the bottom edge on gesture-nav phones.
                height: barHeight + bottomInset,
                child: Padding(
                  padding: EdgeInsets.only(bottom: bottomInset),
                  child: Row(
                    children: [
                      for (var i = 0; i < destinations.length; i++) ...[
                        Expanded(
                          child: _NavItem(
                            icon: destinations[i].icon,
                            label: destinations[i].label,
                            selected: current == i,
                            onTap: () => onSelect(i),
                          ),
                        ),
                        // Clears the notch in the middle.
                        if (i == 1) const SizedBox(width: 82),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Centred on the bar's top edge, so the circle rises clear of the
          // notch instead of sitting down inside it.
          Positioned(
            bottom: barHeight + bottomInset - 35,
            child: _ConsultButton(onTap: onConsult),
          ),
        ],
      ),
    );
  }
}

/// Cuts a rounded notch out of the bar's top edge for the button to sit in.
class _NotchedBarClipper extends CustomClipper<Path> {
  const _NotchedBarClipper();

  // Clears the 70px button (62 + a 4px ring each side) with a small gap.
  static const _notchRadius = 41.0;

  @override
  Path getClip(Size size) {
    final centre = size.width / 2;

    return Path.combine(
      PathOperation.difference,
      // Square edges: the bar runs the full width, flush to the screen.
      Path()..addRect(Offset.zero & size),
      // Centred on the top edge so the cut reads as a notch rather than a
      // hole, with a little clearance around the 62px button.
      Path()..addOval(
        Rect.fromCircle(center: Offset(centre, 0), radius: _notchRadius),
      ),
    );
  }

  @override
  bool shouldReclip(_NotchedBarClipper oldClipper) => false;
}

/// Raised circular button sitting in the notch.
class _ConsultButton extends StatelessWidget {
  const _ConsultButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 62,
        height: 62,
        decoration: BoxDecoration(
          color: AppColors.ink,
          shape: BoxShape.circle,
          // Separates the dark circle from whatever scrolls past behind it;
          // without this it disappears against a dark card.
          border: Border.all(color: AppColors.surface, width: 4),
          boxShadow: [
            BoxShadow(
              color: AppColors.ink.withValues(alpha: 0.38),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: const Icon(
          Icons.videocam_rounded,
          size: 28,
          color: Colors.white,
        ),
      ),
    );
  }
}

/// One bottom-nav destination: dark and bold while active, grey otherwise.
class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tint = selected ? AppColors.ink : AppColors.inkSubtle;

    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedScale(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            scale: selected ? 1.08 : 1,
            child: Icon(icon, size: 24, color: tint),
          ),
          const SizedBox(height: 6),
          // Flexible + ellipsis so a large text scale shortens the label
          // rather than overflowing the bar.
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: tint,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Stand-in until each destination is built.
class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 30, color: AppColors.inkSubtle),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.inkMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({required this.data});

  final HomeData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _TopBar(name: data.greetingName),
        Expanded(
          child: ListView(
            // Bottom clears the floating nav.
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 108),
            children: [
              _ConsultNowCard(lawyersOnline: data.lawyersOnline),
              const SizedBox(height: 12),
              const _ScheduleCard(),
              const SizedBox(height: 20),

              const _SectionTitle('Why Ask My Lawyer'),
              const SizedBox(height: 10),
              // Two per row. `Wrap` lets each tile keep its own height, so a
              // wrapped title left the pair ragged; `IntrinsicHeight` sizes
              // both to the taller of the two instead.
              for (var i = 0; i < homeFeatures.length; i += 2) ...[
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(child: _FeatureTile(feature: homeFeatures[i])),
                      const SizedBox(width: 12),
                      // The trailing gap keeps a lone last tile at half width
                      // rather than letting it stretch across the row.
                      if (i + 1 < homeFeatures.length)
                        Expanded(
                          child: _FeatureTile(feature: homeFeatures[i + 1]),
                        )
                      else
                        const Expanded(child: SizedBox()),
                    ],
                  ),
                ),
                if (i + 2 < homeFeatures.length) const SizedBox(height: 12),
              ],
              const SizedBox(height: 20),

              if (data.offerHeadline != null && data.offerBody != null) ...[
                _OfferCard(
                  headline: data.offerHeadline!,
                  body: data.offerBody!,
                ),
                const SizedBox(height: 20),
              ],

              const _SectionTitle('Your Activity'),
              const SizedBox(height: 10),
              if (data.hasConsultations)
                // TODO: list real bookings once the backend is wired.
                const SizedBox.shrink()
              else
                const _NoActivityCard(),
            ],
          ),
        ),
      ],
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.name});

  final String name;

  /// Greeting follows the clock, like the design's "Good Afternoon".
  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.ink,
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 16),
        child: Row(
          children: [
            InkWell(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const SettingsScreen()),
              ),
              borderRadius: BorderRadius.circular(6),
              child: const Padding(
                padding: EdgeInsets.all(2),
                child: Icon(Icons.menu, size: 24, color: Colors.white),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_greeting, $name',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'How can we help you today?',
                    style: TextStyle(fontSize: 12, color: Color(0xFFB6C0D4)),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const NotificationsScreen(),
                ),
              ),
              borderRadius: BorderRadius.circular(19),
              child: Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    const Icon(
                      Icons.notifications_none,
                      size: 19,
                      color: AppColors.ink,
                    ),
                    Positioned(
                      top: 9,
                      right: 10,
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: AppColors.negative,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}

/// Dark card offering an instant consultation.
class _ConsultNowCard extends StatelessWidget {
  const _ConsultNowCard({required this.lawyersOnline});

  final bool lawyersOnline;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (lawyersOnline)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _OnlineDot(),
                  SizedBox(width: 6),
                  Text(
                    'LAWYERS ONLINE',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 14),
          const Text(
            'Consult Now',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Connect with a lawyer instantly',
            style: TextStyle(fontSize: 12, color: Color(0xFFB6C0D4)),
          ),
          const SizedBox(height: 14),
          InkWell(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const ConsultationScreen(),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Start',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                SizedBox(width: 6),
                Icon(Icons.arrow_forward, size: 15, color: Colors.white),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OnlineDot extends StatelessWidget {
  const _OnlineDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 6,
      height: 6,
      decoration: const BoxDecoration(
        color: Color(0xFF34D399),
        shape: BoxShape.circle,
      ),
    );
  }
}

/// White row for booking a consultation at a chosen time.
class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard();

  @override
  Widget build(BuildContext context) {
    return InkWell(
      // TODO: open the scheduling flow.
      onTap: () {},
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.line),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.calendar_today_outlined,
                size: 17,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Schedule Consultation',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Book a consultation for a preferred date & time.',
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.35,
                      color: AppColors.inkMuted,
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

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.feature});

  final HomeFeature feature;

  /// Icons track the fixed feature list rather than being stored with it, so
  /// the data stays free of Flutter types.
  IconData get _icon => switch (feature.title) {
    'Verified Lawyers' => Icons.groups_outlined,
    'Secure Payment' => Icons.verified_user_outlined,
    'Consultation Reports' => Icons.description_outlined,
    _ => Icons.headset_mic_outlined,
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(_icon, size: 20, color: AppColors.ink),
          // A fixed gap, not a Spacer: the row above measures these tiles with
          // IntrinsicHeight, and a Spacer has no intrinsic height to report.
          // Equal heights come from the row; this just sets the rhythm.
          const SizedBox(height: 18),
          Text(
            feature.title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            feature.body,
            style: const TextStyle(
              fontSize: 12,
              height: 1.35,
              color: AppColors.inkMuted,
            ),
          ),
        ],
      ),
    );
  }
}

/// Dark promo banner.
class _OfferCard extends StatelessWidget {
  const _OfferCard({required this.headline, required this.body});

  final String headline;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'LIMITED OFFER',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            headline,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            body,
            style: const TextStyle(fontSize: 12, color: Color(0xFFB6C0D4)),
          ),
          const SizedBox(height: 14),
          InkWell(
            // TODO: apply the offer.
            onTap: () {},
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Apply Now',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward, size: 13, color: AppColors.ink),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// First-run state for Your Activity.
class _NoActivityCard extends StatelessWidget {
  const _NoActivityCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 26),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Icon(
              Icons.event_note_outlined,
              size: 20,
              color: AppColors.inkMuted,
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'No consultation yet',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Your bookings and reports will appear here once you connect '
            'with a lawyer.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              height: 1.45,
              color: AppColors.inkMuted,
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            // TODO: open the consult flow.
            onPressed: () {},
            child: const Text('Start Consultation'),
          ),
        ],
      ),
    );
  }
}
