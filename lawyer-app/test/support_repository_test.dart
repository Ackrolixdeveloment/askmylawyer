import 'package:flutter_test/flutter_test.dart';
import 'package:lawyer_app/features/support/support_repository.dart';

void main() {
  test('server ticket rows and full conversations use the same schema', () {
    final ticket = LiveSupportTicket.fromJson({
      'id': 'ticket-id',
      'code': 'TKT-17',
      'subject': 'Payment question',
      'description': 'Please check',
      'categoryName': 'General support',
      'status': 'resolved',
      'priority': 'medium',
      'createdAt': '2026-11-02T00:00:00Z',
      'updatedAt': '2026-11-02T01:00:00Z',
      'resolution': 'Checked payment',
      'hasMoreMessages': true,
      'messages': [
        {
          'id': 'message-id',
          'authorKind': 'admin',
          'authorName': 'Support',
          'body': 'Resolved',
          'createdAt': '2026-11-02T01:00:00Z',
        },
      ],
      'attachments': [
        {
          'id': 'file-id',
          'name': 'evidence.pdf',
          'mimeType': 'application/pdf',
          'sizeBytes': 128,
        },
      ],
    });
    expect(ticket.id, 'ticket-id');
    expect(ticket.code, 'TKT-17');
    expect(ticket.resolution, 'Checked payment');
    expect(ticket.messages.single.fromSupport, isTrue);
    expect(ticket.files.single.size, 128);
    expect(ticket.hasMoreMessages, isTrue);
    final row = LiveSupportTicket.fromJson({
      'id': 'id',
      'code': 'TKT-18',
      'subject': 'Help',
      'categoryName': 'General support',
      'status': 'new',
      'priority': 'medium',
      'createdAt': '2026-11-02T00:00:00Z',
      'updatedAt': '2026-11-02T00:00:00Z',
    });
    expect(row.messages, isEmpty);
    expect(row.files, isEmpty);
  });
  test(
    'timestamps render IST and retry keys are portable unique request IDs',
    () {
      expect(supportDate('2026-11-02T00:00:00Z'), '02-11-2026 05:30 IST');
      expect(supportStatus('in_progress'), 'In progress');
      final repo = SupportRepository.instance;
      final keys = List.generate(50, (_) => repo.newKey());
      expect(keys.toSet().length, 50);
      expect(keys.every((v) => RegExp(r'^[a-f0-9]{32}$').hasMatch(v)), isTrue);
    },
  );
}
