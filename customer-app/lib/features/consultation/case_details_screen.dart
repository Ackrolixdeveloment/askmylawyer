import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/upload_field.dart';
import 'consult_draft.dart';
import 'consult_preview_screen.dart';
import 'consultation_repository.dart';
import 'consultation_header.dart';
import 'consultation_screen.dart';

/// How the consultation will be held.
enum CallChannel { audio, video, chat }

/// Step two: describe the case before a lawyer is matched.
class CaseDetailsScreen extends StatefulWidget {
  const CaseDetailsScreen({
    super.key,
    required this.mode,
    this.slot,
    this.step = 2,
    this.ofSteps = 2,
  });

  /// Carried over from step one; decides what happens after Continue.
  final ConsultMode mode;

  /// The slot picked on the way here, when scheduling.
  final DateTime? slot;

  /// Where this sits in the flow. Scheduling inserts a slot picker before
  /// it, so the same screen is step 2 of 2 or step 3 of 3.
  final int step;
  final int ofSteps;

  @override
  State<CaseDetailsScreen> createState() => _CaseDetailsScreenState();
}

class _CaseDetailsScreenState extends State<CaseDetailsScreen> {
  String? _location;
  String? _caseTag;
  PickedDocument? _document;

  /// The consultation on sale. Null until it has loaded.
  ServicePlan? _plan;
  String? _plansProblem;

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  Future<void> _loadPlans() async {
    try {
      final plans = await ConsultationRepository.instance.plans();
      if (!mounted) return;

      setState(() {
        _plan = plans.isEmpty ? null : plans.first;
        _plansProblem = plans.isEmpty
            ? 'Consultations are not available right now.'
            : null;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _plansProblem = error.message);
    }
  }

  /// Stand-ins until the API supplies the real lists.
  static const _locations = [
    'Delhi',
    'Mumbai',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
  ];

  static const _caseTags = [
    'Family Law',
    'Criminal Law',
    'Property & Real Estate',
    'Corporate & Business',
    'Employment & Labour',
    'Consumer Dispute',
    'Tax',
  ];

  /// Location and case tag are both required before a lawyer can be matched;
  /// the document is optional. The chosen channel also has to be on sale —
  /// the admin team can switch any of the three off.
  bool get _canContinue =>
      _location != null && _caseTag != null && _plan != null;

  /// Hands everything gathered so far to the preview.
  void _openPreview() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ConsultPreviewScreen(
          draft: ConsultDraft(
            mode: widget.mode,

            location: _location!,
            caseTag: _caseTag!,
            plan: _plan,
            slot: widget.slot,
            document: _document,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Column(
        children: [
          ConsultationHeader(
            title: 'Consultation',
            subtitle: 'Describe Your Case',
            step: widget.step,
            ofSteps: widget.ofSteps,
            onBack: () => Navigator.of(context).maybePop(),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 16, 14, 24),
              children: [
                // There is one consultation, so there is nothing to pick:
                // video, voice and chat are all available inside the call
                // itself. This just says what it costs.
                if (_plan case final plan?) _PlanSummary(plan: plan),
                if (_plansProblem != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _plansProblem!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.negative,
                    ),
                  ),
                ],
                const SizedBox(height: 14),

                AppSelectField(
                  label: 'Location',
                  options: _locations,
                  value: _location,
                  onChanged: (value) => setState(() => _location = value),
                ),
                const SizedBox(height: 14),

                AppSelectField(
                  label: 'Case tags',
                  options: _caseTags,
                  value: _caseTag,
                  onChanged: (value) => setState(() => _caseTag = value),
                ),
                const SizedBox(height: 14),

                Row(
                  children: [
                    // Takes the room it needs and shrinks first, so the
                    // "(optional)" tag always stays on screen.
                    const Expanded(
                      child: _FieldLabel('Upload Document if any'),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '(optional)',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.inkSubtle.withValues(alpha: 0.9),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 7),
                UploadField(
                  placeholder: 'Upload*',
                  helper: 'Max Size 2 MB (PNG or JPEG)',
                  maxSizeMb: 2,
                  onChanged: (file) => setState(() => _document = file),
                ),
                const SizedBox(height: 18),

                _ContinueButton(
                  enabled: _canContinue,
                  onTap: _canContinue ? _openPreview : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Small caption above a field.
class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(fontSize: 14, color: AppColors.ink),
    );
  }
}

/// Radio-style pill for picking the call channel.
/// What the consultation costs, now that there is only one of them.
class _PlanSummary extends StatelessWidget {
  const _PlanSummary({required this.plan});

  final ServicePlan plan;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  plan.type,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${plan.durationMinutes} minutes · video, voice or chat',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            '₹${plan.payable}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _ContinueButton extends StatelessWidget {
  const _ContinueButton({required this.enabled, required this.onTap});

  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 46,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: enabled ? AppColors.ink : const Color(0xFFDDE3EC),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Continue',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: enabled ? Colors.white : AppColors.inkSubtle,
              ),
            ),
            const SizedBox(width: 3),
            Icon(
              Icons.chevron_right,
              size: 18,
              color: enabled ? Colors.white : AppColors.inkSubtle,
            ),
          ],
        ),
      ),
    );
  }
}
