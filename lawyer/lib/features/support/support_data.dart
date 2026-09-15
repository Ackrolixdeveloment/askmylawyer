// Placeholder help-centre content. Swap for the API once it exists — the
// screen already handles an empty request list.

enum TicketState { open, resolved }

class TicketAttachment {
  const TicketAttachment({required this.name, required this.size});

  final String name;
  final String size;
}

class TicketMessage {
  const TicketMessage({
    required this.author,
    required this.body,
    required this.timestamp,
    required this.fromSupport,
  });

  final String author;
  final String body;
  final String timestamp;

  /// Support replies carry a different avatar to the lawyer's own entries.
  final bool fromSupport;
}

class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.subject,
    required this.category,
    required this.updated,
    required this.state,
    this.statusLabel = 'In Progress',
    this.createdOn = '12-07-2026 01:16 pm',
    this.description = '',
    this.attachments = const [],
    this.conversation = const [],
  });

  final String id;
  final String subject;
  final String category;
  final String updated;
  final TicketState state;

  final String statusLabel;
  final String createdOn;
  final String description;
  final List<TicketAttachment> attachments;
  final List<TicketMessage> conversation;
}

class FaqEntry {
  const FaqEntry({required this.question, required this.answer});

  final String question;
  final String answer;
}

/// A past consultation a ticket can be raised against.
class TicketConsultation {
  const TicketConsultation({
    required this.client,
    required this.when,
    required this.fee,
  });

  final String client;
  final String when;
  final int fee;

  String get initials => client
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();
}

const ticketConsultations = [
  TicketConsultation(client: 'Rahul Sharma', when: '8 Sep, 3:00 PM', fee: 999),
  TicketConsultation(
    client: 'Sanjana Budhiraja',
    when: '8 Sep, 3:00 PM',
    fee: 999,
  ),
  TicketConsultation(client: 'Rahul Sharma', when: '8 Sep, 3:00 PM', fee: 999),
  TicketConsultation(
    client: 'Sanjana Budhiraja',
    when: '8 Sep, 3:00 PM',
    fee: 999,
  ),
];

const quickHelpTopics = [
  'Booking Issues',
  'Payments',
  'Consultation Issues',
  'Account Issues',
];

const _description =
    'I need to reschedule my consultation which is scheduled on 15Jun 2026 '
    'at 4:00PM with Adv.Rohan Mehta. Please help me with unavailable slots.';

const _attachments = [
  TicketAttachment(name: 'Payment_Receipt.pdf', size: '245 KB'),
  TicketAttachment(name: 'Consultation_Details .pdf', size: '182 KB'),
];

const _conversation = [
  TicketMessage(
    author: 'You created this ticket',
    body:
        'I need to reschedule my consultation which is schedule on 15Jun 2026 '
        'at 4:00 PM.',
    timestamp: '12-07-2026 01:16 pm',
    fromSupport: false,
  ),
  TicketMessage(
    author: 'Support team replied',
    body:
        'Hi! We understand your request. Our team is checking the lawyer\'s '
        'availability and will get back to you shortly.',
    timestamp: '12-07-2026 01:16 pm',
    fromSupport: true,
  ),
  TicketMessage(
    author: 'You created this ticket',
    body:
        'I need to reschedule my consultation which is schedule on 15Jun 2026 '
        'at 4:00 PM.',
    timestamp: '12-07-2026 01:16 pm',
    fromSupport: false,
  ),
];

const supportTickets = [
  SupportTicket(
    id: 'TKT-4798',
    subject: 'Rescheduling consultation with Adv.Rohan Mehta',
    category: 'Payments',
    updated: 'Today, 2:14 PM',
    state: TicketState.open,
    description: _description,
    attachments: _attachments,
    conversation: _conversation,
  ),
  SupportTicket(
    id: 'TKT-4798',
    subject: 'Rescheduling consultation with Adv.Rohan Mehta',
    category: 'Payments',
    updated: 'Today, 2:14 PM',
    state: TicketState.open,
    description: _description,
    attachments: _attachments,
    conversation: _conversation,
  ),
];

const faqEntries = [
  FaqEntry(
    question: 'How do refunds work?',
    answer:
        'Refunds are issued to the original payment method and usually reach '
        'your account within 3-7 business days of approval.',
  ),
  FaqEntry(
    question: 'How do I reschedule a consultation?',
    answer:
        'Open the booking from your Bookings tab and choose a new slot. The '
        'client is notified automatically once the change is confirmed.',
  ),
  FaqEntry(
    question: 'How do I raise a billing dispute?',
    answer:
        'Create a ticket from this screen with the consultation ID. Our team '
        'reviews billing disputes within two working days.',
  ),
];
