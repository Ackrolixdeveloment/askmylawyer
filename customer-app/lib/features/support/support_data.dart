import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Where a ticket has got to. Drives the pill on the card and the detail head.
enum TicketStatus { inProgress, open, resolved }

extension TicketStatusLabels on TicketStatus {
  String get label => switch (this) {
    TicketStatus.inProgress => 'In Progress',
    TicketStatus.open => 'Open',
    TicketStatus.resolved => 'Resolved',
  };

  /// Amber while the team still owes an answer, green once it is closed.
  Color get tint => switch (this) {
    TicketStatus.inProgress => const Color(0xFFE08A1E),
    TicketStatus.open => AppColors.brand,
    TicketStatus.resolved => AppColors.positive,
  };

  Color get wash => switch (this) {
    TicketStatus.inProgress => const Color(0xFFFDF3E4),
    TicketStatus.open => AppColors.brandSoft,
    TicketStatus.resolved => const Color(0xFFE8F6ED),
  };
}

/// The buckets a ticket can be raised under, shown in both the filter and
/// the Raise a Ticket form.
enum TicketCategory { payments, scheduling, lawyer, technical, other }

extension TicketCategoryLabels on TicketCategory {
  String get label => switch (this) {
    TicketCategory.payments => 'Payments',
    TicketCategory.scheduling => 'Scheduling',
    TicketCategory.lawyer => 'Lawyer',
    TicketCategory.technical => 'Technical',
    TicketCategory.other => 'Other',
  };
}

/// A file the customer attached when raising the ticket.
class TicketAttachment {
  const TicketAttachment({required this.name, required this.size});

  final String name;

  /// Pre-formatted, e.g. "245 KB" — there is no real file behind it yet.
  final String size;
}

/// One entry in the ticket's conversation thread.
class TicketMessage {
  const TicketMessage({
    required this.body,
    required this.timestamp,
    required this.fromSupport,
  });

  final String body;
  final String timestamp;

  /// Support replies carry the headset avatar; the customer's carry the
  /// person avatar and read "You created this ticket".
  final bool fromSupport;
}

class SupportTicket {
  SupportTicket({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    required this.createdOn,
    required this.lastUpdated,
    required this.lastUpdatedLabel,
    required this.description,
    this.attachments = const [],
    List<TicketMessage>? conversation,
  }) : conversation = conversation ?? [];

  /// Shown as TKT-4798 on the card and the detail head.
  final String id;

  final String title;
  final TicketCategory category;
  TicketStatus status;

  final String createdOn;

  /// Full timestamp on the detail screen.
  String lastUpdated;

  /// Relative form on the list card, e.g. "2h ago".
  String lastUpdatedLabel;

  final String description;
  final List<TicketAttachment> attachments;
  final List<TicketMessage> conversation;
}

/// Questions shown in the collapsible Popular Questions list.
class FaqEntry {
  const FaqEntry({required this.question, required this.answer});

  final String question;
  final String answer;
}

const faqEntries = <FaqEntry>[
  FaqEntry(
    question: 'How do refunds work?',
    answer:
        'If a consultation does not take place, the amount is returned to '
        'your original payment method within 5–7 working days. Raise a '
        'ticket under Payments if it has been longer than that.',
  ),
  FaqEntry(
    question: 'How do I reschedule a consultation?',
    answer:
        'Open the consultation from Upcoming and choose a new slot at least '
        '2 hours before the scheduled time. Inside that window, raise a '
        'ticket under Scheduling and the team will arrange it with the '
        'lawyer.',
  ),
  FaqEntry(
    question: 'How do I raise a billing dispute?',
    answer:
        'Raise a ticket under Payments with the booking ID and attach the '
        'payment receipt. The team responds within 24 hours.',
  ),
];

/// Placeholder tickets. Swap for the API once it exists — every screen
/// already handles an empty list.
List<SupportTicket> supportSample = [
  SupportTicket(
    id: 'TKT-4798',
    title: 'Rescheduling Consultation',
    category: TicketCategory.payments,
    status: TicketStatus.inProgress,
    createdOn: '12-07-2026 01:16 pm',
    lastUpdated: '12-07-2026 01:16 pm',
    lastUpdatedLabel: '2h ago',
    description:
        'I need to reschedule my consultation which is scheduled on 15Jun '
        '2026 at 4:00PM with Adv.Rohan Mehta. Please help me with '
        'unavailable slots.',
    attachments: const [
      TicketAttachment(name: 'Payment_Receipt.pdf', size: '245 KB'),
      TicketAttachment(name: 'Consultation_Details .pdf', size: '182 KB'),
    ],
    conversation: [
      const TicketMessage(
        body:
            'I need to reschedule my consultation which is schedule on '
            '15Jun 2026 at 4:00 PM.',
        timestamp: '12-07-2026 01:16 pm',
        fromSupport: false,
      ),
      const TicketMessage(
        body:
            'Hi! We understand your request. Our team is checking the '
            "lawyer's availability and will get back to you shortly.",
        timestamp: '12-07-2026 01:16 pm',
        fromSupport: true,
      ),
    ],
  ),
];

/// Consultations offered in the Raise a Ticket picker.
class ConsultationOption {
  const ConsultationOption({
    required this.lawyer,
    required this.slot,
    required this.fee,
  });

  final String lawyer;
  final String slot;
  final String fee;

  /// Initials for the avatar, e.g. "Rahul Sharma" becomes "RS".
  String get initials {
    final parts = lawyer.trim().split(RegExp(r'\s+'));
    if (parts.length < 2) return lawyer.characters.take(2).toString();
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }
}

const consultationOptions = <ConsultationOption>[
  ConsultationOption(
    lawyer: 'Rahul Sharma',
    slot: '8 Sep, 3:00 PM',
    fee: '₹999',
  ),
  ConsultationOption(
    lawyer: 'Sanjana Budhirija',
    slot: '8 Sep, 3:00 PM',
    fee: '₹999',
  ),
];
