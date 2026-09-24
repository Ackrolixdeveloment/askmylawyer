import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';

/// Segmented code entry.
///
/// The boxes are painted from a single hidden field rather than being six
/// separate ones. iOS never sends a key event for backspace on an empty
/// field — and certainly not while the key auto-repeats — so with a field
/// per box, holding delete cleared nothing. With one field there is real
/// text to delete, and pasting or autofilling a whole code works too.
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
  final _controller = TextEditingController();
  final _node = FocusNode();

  @override
  void initState() {
    super.initState();
    _node.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    _node.dispose();
    super.dispose();
  }

  String get _code => _controller.text;

  void _handleChanged(String value) {
    widget.onChanged(value);
    setState(() {});
  }

  /// The box the next digit goes into.
  int get _activeIndex =>
      _code.length >= widget.length ? widget.length - 1 : _code.length;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Off-screen but focusable: it owns the keyboard and the text.
        Positioned(
          width: 1,
          height: 1,
          left: 0,
          top: 0,
          child: Opacity(
            opacity: 0,
            child: TextField(
              controller: _controller,
              focusNode: _node,
              keyboardType: TextInputType.number,
              maxLength: widget.length,
              autocorrect: false,
              enableSuggestions: false,
              autofillHints: const [AutofillHints.oneTimeCode],
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(counterText: ''),
              onChanged: _handleChanged,
            ),
          ),
        ),

        GestureDetector(
          onTap: () {
            _node.requestFocus();
            // Typing always continues at the end, wherever they tapped.
            _controller.selection = TextSelection.collapsed(
              offset: _code.length,
            );
          },
          behavior: HitTestBehavior.opaque,
          child: Row(
            children: List.generate(widget.length, (index) {
              final digit = index < _code.length ? _code[index] : '';
              final focused = _node.hasFocus && index == _activeIndex;

              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: index == widget.length - 1 ? 0 : 8,
                  ),
                  child: Container(
                    height: 48,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: widget.filled ? AppColors.canvas : AppColors.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: focused ? AppColors.ink : AppColors.line,
                        width: focused ? 1.5 : 1,
                      ),
                    ),
                    child: Text(
                      digit,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}
