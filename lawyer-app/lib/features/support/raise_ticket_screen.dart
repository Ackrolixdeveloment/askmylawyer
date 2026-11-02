import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'support_repository.dart';

class RaiseTicketScreen extends StatefulWidget {
  const RaiseTicketScreen({super.key, this.category, this.nextId});
  final String? category, nextId;
  @override
  State<RaiseTicketScreen> createState() => _RaiseTicketState();
}

class _RaiseTicketState extends State<RaiseTicketScreen> {
  final _form = GlobalKey<FormState>();
  final _subject = TextEditingController();
  final _description = TextEditingController();
  final _search = TextEditingController();
  final _repo = SupportRepository.instance;
  late final String _key = _repo.newKey();
  List<SupportOption> _categories = [], _consultations = [];
  String? _categoryId, _requestId;
  String _error = '';
  bool _loading = true, _busy = false;
  @override
  void initState() {
    super.initState();
    _options();
  }

  @override
  void dispose() {
    _subject.dispose();
    _description.dispose();
    _search.dispose();
    super.dispose();
  }

  Future<void> _options() async {
    try {
      final c = await _repo.categories();
      final r = await _repo.consultations();
      if (!mounted) return;
      setState(() {
        _categories = c;
        _consultations = r;
        _error = '';
        if (widget.category != null) {
          final matches = c.where(
            (v) => v.label.toLowerCase() == widget.category!.toLowerCase(),
          );
          if (matches.isNotEmpty) _categoryId = matches.first.id;
        }
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = 'Could not load ticket options. You may still create a general ticket.',
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _find() async {
    if (_busy) return;
    setState(() => _loading = true);
    try {
      final r = await _repo.consultations(_search.text);
      if (mounted) {
        setState(() {
          _consultations = r;
          _requestId = null;
          _error = '';
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not search consultations.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      final r = await _repo.create(
        subject: _subject.text,
        description: _description.text,
        categoryId: _categoryId,
        requestId: _requestId,
        clientKey: _key,
      );
      if (mounted) Navigator.of(context).pop(r);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'Could not create the ticket. Retry without closing this form.',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_busy,
    child: Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(title: const Text('Raise a ticket')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          children: [
            if (_loading) const LinearProgressIndicator(),
            if (_error.isNotEmpty) ...[
              Text(_error, style: const TextStyle(color: Colors.red)),
              TextButton(
                onPressed: _options,
                child: const Text('Reload options'),
              ),
            ],
            TextFormField(
              controller: _subject,
              enabled: !_busy,
              maxLength: 150,
              decoration: const InputDecoration(labelText: 'Subject'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Enter a subject.' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              key: ValueKey('category-$_categoryId'),
              initialValue: _categoryId ?? '',
              decoration: const InputDecoration(labelText: 'Category'),
              items: [
                const DropdownMenuItem(
                  value: '',
                  child: Text('General support'),
                ),
                ..._categories.map(
                  (c) => DropdownMenuItem(value: c.id, child: Text(c.label)),
                ),
              ],
              onChanged: _busy
                  ? null
                  : (v) => setState(() => _categoryId = v == '' ? null : v),
            ),
            const SizedBox(height: 20),
            const Text(
              'Link a consultation (optional)',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _search,
              enabled: !_busy,
              maxLength: 100,
              decoration: InputDecoration(
                hintText: 'Search booking ID or participant name',
                counterText: '',
                suffixIcon: IconButton(
                  onPressed: _busy || _loading ? null : _find,
                  icon: const Icon(Icons.search),
                ),
              ),
              onSubmitted: (_) => _find(),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              key: ValueKey(
                'consultation-$_requestId-${_consultations.length}',
              ),
              initialValue: _requestId ?? '',
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Your consultation'),
              items: [
                const DropdownMenuItem(
                  value: '',
                  child: Text('No linked consultation'),
                ),
                ..._consultations.map(
                  (c) => DropdownMenuItem(
                    value: c.id,
                    child: Text(c.label, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ],
              onChanged: _busy
                  ? null
                  : (v) => setState(() => _requestId = v == '' ? null : v),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _description,
              enabled: !_busy,
              maxLines: 7,
              maxLength: 5000,
              decoration: const InputDecoration(
                labelText: 'Describe the issue',
                alignLabelWithHint: true,
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Describe the issue.' : null,
            ),
            const SizedBox(height: 12),
            const Text(
              'You can add attachments in ticket details after creating the ticket.',
              style: TextStyle(fontSize: 12, color: AppColors.inkMuted),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: Text(_busy ? 'Creating ticket…' : 'Submit ticket'),
            ),
          ],
        ),
      ),
    ),
  );
}
