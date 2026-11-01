import 'dart:async';

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../profile/profile_screen.dart';
import '../consultation/payment_service.dart';
import 'report_repository.dart';

/// The client's consultation report.
///
/// Three states: the lawyer still has it, there is something to pay, or it
/// is theirs to read.
class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _reports = ReportRepository.instance;

  Timer? _poll;
  CustomerReport? _report;
  String? _error;
  bool _downloading = false;
  bool _paying = false;

  @override
  void initState() {
    super.initState();
    _refresh();
    // A lawyer has half an hour, so there is no rush — but a client who
    // leaves this open should see it arrive.
    _poll = Timer.periodic(const Duration(seconds: 20), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final report = await _reports.forConsultation(widget.consultationId);
      if (!mounted) return;

      setState(() => _report = report);
      if (report.isReady) _poll?.cancel();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  /// Opens the profile so they can fill in what is missing, then looks
  /// again — the report unlocks the moment it is complete.
  Future<void> _completeProfile() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            ProfileScreen(onClose: () => Navigator.of(context).maybePop()),
      ),
    );
    if (mounted) _refresh();
  }

  Future<void> _payOutstanding(CustomerReport report) async {
    setState(() => _paying = true);
    try {
      for (final id in report.unpaidExtensionIds) {
        if (!await PaymentService.instance.payExtension(
          widget.consultationId,
          id,
        )) {
          break;
        }
      }
      await _refresh();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment could not be completed. Please try again.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  Future<void> _download() async {
    setState(() => _downloading = true);
    try {
      final bytes = await ApiClient.instance.bytes(
        '/api/v1/customer/consultations/${widget.consultationId}/report/pdf',
      );
      if (!mounted) return;
      final box = context.findRenderObject() as RenderBox?;
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile.fromData(bytes, mimeType: 'application/pdf')],
          fileNameOverrides: [
            'consultation-report-${widget.consultationId}.pdf',
          ],
          sharePositionOrigin: box == null
              ? null
              : box.localToGlobal(Offset.zero) & box.size,
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'The report could not be downloaded. Please try again.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final report = _report;

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
          'Consultation Report',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
      ),
      body: report == null
          ? Center(
              child: _error == null
                  ? const CircularProgressIndicator()
                  : Text(
                      _error!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.negative,
                      ),
                    ),
            )
          : report.isReady
          ? _ready(report)
          : _waiting(report),
    );
  }

  /// Waiting on the lawyer, or waiting on payment.
  Widget _waiting(CustomerReport report) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              report.needsPayment || report.needsDetails
                  ? Icons.lock_outline
                  : Icons.hourglass_empty_rounded,
              size: 48,
              color: AppColors.inkSubtle,
            ),
            const SizedBox(height: 18),
            Text(
              report.needsPayment || report.needsDetails
                  ? 'Your report is ready'
                  : 'Being prepared',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              report.needsPayment
                  ? 'There is ₹${report.owed} outstanding for the extra time '
                        'added to your call. Settle it to open your report.'
                  : report.needsDetails
                  // Named plainly, because "complete your profile" leaves
                  // them hunting for which part.
                  ? 'Your report goes out in your name, so we need '
                        '${_asList(report.missingDetails)} first.'
                  : report.message ??
                        'Your report is with ${report.lawyerName} for review.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                height: 1.5,
                color: AppColors.inkMuted,
              ),
            ),
            if (report.needsDetails) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _completeProfile,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.ink,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Add your details'),
                ),
              ),
            ],
            if (report.needsPayment) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _paying ? null : () => _payOutstanding(report),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.ink,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(
                    _paying ? 'Opening payment…' : 'Pay ₹${report.owed}',
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// The report itself.
  Widget _ready(CustomerReport report) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 24),
      children: [
        FilledButton.icon(
          onPressed: _downloading ? null : _download,
          icon: const Icon(Icons.download_outlined),
          label: Text(_downloading ? 'Preparing PDF…' : 'Download report PDF'),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Part(title: 'Case Summary', body: report.caseSummary!),
              _Part(
                title: 'Legal Guidance Provided',
                body: report.legalGuidance ?? '',
              ),
              _Part(
                title: 'Recommended Next Steps',
                body: report.nextSteps ?? '',
                last: true,
              ),
              const SizedBox(height: 18),
              const Divider(color: AppColors.line),
              const SizedBox(height: 12),
              Text(
                report.lawyerName,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Advocate',
                style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// "your full name, your age and a mobile number".
String _asList(List<String> items) {
  if (items.isEmpty) return 'a few details';
  if (items.length == 1) return items.first;

  return '${items.sublist(0, items.length - 1).join(', ')} and ${items.last}';
}

class _Part extends StatelessWidget {
  const _Part({required this.title, required this.body, this.last = false});

  final String title;
  final String body;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            body,
            style: const TextStyle(
              fontSize: 13,
              height: 1.55,
              color: AppColors.inkMuted,
            ),
          ),
        ],
      ),
    );
  }
}
