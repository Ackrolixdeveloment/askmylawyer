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
  CallChannel _channel = CallChannel.audio;
  String? _location;
  String? _caseTag;
  PickedDocument? _document;

  /// The price list, keyed by plan code. Empty until it has loaded.
  Map<String, ServicePlan> _plans = const {};
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
        _plans = {for (final plan in plans) plan.code: plan};
        _plansProblem = null;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _plansProblem = error.message);
    }
  }

  ServicePlan? _planFor(CallChannel channel) => _plans[switch (channel) {
    CallChannel.audio => 'audio',
    CallChannel.video => 'video',
    CallChannel.chat => 'chat',
  }];

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
      _location != null && _caseTag != null && _planFor(_channel) != null;

  /// Hands everything gathered so far to the preview.
  void _openPreview() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ConsultPreviewScreen(
          draft: ConsultDraft(
            mode: widget.mode,
            channel: _channel,
            location: _location!,
            caseTag: _caseTag!,
            plan: _planFor(_channel),
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
                const _FieldLabel('Consultation type'),
                const SizedBox(height: 7),
                // The three share the row equally: at a large text scale
                // their natural widths no longer fit a narrow phone.
                Row(
                  children: [
                    for (final channel in CallChannel.values) ...[
                      Expanded(
                        child: _ChannelChip(
                          label: switch (channel) {
                            CallChannel.audio => 'Audio',
                            CallChannel.video => 'Video',
                            CallChannel.chat => 'Chat',
                          },
                          // Blank while the price list loads, rather than a
                          // figure that might be about to change.
                          price: _planFor(channel)?.payable,
                          selected: _channel == channel,
                          onTap: () => setState(() => _channel = channel),
                        ),
                      ),
                      if (channel != CallChannel.values.last)
                        const SizedBox(width: 9),
                    ],
                  ],
                ),
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
class _ChannelChip extends StatelessWidget {
  const _ChannelChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.price,
  });

  final String label;

  /// What this channel costs, all in. Null while the price list loads.
  final int? price;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.line),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _RadioDot(selected: selected),
            const SizedBox(width: 7),
            // Ellipsises rather than pushing past the chip's share of the row.
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  if (price != null)
                    Text(
                      '₹$price',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Hollow ring, filled with a dot once chosen.
class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 15,
      height: 15,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? AppColors.ink : AppColors.inkSubtle,
          width: 1.4,
        ),
      ),
      child: selected
          ? Container(
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
            )
          : null,
    );
  }
}

/// Full-width primary action, greyed until both selects are filled.
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
