import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'case_details_screen.dart';
import 'consultation_header.dart';
import 'consultation_screen.dart';

/// Picks the slot for a scheduled consultation.
class ChooseTimeScreen extends StatefulWidget {
  const ChooseTimeScreen({super.key, this.now});

  /// Injectable so tests and previews get a stable set of days.
  final DateTime? now;

  @override
  State<ChooseTimeScreen> createState() => _ChooseTimeScreenState();
}

class _ChooseTimeScreenState extends State<ChooseTimeScreen> {
  static const _days = 14;
  static const _hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  static const _minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  static const _meridiems = ['AM', 'PM'];

  late final DateTime _today = widget.now ?? DateTime.now();

  // Each wheel opens on the current slot.
  late final _dayController = FixedExtentScrollController(initialItem: _day);
  late final _hourController = FixedExtentScrollController(initialItem: _hour);
  late final _minuteController = FixedExtentScrollController(
    initialItem: _minute,
  );
  late final _meridiemController = FixedExtentScrollController(
    initialItem: _meridiem,
  );

  /// Opens on the next free slot: today, at the current time rounded up to
  /// the next five minutes.
  late final DateTime _start = _roundedUp(_today);

  // Track which row each wheel has settled on; they start on the current
  // slot and move as the client scrolls.
  int _day = 0;
  late int _hour = _hours.indexOf(
    _start.hour % 12 == 0 ? 12 : _start.hour % 12,
  );
  late int _minute = _minutes.indexOf(_start.minute);
  late int _meridiem = _start.hour < 12 ? 0 : 1;

  /// Nudges to the next multiple of five minutes, rolling the hour over when
  /// that lands past the top of the hour.
  static DateTime _roundedUp(DateTime from) {
    final remainder = from.minute % 5;
    return from.add(Duration(minutes: remainder == 0 ? 0 : 5 - remainder));
  }

  /// The four wheels read back as one date and time.
  DateTime get _chosenSlot {
    final date = _today.add(Duration(days: _day));
    final hour12 = _hours[_hour];
    // 12 AM is midnight and 12 PM is noon, so 12 does not simply add twelve.
    final hour24 = switch ((hour12, _meridiem)) {
      (12, 0) => 0,
      (12, 1) => 12,
      (final h, 0) => h,
      (final h, _) => h + 12,
    };

    return DateTime(date.year, date.month, date.day, hour24, _minutes[_minute]);
  }

  @override
  void dispose() {
    _dayController.dispose();
    _hourController.dispose();
    _minuteController.dispose();
    _meridiemController.dispose();
    super.dispose();
  }

  /// "Today" for the first entry, then "Wed 16 Sep".
  String _dayLabel(int index) {
    if (index == 0) return 'Today';

    final date = _today.add(Duration(days: index));
    return '${_weekdays[date.weekday - 1]} ${date.day} '
        '${_months[date.month - 1]}';
  }

  static const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Column(
        children: [
          ConsultationHeader(
            title: 'Choose a time',
            subtitle: 'Choose your time',
            step: 2,
            ofSteps: 3,
            onBack: () => Navigator.of(context).maybePop(),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 16, 14, 24),
              children: [
                _WheelCard(
                  children: [
                    // Widest column: the day labels carry the most text.
                    Expanded(
                      flex: 4,
                      child: _Wheel(
                        controller: _dayController,
                        itemCount: _days,
                        selected: _day,
                        onChanged: (i) => setState(() => _day = i),
                        labelAt: _dayLabel,
                        alignment: Alignment.centerRight,
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: _Wheel(
                        controller: _hourController,
                        itemCount: _hours.length,
                        selected: _hour,
                        onChanged: (i) => setState(() => _hour = i),
                        labelAt: (i) => '${_hours[i]}',
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: _Wheel(
                        controller: _minuteController,
                        itemCount: _minutes.length,
                        selected: _minute,
                        onChanged: (i) => setState(() => _minute = i),
                        labelAt: (i) => _minutes[i].toString().padLeft(2, '0'),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: _Wheel(
                        controller: _meridiemController,
                        itemCount: _meridiems.length,
                        selected: _meridiem,
                        onChanged: (i) => setState(() => _meridiem = i),
                        labelAt: (i) => _meridiems[i],
                        alignment: Alignment.centerLeft,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Policy and the action stay pinned, so the wheels keep the room
          // above them however tall the screen is.
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const _CancellationPolicy(),
                const SizedBox(height: 14),
                _ContinueButton(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CaseDetailsScreen(
                        mode: ConsultMode.scheduled,
                        slot: _chosenSlot,
                        step: 3,
                        ofSteps: 3,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 6),
        ],
      ),
    );
  }
}

/// White card holding the wheels, with the selection band behind them.
class _WheelCard extends StatelessWidget {
  const _WheelCard({required this.children});

  final List<Widget> children;

  static const _rowHeight = 34.0;
  static const _visibleRows = 5;

  @override
  Widget build(BuildContext context) {
    return Container(
      // An odd number of rows, so one sits exactly in the middle with the
      // same count above and below. No vertical padding: it would offset
      // the wheels from the band drawn behind them.
      height: _rowHeight * _visibleRows,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Band marking the row the wheels settle on.
          Container(
            height: _rowHeight,
            margin: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F4F9),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          // Fills the card, so every wheel centres its selection on the
          // same line as the band above.
          SizedBox.expand(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children,
            ),
          ),
        ],
      ),
    );
  }
}

/// One scrollable column. The centred row is dark, its neighbours fade.
class _Wheel extends StatelessWidget {
  const _Wheel({
    required this.controller,
    required this.itemCount,
    required this.selected,
    required this.onChanged,
    required this.labelAt,
    this.alignment = Alignment.center,
  });

  final FixedExtentScrollController controller;
  final int itemCount;
  final int selected;
  final ValueChanged<int> onChanged;
  final String Function(int index) labelAt;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return ListWheelScrollView.useDelegate(
      controller: controller,
      itemExtent: _WheelCard._rowHeight,
      // Flat list, not a drum: any curvature shifts rows off the band drawn
      // behind them, and squeezes the ones near the edges.
      diameterRatio: 10000,
      perspective: 0.000000001,
      physics: const FixedExtentScrollPhysics(),
      overAndUnderCenterOpacity: 1,
      onSelectedItemChanged: onChanged,
      childDelegate: ListWheelChildBuilderDelegate(
        childCount: itemCount,
        builder: (context, index) {
          final isSelected = index == selected;

          return Container(
            height: _WheelCard._rowHeight,
            alignment: alignment,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              labelAt(index),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppColors.ink : AppColors.inkSubtle,
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Fine print above the action.
class _CancellationPolicy extends StatelessWidget {
  const _CancellationPolicy();

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        children: [
          const TextSpan(
            text: 'Cancellation policy : ',
            style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink),
          ),
          const TextSpan(
            text:
                'Free cancellation up to 15 min before your slot. '
                'Full refund if no lawyer accepts your booking. ',
          ),
          TextSpan(
            text: 'See terms',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
            // TODO: link to the cancellation terms page.
          ),
        ],
      ),
      style: const TextStyle(
        fontSize: 12,
        height: 1.45,
        color: AppColors.inkSubtle,
      ),
    );
  }
}

class _ContinueButton extends StatelessWidget {
  const _ContinueButton({required this.onTap});

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
              'Continue',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 7),
            Icon(Icons.arrow_forward, size: 17, color: Colors.white),
          ],
        ),
      ),
    );
  }
}
