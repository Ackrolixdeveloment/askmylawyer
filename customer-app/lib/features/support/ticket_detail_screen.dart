import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'support_data.dart';

/// A single ticket: its status, the issue as raised, any attachments, and
/// the conversation with the support team.
class TicketDetailScreen extends StatefulWidget {
  const TicketDetailScreen({super.key, required this.ticket});

  final SupportTicket ticket;

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  Future<void> _reply() async {
    final message = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useRootNavigator: true,
      builder: (_) => const _ReplySheet(),
    );

    if (message == null || !mounted) return;

    setState(() {
      // TODO: post the reply to the backend and re-read the thread.
      widget.ticket.conversation.add(
        TicketMessage(
          body: message,
          timestamp: widget.ticket.lastUpdated,
          fromSupport: false,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final ticket = widget.ticket;
    // Read before removePadding below, which would zero the inset this
    // height depends on.
    final navHeight = shellNavHeight(context);

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
          'Ticket Details',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
      ),
      // Reply sits in the bar slot so the shell's floating nav cannot cover
      // it; the thread scrolls above. The Scaffold would add the device
      // inset again on top of navHeight, which already counts it.
      bottomNavigationBar: MediaQuery.removePadding(
        context: context,
        removeBottom: true,
        child: Padding(
          padding: EdgeInsets.fromLTRB(14, 8, 14, 12 + navHeight),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _reply,
              icon: const Icon(Icons.chat_bubble_outline, size: 16),
              label: const Text('Reply to Ticket'),
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 6, 14, 20),
        children: [
          _Card(child: _TicketHead(ticket: ticket)),
          const SizedBox(height: 12),

          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const _CardLabel('Issue description'),
                const SizedBox(height: 8),
                Text(
                  ticket.description,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.5,
                    color: AppColors.inkMuted,
                  ),
                ),

                if (ticket.attachments.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  _CardLabel('Attachment (${ticket.attachments.length})'),
                  const SizedBox(height: 10),
                  for (final file in ticket.attachments) ...[
                    _AttachmentRow(attachment: file),
                    if (file != ticket.attachments.last)
                      const SizedBox(height: 10),
                  ],
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),

          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const _CardLabel('Conversation'),
                const SizedBox(height: 12),
                for (final message in ticket.conversation) ...[
                  _MessageRow(message: message),
                  if (message != ticket.conversation.last)
                    const SizedBox(height: 12),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

        ],
      ),
    );
  }
}

/// Ticket id, status, title, category and the two timestamps.
class _TicketHead extends StatelessWidget {
  const _TicketHead({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Expanded(child: _CardLabel('TICKET ID')),
            const Text(
              'STATUS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.4,
                color: AppColors.inkSubtle,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: Text(
                ticket.id,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
            ),
            StatusPill(status: ticket.status),
          ],
        ),
        const SizedBox(height: 12),

        Text(
          ticket.title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            height: 1.4,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 10),
        Align(
          alignment: Alignment.centerLeft,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
        ),
        const SizedBox(height: 16),
        const Divider(color: AppColors.line, height: 1),
        const SizedBox(height: 14),

        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _Stamp(label: 'CREATED ON', value: ticket.createdOn)),
            Expanded(
              child: _Stamp(label: 'LAST UPDATED', value: ticket.lastUpdated),
            ),
          ],
        ),
      ],
    );
  }
}

class _Stamp extends StatelessWidget {
  const _Stamp({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.4,
            color: AppColors.inkSubtle,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.ink,
          ),
        ),
      ],
    );
  }
}

class _AttachmentRow extends StatelessWidget {
  const _AttachmentRow({required this.attachment});

  final TicketAttachment attachment;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.insert_drive_file_outlined,
            size: 18,
            color: AppColors.inkMuted,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  attachment.name,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  attachment.size,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          // TODO: download the file once attachments are served.
          const Icon(
            Icons.file_download_outlined,
            size: 18,
            color: AppColors.inkMuted,
          ),
        ],
      ),
    );
  }
}

/// One conversation entry: avatar, who wrote it, body and timestamp.
class _MessageRow extends StatelessWidget {
  const _MessageRow({required this.message});

  final TicketMessage message;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: AppColors.ink,
            shape: BoxShape.circle,
          ),
          child: Icon(
            message.fromSupport
                ? Icons.headset_mic_outlined
                : Icons.person_outline,
            size: 15,
            color: Colors.white,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.fromSupport
                      ? 'Support team replied'
                      : 'You created this ticket',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message.body,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.5,
                    color: AppColors.inkMuted,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  message.timestamp,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Composer for a reply, opened from the button at the foot of the screen.
class _ReplySheet extends StatefulWidget {
  const _ReplySheet();

  @override
  State<_ReplySheet> createState() => _ReplySheetState();
}

class _ReplySheetState extends State<_ReplySheet> {
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final inset = media.viewInsets.bottom;
    // Clears the gesture-nav home indicator, but only when the keyboard is
    // down — the inset above already handles it otherwise.
    final safeBottom = inset > 0 ? 0.0 : media.padding.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: inset),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        padding: EdgeInsets.fromLTRB(20, 18, 20, 20 + safeBottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Reply to Ticket',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, size: 20),
                  color: AppColors.inkMuted,
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _controller,
              maxLines: 5,
              minLines: 4,
              autofocus: true,
              textCapitalization: TextCapitalization.sentences,
              style: const TextStyle(fontSize: 13, color: AppColors.ink),
              decoration: InputDecoration(
                hintText: 'Type your reply…',
                hintStyle: const TextStyle(
                  fontSize: 13,
                  color: AppColors.inkSubtle,
                ),
                filled: true,
                fillColor: AppColors.canvas,
                contentPadding: const EdgeInsets.all(12),
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
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _controller.text.trim().isEmpty
                  ? null
                  : () => Navigator.of(context).pop(_controller.text.trim()),
              child: const Text('Send Reply'),
            ),
          ],
        ),
      ),
    );
  }
}

/// White card the detail sections sit in.
class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: child,
    );
  }
}

class _CardLabel extends StatelessWidget {
  const _CardLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}

/// Status pill, shared with the list card.
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.status});

  final TicketStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: status.wash,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: status.tint,
        ),
      ),
    );
  }
}
