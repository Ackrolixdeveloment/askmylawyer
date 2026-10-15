import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'report_repository.dart';

/// The consultation report: waiting for the draft, then checking and sending
/// it.
///
/// One screen with two faces. While the draft is being written it shows the
/// waiting state; once it arrives it becomes the report itself, with the
/// lawyer's deadline running at the top.
class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _reports = ReportRepository.instance;

  final _summary = TextEditingController();
  final _guidance = TextEditingController();
  final _steps = TextEditingController();

  Timer? _poll;
  Timer? _clock;
  ConsultationReport? _report;

  bool _editing = false;
  bool _busy = false;
  String? _error;

  /// Set once the fields have been filled from the draft, so a later poll
  /// cannot overwrite what the lawyer is typing.
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _refresh());
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _report?.reviewEndsAt != null) setState(() {});
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    _clock?.cancel();
    _summary.dispose();
    _guidance.dispose();
    _steps.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final report = await _reports.forConsultation(widget.consultationId);
      if (!mounted) return;

      setState(() => _report = report);

      // Only once: the draft fills the fields, the lawyer owns them after.
      if (!_loaded && !report.isDrafting) {
        _loaded = true;
        _summary.text = report.caseSummary;
        _guidance.text = report.legalGuidance;
        _steps.text = report.nextSteps;
        // Nothing to read means nothing to review; open straight into
        // writing rather than showing three empty headings.
        if (report.writeFromScratch) setState(() => _editing = true);
      }

      if (!report.isDrafting) _poll?.cancel();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await _reports.submit(
        widget.consultationId,
        caseSummary: _summary.text,
        legalGuidance: _guidance.text,
        nextSteps: _steps.text,
      );
      if (!mounted) return;

      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Report sent to your client.')),
      );
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _askForLonger() async {
    try {
      final report = await _reports.askForLonger(widget.consultationId);
      if (mounted) setState(() => _report = report);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final report = _report;

    if (report == null || report.isDrafting) {
      return _Waiting(problem: _error);
    }

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: AppColors.surface,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Consultation Report',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        actions: [
          IconButton(
            tooltip: _editing ? 'Done editing' : 'Edit',
            onPressed: () => setState(() => _editing = !_editing),
            icon: Icon(_editing ? Icons.check : Icons.edit_outlined, size: 20),
            color: AppColors.ink,
          ),
        ],
      ),
      body: Column(
        children: [
          _Deadline(
            report: report,
            onAskForLonger: report.canAskForLonger ? _askForLonger : null,
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
              children: [
                if (report.problem != null && !report.isSent)
                  _Notice(text: report.problem!),

                // Whatever was typed during the call, so the lawyer is not
                // writing the report from memory alone.
                if (report.transcript != null && !report.isSent)
                  _Transcript(text: report.transcript!),

                _Section(
                  title: 'Case Summary',
                  controller: _summary,
                  editing: _editing,
                  hint: 'What the client came to you about, and the facts '
                      'they gave you.',
                ),
                _Section(
                  title: 'Legal Guidance Provided',
                  controller: _guidance,
                  editing: _editing,
                  hint: 'The position you explained and the options you set '
                      'out.',
                ),
                _Section(
                  title: 'Recommended Next Steps',
                  controller: _steps,
                  editing: _editing,
                  hint: 'What the client should do now.',
                ),

                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.negative,
                    ),
                  ),
                ],
              ],
            ),
          ),

          if (!report.isSent)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton.icon(
                  onPressed: _busy ? null : _send,
                  icon: const Icon(Icons.send, size: 18),
                  label: Text(_busy ? 'Sending…' : 'Send to Client'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.ink,
                    foregroundColor: Colors.white,
                    textStyle: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// "Creating Case Summary" — while the draft is being written.
class _Waiting extends StatelessWidget {
  const _Waiting({this.problem});

  final String? problem;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.balance,
                  size: 76,
                  color: Color(0xFFE2E6EE),
                ),
                const SizedBox(height: 28),
                const Text(
                  'CONSULTATION COMPLETE',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.1,
                    color: AppColors.inkSubtle,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Creating Case Summary',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.auto_awesome,
                      size: 15,
                      color: AppColors.inkMuted,
                    ),
                    const SizedBox(width: 7),
                    Text(
                      problem ?? 'Analysing conversation…',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.inkMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                const SizedBox(
                  width: 30,
                  height: 30,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    valueColor: AlwaysStoppedAnimation(AppColors.inkSubtle),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The countdown, and what happens when it runs out.
class _Deadline extends StatelessWidget {
  const _Deadline({required this.report, this.onAskForLonger});

  final ConsultationReport report;
  final VoidCallback? onAskForLonger;

  @override
  Widget build(BuildContext context) {
    if (report.isSent) {
      return Container(
        width: double.infinity,
        color: const Color(0xFFE7F6EC),
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 14),
        child: const Text(
          'Sent to your client.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1B8A4B),
          ),
        ),
      );
    }

    // Past the deadline the report still sends; the earnings are what wait.
    if (report.overdue) {
      return Container(
        width: double.infinity,
        color: const Color(0xFFFDECEC),
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 14),
        child: Text(
          report.earningNet == null
              ? 'Overdue. Send this report to close the consultation.'
              : '₹${report.earningNet} is on hold until you send this report.',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.negative,
          ),
        ),
      );
    }

    final left = report.secondsLeft;
    final minutes = (left ~/ 60).toString().padLeft(2, '0');
    final seconds = (left % 60).toString().padLeft(2, '0');

    return Container(
      width: double.infinity,
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Report expires in $minutes:$seconds',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.negative,
            ),
          ),
          if (onAskForLonger != null) ...[
            const SizedBox(width: 12),
            GestureDetector(
              onTap: onAskForLonger,
              child: Text(
                '+${report.extensionMinutes} min',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.brand,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// One part of the report: read as a paragraph, or edited as a field.
class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.controller,
    required this.editing,
    required this.hint,
  });

  final String title;
  final TextEditingController controller;
  final bool editing;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
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
          const SizedBox(height: 8),
          if (editing)
            TextField(
              controller: controller,
              maxLines: null,
              minLines: 4,
              textCapitalization: TextCapitalization.sentences,
              style: const TextStyle(
                fontSize: 13,
                height: 1.5,
                color: AppColors.ink,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(
                  fontSize: 13,
                  color: AppColors.inkSubtle,
                ),
                filled: true,
                fillColor: AppColors.canvas,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            )
          else
            Text(
              controller.text.isEmpty ? hint : controller.text,
              style: TextStyle(
                fontSize: 13,
                height: 1.5,
                color: controller.text.isEmpty
                    ? AppColors.inkSubtle
                    : AppColors.inkMuted,
              ),
            ),
        ],
      ),
    );
  }
}

/// The chat from the call, to write the report against.
class _Transcript extends StatelessWidget {
  const _Transcript({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'From the call',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 8),
          SelectableText(
            text,
            style: const TextStyle(
              fontSize: 12,
              height: 1.6,
              color: AppColors.inkMuted,
            ),
          ),
        ],
      ),
    );
  }
}

/// Says plainly that there was no draft to work from.
class _Notice extends StatelessWidget {
  const _Notice({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF6E5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline,
            size: 17,
            color: Color(0xFF9A6B00),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12,
                height: 1.45,
                color: Color(0xFF9A6B00),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
