import '../../core/network/api_client.dart';

/// What a notification is about, which the filter chips sort by.
enum NotificationKind { consultation, report, system }

/// Something worth telling the customer about.
class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.at,
    required this.kind,
    required this.unread,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        at: DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
            DateTime.now(),
        kind: switch (json['type'] as String? ?? '') {
          'report' => NotificationKind.report,
          'consultation' => NotificationKind.consultation,
          _ => NotificationKind.system,
        },
        unread: json['readAt'] == null,
      );

  final String id;
  final String title;
  final String body;
  final DateTime at;
  final NotificationKind kind;
  final bool unread;

  /// Groups the list into Today / Earlier.
  bool get isToday {
    final now = DateTime.now();
    return at.year == now.year && at.month == now.month && at.day == now.day;
  }

  /// "2:30 PM" today, "12 Jun" before that.
  String get time {
    if (isToday) {
      final hour = at.hour % 12 == 0 ? 12 : at.hour % 12;
      final minute = at.minute.toString().padLeft(2, '0');
      return '$hour:$minute ${at.hour < 12 ? 'AM' : 'PM'}';
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${at.day} ${months[at.month - 1]}';
  }
}

class NotificationRepository {
  NotificationRepository._();

  static final instance = NotificationRepository._();

  final _api = ApiClient.instance;

  Future<({List<AppNotification> items, int unread})> list() async {
    final data = await _api.get('/api/v1/customer/notifications');

    return (
      items: (data['data'] as List<dynamic>)
          .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
          .toList(),
      unread: data['unread'] as int? ?? 0,
    );
  }

  Future<int> unreadCount() async {
    final data = await _api.get('/api/v1/customer/notifications/unread-count');
    return data['unread'] as int? ?? 0;
  }

  /// Marks one as read, or the whole list when [id] is left out.
  Future<void> markRead({String? id}) async {
    await _api.post(
      id == null
          ? '/api/v1/customer/notifications/read'
          : '/api/v1/customer/notifications/$id/read',
      auth: true,
    );
  }
}
