import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'consult_draft.dart';

/// Shown after paying for a scheduled consultation: the slot is held, and
/// the client is told when they will be called.
class BookingConfirmedScreen extends StatelessWidget {
  const BookingConfirmedScreen({super.key, required this.draft});

  final ConsultDraft draft;

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

  String get _slotLabel {
    final slot = draft.slot;
    if (slot == null) return 'Slot to be confirmed';

    final hour12 = slot.hour % 12 == 0 ? 12 : slot.hour % 12;
    final minute = slot.minute.toString().padLeft(2, '0');
    final meridiem = slot.hour < 12 ? 'AM' : 'PM';

    return '${slot.day} ${_months[slot.month - 1]} . $hour12:$minute $meridiem';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 28, 16, 16),
                children: [
                  const Center(child: _SuccessTick()),
                  const SizedBox(height: 16),
                  const Text(
                    'Consultation booked',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    "We'll remind you 10 minutes before it starts, so you "
                    'can join on time.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.45,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                  const SizedBox(height: 20),

                  _SlotCard(
                    slotLabel: _slotLabel,
                    channel: draft.channelLabel,
                    location: draft.location,
                    amount: draft.price,
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: _DoneButton(
                // Unwinds the booking flow, leaving the client back in the
                // tab they started from.
                onTap: () =>
                    Navigator.of(context).popUntil((route) => route.isFirst),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SuccessTick extends StatelessWidget {
  const _SuccessTick();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 62,
      height: 62,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: Color(0xFF4CAF7D),
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.check, size: 30, color: Colors.white),
    );
  }
}

class _SlotCard extends StatelessWidget {
  const _SlotCard({
    required this.slotLabel,
    required this.channel,
    required this.location,
    required this.amount,
  });

  final String slotLabel;
  final String channel;
  final String location;
  final double amount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _Row(icon: Icons.event_outlined, label: 'When', value: slotLabel),
          _Row(
            icon: Icons.headset_outlined,
            label: 'Format',
            value: '$channel Consultation',
          ),
          _Row(icon: Icons.place_outlined, label: 'Location', value: location),
          _Row(
            icon: Icons.currency_rupee,
            label: 'Paid',
            value: '₹${amount.toStringAsFixed(0)}',
            last: true,
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.icon,
    required this.label,
    required this.value,
    this.last = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: last
          ? null
          : const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.line)),
            ),
      child: Row(
        children: [
          Icon(icon, size: 15, color: AppColors.inkSubtle),
          const SizedBox(width: 9),
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
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DoneButton extends StatelessWidget {
  const _DoneButton({required this.onTap});

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
        child: const Text(
          'View in Upcoming',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
