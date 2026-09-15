import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'raise_ticket_screen.dart';
import 'support_data.dart';
import 'ticket_detail_screen.dart';

/// Help centre: search, common topics, the lawyer's own tickets and FAQs.
class HelpFaqScreen extends StatefulWidget {
  const HelpFaqScreen({super.key});

  @override
  State<HelpFaqScreen> createState() => _HelpFaqScreenState();
}

class _HelpFaqScreenState extends State<HelpFaqScreen> {
  final _search = TextEditingController();

  /// Index of the open FAQ, or null when all are collapsed.
  int? _openFaq;

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

  List<FaqEntry> get _visibleFaqs {
    final query = _search.text.trim().toLowerCase();
    if (query.isEmpty) return faqEntries;

    return faqEntries
        .where((faq) => faq.question.toLowerCase().contains(query))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final faqs = _visibleFaqs;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
          children: [
            Row(
              children: [
                InkWell(
                  onTap: () => Navigator.of(context).maybePop(),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.line),
                    ),
                    child: const Icon(
                      Icons.arrow_back,
                      size: 18,
                      color: AppColors.ink,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'How can we help today?',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _search,
              style: const TextStyle(fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search FAQs or ticket topics...',
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
            const SizedBox(height: 18),

            const _SectionTitle('Quick Help'),
            const SizedBox(height: 10),
            // Two per row, matching the design's grid.
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.9,
              children: [
                for (final topic in _quickCards)
                  _QuickCard(
                    icon: topic.icon,
                    label: topic.label,
                    // Opens the form with this category already chosen.
                    onTap: () => _openTicketForm(context, topic.label),
                  ),
              ],
            ),
            const SizedBox(height: 18),

            Row(
              children: [
                const Expanded(child: _SectionTitle('My Requests')),
                if (supportTickets.isNotEmpty)
                  const Text(
                    'View All',
                    style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            if (supportTickets.isEmpty)
              const _NoTickets()
            else
              for (final ticket in supportTickets) _TicketCard(ticket: ticket),
            const SizedBox(height: 8),

            Row(
              children: [
                const Expanded(
                  child: _SectionTitle('Frequently Asked Questions'),
                ),
                const Text(
                  'View All',
                  style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (faqs.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'No questions match your search.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    for (var i = 0; i < faqs.length; i++) ...[
                      if (i > 0)
                        const Divider(
                          height: 1,
                          thickness: 1,
                          color: AppColors.line,
                        ),
                      _FaqRow(
                        entry: faqs[i],
                        expanded: _openFaq == i,
                        // Only one answer stays open at a time.
                        onTap: () =>
                            setState(() => _openFaq = _openFaq == i ? null : i),
                      ),
                    ],
                  ],
                ),
              ),
            const SizedBox(height: 18),

            const _NeedHelpCard(),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}

/// The Quick Help grid, paired with the category each card pre-selects.
const _quickCards = [
  (icon: Icons.calendar_today_outlined, label: 'Booking Issues'),
  (icon: Icons.credit_card, label: 'Payments'),
  (icon: Icons.balance, label: 'Consultation Issues'),
  (icon: Icons.person_outline, label: 'Account Issues'),
];

void _openTicketForm(BuildContext context, String? category) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => RaiseTicketScreen(category: category),
    ),
  );
}

class _QuickCard extends StatelessWidget {
  const _QuickCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: AppColors.ink),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppColors.ink),
            ),
          ],
        ),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final open = ticket.state == TicketState.open;

    return InkWell(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => TicketDetailScreen(ticket: ticket),
        ),
      ),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.chat_bubble_outline,
                  size: 17,
                  color: AppColors.inkMuted,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ticket.subject,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        ticket.id,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.inkSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  open ? 'Open' : 'Resolved',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: open ? AppColors.positive : AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.ink,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    ticket.category,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  ticket.updated,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _NoTickets extends StatelessWidget {
  const _NoTickets();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Column(
        children: [
          Icon(Icons.chat_bubble_outline, size: 34, color: AppColors.inkSubtle),
          SizedBox(height: 10),
          Text(
            'No requests yet',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Tickets you raise will appear here.',
            style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
          ),
        ],
      ),
    );
  }
}

class _FaqRow extends StatelessWidget {
  const _FaqRow({
    required this.entry,
    required this.expanded,
    required this.onTap,
  });

  final FaqEntry entry;
  final bool expanded;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    entry.question,
                    style: const TextStyle(fontSize: 13, color: AppColors.ink),
                  ),
                ),
                Icon(
                  expanded ? Icons.expand_less : Icons.expand_more,
                  size: 18,
                  color: AppColors.inkSubtle,
                ),
              ],
            ),
            if (expanded) ...[
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  entry.answer,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.5,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NeedHelpCard extends StatelessWidget {
  const _NeedHelpCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Need more help?',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Our team is here Monday-Friday,\n9am-6pm ESR',
                  style: TextStyle(
                    fontSize: 10,
                    height: 1.5,
                    color: Color(0xFFB6C0D4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          InkWell(
            // No category preselected when starting from scratch.
            onTap: () => _openTicketForm(context, null),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add, size: 15, color: AppColors.ink),
                  SizedBox(width: 6),
                  Text(
                    'Create ticket',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
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
