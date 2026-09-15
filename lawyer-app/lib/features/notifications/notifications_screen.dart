import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

enum NotificationKind { consultation, earnings, system }

class AppNotification {
  const AppNotification({
    required this.title,
    required this.body,
    required this.time,
    required this.kind,
    required this.isToday,
    this.unread = false,
  });

  final String title;
  final String body;
  final String time;
  final NotificationKind kind;

  /// Groups the list into Today / Yesterday.
  final bool isToday;
  final bool unread;
}

const _sample = <AppNotification>[
  AppNotification(
    title: 'New Consultation Request',
    body:
        'Arjun Mehta has requested a 15-min session on corporate '
        'restructuring.',
    time: '2:30 PM',
    kind: NotificationKind.consultation,
    isToday: true,
    unread: true,
  ),
  AppNotification(
    title: 'New Consultation Request',
    body:
        'Arjun Mehta has requested a 15-min session on corporate '
        'restructuring.',
    time: '2:30 PM',
    kind: NotificationKind.consultation,
    isToday: true,
    unread: true,
  ),
  AppNotification(
    title: 'Payment credited',
    body: '₹4,500 has been credited to your HDFC account ending 4521.',
    time: '2:30 PM',
    kind: NotificationKind.earnings,
    isToday: false,
    unread: true,
  ),
  AppNotification(
    title: 'New Consultation Request',
    body:
        'Arjun Mehta has requested a 15-min session on corporate '
        'restructuring.',
    time: '2:30 PM',
    kind: NotificationKind.consultation,
    isToday: false,
  ),
];

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.notifications = _sample});

  /// Pass an empty list to see the first-run state.
  final List<AppNotification> notifications;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const _filters = ['All', 'Unread', 'Consultations', 'Earnings'];

  final _search = TextEditingController();
  String _filter = 'All';

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  int get _unreadCount =>
      widget.notifications.where((item) => item.unread).length;

  List<AppNotification> get _visible {
    final query = _search.text.trim().toLowerCase();

    return widget.notifications.where((item) {
      final matchesQuery =
          query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          item.body.toLowerCase().contains(query);

      final matchesFilter = switch (_filter) {
        'Unread' => item.unread,
        'Consultations' => item.kind == NotificationKind.consultation,
        'Earnings' => item.kind == NotificationKind.earnings,
        _ => true,
      };

      return matchesQuery && matchesFilter;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isEmpty = widget.notifications.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.chevron_left, size: 26),
          color: AppColors.ink,
        ),
        // The empty screen keeps the title centred; the list uses a heading.
        title: isEmpty
            ? const Text(
                'Notifications',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              )
            : null,
        centerTitle: true,
      ),
      body: isEmpty ? const _EmptyNotifications() : _list(),
    );
  }

  Widget _list() {
    final visible = _visible;
    final today = visible.where((item) => item.isToday).toList();
    final earlier = visible.where((item) => !item.isToday).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      children: [
        const Text(
          'Notifications',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '$_unreadCount unread',
          style: const TextStyle(fontSize: 13, color: AppColors.inkSubtle),
        ),
        const SizedBox(height: 14),

        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _search,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search notification...',
                  hintStyle: const TextStyle(
                    fontSize: 13,
                    color: AppColors.inkSubtle,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 18,
                    color: AppColors.inkSubtle,
                  ),
                  filled: true,
                  fillColor: AppColors.surface,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.line),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.brand),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.ink,
                borderRadius: BorderRadius.circular(10),
              ),
              // TODO: open advanced notification filters.
              child: const Icon(Icons.tune, size: 18, color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 14),

        SizedBox(
          height: 32,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _filters.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final filter = _filters[index];
              final selected = filter == _filter;

              return GestureDetector(
                onTap: () => setState(() => _filter = filter),
                child: Container(
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.ink : AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: selected ? AppColors.ink : AppColors.line,
                    ),
                  ),
                  child: Text(
                    filter,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: selected ? Colors.white : AppColors.inkMuted,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 18),

        if (visible.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 60),
            child: Text(
              'Nothing matches this filter.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          ),

        if (today.isNotEmpty) ...[
          const _GroupHeader(label: 'Today'),
          for (final item in today) _NotificationCard(item: item),
        ],

        if (earlier.isNotEmpty) ...[
          const _GroupHeader(label: 'Yesterday', action: 'View All'),
          for (final item in earlier) _NotificationCard(item: item),
        ],
      ],
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader({required this.label, this.action});

  final String label;
  final String? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
          ),
          if (action != null)
            Text(
              action!,
              style: const TextStyle(fontSize: 11, color: AppColors.inkSubtle),
            ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.item});

  final AppNotification item;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  item.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                item.time,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.inkSubtle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            item.body,
            style: const TextStyle(
              fontSize: 12,
              height: 1.5,
              color: AppColors.inkSubtle,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Oversized, very light bell — decoration rather than an icon.
            Icon(
              Icons.notifications_active,
              size: 150,
              color: AppColors.line.withValues(alpha: 0.9),
            ),
            const SizedBox(height: 20),
            const Text(
              'No Notifications',
              style: TextStyle(
                fontSize: 23,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              "We'll let you know when there will be something to update you.",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                height: 1.5,
                color: AppColors.inkSubtle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
