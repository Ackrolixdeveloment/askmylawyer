/// Where the policy pages live.
///
/// Empty until the client publishes them, and a row whose link is empty is
/// hidden rather than shown as a button that does nothing. Supply them at
/// build time, or fill the defaults in once the URLs are permanent:
///
/// ```
/// flutter build apk --dart-define=TERMS_URL=https://amlst.in/terms
/// ```
class LegalLinks {
  const LegalLinks._();

  static const terms = String.fromEnvironment('TERMS_URL');
  static const privacy = String.fromEnvironment('PRIVACY_URL');
  static const refunds = String.fromEnvironment('REFUND_URL');

  /// Google Play and the App Store both require a reachable privacy policy,
  /// so this has to be answered before either store will take a build.
  static bool get anyPublished =>
      terms.isNotEmpty || privacy.isNotEmpty || refunds.isNotEmpty;
}
