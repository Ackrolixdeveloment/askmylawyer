import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import 'booking_repository.dart';
import 'consultation_detail_screen.dart';

/// Past consultations, filtered by status and call mode.
class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key, this.bookings});

  /// Defaults to the sample history; pass an empty list for the first-run
  /// state.
  final List<Booking>? bookings;

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  final _search = TextEditingController();

  /// Null means "All" — nothing is hidden until a filter is picked.
  String? _status;
  CallMode? _mode;

  List<Booking>? _bookings;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));

    final given = widget.bookings;
    if (given != null) {
      _bookings = given;
      _loading = false;
    } else {
      _load();
    }
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final bookings = await BookingRepository.instance.history();
      if (mounted) setState(() => _bookings = bookings);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Booking> get _all => _bookings ?? const <Booking>[];

  List<Booking> get _visible {
    final query = _search.text.trim().toLowerCase();

    return _all.where((booking) {
      final matchesQuery =
          query.isEmpty ||
          (booking.lawyer ?? '').toLowerCase().contains(query) ||
          booking.reference.toLowerCase().contains(query);

      return matchesQuery &&
          (_status == null || booking.status == _status) &&
          (_mode == null || booking.mode == _mode);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visible;

    if (_bookings == null) {
      return Center(
        child: _loading
            ? const CircularProgressIndicator()
            : Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  _error ?? 'No consultations yet.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.inkMuted,
                  ),
                ),
              ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 108),
      children: [
        const Text(
          'Booking History',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'All your consultation in one place',
          style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
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
          ],
        ),
        const SizedBox(height: 12),

        // Status scrolls sideways: the labels are too wide to share a row on
        // a narrow phone.
        SizedBox(
          height: 34,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _StatusChip(
                label: 'All',
                icon: Icons.menu,
                selected: _status == null,
                onTap: () => setState(() => _status = null),
              ),
              const SizedBox(width: 8),
              _StatusChip(
                label: 'Completed',
                icon: Icons.check_circle_outline,
                selected: _status == 'completed',
                onTap: () => setState(() => _status = 'completed'),
              ),
              const SizedBox(width: 8),
              _StatusChip(
                label: 'Cancelled',
                icon: Icons.close,
                selected: _status == 'cancelled',
                onTap: () => setState(() => _status = 'cancelled'),
              ),
              const SizedBox(width: 8),
              // Nobody took the consultation; the money came back.
              _StatusChip(
                label: 'Refunded',
                icon: Icons.history,
                selected: _status == 'refunded',
                onTap: () => setState(() => _status = 'refunded'),
              ),
            ],
          ),
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
              'No bookings match this filter.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
          )
        else
          for (final booking in visible) _BookingCard(booking: booking),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.ink : AppColors.line),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
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

/// One past consultation: a tinted header naming the lawyer, then the detail
/// rows underneath.
class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking});

  final Booking booking;

  IconData get _modeIcon => switch (booking.mode) {
    CallMode.audio => Icons.headset_outlined,
    CallMode.video => Icons.videocam_outlined,
    CallMode.chat => Icons.chat_bubble_outline,
  };

  void _open(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ConsultationDetailScreen(consultationId: booking.id),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reportAvailable = booking.reportReady;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => _open(context),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
            child: Container(
              padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
              decoration: const BoxDecoration(
                color: AppColors.brandSoft,
                borderRadius: BorderRadius.vertical(top: Radius.circular(11)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Mode pill sits above the name, as in the design.
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(_modeIcon, size: 12, color: AppColors.ink),
                              const SizedBox(width: 5),
                              Text(
                                booking.modeLabel,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.ink,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          booking.lawyer ?? 'No lawyer found',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => _open(context),
                    icon: const Icon(Icons.chevron_right, size: 20),
                    color: AppColors.ink,
                  ),
                ],
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        booking.category ?? 'General',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                    Text(
                      '${booking.durationMinutes} min',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.inkMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        booking.dateLabel,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                    Text(
                      booking.timeLabel,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.inkMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(
                            Icons.download_outlined,
                            size: 15,
                            // Amber once ready to download, red while waiting.
                            color: reportAvailable
                                ? const Color(0xFFD97706)
                                : AppColors.negative,
                          ),
                          const SizedBox(width: 6),
                          // Flexible so a large text scale ellipsises rather
                          // than pushing the status pill off the card.
                          Flexible(
                            child: Text(
                              reportAvailable
                                  ? 'Report Available'
                                  : 'Report Pending',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: reportAvailable
                                    ? const Color(0xFFD97706)
                                    : AppColors.negative,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    _StatusPill(booking: booking),
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

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.booking});

  final Booking booking;

  @override
  Widget build(BuildContext context) {
    final (Color tint, Color background) = switch (booking.status) {
      'completed' => (
        AppColors.positive,
        AppColors.positive.withValues(alpha: 0.12),
      ),
      'cancelled' || 'no_lawyer' => (
        AppColors.negative,
        AppColors.negative.withValues(alpha: 0.12),
      ),
      _ => (AppColors.inkMuted, AppColors.canvas),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        booking.statusLabel,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: tint,
        ),
      ),
    );
  }
}
