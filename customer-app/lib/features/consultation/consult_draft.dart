import '../../core/widgets/upload_field.dart';
import 'consultation_repository.dart';
import 'consultation_screen.dart';

/// Everything gathered across the consultation flow, handed to the preview
/// so it can show back what the client chose before they pay.
class ConsultDraft {
  const ConsultDraft({
    required this.mode,
    required this.location,
    required this.caseTag,
    this.plan,
    this.slot,
    this.document,
  });

  final ConsultMode mode;
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

  /// What the consultation is called, from the plan the admin team set up.
  String get channelLabel => plan?.type ?? 'Consultation';

  /// What the consult costs, in rupees — the plan's amount plus GST.
  double get price => (plan?.payable ?? 0).toDouble();

  /// The code the backend prices this consultation by. Null leaves the
  /// choice to the backend, which has one consultation on sale.
  String? get planCode => plan?.code;
}
