import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'raise_ticket_screen.dart';
import 'support_data.dart';
import 'ticket_detail_screen.dart';

/// Help & FAQ: ticket counts, the customer's tickets, and the questions
/// asked most often.
class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _search = TextEditingController();

  // TODO: load tickets from the backend instead of the sample list.
  final List<SupportTicket> _tickets = List.of(supportSample);

  TicketStatus? _status;
  TicketCategory? _category;

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  int get _open =>
      _tickets.where((t) => t.status != TicketStatus.resolved).length;

  int get _resolved =>
      _tickets.where((t) => t.status == TicketStatus.resolved).length;

  List<SupportTicket> get _visible {
    final query = _search.text.trim().toLowerCase();

    return _tickets.where((ticket) {
      final matchesQuery =
          query.isEmpty ||
          ticket.title.toLowerCase().contains(query) ||
          ticket.id.toLowerCase().contains(query);

      return matchesQuery &&
          (_status == null || ticket.status == _status) &&
          (_category == null || ticket.category == _category);
    }).toList();
  }

  Future<void> _raiseTicket() async {
    // Stays on this navigator so the bottom nav remains visible; the form
    // keeps Submit clear of it with its own bottom bar.
    final ticket = await Navigator.of(context).push<SupportTicket>(
      MaterialPageRoute(
        // Ids run on from the sample set so they stay unique without a
        // backend to allocate them.
        builder: (_) => RaiseTicketScreen(
          nextId: 'TKT-${4799 + _tickets.length}',
        ),
      ),
    );

    if (ticket == null || !mounted) return;
    setState(() => _tickets.insert(0, ticket));
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visible;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          color: AppColors.ink,
        ),
        title: const Text(
          'Support Ticket',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: FilledButton.icon(
              onPressed: _raiseTicket,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              icon: const Icon(Icons.add_circle_outline, size: 15),
              label: const Text('Raise Ticket'),
            ),
          ),
        ],
      ),
      body: ListView(
        // Room for the shell's floating nav, which paints over this route.
        padding: EdgeInsets.fromLTRB(14, 0, 14, 24 + shellNavHeight(context)),
        children: [
          const _NeedHelpBanner(),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _StatTile(value: _tickets.length, label: 'Total Tickets'),
              ),
              const SizedBox(width: 10),
              Expanded(child: _StatTile(value: _open, label: 'Open')),
              const SizedBox(width: 10),
              Expanded(child: _StatTile(value: _resolved, label: 'Resolved')),
            ],
          ),
          const SizedBox(height: 14),

          _SearchRow(
            controller: _search,
            onFilter: _showFilterSheet,
            filtered: _status != null || _category != null,
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _FilterDropdown<TicketStatus>(
                  hint: 'All Status',
                  value: _status,
                  items: {
                    for (final status in TicketStatus.values)
                      status: status.label,
                  },
                  onChanged: (value) => setState(() => _status = value),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _FilterDropdown<TicketCategory>(
                  hint: 'All Categories',
                  value: _category,
                  items: {
                    for (final category in TicketCategory.values)
                      category: category.label,
                  },
                  onChanged: (value) => setState(() => _category = value),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          const _SectionTitle('My Tickets'),
          const SizedBox(height: 10),

          if (visible.isEmpty)
            const _EmptyTickets()
          else
            for (final ticket in visible) ...[
              _TicketCard(
                ticket: ticket,
                onTap: () => _openTicket(ticket),
              ),
              const SizedBox(height: 10),
            ],

          const SizedBox(height: 10),
          const _SectionTitle('Popular Questions'),
          const SizedBox(height: 10),
          const _FaqList(),
        ],
      ),
    );
  }

  Future<void> _openTicket(SupportTicket ticket) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => TicketDetailScreen(ticket: ticket),
      ),
    );
    // A reply mutates the ticket in place, so repaint the card's timestamp.
    if (mounted) setState(() {});
  }

  Future<void> _showFilterSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      useRootNavigator: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Filter tickets',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () {
                  setState(() {
                    _status = null;
                    _category = null;
                  });
                  Navigator.of(sheetContext).pop();
                },
                child: const Text('Clear all filters'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NeedHelpBanner extends StatelessWidget {
  const _NeedHelpBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Need help?',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Our team is here Monday-Friday, 9am-6pm ESR',
            style: TextStyle(fontSize: 12, color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.value, required this.label});

  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$value',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.inkSubtle),
          ),
        ],
      ),
    );
  }
}

class _SearchRow extends StatelessWidget {
  const _SearchRow({
    required this.controller,
    required this.onFilter,
    required this.filtered,
  });

  final TextEditingController controller;
  final VoidCallback onFilter;

  /// Tints the filter button while a filter is narrowing the list.
  final bool filtered;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: controller,
            style: const TextStyle(fontSize: 13, color: AppColors.ink),
            decoration: InputDecoration(
              hintText: 'Search by client name or booking ID...',
              hintStyle: const TextStyle(
                fontSize: 13,
                color: AppColors.inkSubtle,
              ),
              prefixIcon: const Icon(
                Icons.search,
                size: 18,
                color: AppColors.inkSubtle,
              ),
              filled: true,
              fillColor: AppColors.surface,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.line),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.brand),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        InkWell(
          onTap: onFilter,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            width: 46,
            height: 46,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: filtered ? AppColors.brand : AppColors.ink,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.filter_list,
              size: 18,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}

/// Dropdown that shows a hint while nothing is chosen, so it reads as
/// "All Status" rather than an empty box.
class _FilterDropdown<T> extends StatelessWidget {
  const _FilterDropdown({
    required this.hint,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String hint;
  final T? value;
  final Map<T, String> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T?>(
          value: value,
          isExpanded: true,
          borderRadius: BorderRadius.circular(10),
          icon: const Icon(
            Icons.keyboard_arrow_down,
            size: 18,
            color: AppColors.inkMuted,
          ),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontSize: 12,
            color: AppColors.ink,
          ),
          items: [
            DropdownMenuItem<T?>(value: null, child: Text(hint)),
            for (final entry in items.entries)
              DropdownMenuItem<T?>(
                value: entry.key,
                child: Text(entry.value),
              ),
          ],
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket, required this.onTap});

  final SupportTicket ticket;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      ticket.id,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ),
                  StatusPill(status: ticket.status),
                ],
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: Text(
                      ticket.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.ink,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      ticket.category.label,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Last updated ${ticket.lastUpdatedLabel}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ),
                  const Icon(
                    Icons.calendar_today_outlined,
                    size: 12,
                    color: AppColors.inkSubtle,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    ticket.createdOn.split(' ').first,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              Text(
                ticket.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  color: AppColors.inkMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyTickets extends StatelessWidget {
  const _EmptyTickets();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.confirmation_number_outlined,
            size: 26,
            color: AppColors.inkSubtle,
          ),
          SizedBox(height: 10),
          Text(
            'No tickets to show',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.inkMuted,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Raise a ticket and the team will get back to you.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
          ),
        ],
      ),
    );
  }
}

/// Collapsible FAQ list.
class _FaqList extends StatefulWidget {
  const _FaqList();

  @override
  State<_FaqList> createState() => _FaqListState();
}

class _FaqListState extends State<_FaqList> {
  /// Index of the open question, or null while all are collapsed.
  int? _open;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < faqEntries.length; i++) ...[
          _FaqTile(
            entry: faqEntries[i],
            open: _open == i,
            onTap: () => setState(() => _open = _open == i ? null : i),
          ),
          if (i != faqEntries.length - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _FaqTile extends StatelessWidget {
  const _FaqTile({
    required this.entry,
    required this.open,
    required this.onTap,
  });

  final FaqEntry entry;
  final bool open;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      entry.question,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  Icon(
                    open ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    size: 20,
                    color: AppColors.inkMuted,
                  ),
                ],
              ),
              if (open) ...[
                const SizedBox(height: 10),
                Text(
                  entry.answer,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.55,
                    color: AppColors.inkMuted,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
