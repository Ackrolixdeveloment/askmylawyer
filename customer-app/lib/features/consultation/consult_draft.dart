import '../../core/widgets/upload_field.dart';
import 'case_details_screen.dart';
import 'consultation_repository.dart';
import 'consultation_screen.dart';

/// Everything gathered across the consultation flow, handed to the preview
/// so it can show back what the client chose before they pay.
class ConsultDraft {
  const ConsultDraft({
    required this.mode,
    required this.channel,
    required this.location,
    required this.caseTag,
    this.plan,
    this.slot,
    this.document,
  });

  final ConsultMode mode;
  final CallChannel channel;
  final String location;
  final String caseTag;

  /// The priced plan behind [channel], as the admin team set it up. Null only
  /// when the price list could not be reached.
  final ServicePlan? plan;

  /// Only set when the client chose to schedule; an instant consult starts
  /// as soon as a lawyer accepts.
  final DateTime? slot;

  /// Optional supporting file.
  final PickedDocument? document;

  String get channelLabel => switch (channel) {
    CallChannel.audio => 'Audio',
    CallChannel.video => 'Video',
    CallChannel.chat => 'Chat',
  };

  /// What the consult costs, in rupees — the plan's amount plus GST.
  double get price => (plan?.payable ?? 0).toDouble();

  /// The code the backend prices this consultation by.
  String get planCode => switch (channel) {
    CallChannel.audio => 'audio',
    CallChannel.video => 'video',
    CallChannel.chat => 'chat',
  };
}
