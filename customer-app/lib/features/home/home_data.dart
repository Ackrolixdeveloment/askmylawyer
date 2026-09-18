/// One reason-to-trust tile in the "Why Ask My Lawyer" grid.
class HomeFeature {
  const HomeFeature({required this.title, required this.body});

  final String title;
  final String body;
}

/// Everything the customer home tab renders.
class HomeData {
  const HomeData({
    required this.greetingName,
    required this.lawyersOnline,
    required this.hasConsultations,
    this.offerHeadline,
    this.offerBody,
  });

  final String greetingName;

  /// Drives the "LAWYERS ONLINE" pill on the consult card.
  final bool lawyersOnline;

  /// False on first run, which shows the empty Your Activity card.
  final bool hasConsultations;

  /// Promo banner; hidden when either half is null.
  final String? offerHeadline;
  final String? offerBody;
}

/// First-run state: no bookings yet, offer still available.
const emptyHome = HomeData(
  greetingName: 'Priya',
  lawyersOnline: true,
  hasConsultations: false,
  offerHeadline: 'First Consultation Offer',
  offerBody: 'Get ₹100 off on your first consultation.',
);

/// Fixed for now — these never vary per customer.
const homeFeatures = <HomeFeature>[
  HomeFeature(title: 'Verified Lawyers', body: 'Hand - picked legal experts'),
  HomeFeature(title: 'Secure Payment', body: 'Encrypted transactions.'),
  HomeFeature(title: 'Consultation Reports', body: 'Detailed case summaries.'),
  HomeFeature(title: 'Audio , Video & Chat', body: 'Talk your way'),
];
