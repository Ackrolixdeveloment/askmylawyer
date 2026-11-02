import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'support_repository.dart';
import 'raise_ticket_screen.dart';
import 'ticket_detail_screen.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});
  @override
  State<SupportScreen> createState() => _SupportListState();
}

class _SupportListState extends State<SupportScreen> {
  final _search = TextEditingController();
  final _repo = SupportRepository.instance;
  Timer? _debounce;
  List<LiveSupportTicket> _tickets = [];
  String _status = '', _error = '';
  int _total = 0, _all = 0, _page = 1, _generation = 0;
  bool _loading = true;
  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(() {
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 350), () => _load());
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({bool more = false}) async {
    if (more && _loading) return;
    final generation = ++_generation;
    final page = more ? _page + 1 : 1;
    setState(() => _loading = true);
    try {
      final r = await _repo.list(
        search: _search.text,
        status: _status,
        page: page,
      );
      if (!mounted || generation != _generation) return;
      setState(() {
        _tickets = more ? [..._tickets, ...r.rows] : r.rows;
        _page = page;
        _total = r.total;
        _all = r.totalRecords;
        _error = '';
      });
    } on ApiException catch (e) {
      if (mounted && generation == _generation) {
        setState(() => _error = e.message);
      }
    } catch (_) {
      if (mounted && generation == _generation) {
        setState(() => _error = 'Could not load support tickets.');
      }
    } finally {
      if (mounted && generation == _generation) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _create() async {
    final ticket = await Navigator.of(context).push<LiveSupportTicket>(
      MaterialPageRoute(builder: (_) => const RaiseTicketScreen()),
    );
    if (ticket != null && mounted) {
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => TicketDetailScreen(ticketId: ticket.id),
        ),
      );
      if (mounted) _load();
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.canvas,
    appBar: AppBar(
      title: const Text('Support & help'),
      actions: [
        TextButton.icon(
          onPressed: _create,
          icon: const Icon(Icons.add),
          label: const Text('Raise ticket'),
        ),
      ],
    ),
    body: RefreshIndicator(
      onRefresh: () => _load(),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        children: [
          TextField(
            controller: _search,
            maxLength: 100,
            decoration: const InputDecoration(
              labelText: 'Search ticket ID or subject',
              prefixIcon: Icon(Icons.search),
              counterText: '',
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _status,
            decoration: const InputDecoration(labelText: 'Ticket status'),
            items: [
              const DropdownMenuItem(value: '', child: Text('All tickets')),
              ...['new', 'in_progress', 'escalated', 'resolved', 'closed'].map(
                (s) =>
                    DropdownMenuItem(value: s, child: Text(supportStatus(s))),
              ),
            ],
            onChanged: (v) {
              setState(() => _status = v ?? '');
              _load();
            },
          ),
          const SizedBox(height: 16),
          Text(
            '$_total matching · $_all total tickets',
            style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
          ),
          if (_loading) ...[
            const SizedBox(height: 12),
            const LinearProgressIndicator(),
          ],
          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_error, style: const TextStyle(color: Colors.red)),
            TextButton(onPressed: () => _load(), child: const Text('Retry')),
          ],
          if (!_loading && _tickets.isEmpty && _error.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Text('No support tickets to show.'),
            ),
          const SizedBox(height: 12),
          ..._tickets.map(
            (t) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: const EdgeInsets.all(14),
                title: Text(
                  t.subject,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '${t.code} · ${t.category}\n${supportStatus(t.status)} · ${supportDate(t.updatedAt)}',
                  ),
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => TicketDetailScreen(ticketId: t.id),
                    ),
                  );
                  if (mounted) _load();
                },
              ),
            ),
          ),
          if (_tickets.length < _total)
            OutlinedButton(
              onPressed: _loading ? null : () => _load(more: true),
              child: const Text('Load more tickets'),
            ),
          const SizedBox(height: 24),
          const Text(
            'Help',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
          ),
          const ExpansionTile(
            title: Text('How do I track my request?'),
            children: [
              Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'Open a ticket to see replies, status and resolution. Pull down to refresh this list.',
                ),
              ),
            ],
          ),
          const ExpansionTile(
            title: Text('Can I attach documents?'),
            children: [
              Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'After creating a ticket, open it to add up to 10 PDF, JPG, PNG, WebP or TXT files, each up to 5 MB.',
                ),
              ),
            ],
          ),
          const ExpansionTile(
            title: Text('I still need help after resolution'),
            children: [
              Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'Reply to a resolved ticket to reopen it. For a closed ticket, create a new request and mention the earlier ticket ID.',
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}
