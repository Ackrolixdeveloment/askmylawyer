import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'booking_confirmed_screen.dart';
import 'consult_draft.dart';
import 'consultation_screen.dart';
import 'finding_lawyer_screen.dart';

/// Final check before paying: shows the price, the slot, and everything the
/// client chose on the way here.
class ConsultPreviewScreen extends StatelessWidget {
  const ConsultPreviewScreen({super.key, required this.draft});

  final ConsultDraft draft;

  /// "12 Jun . 2:30 PM" for a scheduled slot; instant consults start as soon
  /// as a lawyer picks them up.
  String get _slotLabel {
    final slot = draft.slot;
    if (slot == null) return 'Starts as soon as a lawyer accepts';

    final hour12 = slot.hour % 12 == 0 ? 12 : slot.hour % 12;
    final minute = slot.minute.toString().padLeft(2, '0');
    final meridiem = slot.hour < 12 ? 'AM' : 'PM';

    return '${slot.day} ${_months[slot.month - 1]} . '
        '$hour12:$minute $meridiem';
  }

  static const _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  @override
  Widget build(BuildContext context) {
    final document = draft.document;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: AppColors.surface,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          color: AppColors.ink,
        ),
        title: const Text(
          'Consult Preview',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
        children: [
          _PriceCard(
            price: draft.price,
            slotLabel: _slotLabel,
            children: [
              const _SectionHeading(),
              const SizedBox(height: 10),
              _DetailPanel(
                rows: [
                  ('Consultation type', draft.channelLabel, null),
                  ('Location', draft.location, null),
                  ('Case tag', draft.caseTag, null),
                  if (document != null)
                    (
                      'Documents',
                      document.name,
                      'Uploaded by Client . ${document.sizeLabel}',
                    ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          _PayButton(
            // TODO: take the payment first, once the gateway is wired up.
            // A scheduled booking is simply confirmed for its slot; an
            // instant one starts hunting for a lawyer straight away.
            onTap: () => switch (draft.mode) {
              ConsultMode.scheduled => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => BookingConfirmedScreen(draft: draft),
                ),
              ),
              ConsultMode.now => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => FindingLawyerScreen(draft: draft),
                ),
              ),
            },
          ),
        ],
      ),
    );
  }
}

/// White card: price and slot on top, the breakdown beneath.
class _PriceCard extends StatelessWidget {
  const _PriceCard({
    required this.price,
    required this.slotLabel,
    required this.children,
  });

  final double price;
  final String slotLabel;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 18, 14, 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '₹${price.toStringAsFixed(2)}/-',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            slotLabel,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: AppColors.inkSubtle),
          ),
          const SizedBox(height: 18),
          ...children,
        ],
      ),
    );
  }
}

/// "Consultation Preview" with the edit affordance beside it.
class _SectionHeading extends StatelessWidget {
  const _SectionHeading();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'Consultation Preview',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
        ),
        InkWell(
          // Back to the details step, where every one of these was chosen.
          onTap: () => Navigator.of(context).maybePop(),
          borderRadius: BorderRadius.circular(6),
          child: const Padding(
            padding: EdgeInsets.all(4),
            child: Icon(
              Icons.edit_outlined,
              size: 17,
              color: AppColors.inkMuted,
            ),
          ),
        ),
      ],
    );
  }
}

/// Tinted panel listing each choice as a label/value pair.
class _DetailPanel extends StatelessWidget {
  const _DetailPanel({required this.rows});

  /// Label, value, and an optional second line under the value.
  final List<(String, String, String?)> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          for (final (label, value, note) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 9),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // The value column takes what it needs and wraps rather
                  // than pushing the label off the row.
                  Flexible(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          value,
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink,
                          ),
                        ),
                        if (note != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            note,
                            textAlign: TextAlign.right,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.inkSubtle,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _PayButton extends StatelessWidget {
  const _PayButton({required this.onTap});

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
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Proceed to Payment',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 7),
            Icon(Icons.chevron_right, size: 18, color: Colors.white),
          ],
        ),
      ),
    );
  }
}
