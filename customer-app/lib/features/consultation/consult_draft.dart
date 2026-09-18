import '../../core/widgets/upload_field.dart';
import 'case_details_screen.dart';
import 'consultation_screen.dart';

/// Everything gathered across the consultation flow, handed to the preview
/// so it can show back what the client chose before they pay.
class ConsultDraft {
  const ConsultDraft({
    required this.mode,
    required this.channel,
    required this.location,
    required this.caseTag,
    this.slot,
    this.document,
  });

  final ConsultMode mode;
  final CallChannel channel;
  final String location;
  final String caseTag;

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

  /// What the consult costs, in rupees. Flat for now — the API will price
  /// this once lawyers set their own rates.
  double get price => 399;
}
