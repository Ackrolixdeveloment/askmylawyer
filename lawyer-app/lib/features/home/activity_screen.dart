import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'home_repository.dart';
import 'widgets/home_sections.dart';

/// Everything that has happened lately, in full.
///
/// Fetched ten at a time as the lawyer scrolls: a lawyer two years in has
/// thousands of these, and none of them are worth waiting for up front.
class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  static const _pageSize = 10;

  /// How close to the bottom starts the next page, in pixels.
  static const _loadAhead = 400.0;

  final _scroll = ScrollController();
  final _entries = <ActivityEntry>[];

  String? _cursor;
  bool _hasMore = true;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    _loadMore();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scroll.hasClients) return;

    final remaining = _scroll.position.maxScrollExtent - _scroll.position.pixels;
    if (remaining < _loadAhead) _loadMore();
  }

  Future<void> _loadMore() async {
    // One page at a time, and nothing once the list has run out.
    if (_loading || !_hasMore) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final page = await HomeRepository.instance.activity(
        cursor: _cursor,
        limit: _pageSize,
      );
      if (!mounted) return;

      setState(() {
        _entries.addAll(page.entries);
        _cursor = page.nextCursor;
        _hasMore = page.hasMore;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Pull-to-refresh starts the list again from the top.
  Future<void> _refresh() async {
    setState(() {
      _entries.clear();
      _cursor = null;
      _hasMore = true;
    });
    await _loadMore();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          color: AppColors.ink,
        ),
        title: const Text(
          'Recent Activity',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: _entries.isEmpty ? _firstLoad() : _list(),
      ),
    );
  }

  /// Before anything has arrived: the spinner, an error, or an empty list.
  Widget _firstLoad() {
    return ListView(
      children: [
        const SizedBox(height: 140),
        Center(
          child: _loading
              ? const CircularProgressIndicator()
              : Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    _error ?? 'Nothing has happened yet.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: _error == null
                          ? AppColors.inkMuted
                          : AppColors.negative,
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _list() {
    // One extra row at the end: the spinner, the error, or nothing.
    final rows = _entries.length + 1;

    return ListView.separated(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 24),
      itemCount: rows,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, index) {
        if (index < _entries.length) {
          return ActivityRow(entry: _entries[index]);
        }
        return _footer();
      },
    );
  }

  Widget _footer() {
    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 18),
        child: Column(
          children: [
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppColors.negative),
            ),
            const SizedBox(height: 8),
            TextButton(onPressed: _loadMore, child: const Text('Try again')),
          ],
        ),
      );
    }

    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 2.2),
          ),
        ),
      );
    }

    // The end of the list, said quietly.
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: Text(
          'That is everything.',
          style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
        ),
      ),
    );
  }
}
