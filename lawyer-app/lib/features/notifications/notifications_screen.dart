import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'notification_repository.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const _filters = ['All', 'Unread'];

  final _search = TextEditingController();
  String _filter = 'All';

  List<AppNotification> _notifications = const [];
  int _unreadCount = 0;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final result = await NotificationRepository.instance.load();
      if (!mounted) return;
      setState(() {
        _notifications = result.items;
        _unreadCount = result.unread;
        _loading = false;
      });

      // Opening the list counts as reading it, so the bell clears.
      if (result.unread > 0) {
        await NotificationRepository.instance.markAllRead();
      }
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  List<AppNotification> get _visible {
    final query = _search.text.trim().toLowerCase();

    return _notifications.where((item) {
      final matchesQuery =
          query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          item.body.toLowerCase().contains(query);

      return matchesQuery && (_filter != 'Unread' || !item.read);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isEmpty = _notifications.isEmpty;

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
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _Failed(message: _error!, onRetry: _load)
          : isEmpty
          ? const _EmptyNotifications()
          : RefreshIndicator(onRefresh: _load, child: _list()),
    );
  }

  Widget _list() {
    final visible = _visible;
    final today = visible.where((item) => item.isToday).toList();
    final earlier = visible.where((item) => !item.isToday).toList();

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
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
          const _GroupHeader(label: 'Earlier'),
          for (final item in earlier) _NotificationCard(item: item),
        ],
      ],
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader({required this.label});

  final String label;

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
              if (!item.read) ...[
                Container(
                  width: 7,
                  height: 7,
                  margin: const EdgeInsets.only(top: 5, right: 8),
                  decoration: const BoxDecoration(
                    color: AppColors.negative,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
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


/// The list could not be loaded — offer another go.
class _Failed extends StatelessWidget {
  const _Failed({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
