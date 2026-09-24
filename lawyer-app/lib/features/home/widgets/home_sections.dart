import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../home_data.dart';

/// White card every dashboard section sits in.
class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }
}

/// Section heading with an optional trailing action.
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.actionIcon,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final IconData? actionIcon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
          ),
          if (actionLabel != null)
            InkWell(
              onTap: onAction,
              child: Row(
                children: [
                  Text(
                    actionLabel!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.inkMuted,
                    ),
                  ),
                  if (actionIcon != null) ...[
                    const SizedBox(width: 3),
                    Icon(actionIcon, size: 12, color: AppColors.inkMuted),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Placeholder used by every section before there is anything to show.
class EmptySection extends StatelessWidget {
  const EmptySection({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.symmetric(vertical: 26, horizontal: 20),
      child: Column(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: AppColors.inkSubtle),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 11,
              height: 1.5,
              color: AppColors.inkSubtle,
            ),
          ),
        ],
      ),
    );
  }
}

/// Online switch — the lawyer only receives instant requests while this is on.
class OnlineCard extends StatelessWidget {
  const OnlineCard({
    super.key,
    required this.online,
    required this.onChanged,
    this.busy = false,
    this.notice,
    this.onFixLocation,
  });

  final bool online;
  final ValueChanged<bool> onChanged;

  /// True while the change is being sent.
  final bool busy;

  /// Why going online did not work, if it did not.
  final String? notice;

  /// Opens the phone's settings, when permission was refused for good.
  final VoidCallback? onFixLocation;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: online ? AppColors.positive : AppColors.inkSubtle,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      online ? 'You are Online' : 'You are Offline',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      online
                          ? 'You are available to receive consultation'
                          : 'You will only receive scheduled bookings',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ],
                ),
              ),
              if (busy)
                const SizedBox.square(
                  dimension: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                Switch(
                  value: online,
                  onChanged: onChanged,
                  activeThumbColor: Colors.white,
                  activeTrackColor: AppColors.positive,
                ),
            ],
          ),

          // Going online needs a location; this says so when it is missing.
          if (notice != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notice!,
                    style: const TextStyle(
                      fontSize: 11,
                      height: 1.45,
                      color: Color(0xFFC2410C),
                    ),
                  ),
                  if (onFixLocation != null) ...[
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: onFixLocation,
                      child: const Text(
                        'Open settings',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFC2410C),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Weekly earnings with the trend line underneath.
class EarningsCard extends StatelessWidget {
  const EarningsCard({
    super.key,
    required this.amount,
    required this.changePercent,
    required this.series,
  });

  final double amount;
  final double? changePercent;
  final List<double> series;

  static const _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    final maxValue = series.fold<double>(0, (max, v) => v > max ? v : max);
    // Keep the axis readable even before any earnings land.
    final axisMax = maxValue == 0 ? 1000.0 : (maxValue * 1.15);

    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '₹${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},')}',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          if (changePercent != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(
                  Icons.trending_up,
                  size: 13,
                  color: AppColors.positive,
                ),
                const SizedBox(width: 4),
                Text(
                  '+$changePercent% vs last week',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.positive,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            height: 140,
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: axisMax,
                gridData: FlGridData(
                  drawVerticalLine: false,
                  horizontalInterval: axisMax / 4,
                  getDrawingHorizontalLine: (_) =>
                      const FlLine(color: AppColors.line, strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(),
                  rightTitles: const AxisTitles(),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 34,
                      interval: axisMax / 4,
                      getTitlesWidget: (value, _) => Text(
                        value.round().toString(),
                        style: const TextStyle(
                          fontSize: 9,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      getTitlesWidget: (value, _) {
                        final index = value.round();
                        if (index < 0 || index >= _days.length) {
                          return const SizedBox.shrink();
                        }
                        return Text(
                          _days[index],
                          style: const TextStyle(
                            fontSize: 9,
                            color: AppColors.inkSubtle,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                lineTouchData: const LineTouchData(enabled: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      for (var i = 0; i < series.length; i++)
                        FlSpot(i.toDouble(), series[i]),
                    ],
                    isCurved: true,
                    curveSmoothness: 0.3,
                    color: const Color(0xFF5B67CA),
                    barWidth: 2,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          const Color(0xFF5B67CA).withValues(alpha: 0.22),
                          const Color(0xFF5B67CA).withValues(alpha: 0.02),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The next booked consultation, highlighted so it cannot be missed.
class UpcomingCard extends StatelessWidget {
  const UpcomingCard({super.key, required this.consultation});

  final UpcomingConsultation consultation;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E5B3A),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Starts in ${consultation.startsInMinutes} min',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF7DE2A5),
                  ),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    Icon(
                      consultation.isVideo
                          ? Icons.videocam_outlined
                          : Icons.headset_mic_outlined,
                      size: 12,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      consultation.isVideo ? 'Video' : 'Audio',
                      style: const TextStyle(fontSize: 10, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: Colors.white.withValues(alpha: 0.14),
                child: Text(
                  consultation.initials,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      consultation.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      consultation.matter,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFFB6C0D4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _DarkChip(
                icon: Icons.calendar_today_outlined,
                label: consultation.day,
              ),
              const SizedBox(width: 10),
              _DarkChip(icon: Icons.access_time, label: consultation.time),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              // TODO: open the consultation detail screen.
              onPressed: () {},
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.ink,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('View Details'),
                  Spacer(),
                  Icon(Icons.chevron_right, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DarkChip extends StatelessWidget {
  const _DarkChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, size: 13, color: const Color(0xFFB6C0D4)),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}

/// One booking in today's list.
class ScheduleRow extends StatelessWidget {
  const ScheduleRow({super.key, required this.entry});

  final ScheduleEntry entry;

  @override
  Widget build(BuildContext context) {
    final confirmed = entry.state == BookingState.confirmed;

    return SectionCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.canvas,
            child: Text(
              entry.initials,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.inkMuted,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${entry.time} . ${entry.slotMinutes} min slot',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: confirmed
                  ? const Color(0xFFE7F7EE)
                  : const Color(0xFFFDF3E3),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              confirmed ? 'Confirmed' : 'Pending',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: confirmed ? AppColors.positive : const Color(0xFFB98A2F),
              ),
            ),
          ),
          const Icon(Icons.chevron_right, size: 18, color: AppColors.inkSubtle),
        ],
      ),
    );
  }
}

/// Icon + label row used by Recent Activity.
class ActivityRow extends StatelessWidget {
  const ActivityRow({super.key, required this.entry});

  final ActivityEntry entry;

  static const _icons = {
    ActivityKind.booking: Icons.event_available_outlined,
    ActivityKind.consultation: Icons.check_circle_outline,
    ActivityKind.report: Icons.description_outlined,
    ActivityKind.payment: Icons.account_balance_wallet_outlined,
    ActivityKind.approval: Icons.verified_outlined,
  };

  @override
  Widget build(BuildContext context) {
    final approval = entry.kind == ActivityKind.approval;

    return SectionCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            _icons[entry.kind],
            size: 18,
            color: approval ? AppColors.positive : AppColors.inkMuted,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  entry.subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    height: 1.4,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            entry.timeAgo,
            style: const TextStyle(fontSize: 10, color: AppColors.inkSubtle),
          ),
        ],
      ),
    );
  }
}
