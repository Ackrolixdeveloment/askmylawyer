// Placeholder booking history. Swap for the API once it exists — the screen
// already handles an empty list.

enum CallMode { audio, video, chat }

enum BookingStatus { completed, canceled, rescheduled }

/// Whether the consultation summary has been produced yet.
enum ReportStatus { available, pending }

class BookingDocument {
  const BookingDocument({
    required this.name,
    required this.uploadedBy,
    required this.size,
  });

  final String name;
  final String uploadedBy;
  final String size;
}

/// One message from the in-call chat transcript.
class ChatMessage {
  const ChatMessage({
    required this.author,
    required this.body,
    required this.time,
    required this.fromCustomer,
  });

  final String author;
  final String body;
  final String time;

  /// Drives which side of the thread the message sits on.
  final bool fromCustomer;
}

class PaymentSummary {
  const PaymentSummary({
    required this.amountPaid,
    required this.couponDiscount,
    required this.finalPaid,
  });

  final int amountPaid;
  final int couponDiscount;
  final int finalPaid;
}

class Booking {
  const Booking({
    required this.id,
    required this.bookingId,
    required this.lawyer,
    required this.practice,
    required this.date,
    required this.time,
    required this.durationMinutes,
    required this.mode,
    required this.status,
    required this.report,
    required this.summary,
    required this.myDocuments,
    required this.lawyerDocuments,
    required this.chat,
    required this.payment,
    required this.reportGeneratedAt,
  });

  final String id;
  final String bookingId;

  /// The advocate the customer spoke to.
  final String lawyer;

  final String practice;
  final String date;
  final String time;
  final int durationMinutes;
  final CallMode mode;
  final BookingStatus status;
  final ReportStatus report;

  final String summary;

  /// Files the customer attached, and the ones the advocate sent back.
  final List<BookingDocument> myDocuments;
  final List<BookingDocument> lawyerDocuments;

  final List<ChatMessage> chat;
  final PaymentSummary payment;

  /// Null until the consultation summary has been produced.
  final String? reportGeneratedAt;

  String get modeLabel => switch (mode) {
    CallMode.audio => 'Audio',
    CallMode.video => 'Video',
    CallMode.chat => 'Chat',
  };

  String get statusLabel => switch (status) {
    BookingStatus.completed => 'Completed',
    BookingStatus.canceled => 'Canceled',
    BookingStatus.rescheduled => 'Rescheduled',
  };
}

const _summary =
    'During the consultation, the client sought legal guidance regarding '
    'divorce proceedings and child custody arrangements.';

const _myDocuments = [
  BookingDocument(
    name: 'Marriage Certificate.pdf',
    uploadedBy: 'Client',
    size: '2.4 MB',
  ),
  BookingDocument(
    name: 'Legal Notice .pdf',
    uploadedBy: 'Client',
    size: '2.4 MB',
  ),
];

const _lawyerDocuments = [
  BookingDocument(
    name: 'Marriage Certificate.pdf',
    uploadedBy: 'Lawyer',
    size: '2.4 MB',
  ),
];

const _chat = [
  ChatMessage(
    author: 'You',
    body: 'Can you explain the next steps for the case?',
    time: '2:32 PM',
    fromCustomer: true,
  ),
  ChatMessage(
    author: 'Adv. Priyanshu Sharma',
    body:
        'Yes, I have explained all the possible legal options in '
        'chat / doc.',
    time: '2:33 PM',
    fromCustomer: false,
  ),
];

const _payment = PaymentSummary(
  amountPaid: 999,
  couponDiscount: 400,
  finalPaid: 599,
);

/// A mix of modes and statuses, so every filter has something to show.
final bookingSample = List.generate(9, (index) {
  const modes = [CallMode.video, CallMode.audio, CallMode.chat];
  const statuses = [
    BookingStatus.completed,
    BookingStatus.completed,
    BookingStatus.canceled,
    BookingStatus.rescheduled,
  ];

  return Booking(
    id: 'booking-${index + 1}',
    bookingId: '#AML-12345$index',
    lawyer: 'Adv.Priyanshu Sharma',
    practice: 'Family Law',
    date: '12/06/2025',
    time: '2:30 PM',
    durationMinutes: 14,
    mode: modes[index % modes.length],
    status: statuses[index % statuses.length],
    // Every other one is still waiting on its report.
    report: index.isEven ? ReportStatus.available : ReportStatus.pending,
    summary: _summary,
    myDocuments: _myDocuments,
    lawyerDocuments: _lawyerDocuments,
    chat: _chat,
    payment: _payment,
    reportGeneratedAt: index.isEven ? '12 Jun 2026 . 2:45 PM' : null,
  );
});
