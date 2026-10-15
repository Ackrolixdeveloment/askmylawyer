import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../bookings/bookings_screen.dart';
import '../commission/commission_screen.dart';
import '../consultations/availability_controller.dart';
import '../consultations/offer_watcher.dart';
import '../consultations/rejoin_card.dart';
import '../reports/report_screen.dart';
import 'activity_screen.dart';
import '../notifications/notification_poller.dart';
import '../notifications/notification_repository.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../referral/referral_screen.dart';
import '../settings/settings_screen.dart';
import '../../core/network/api_client.dart';
import 'home_repository.dart';
import 'widgets/home_sections.dart';

/// Shell holding the five bottom-nav destinations.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.data});

  /// Supplied only by tests and previews; otherwise it is fetched.
  final HomeData? data;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  /// One navigator per tab, so every tab keeps its own back stack and no
  /// destination can be left out of the system-back handling below.
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

  /// Settings opens inside the home tab, so the bottom nav stays in place
  /// and Home — not Profile — remains the highlighted destination.
  void _openSettings() {
    _navigators[0].currentState?.push(
      MaterialPageRoute<void>(
        builder: (_) => SettingsScreen(onEditProfile: _openProfileTab),
      ),
    );
  }

  /// Closes settings and moves to the Profile tab, so the profile is always
  /// the same screen inside the same shell.
  void _openProfileTab() {
    _navigators[0].currentState?.popUntil((route) => route.isFirst);
    setState(() => _tab = 3);
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

  static const _destinations = [
    (icon: Icons.home_outlined, label: 'Home'),
    (icon: Icons.receipt_long_outlined, label: 'Commission'),
    (icon: Icons.assignment_outlined, label: 'Bookings'),
    (icon: Icons.person_outline, label: 'Profile'),
  ];

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
      child: _buildScaffold(),
    );
  }

  Widget _buildScaffold() {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      // Every tab is wrapped, so pushes from any of them stay inside the
      // tab and the bottom nav survives.
      body: switch (_tab) {
        0 => _tabNavigator(
          0,
          _HomeTab(data: widget.data, onOpenSettings: _openSettings),
        ),
        // Each has its own scroll view, so they just need the status-bar inset.
        1 => _tabNavigator(
          1,
          const SafeArea(bottom: false, child: CommissionScreen()),
        ),
        2 => _tabNavigator(
          2,
          const SafeArea(bottom: false, child: BookingsScreen()),
        ),
        // Inside a tab there is nothing to pop, so close returns home.
        _ => _tabNavigator(
          3,
          SafeArea(bottom: false, child: const ProfileScreen()),
        ),
      },
      // Built by hand rather than with NavigationBar, which imposes its own
      // selected colours and pill indicator.
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.line)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 60,
            child: Row(
              children: [
                for (var i = 0; i < _destinations.length; i++)
                  Expanded(
                    child: _NavItem(
                      icon: _destinations[i].icon,
                      label: _destinations[i].label,
                      selected: _tab == i,
                      onTap: () => setState(() => _tab = i),
                    ),
                  ),
              ],
            ),
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
          Icon(icon, size: 21, color: tint),
          const SizedBox(height: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
              color: tint,
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeTab extends StatefulWidget {
  const _HomeTab({required this.data, required this.onOpenSettings});

  /// Null until the dashboard has been fetched.
  final HomeData? data;
  final VoidCallback onOpenSettings;

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

/// How much of the activity list the home screen shows.
const _recentActivityShown = 3;

class _HomeTabState extends State<_HomeTab> {
  final _availability = AvailabilityController.instance;

  HomeData? _data;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _availability.addListener(_onAvailabilityChanged);
    _availability.load();
    // Consultation offers ring from here.
    OfferWatcher.instance.start();

    final given = widget.data;
    if (given != null) {
      _data = given;
      _loading = false;
    } else {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await HomeRepository.instance.dashboard();
      if (mounted) setState(() => _data = data);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _availability.removeListener(_onAvailabilityChanged);
    OfferWatcher.instance.stop();
    super.dispose();
  }

  void _onAvailabilityChanged() {
    if (mounted) setState(() {});
  }

  /// Why the toggle would not move, in the lawyer's words.
  String? get _notice {
    if (_availability.error != null) return _availability.error;

    return switch (_availability.problem) {
      LocationProblem.servicesOff =>
        'Turn on location on your phone to go online and receive '
            'consultations.',
      LocationProblem.denied =>
        'We need your location to send you nearby consultations. Allow it '
            'and try again.',
      LocationProblem.deniedForever =>
        'Location is blocked for this app. Allow it in your phone settings '
            'to go online.',
      null => null,
    };
  }

  /// Toggles availability, and explains if they went offline part-way
  /// through a consultation — that one is still theirs to finish.
  Future<void> _setOnline(bool value) async {
    await _availability.setOnline(value);
    if (!mounted) return;

    final endsAt = _availability.takeLiveUntil();
    if (endsAt == null) return;

    final hour = endsAt.hour % 12 == 0 ? 12 : endsAt.hour % 12;
    final minute = endsAt.minute.toString().padLeft(2, '0');
    final period = endsAt.hour < 12 ? 'am' : 'pm';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 6),
        content: Text(
          "You'll get no new requests. Your current consultation is still "
          'yours until $hour:$minute$period — the client can rejoin until then.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;

    return Column(
      children: [
        _TopBar(
          name: data?.greetingName ?? '',
          onOpenSettings: widget.onOpenSettings,
        ),
        // Pinned under the top bar rather than scrolled away with the rest,
        // so availability can be toggled from anywhere on the page.
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
          child: OnlineCard(
            online: _availability.isOnline,
            busy: _availability.busy,
            notice: _notice,
            onFixLocation:
                _availability.problem == LocationProblem.deniedForever
                ? _availability.openSettings
                : null,
            onChanged: _setOnline,
          ),
        ),

        if (data == null)
          Expanded(
            child: Center(
              child: _loading
                  ? const CircularProgressIndicator()
                  : Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        _error ?? 'Nothing to show yet.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
            ),
          )
        else
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              child: ListView(
            padding: const EdgeInsets.fromLTRB(14, 16, 14, 24),
            children: [
              // A call still running is the most urgent thing here, so it
              // goes above the earnings. Hides itself when there is none.
              const RejoinCard(),
              const SectionHeader(title: 'Total Weekly Earnings'),
              EarningsCard(
                amount: data.weeklyEarnings.toDouble(),
                changePercent: data.weeklyChangePercent,
                series: data.earningsSeries,
              ),
              const SizedBox(height: 16),

              /*
               * Upcoming Consultation and Today's Schedule are parked, not
               * dropped.
               *
               * Both describe a diary, and a lawyer has no diary: they go
               * online and take whatever comes. Neither section can ever
               * hold anything until lawyers can set their own slots and
               * clients can book them. Shown empty they read as broken, so
               * they stay here until there is scheduling to fill them.
               *
               * SectionHeader(
               *   title: 'Upcoming Consultation',
               *   actionLabel: data.upcoming == null ? null : 'View All',
               * ),
               * if (data.upcoming case final upcoming?)
               *   UpcomingCard(consultation: upcoming)
               * else
               *   const EmptySection(
               *     icon: Icons.event_note_outlined,
               *     title: 'No Consultation',
               *     body: 'Your upcoming client consultations will be '
               *         'displayed here.',
               *   ),
               * const SizedBox(height: 16),
               *
               * SectionHeader(
               *   title: "Today's Schedule",
               *   actionLabel: data.schedule.isEmpty ? null : 'View All',
               * ),
               * if (data.schedule.isEmpty)
               *   const EmptySection(
               *     icon: Icons.event_available_outlined,
               *     title: 'No Schedule for Today',
               *     body: 'Your confirmed consultations for today will '
               *         'appear here.',
               *   )
               * else
               *   for (final entry in data.schedule) ...[
               *     ScheduleRow(entry: entry),
               *     const SizedBox(height: 8),
               *   ],
               * const SizedBox(height: 8),
               */

              // Reports are only worth surfacing when something is overdue.
              if (data.pendingReports.isNotEmpty) ...[
                const SectionHeader(
                  title: 'Pending Reports',
                  actionLabel: 'Create',
                  actionIcon: Icons.edit_outlined,
                ),
                Text(
                  data.heldTotal > 0
                      ? '${data.pendingReports.length} pending · '
                            '₹${data.heldTotal} on hold'
                      : '${data.pendingReports.length} Reports Pending',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFB98A2F),
                  ),
                ),
                const SizedBox(height: 8),
                for (final report in data.pendingReports) ...[
                  InkWell(
                    onTap: () => _openReport(report),
                    borderRadius: BorderRadius.circular(12),
                    child: SectionCard(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                report.client,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ink,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                report.heldAmount > 0
                                    ? 'Consulted ${report.consultedAgo} · '
                                          'holding ₹${report.heldAmount}'
                                    : 'Consulted ${report.consultedAgo}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: report.overdue
                                      ? AppColors.negative
                                      : AppColors.inkSubtle,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right,
                          size: 18,
                          color: AppColors.inkSubtle,
                        ),
                      ],
                    ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                const SizedBox(height: 8),
              ],

              SectionHeader(
                title: 'Recent Activity',
                // Only worth offering when there is more than is shown.
                actionLabel: data.activity.length > _recentActivityShown
                    ? 'View All'
                    : null,
                onAction: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const ActivityScreen(),
                  ),
                ),
              ),
              // A dashboard is for what needs attention now, not a ledger of
              // everything that has ever happened. The rest is a tap away.
              for (final entry in data.activity.take(_recentActivityShown)) ...[
                ActivityRow(entry: entry),
                const SizedBox(height: 8),
              ],
            ],
              ),
            ),
          ),
      ],
    );
  }

  /// Opens the report this card is about, then refreshes — sending it moves
  /// money out of hold, and the dashboard should say so at once.
  Future<void> _openReport(PendingReport report) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ReportScreen(consultationId: report.consultationId),
      ),
    );
    if (mounted) _load();
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.name, required this.onOpenSettings});

  final String name;
  final VoidCallback onOpenSettings;

  /// Greeting follows the clock, like the design's "Good Afternoon".
  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.ink,
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
        child: Row(
          children: [
            InkWell(
              onTap: onOpenSettings,
              borderRadius: BorderRadius.circular(6),
              child: const Padding(
                padding: EdgeInsets.all(2),
                child: Icon(
                  Icons.menu,
                  size: 24,
                  weight: 700,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _greeting,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFFB6C0D4),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const ReferralScreen()),
              ),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.card_giftcard, size: 17, color: Colors.white),
                    SizedBox(width: 8),
                    Text(
                      'Refer & Earn',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),

            const _NotificationBell(),
          ],
        ),
      ),
    );
  }
}


/// Bell on the home banner, carrying the unread count.
class _NotificationBell extends StatefulWidget {
  const _NotificationBell();

  @override
  State<_NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends State<_NotificationBell> {
  final _notifications = NotificationRepository.instance;

  @override
  void initState() {
    super.initState();
    _notifications.refreshBadge();
    // Banners come from here, so they appear even on a phone push cannot
    // reach.
    NotificationPoller.instance.start();
  }

  @override
  void dispose() {
    NotificationPoller.instance.stop();
    super.dispose();
  }

  Future<void> _open() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const NotificationsScreen()),
    );
    // Reading the list clears the badge; pick up whatever it left behind.
    await _notifications.refreshBadge();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _open,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 38,
        height: 38,
        // Outlined circle on the dark band, not a filled disc.
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white),
        ),
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            const Icon(
              Icons.notifications_none,
              size: 19,
              color: Colors.white,
            ),
            ValueListenableBuilder<int>(
              valueListenable: _notifications.unreadBadge,
              builder: (context, unread, _) {
                if (unread == 0) return const SizedBox.shrink();

                return Positioned(
                  top: 2,
                  right: 1,
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 15),
                    height: 15,
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: AppColors.negative,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white, width: 1.2),
                    ),
                    child: Text(
                      unread > 9 ? '9+' : '$unread',
                      style: const TextStyle(
                        fontSize: 9,
                        height: 1,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
