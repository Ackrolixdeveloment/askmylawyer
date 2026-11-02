import 'dart:async';
import 'dart:io';

import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'support_repository.dart';

class TicketDetailScreen extends StatefulWidget {
  const TicketDetailScreen({super.key, required this.ticketId});
  final String ticketId;
  @override
  State<TicketDetailScreen> createState() => _TicketDetailState();
}

class _TicketDetailState extends State<TicketDetailScreen> {
  final _repo = SupportRepository.instance;
  final _reply = TextEditingController();
  Timer? _poll;
  LiveSupportTicket? _ticket;
  List<SupportReply> _messages = [];
  int _generation = 0;
  bool _hasMore = false,
      _historyLoaded = false,
      _loading = true,
      _fetching = false,
      _busy = false;
  String _error = '';
  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _load(silent: true),
    );
  }

  @override
  void dispose() {
    _poll?.cancel();
    _reply.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (silent && (_fetching || _busy)) return;
    final generation = ++_generation;
    _fetching = true;
    try {
      final r = await _repo.detail(widget.ticketId);
      if (!mounted || generation != _generation) return;
      setState(() {
        _ticket = r;
        if (_historyLoaded) {
          final byId = {
            for (final m in [..._messages, ...r.messages]) m.id: m,
          };
          _messages = byId.values.toList()
            ..sort((a, b) => a.date.compareTo(b.date));
        } else {
          _messages = r.messages;
          _hasMore = r.hasMoreMessages;
        }
        if (!silent) _error = '';
      });
    } on ApiException catch (e) {
      if (mounted && !silent) setState(() => _error = e.message);
    } catch (_) {
      if (mounted && !silent) {
        setState(() => _error = 'Could not load this support ticket.');
      }
    } finally {
      if (generation == _generation) {
        _fetching = false;
        if (mounted) setState(() => _loading = false);
      }
    }
  }

  Future<void> _send() async {
    if (_busy || _reply.text.trim().isEmpty) return;
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      await _repo.reply(widget.ticketId, _reply.text);
      if (!mounted) return;
      _reply.clear();
      await _load();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not send the reply.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _older() async {
    if (_busy || _messages.isEmpty) return;
    setState(() => _busy = true);
    try {
      final r = await _repo.older(widget.ticketId, _messages.first.id);
      if (mounted) {
        setState(() {
          final byId = {
            for (final m in [...r.rows, ..._messages]) m.id: m,
          };
          _messages = byId.values.toList()
            ..sort((a, b) => a.date.compareTo(b.date));
          _hasMore = r.hasMore;
          _historyLoaded = true;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not load older replies.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _upload() async {
    if (_busy) return;
    try {
      final result = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt'],
      );
      if (result == null || !mounted) return;
      final file = result;
      final size = await file.length();
      if (size > 5 * 1024 * 1024) {
        setState(() => _error = 'Choose a file up to 5 MB from this device.');
        return;
      }
      setState(() {
        _busy = true;
        _error = '';
      });
      await _repo.upload(widget.ticketId, await file.readAsBytes(), file.name);
      await _load();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not upload this file. Please retry.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _download(SupportFile file) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      final bytes = await ApiClient.instance.bytes(
        _repo.fileUrl(widget.ticketId, file.id),
      );
      if (!mounted) return;
      final dir = await getTemporaryDirectory();
      final name = file.name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
      final local = File('${dir.path}/${file.id}-$name');
      await local.writeAsBytes(bytes);
      final result = await OpenFilex.open(local.path);
      if (result.type != ResultType.done) {
        throw Exception('Could not open file');
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not open this attachment.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _card(String title, List<Widget> children) => Card(
    margin: const EdgeInsets.only(bottom: 16),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    ),
  );
  @override
  Widget build(BuildContext context) {
    final t = _ticket;
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: Text(t?.code ?? 'Support ticket'),
        actions: [
          IconButton(
            onPressed: _busy ? null : () => _load(),
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh ticket',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _load(),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
                children: [
                  if (_error.isNotEmpty) ...[
                    Text(_error, style: const TextStyle(color: Colors.red)),
                    TextButton(
                      onPressed: () => _load(),
                      child: const Text('Retry'),
                    ),
                  ],
                  if (t != null) ...[
                    _card(t.subject, [
                      Text(
                        '${supportStatus(t.status)} · ${t.category}',
                        style: const TextStyle(color: AppColors.brand),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Created ${supportDate(t.createdAt)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.inkMuted,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SelectableText(t.description),
                    ]),
                    if (t.resolution != null)
                      _card('Resolution', [SelectableText(t.resolution!)]),
                    _card('Conversation', [
                      if (_hasMore)
                        TextButton(
                          onPressed: _busy ? null : _older,
                          child: const Text('Load older replies'),
                        ),
                      if (_messages.isEmpty) const Text('No replies yet.'),
                      ..._messages.map(
                        (m) => Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: m.fromSupport
                                ? AppColors.brandSoft
                                : AppColors.canvas,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m.fromSupport ? '${m.author} · Support' : 'You',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 6),
                              SelectableText(m.body),
                              const SizedBox(height: 8),
                              Text(
                                supportDate(m.date),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.inkMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (t.status != 'closed') ...[
                        const SizedBox(height: 8),
                        TextField(
                          controller: _reply,
                          enabled: !_busy,
                          maxLength: 5000,
                          maxLines: 4,
                          decoration: InputDecoration(
                            labelText: t.status == 'resolved'
                                ? 'Reply to reopen ticket'
                                : 'Your reply',
                            alignLabelWithHint: true,
                          ),
                        ),
                        const SizedBox(height: 8),
                        FilledButton(
                          onPressed: _busy ? null : _send,
                          child: Text(_busy ? 'Saving…' : 'Send reply'),
                        ),
                      ] else
                        const Text(
                          'This ticket is closed. Create a new ticket for further help.',
                        ),
                    ]),
                    _card('Attachments · ${t.files.length}/10', [
                      ...t.files.map(
                        (f) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(f.name),
                          subtitle: Text('${(f.size / 1024).ceil()} KB'),
                          trailing: const Icon(Icons.download),
                          onTap: _busy ? null : () => _download(f),
                        ),
                      ),
                      if (t.files.isEmpty) const Text('No attachments.'),
                      if (t.status != 'closed' && t.files.length < 10) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _busy ? null : _upload,
                          icon: const Icon(Icons.attach_file),
                          label: const Text('Add attachment'),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'PDF, JPG, PNG, WebP or TXT · up to 5 MB each',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.inkMuted,
                          ),
                        ),
                      ],
                    ]),
                  ],
                ],
              ),
            ),
    );
  }
}
