import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../reports/report_screen.dart';
import '../consultation/consultation_repository.dart';
import '../consultation/payment_service.dart';
import '../consultation/consult_draft.dart';
import '../consultation/consultation_screen.dart';
import '../consultation/finding_lawyer_screen.dart';
import '../support/support_screen.dart';
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
  bool _acting = false;

  Future<void> _retryPaidBooking() async {
    setState(() {
      _acting = true;
      _error = null;
    });
    try {
      final consultation = await ConsultationRepository.instance.resolve(
        widget.consultationId,
        choice: 'reschedule',
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => FindingLawyerScreen(
            draft: ConsultDraft(
              mode: ConsultMode.now,
              location: '',
              caseTag: consultation.category ?? '',
              plan: ServicePlan(
                code: consultation.planCode,
                type: consultation.planName,
                amount: consultation.amount,
                gst: 0,
                payable: consultation.amount,
                durationMinutes: consultation.durationMinutes,
              ),
            ),
            consultation: consultation,
          ),
        ),
      );
      await _load();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _resumePayment() async {
    setState(() {
      _acting = true;
      _error = null;
    });
    try {
      final consultation = await ConsultationRepository.instance.detail(
        widget.consultationId,
      );
      if (!consultation.needsPayment) {
        await _load();
        return;
      }
      final result = await PaymentService.instance.payFor(consultation);
      if (mounted && !result.paid) {
        setState(
          () => _error = result.message ?? 'Payment was not completed. You can retry or cancel this booking.',
        );
      }
      await _load();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _cancelUnpaid() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel unpaid booking?'),
        content: const Text(
          'No payment has been completed. Cancelling lets you create a new booking.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep booking'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Cancel booking'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() {
      _acting = true;
      _error = null;
    });
    try {
      await ConsultationRepository.instance.cancel(widget.consultationId);
      await _load();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

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

  /// Long case descriptions are clamped until the customer asks for the rest.
  bool _summaryOpen = false;

  static bool _summaryIsLong(String? text) => (text ?? '').length > 220;

  Future<void> _openReport() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ReportScreen(consultationId: widget.consultationId),
      ),
    );
    if (mounted) _load();
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
          _HeaderCard(booking: booking),
          if (booking.status == 'no_lawyer') ...[
            const SizedBox(height: 12),
            const Text(
              'No lawyer is available right now. Your existing payment stays with this booking. Try again later without another payment.',
            ),
            FilledButton(
              onPressed: _acting ? null : _retryPaidBooking,
              child: Text(_acting ? 'Please wait…' : 'Try again later'),
            ),
          ],
          if (booking.status != 'pending_payment')
            TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const SupportScreen()),
              ),
              child: const Text('Contact Support'),
            ),
          if (booking.status == 'pending_payment') ...[
            const SizedBox(height: 12),
            const Text(
              'Payment pending. This consultation has not started. Resume payment or cancel it before creating another instant booking.',
            ),
            FilledButton(
              onPressed: _acting ? null : _resumePayment,
              child: Text(_acting ? 'Please wait…' : 'Resume payment'),
            ),
            TextButton(
              onPressed: _acting ? null : _cancelUnpaid,
              child: const Text('Cancel unpaid booking'),
            ),
          ],
          if (_error != null)
            Text(_error!, style: const TextStyle(color: AppColors.negative)),
          const SizedBox(height: 18),

          const _SectionTitle('Case Summary'),
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.description ??
                      'No summary yet — it arrives with your report.',
                  // Long descriptions pushed everything below off the
                  // screen; the link below opens the rest.
                  maxLines: _summaryOpen ? null : 4,
                  overflow: _summaryOpen
                      ? TextOverflow.visible
                      : TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.55,
                    color: AppColors.inkSubtle,
                  ),
                ),
                if (_summaryIsLong(booking.description)) ...[
                  const SizedBox(height: 10),
                  InkWell(
                    onTap: () => setState(() => _summaryOpen = !_summaryOpen),
                    child: Text(
                      _summaryOpen ? 'Show less' : 'Read full summary',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Files attached at booking are not stored or passed through
          // yet, and chat consultations do not connect at all — so these
          // say so rather than showing empty lists as though none were
          // sent.
          const _SectionTitle('Documents'),
          const _Card(
            child: Text(
              'No documents shared.',
              style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
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
                        !booking.hasReport
                            ? 'Pending'
                            : booking.reportReady
                            ? 'Ready to read'
                            : 'With your lawyer for review',
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
                _DetailRow(label: 'Consultation ID', value: booking.reference),
                const _Hairline(),
                _DetailRow(label: 'Mode', value: booking.planName),
                const _Hairline(),
                _DetailRow(
                  label: 'Duration',
                  value: '${booking.totalMinutes} Minutes',
                ),
                const _Hairline(),
                _DetailRow(label: 'Date', value: booking.dateLabel),
              ],
            ),
          ),
          const SizedBox(height: 18),

          const _SectionTitle('Payment Summary'),
          _Card(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _DetailRow(label: 'Amount Paid', value: '₹${booking.paid}'),
                const _Hairline(),
                _DetailRow(
                  label: 'Coupon Discount',
                  value: '₹${booking.owedForExtraTime}',
                ),
                const _Hairline(),
                _DetailRow(
                  label: 'Final Paid',
                  value: '₹${booking.paid + booking.owedForExtraTime}',
                  emphasised: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          SizedBox(
            height: 48,
            child: FilledButton.icon(
              onPressed: booking.hasReport ? _openReport : null,
              icon: const Icon(Icons.description_outlined, size: 17),
              label: const Text('View Report'),
            ),
          ),
          // The invoice button is out until there are invoices to download:
          // that needs the GSTIN, the registered address and an agreed
          // layout. Saying "Download Invoice" and producing nothing is
          // worse than not offering it.
        ],
      ),
    );
  }
}

/// Dark card naming the advocate, with the mode and status alongside.
class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.booking});

  final BookingDetail booking;

  IconData get _modeIcon => switch (booking.planName.toLowerCase()) {
    final name when name.contains('audio') => Icons.headset_outlined,
    final name when name.contains('chat') => Icons.chat_bubble_outline,
    _ => Icons.videocam_outlined,
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
                      booking.lawyer ??
                          (booking.status == 'pending_payment'
                              ? 'Awaiting payment'
                              : 'Lawyer not assigned'),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      booking.category ?? 'General',
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
                      booking.planName,
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
                  '${booking.dateLabel}   ${booking.totalMinutes} min',
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
                  booking.status,
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
