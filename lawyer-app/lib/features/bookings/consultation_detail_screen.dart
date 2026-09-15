import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'booking_data.dart';

/// Everything recorded against one consultation.
class ConsultationDetailScreen extends StatelessWidget {
  const ConsultationDetailScreen({super.key, required this.booking});

  final Booking booking;

  @override
  Widget build(BuildContext context) {
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
                    booking.initials,
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
                        booking.practice,
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
                      booking.clientRef,
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
                        booking.caseTag,
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
                  booking.summary,
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

          Row(
            children: [
              Expanded(
                child: _SectionTitle('Documents (${booking.documents.length})'),
              ),
              const Text(
                'View All',
                style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
              ),
            ],
          ),
          _Card(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var i = 0; i < booking.documents.length; i++) ...[
                  if (i > 0)
                    const Divider(
                      height: 1,
                      thickness: 1,
                      color: AppColors.line,
                    ),
                  _DocumentRow(document: booking.documents[i]),
                ],
              ],
            ),
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Generated Report'),
          _Card(
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
                        booking.reportGeneratedAt == null
                            ? 'Not generated yet'
                            : 'Generated on ${booking.reportGeneratedAt}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  size: 18,
                  color: AppColors.inkSubtle,
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Booking Details'),
          _Card(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _BookingRow(label: 'Consultation ID', value: booking.bookingId),
                _BookingRow(label: 'Mode', value: '${booking.modeLabel} Call'),
                _BookingRow(
                  label: 'Duration',
                  value: '${booking.durationMinutes} Minutes',
                ),
                _BookingRow(label: 'Date', value: booking.date),
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

class _DocumentRow extends StatelessWidget {
  const _DocumentRow({required this.document});

  final BookingDocument document;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          const _PdfBadge(),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.name,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Uploaded by ${document.uploadedBy} . ${document.size}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          // TODO: download the document.
          const Icon(
            Icons.download_outlined,
            size: 18,
            color: AppColors.inkMuted,
          ),
        ],
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
