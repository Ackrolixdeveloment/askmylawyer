import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../consultation/consultation_repository.dart';
import '../consultation/consultation_screen.dart';
import '../consultation/consult_draft.dart';
import '../consultation/call_screen.dart';
import '../consultation/finding_lawyer_screen.dart';
import '../consultation/payment_service.dart';
import 'upcoming_data.dart';

class UpcomingScreen extends StatefulWidget {
  const UpcomingScreen({super.key, this.consultations, this.now});
  // Retained for existing callers; production always reads persisted bookings.
  final List<UpcomingConsultation>? consultations;
  final DateTime? now;
  @override
  State<UpcomingScreen> createState() => _UpcomingScreenState();
}

class _UpcomingScreenState extends State<UpcomingScreen> {
  List<Consultation>? _rows;
  String? _error;
  String? _busy;
  Timer? _poll;
  bool _loading = false;
  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(const Duration(seconds: 15), (_) => _load());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    if (_loading) return;
    _loading = true;
    try {
      final rows = await ConsultationRepository.instance.upcoming();
      if (mounted) {
        setState(() {
          _rows = rows;
          _error = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      _loading = false;
    }
  }

  Future<void> _open(Consultation row) async {
    if (row.needsPayment) {
      setState(() => _busy = row.id);
      try {
        await PaymentService.instance.payFor(row);
        await _load();
      } finally {
        if (mounted) setState(() => _busy = null);
      }
      return;
    }
    if (row.isMatched) {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => CallScreen(
            consultationId: row.id,
            title: row.lawyerName ?? 'Your lawyer',
            planName: row.planName,
          ),
        ),
      );
    } else if (row.isSearching || row.noLawyerFound) {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => FindingLawyerScreen(
            draft: ConsultDraft(
              mode: ConsultMode.scheduled,
              location: '',
              caseTag: row.category ?? '',
              slot: row.scheduledFor,
            ),
            consultation: row,
          ),
        ),
      );
    }
    await _load();
  }

  Future<void> _cancel(Consultation row) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel booking?'),
        content: const Text(
          'Any captured consultation payment will be queued for refund.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep booking'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel booking'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ConsultationRepository.instance.cancel(row.id);
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final rows = _rows;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 100),
        children: [
          const Text(
            'Upcoming consultations',
            style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          const Text('Your saved bookings and current matching status.'),
          if (_error != null)
            Padding(padding: const EdgeInsets.all(16), child: Text(_error!)),
          if (rows == null && _error == null)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            ),
          if (rows != null && rows.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 60),
              child: Center(
                child: Text(
                  'No upcoming bookings. Schedule a consultation to see it here.',
                ),
              ),
            ),
          for (final row in rows ?? <Consultation>[])
            Card(
              margin: const EdgeInsets.only(top: 16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      row.category ?? row.planName,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      row.scheduledFor == null
                          ? ''
                          : '${row.scheduledFor!.day}/${row.scheduledFor!.month}/${row.scheduledFor!.year} · ${TimeOfDay.fromDateTime(row.scheduledFor!).format(context)}',
                    ),
                    const SizedBox(height: 6),
                    Text('₹${row.amount} · ${row.durationMinutes} minutes'),
                    const SizedBox(height: 6),
                    Text(
                      row.lawyerName ??
                          'Lawyer will be assigned near your slot',
                      style: const TextStyle(color: AppColors.inkMuted),
                    ),
                    const SizedBox(height: 8),
                    Text(row.status.replaceAll('_', ' ')),
                    if (row.status != 'scheduled')
                      FilledButton(
                        onPressed: _busy == row.id ? null : () => _open(row),
                        child: Text(
                          _busy == row.id
                              ? 'Opening…'
                              : row.needsPayment
                              ? 'Complete payment'
                              : row.isMatched
                              ? 'Get ready / Join'
                              : row.noLawyerFound
                              ? 'Review options'
                              : 'View matching',
                        ),
                      ),
                    if (row.status == 'scheduled' ||
                        row.needsPayment ||
                        row.isSearching)
                      TextButton(
                        onPressed: () => _cancel(row),
                        child: const Text('Cancel booking'),
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
