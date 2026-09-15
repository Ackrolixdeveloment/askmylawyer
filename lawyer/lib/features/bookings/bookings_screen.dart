import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'booking_data.dart';
import 'consultation_detail_screen.dart';

/// Past consultation calls, filtered by outcome and mode.
class BookingsScreen extends StatefulWidget {
  BookingsScreen({super.key, BookingData? data}) : data = data ?? bookingSample;

  final BookingData data;

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  final _search = TextEditingController();

  /// Null means "All" — both filters sit on top of each other.
  CallOutcome? _outcome;
  CallMode? _mode;

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<Booking> get _visible {
    final query = _search.text.trim().toLowerCase();

    return widget.data.calls.where((call) {
      final matchesQuery =
          query.isEmpty ||
          call.client.toLowerCase().contains(query) ||
          call.bookingId.toLowerCase().contains(query);

      return matchesQuery &&
          (_outcome == null || call.outcome == _outcome) &&
          (_mode == null || call.mode == _mode);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final visible = _visible;

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 24),
      children: [
        const Text(
          'Call History',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'Your consultation calls',
          style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
        ),
        const SizedBox(height: 14),

        Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.ink,
            borderRadius: BorderRadius.circular(12),
          ),
          child: IntrinsicHeight(
            child: Row(
              children: [
                _Stat(value: '${data.accepted}', label: 'Accepted'),
                const VerticalDivider(color: Color(0xFF2A3550), width: 1),
                _Stat(value: '${data.rejected}', label: 'Rejected'),
                const VerticalDivider(color: Color(0xFF2A3550), width: 1),
                _Stat(
                  value: '₹${_thousands(data.thisMonth)}',
                  label: 'This Month',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _search,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search by client name or booking ID...',
                  hintStyle: const TextStyle(
                    fontSize: 13,
                    color: AppColors.inkSubtle,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 18,
                    color: AppColors.inkSubtle,
                  ),
                  filled: true,
                  fillColor: AppColors.surface,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.line),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.brand),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.ink,
                borderRadius: BorderRadius.circular(10),
              ),
              // TODO: open the advanced call filters.
              child: const Icon(Icons.tune, size: 18, color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 12),

        Row(
          children: [
            Expanded(
              child: _OutcomeChip(
                label: 'All',
                icon: Icons.menu,
                selected: _outcome == null,
                onTap: () => setState(() => _outcome = null),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _OutcomeChip(
                label: 'Accepted',
                icon: Icons.check_circle_outline,
                selected: _outcome == CallOutcome.accepted,
                onTap: () => setState(() => _outcome = CallOutcome.accepted),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _OutcomeChip(
                label: 'Rejected',
                icon: Icons.close,
                selected: _outcome == CallOutcome.rejected,
                onTap: () => setState(() => _outcome = CallOutcome.rejected),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Mode sits in its own segmented row, so both filters can combine.
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            children: [
              Expanded(
                child: _ModeChip(
                  label: 'Audio',
                  icon: Icons.headset_outlined,
                  selected: _mode == CallMode.audio,
                  onTap: () => setState(
                    () =>
                        _mode = _mode == CallMode.audio ? null : CallMode.audio,
                  ),
                ),
              ),
              Expanded(
                child: _ModeChip(
                  label: 'Video',
                  icon: Icons.videocam_outlined,
                  selected: _mode == CallMode.video,
                  onTap: () => setState(
                    () =>
                        _mode = _mode == CallMode.video ? null : CallMode.video,
                  ),
                ),
              ),
              Expanded(
                child: _ModeChip(
                  label: 'Chat',
                  icon: Icons.chat_bubble_outline,
                  selected: _mode == CallMode.chat,
                  onTap: () => setState(
                    () => _mode = _mode == CallMode.chat ? null : CallMode.chat,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        if (visible.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 50),
            child: Text(
              'No calls match this filter.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          )
        else
          for (final call in visible) _CallCard(call: call),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Color(0xFFB6C0D4)),
          ),
        ],
      ),
    );
  }
}

class _OutcomeChip extends StatelessWidget {
  const _OutcomeChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.ink : AppColors.line),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: selected ? Colors.white : AppColors.inkMuted,
              ),
            ),
            const SizedBox(width: 5),
            Icon(
              icon,
              size: 13,
              color: selected ? Colors.white : AppColors.inkSubtle,
            ),
          ],
        ),
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  const _ModeChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.brandSoft : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.brand : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 14,
              color: selected ? AppColors.brand : AppColors.inkSubtle,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: selected ? AppColors.brand : AppColors.inkMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallCard extends StatelessWidget {
  const _CallCard({required this.call});

  final Booking call;

  @override
  Widget build(BuildContext context) {
    final accepted = call.outcome == CallOutcome.accepted;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          // Header carries the booking id and the way into the detail.
          Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
            decoration: const BoxDecoration(
              color: Color(0xFFF7FAFF),
              borderRadius: BorderRadius.vertical(top: Radius.circular(11)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        call.bookingId,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        call.client,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                    ],
                  ),
                ),
                InkWell(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => ConsultationDetailScreen(booking: call),
                    ),
                  ),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: 30,
                    height: 30,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.chevron_right,
                      size: 18,
                      color: AppColors.ink,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        call.practice,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ),
                    Text(
                      '${call.durationMinutes} min',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        call.date,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ),
                    Text(
                      call.time,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            switch (call.mode) {
                              CallMode.audio => Icons.headset_outlined,
                              CallMode.video => Icons.videocam_outlined,
                              CallMode.chat => Icons.chat_bubble_outline,
                            },
                            size: 12,
                            color: AppColors.inkMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            call.modeLabel,
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.inkMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: accepted
                            ? AppColors.positive.withValues(alpha: 0.12)
                            : AppColors.negative.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        accepted ? 'Accepted' : 'Rejected',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: accepted
                              ? AppColors.positive
                              : AppColors.negative,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// 84500 -> "84,500". Amounts here are whole rupees.
String _thousands(double value) {
  final digits = value.round().toString();
  final buffer = StringBuffer();

  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write(',');
    buffer.write(digits[i]);
  }

  return buffer.toString();
}
