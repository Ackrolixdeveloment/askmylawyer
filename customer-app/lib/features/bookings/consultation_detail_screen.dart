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
          _HeaderCard(booking: booking),
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
                    height: 1.55,
                    color: AppColors.inkSubtle,
                  ),
                ),
                const SizedBox(height: 10),
                // TODO: expand to the full summary.
                InkWell(
                  onTap: () {},
                  child: const Text(
                    'Read full summary',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          _DocumentSection(
            title: 'Your Documents (${booking.myDocuments.length})',
            action: 'View All',
            documents: booking.myDocuments,
          ),
          const SizedBox(height: 18),

          _DocumentSection(
            title: 'Lawyer Reference Documents',
            documents: booking.lawyerDocuments,
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Chat During Consultation'),
          _Card(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            child: Column(
              children: [
                for (final message in booking.chat) ...[
                  _ChatRow(message: message),
                  const SizedBox(height: 12),
                ],
                // TODO: open the full transcript.
                InkWell(
                  onTap: () {},
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '+6 more Messages',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppColors.brand,
                        ),
                      ),
                    ],
                  ),
                ),
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
                            ? 'Pending'
                            : 'Generated on ${booking.reportGeneratedAt}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
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
                _DetailRow(label: 'Consultation ID', value: booking.bookingId),
                const _Hairline(),
                _DetailRow(label: 'Mode', value: '${booking.modeLabel} Call'),
                const _Hairline(),
                _DetailRow(
                  label: 'Duration',
                  value: '${booking.durationMinutes} Minutes',
                ),
                const _Hairline(),
                _DetailRow(
                  label: 'Date',
                  value: '${booking.date}  ${booking.time}',
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Payment Summary'),
          _Card(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _DetailRow(
                  label: 'Amount Paid',
                  value: '₹${booking.payment.amountPaid}',
                ),
                const _Hairline(),
                _DetailRow(
                  label: 'Coupon Discount',
                  value: '₹${booking.payment.couponDiscount}',
                ),
                const _Hairline(),
                _DetailRow(
                  label: 'Final Paid',
                  value: '₹${booking.payment.finalPaid}',
                  emphasised: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          SizedBox(
            height: 48,
            child: FilledButton.icon(
              // TODO: open or download the generated report.
              onPressed: booking.reportGeneratedAt == null ? null : () {},
              icon: const Icon(Icons.description_outlined, size: 17),
              label: const Text('View or download Report'),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 48,
            child: OutlinedButton.icon(
              // TODO: download the tax invoice.
              onPressed: () {},
              icon: const Icon(Icons.download_outlined, size: 17),
              label: const Text('Download Invoice'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.ink,
                side: const BorderSide(color: AppColors.line),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Dark card naming the advocate, with the mode and status alongside.
class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.booking});

  final Booking booking;

  IconData get _modeIcon => switch (booking.mode) {
    CallMode.audio => Icons.headset_outlined,
    CallMode.video => Icons.videocam_outlined,
    CallMode.chat => Icons.chat_bubble_outline,
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person_outline,
                  size: 19,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.lawyer,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      booking.practice,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFFB6C0D4),
                      ),
                    ),
                  ],
                ),
              ),
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
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_modeIcon, size: 12, color: Colors.white),
                    const SizedBox(width: 5),
                    Text(
                      booking.modeLabel,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: Text(
                  '${booking.date}   ${booking.time}   '
                  '${booking.durationMinutes}min',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFFB6C0D4),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.positive.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  booking.statusLabel,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF6EE7A8),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// A titled card listing documents, with an optional trailing action.
class _DocumentSection extends StatelessWidget {
  const _DocumentSection({
    required this.title,
    required this.documents,
    this.action,
  });

  final String title;
  final List<BookingDocument> documents;
  final String? action;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 8),
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
              if (action != null)
                // TODO: open the full document list.
                InkWell(
                  onTap: () {},
                  child: Text(
                    action!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                ),
            ],
          ),
        ),
        _Card(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < documents.length; i++) ...[
                if (i > 0) const _Hairline(),
                _DocumentRow(document: documents[i]),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _ChatRow extends StatelessWidget {
  const _ChatRow({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 26,
          height: 26,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: message.fromCustomer ? AppColors.ink : AppColors.canvas,
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.person_outline,
            size: 14,
            color: message.fromCustomer ? Colors.white : AppColors.inkMuted,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      message.author,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  Text(
                    message.time,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                message.body,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  color: AppColors.inkSubtle,
                ),
              ),
            ],
          ),
        ),
      ],
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

class _Hairline extends StatelessWidget {
  const _Hairline();

  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, thickness: 1, color: AppColors.line);
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
          fontSize: 12,
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
                    fontSize: 12,
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

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
    this.emphasised = false,
  });

  final String label;
  final String value;

  /// Final Paid reads heavier than the rows above it.
  final bool emphasised;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: emphasised ? FontWeight.w700 : FontWeight.w400,
                color: emphasised ? AppColors.ink : AppColors.inkSubtle,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: emphasised ? 14 : 13,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}
