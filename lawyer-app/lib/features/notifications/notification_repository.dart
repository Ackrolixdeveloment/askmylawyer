import 'package:flutter/foundation.dart';

import '../../core/network/api_client.dart';

/// One entry in the lawyer's notification list.
class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.read,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        type: json['type'] as String? ?? 'admin_notification',
        read: json['read'] as bool? ?? false,
        createdAt:
            DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
            DateTime.now(),
      );

  final String id;
  final String title;
  final String body;

  /// Where it came from, e.g. `admin_notification`.
  final String type;
  final bool read;
  final DateTime createdAt;

  /// "2:30 PM", as shown on the card.
  String get time {
    final hour = createdAt.hour % 12 == 0 ? 12 : createdAt.hour % 12;
    final minute = createdAt.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${createdAt.hour < 12 ? 'AM' : 'PM'}';
  }

  bool get isToday {
    final now = DateTime.now();
    return createdAt.year == now.year &&
        createdAt.month == now.month &&
        createdAt.day == now.day;
  }
}

class NotificationRepository {
  NotificationRepository._();

  static final instance = NotificationRepository._();

  static const _path = '/api/v1/lawyer/notifications';

  final _api = ApiClient.instance;

  /// Unread count, watched by the bell on the home screen.
  final unreadBadge = ValueNotifier<int>(0);

  /// [after] limits the result to what has arrived since that moment — how
  /// the poller spots new notifications.
  Future<({List<AppNotification> items, int unread})> load({
    DateTime? after,
  }) async {
    final query = after == null
        ? ''
        : '?after=${Uri.encodeQueryComponent(after.toUtc().toIso8601String())}';
    final data = await _api.get('$_path$query');
    final list = (data['data'] as List<dynamic>)
        .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
        .toList();

    final unread = data['unread'] as int? ?? 0;
    unreadBadge.value = unread;
    return (items: list, unread: unread);
  }

  /// Refreshes the badge. Quietly leaves it alone when nobody is signed in.
  Future<void> refreshBadge() async {
    try {
      final data = await _api.get('$_path/unread-count');
      unreadBadge.value = data['unread'] as int? ?? 0;
    } on ApiException {
      unreadBadge.value = 0;
    }
  }

  Future<void> markAllRead() async {
    try {
      await _api.post('$_path/read', auth: true);
      unreadBadge.value = 0;
    } on ApiException {
      // The list still reads as unread next time; not worth interrupting.
    }
  }
}
