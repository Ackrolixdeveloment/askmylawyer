// Placeholder call history. Swap for the API once it exists — the screen
// already handles an empty list.

enum CallMode { audio, video, chat }

enum CallOutcome { accepted, rejected }

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

class Booking {
  const Booking({
    required this.id,
    required this.bookingId,
    required this.client,
    required this.practice,
    required this.caseTag,
    required this.clientRef,
    required this.date,
    required this.time,
    required this.durationMinutes,
    required this.mode,
    required this.outcome,
    required this.summary,
    required this.documents,
    required this.reportGeneratedAt,
  });

  final String id;
  final String bookingId;
  final String client;
  final String practice;
  final String caseTag;

  /// Short client reference shown on the detail screen.
  final String clientRef;

  final String date;
  final String time;
  final int durationMinutes;
  final CallMode mode;
  final CallOutcome outcome;

  final String summary;
  final List<BookingDocument> documents;

  /// Null until the consultation summary has been produced.
  final String? reportGeneratedAt;

  String get initials => client
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();

  String get modeLabel => switch (mode) {
    CallMode.audio => 'Audio',
    CallMode.video => 'Video',
    CallMode.chat => 'Chat',
  };
}

class BookingData {
  const BookingData({
    required this.accepted,
    required this.rejected,
    required this.thisMonth,
    required this.calls,
  });

  final int accepted;
  final int rejected;
  final double thisMonth;
  final List<Booking> calls;
}

const _summary =
    'During the consultation, the client sought legal guidance regarding '
    'divorce proceedings and child custody arrangements.';

const _documents = [
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

/// A mix of modes and outcomes, so every filter has something to show.
final bookingSample = BookingData(
  accepted: 12,
  rejected: 12,
  thisMonth: 84500,
  calls: List.generate(9, (index) {
    const modes = [CallMode.video, CallMode.audio, CallMode.chat];
    final mode = modes[index % modes.length];

    return Booking(
      id: 'booking-${index + 1}',
      bookingId: '#AML-123456',
      client: 'Sarah M.',
      practice: 'Family Law',
      caseTag: 'Child Custody',
      clientRef: '#SRM456',
      date: '12/06/202',
      time: '2:30 PM',
      durationMinutes: 14,
      mode: mode,
      // Every third call was turned down.
      outcome: index % 3 == 2 ? CallOutcome.rejected : CallOutcome.accepted,
      summary: _summary,
      documents: _documents,
      reportGeneratedAt: '12 Jun 2026 . 2:45 PM',
    );
  }),
);
