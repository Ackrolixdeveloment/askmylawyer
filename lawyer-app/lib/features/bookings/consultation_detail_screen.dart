import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../reports/report_screen.dart';
import 'booking_repository.dart';

/// Everything recorded against one consultation.
class ConsultationDetailScreen extends StatefulWidget {
  const ConsultationDetailScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<ConsultationDetailScreen> createState() =>
      _ConsultationDetailScreenState();
}

class _ConsultationDetailScreenState extends State<ConsultationDetailScreen> {
  BookingDetail? _booking;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final booking = await BookingRepository.instance.detail(
        widget.consultationId,
      );
      if (mounted) setState(() => _booking = booking);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  /// Opens the report — to read if it has gone, to finish if it has not.
  Future<void> _openReport() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ReportScreen(consultationId: widget.consultationId),
      ),
    );
    if (mounted) _load();
  }

  /// Two letters for the avatar.
  String _initials(String name) => name
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();

  /// What the report row says underneath its title.
  String _reportLine(BookingDetail booking) {
    if (!booking.hasReport) return 'No report for this consultation';
    if (booking.reportSent) {
      final at = booking.reportSubmittedAt;
      return at == null ? 'Sent to your client' : 'Sent on ${booking.dateLabel}';
    }
    return 'Needs your review — tap to finish it';
  }

  @override
  Widget build(BuildContext context) {
    final booking = _booking;

    if (booking == null) {
      return Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            onPressed: () => Navigator.of(context).maybePop(),
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
            color: AppColors.ink,
          ),
        ),
        body: Center(
          child: _error == null
              ? const CircularProgressIndicator()
              : Text(
                  _error!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.negative,
                  ),
                ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.chevron_left, size: 26),
          color: AppColors.ink,
        ),
        title: const Text(
          'Consultation Details',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 4, 14, 24),
        children: [
          _Card(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.ink,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    _initials(booking.client),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
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
                        booking.client,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        booking.planName,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      booking.reference,
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.canvas,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        booking.caseTag ?? 'General',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Case Summary'),
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.reportSummary?.isNotEmpty == true
                      ? booking.reportSummary!
                      : booking.description ??
                            'No summary yet — it arrives with the report.',
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.6,
                    color: AppColors.inkSubtle,
                  ),
                ),
                const SizedBox(height: 12),
                // TODO: open the full summary.
                const Text(
                  'Read full summary',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Clients can attach a file when booking, but it is not stored
          // or passed through to the lawyer yet — so this says so rather
          // than showing an empty list as though none were sent.
          const _SectionTitle('Documents'),
          const _Card(
            child: Text(
              'No documents shared.',
              style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
            ),
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Generated Report'),
          InkWell(
            onTap: booking.hasReport ? _openReport : null,
            borderRadius: BorderRadius.circular(12),
            child: _Card(
              child: Row(
                children: [
                  const _PdfBadge(),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Consultation Summary Report',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _reportLine(booking),
                          style: TextStyle(
                            fontSize: 10,
                            // An outstanding report is the lawyer's to
                            // finish, and their money is waiting on it.
                            color: booking.hasReport && !booking.reportSent
                                ? AppColors.negative
                                : AppColors.inkSubtle,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (booking.hasReport)
                    const Icon(
                      Icons.chevron_right,
                      size: 18,
                      color: AppColors.inkSubtle,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Booking Details'),
          _Card(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _BookingRow(label: 'Consultation ID', value: booking.reference),
                _BookingRow(label: 'Mode', value: booking.planName),
                _BookingRow(
                  label: 'Duration',
                  value: '${booking.durationMinutes} Minutes',
                ),
                _BookingRow(label: 'Date', value: booking.dateLabel),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child, this.padding = const EdgeInsets.all(14)});

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.line),
      ),
      child: child,
    );
  }
}

class _PdfBadge extends StatelessWidget {
  const _PdfBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: 30,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Text(
        'PDF',
        style: TextStyle(
          fontSize: 7,
          fontWeight: FontWeight.w700,
          color: AppColors.inkMuted,
        ),
      ),
    );
  }
}

class _BookingRow extends StatelessWidget {
  const _BookingRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.inkSubtle),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}
