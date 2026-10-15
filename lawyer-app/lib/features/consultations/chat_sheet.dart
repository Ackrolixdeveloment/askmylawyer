import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import 'consultation_repository.dart';

/// The chat inside a call.
///
/// Opened as a sheet over the call so the video keeps running behind it —
/// people type while they are still talking, which is the whole point.
class ChatSheet extends StatefulWidget {
  const ChatSheet({
    super.key,
    required this.consultationId,
    required this.mine,
    required this.otherName,
  });

  final String consultationId;

  /// "customer" or "lawyer": which side of the thread is ours.
  final String mine;

  /// Who is on the other end, for the empty state.
  final String otherName;

  /// Returns how many messages the thread ended on, so the call screen can
  /// keep its badge in step.
  static Future<int?> open(
    BuildContext context, {
    required String consultationId,
    required String mine,
    required String otherName,
  }) {
    return showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChatSheet(
        consultationId: consultationId,
        mine: mine,
        otherName: otherName,
      ),
    );
  }

  @override
  State<ChatSheet> createState() => _ChatSheetState();
}

class _ChatSheetState extends State<ChatSheet> {
  /// Brisk while the panel is open; the call screen polls far slower.
  static const _pollEvery = Duration(seconds: 2);

  final _consultations = ConsultationRepository.instance;
  final _input = TextEditingController();
  final _scroll = ScrollController();

  final _messages = <ChatMessage>[];
  Timer? _poll;
  bool _sending = false;
  bool _loaded = false;
  String? _problem;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(_pollEvery, (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      // Only what is new, so an open panel is cheap to keep current.
      final fresh = await _consultations.messages(
        widget.consultationId,
        after: _messages.isEmpty ? null : _messages.last.id,
      );
      if (!mounted) return;

      setState(() {
        _messages.addAll(fresh);
        _loaded = true;
        _problem = null;
      });
      if (fresh.isNotEmpty) _toBottom();
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    }
  }

  Future<void> _send() async {
    final body = _input.text.trim();
    if (body.isEmpty || _sending) return;

    setState(() => _sending = true);

    try {
      final sent = await _consultations.sendMessage(
        widget.consultationId,
        body,
      );
      if (!mounted) return;

      _input.clear();
      setState(() => _messages.add(sent));
      _toBottom();
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _toBottom() {
    // After the frame, so the new row has been laid out.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final inset = MediaQuery.of(context).viewInsets.bottom;

    return PopScope(
      onPopInvokedWithResult: (_, _) {},
      child: Padding(
        // Lifts the whole sheet above the keyboard.
        padding: EdgeInsets.only(bottom: inset),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
          ),
          child: Column(
            children: [
              _handle(),
              Expanded(child: _thread()),
              if (_problem != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                  child: Text(
                    _problem!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.negative,
                    ),
                  ),
                ),
              _composer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _handle() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 8, 6),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Chat',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
          ),
          IconButton(
            onPressed: () => Navigator.of(context).pop(_messages.length),
            icon: const Icon(Icons.close, size: 20),
            color: AppColors.inkMuted,
          ),
        ],
      ),
    );
  }

  Widget _thread() {
    if (!_loaded) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: Text(
            'Anything typed here stays with the consultation, so it is a '
            'good place for names, dates and case numbers.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              height: 1.5,
              color: AppColors.inkSubtle,
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 10),
      itemCount: _messages.length,
      itemBuilder: (_, index) {
        final message = _messages[index];
        return _Bubble(
          message: message,
          fromMe: message.senderRole == widget.mine,
        );
      },
    );
  }

  Widget _composer() {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.line)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: _input,
                minLines: 1,
                maxLines: 4,
                maxLength: 2000,
                textCapitalization: TextCapitalization.sentences,
                onSubmitted: (_) => _send(),
                style: const TextStyle(fontSize: 14, color: AppColors.ink),
                decoration: InputDecoration(
                  hintText: 'Type a message',
                  hintStyle: const TextStyle(
                    fontSize: 14,
                    color: AppColors.inkSubtle,
                  ),
                  counterText: '',
                  filled: true,
                  fillColor: AppColors.canvas,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 11,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _sending ? null : _send,
              child: Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: _sending ? AppColors.inkSubtle : AppColors.ink,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.send, size: 18, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.fromMe});

  final ChatMessage message;
  final bool fromMe;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: fromMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.fromLTRB(13, 9, 13, 7),
        decoration: BoxDecoration(
          color: fromMe ? AppColors.ink : AppColors.surface,
          borderRadius: BorderRadius.circular(14).subtract(
            BorderRadius.only(
              bottomRight: Radius.circular(fromMe ? 10 : 0),
              bottomLeft: Radius.circular(fromMe ? 0 : 10),
            ),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.body,
              style: TextStyle(
                fontSize: 14,
                height: 1.35,
                color: fromMe ? Colors.white : AppColors.ink,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              message.timeLabel,
              style: TextStyle(
                fontSize: 10,
                color: fromMe ? Colors.white60 : AppColors.inkSubtle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
