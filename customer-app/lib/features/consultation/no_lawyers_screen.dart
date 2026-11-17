import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'consult_draft.dart';
import 'consultation_repository.dart';
import 'finding_lawyer_screen.dart';

/// Nobody picked the case up in time: retain the payment for retry or rescheduling.
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
  Future<Consultation?> _resolve(String choice, {DateTime? slot}) async {
    setState(() {
      _busy = true;
      _problem = null;
    });

    try {
      return await _consultations.resolve(
        widget.consultation.id,
        choice: choice,
        scheduledFor: slot,
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

  /// Keep the existing payment and move this booking to a future slot.
  Future<void> _reschedule() async {
    final now = DateTime.now();
    final day = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
    );
    if (day == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time == null || !mounted) return;
    final slot = DateTime(day.year, day.month, day.day, time.hour, time.minute);
    final consultation = await _resolve('reschedule', slot: slot);
    if (consultation == null || !mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Booking rescheduled. No additional booking payment is needed.',
        ),
      ),
    );
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
                      'scheduled time. Your payment stays with this booking; you will not be charged again.',
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
                      label: 'Try again later',
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
                onPressed: _busy ? null : () => HomeScreen.openTab(context, 1),
                child: const Text('Back to Bookings — retry when ready'),
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
