import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';

/// Segmented code entry. Typing advances, backspace on an empty box steps back.
class OtpInput extends StatefulWidget {
  const OtpInput({
    super.key,
    required this.onChanged,
    this.length = 6,
    this.filled = false,
  });

  final ValueChanged<String> onChanged;
  final int length;

  /// Grey boxes (email flow) instead of outlined ones (mobile flow).
  final bool filled;

  @override
  State<OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends State<OtpInput> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _nodes;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(widget.length, (_) => TextEditingController());
    _nodes = List.generate(widget.length, (_) => FocusNode());
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _nodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();

  void _handleChanged(int index, String value) {
    if (value.isNotEmpty && index < widget.length - 1) {
      _nodes[index + 1].requestFocus();
    }
    widget.onChanged(_code);
    setState(() {});
  }

  KeyEventResult _handleKey(int index, KeyEvent event) {
    final isBackspace =
        event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace;

    if (isBackspace && _controllers[index].text.isEmpty && index > 0) {
      _controllers[index - 1].clear();
      _nodes[index - 1].requestFocus();
      widget.onChanged(_code);
      setState(() {});
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(widget.length, (index) {
        final focused = _nodes[index].hasFocus;

        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: index == widget.length - 1 ? 0 : 8),
            child: Focus(
              onKeyEvent: (_, event) => _handleKey(index, event),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: widget.filled ? AppColors.canvas : AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: focused ? AppColors.ink : AppColors.line,
                    width: focused ? 1.5 : 1,
                  ),
                ),
                alignment: Alignment.center,
                child: TextField(
                  controller: _controllers[index],
                  focusNode: _nodes[index],
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  maxLength: 1,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                  decoration: const InputDecoration(
                    counterText: '',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                  onChanged: (value) => _handleChanged(index, value),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
