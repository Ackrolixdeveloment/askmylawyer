import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'choose_time_screen.dart';
import 'consult_draft.dart';
import 'consultation_repository.dart';
import 'finding_lawyer_screen.dart';

/// Nobody picked the case up in time: offer to reschedule, retry, or refund.
class NoLawyersScreen extends StatefulWidget {
  const NoLawyersScreen({
    super.key,
    required this.draft,
    required this.consultation,
  });

  final ConsultDraft draft;

  /// The consultation the search gave up on. It stays open until one of
  /// these buttons resolves it, so the backend knows what was decided.
  final Consultation consultation;

  @override
  State<NoLawyersScreen> createState() => _NoLawyersScreenState();
}

class _NoLawyersScreenState extends State<NoLawyersScreen> {
  final _consultations = ConsultationRepository.instance;

  bool _busy = false;
  String? _problem;

  /// Sends the decision, and hands back the consultation it produced.
  Future<Consultation?> _resolve(String choice) async {
    setState(() {
      _busy = true;
      _problem = null;
    });

    try {
      return await _consultations.resolve(
        widget.consultation.id,
        choice: choice,
      );
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
      return null;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Searches again on the same consultation, so nothing is paid twice.
  Future<void> _tryAgain() async {
    final consultation = await _resolve('reschedule');
    if (consultation == null || !mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => FindingLawyerScreen(
          draft: widget.draft,
          consultation: consultation,
        ),
      ),
    );
  }

  /// Takes the money back, then picks a slot. Scheduled bookings are not on
  /// the backend yet, so this leaves off at the slot picker.
  Future<void> _reschedule() async {
    final consultation = await _resolve('refund');
    if (consultation == null || !mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const ChooseTimeScreen()),
    );
  }

  Future<void> _refund() async {
    final confirmed = await showCancelRequestSheet(
      context,
      draft: widget.draft,
    );
    if (confirmed != true || !mounted) return;

    final consultation = await _resolve('refund');
    if (consultation == null || !mounted) return;

    // Back to the shell, not out of the app: this flow sits on the root
    // navigator, above the signed-in shell.
    HomeScreen.openTab(context, 0);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      // The consultation is still open until one of these is chosen.
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.canvas,
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 26, 16, 16),
                  children: [
                    const _DimmedAvatars(),
                    const SizedBox(height: 18),
                    const Text(
                      'All lawyers are on call\nright now',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 20,
                        height: 1.3,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Nobody was free to take it. Try again shortly, pick a '
                      'scheduled time, or cancel with instant refund.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.45,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                    const SizedBox(height: 20),

                    _ConsultationSummary(draft: widget.draft),
                    const SizedBox(height: 16),

                    _PrimaryAction(
                      icon: Icons.calendar_today_outlined,
                      label: 'Reschedule for later',
                      onTap: _busy ? null : _reschedule,
                    ),
                    const SizedBox(height: 10),
                    _SecondaryAction(
                      icon: Icons.refresh,
                      label: 'Try again now',
                      onTap: _busy ? null : _tryAgain,
                    ),

                    if (_problem != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _problem!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.negative,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              TextButton(
                onPressed: _busy ? null : _refund,
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.negative,
                ),
                child: const Text(
                  'Cancel request & get instant refund',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

/// The same trio as the search, faded out now that nobody answered.
class _DimmedAvatars extends StatelessWidget {
  const _DimmedAvatars();

  static const _people = [
    (initials: 'PS', color: Color(0xFFB9A7F0)),
    (initials: 'RK', color: Color(0xFF9AA3AF)),
    (initials: 'AM', color: Color(0xFF93DDB4)),
  ];

  @override
  Widget build(BuildContext context) {
    return MediaQuery.withNoTextScaling(
      child: SizedBox(
        height: 46,
        child: Stack(
          alignment: Alignment.center,
          children: [
            for (var i = 0; i < _people.length; i++)
              Transform.translate(
                offset: Offset((i - 1) * 30.0, 0),
                child: Container(
                  width: i == 1 ? 44 : 38,
                  height: i == 1 ? 44 : 38,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _people[i].color,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.canvas, width: 2),
                  ),
                  child: Text(
                    _people[i].initials,
                    style: TextStyle(
                      fontSize: i == 1 ? 14 : 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// What the client asked for and paid, so they can weigh the options.
class _ConsultationSummary extends StatelessWidget {
  const _ConsultationSummary({required this.draft});

  final ConsultDraft draft;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CONSULTATION SUMMARY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.7,
              color: AppColors.inkSubtle,
            ),
          ),
          const SizedBox(height: 10),
          _SummaryRow(
            icon: Icons.place_outlined,
            label: 'Location',
            value: draft.location,
          ),
          _SummaryRow(
            icon: Icons.headset_outlined,
            label: 'Format',
            value: '${draft.channelLabel} Consultation',
          ),
          _SummaryRow(
            icon: Icons.currency_rupee,
            label: 'Payment',
            value: '₹${draft.price.toStringAsFixed(0)}',
            emphasised: true,
            last: true,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.icon,
    required this.label,
    required this.value,
    this.emphasised = false,
    this.last = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool emphasised;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: last
          ? null
          : const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.line)),
            ),
      child: Row(
        children: [
          Icon(icon, size: 15, color: AppColors.inkSubtle),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          ),
          const SizedBox(width: 10),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: emphasised ? 15 : 13,
                fontWeight: emphasised ? FontWeight.w700 : FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PrimaryAction extends StatelessWidget {
  const _PrimaryAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;

  /// Null while a decision is being sent, which also greys the button.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 17, color: Colors.white),
            const SizedBox(width: 9),
            Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SecondaryAction extends StatelessWidget {
  const _SecondaryAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;

  /// Null while a decision is being sent, which also greys the button.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.line),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 17, color: AppColors.ink),
            const SizedBox(width: 9),
            Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Confirms cancelling before the money is refunded. Resolves true when the
/// client goes through with it.
Future<bool?> showCancelRequestSheet(
  BuildContext context, {
  required ConsultDraft draft,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    backgroundColor: AppColors.surface,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (sheetContext) => _CancelRequestSheet(draft: draft),
  );
}

class _CancelRequestSheet extends StatelessWidget {
  const _CancelRequestSheet({required this.draft});

  final ConsultDraft draft;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Cancel this request?',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              'Your booking will be cancelled and payment refunded. '
              'You can rebook anytime.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppColors.inkSubtle,
              ),
            ),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  _SummaryRow(
                    icon: Icons.currency_rupee,
                    label: 'Consultation Amount',
                    value: '₹${draft.price.toStringAsFixed(0)}',
                    emphasised: true,
                  ),
                  _SummaryRow(
                    icon: Icons.headset_outlined,
                    label: 'Consultation Type',
                    value: '${draft.channelLabel} Consultation',
                    last: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            const _RefundTimeline(),
            const SizedBox(height: 16),

            _PrimaryActionButton(
              label: 'Keep request active',
              onTap: () => Navigator.of(context).pop(false),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: TextButton.styleFrom(foregroundColor: AppColors.negative),
              child: const Text(
                'Yes cancel',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// How long the money takes to come back.
class _RefundTimeline extends StatelessWidget {
  const _RefundTimeline();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF4FF),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Color(0xFFDCE7FF),
              shape: BoxShape.circle,
            ),
            child: const Text(
              'i',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.brand,
              ),
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: 'Refund timeline: Credited to your original '),
                  TextSpan(text: 'payment method within '),
                  TextSpan(
                    text: '5-7 business days',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.brand,
                    ),
                  ),
                  TextSpan(
                    text: ". You'll get an email confirmation once processed.",
                  ),
                ],
              ),
              style: TextStyle(
                fontSize: 12,
                height: 1.45,
                color: AppColors.inkSubtle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PrimaryActionButton extends StatelessWidget {
  const _PrimaryActionButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
