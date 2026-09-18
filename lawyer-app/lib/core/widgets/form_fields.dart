import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';

/// Labelled text input used across the registration steps.
///
/// The error is shown once the field has been touched, so a fresh form never
/// opens covered in red.
class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.label,
    required this.hint,
    this.controller,
    this.keyboardType,
    this.enabled = true,
    this.required = false,
    this.helper,
    this.validator,
    this.maxLength,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
    this.correction,
  });

  /// Feedback from the admin review. Any value turns the field red; a
  /// non-empty one is also shown as the helper text underneath.
  final String? correction;

  final String label;
  final String hint;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool enabled;
  final bool required;
  final String? helper;

  /// Returns an error message, or null when the value is acceptable.
  final String? Function(String value)? validator;

  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  bool _touched = false;

  bool get _flagged => widget.correction != null;

  String? get _error {
    // The lawyer's own mistakes take priority over the admin's note.
    final validation = !_touched || widget.validator == null
        ? null
        : widget.validator!(widget.controller?.text ?? '');
    if (validation != null) return validation;

    final correction = widget.correction;
    return correction != null && correction.isNotEmpty ? correction : null;
  }

  @override
  Widget build(BuildContext context) {
    final error = _error;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _FieldLabel(
          label: widget.label,
          required: widget.required,
          flagged: _flagged,
        ),
        const SizedBox(height: 6),
        Focus(
          // Mark as touched on blur, so errors appear after the first attempt.
          onFocusChange: (hasFocus) {
            if (!hasFocus && !_touched) setState(() => _touched = true);
          },
          child: TextField(
            controller: widget.controller,
            keyboardType: widget.keyboardType,
            enabled: widget.enabled,
            maxLength: widget.maxLength,
            inputFormatters: widget.inputFormatters,
            textCapitalization: widget.textCapitalization,
            onChanged: (_) {
              if (_touched) setState(() {});
            },
            style: TextStyle(
              fontSize: 14,
              color: widget.enabled ? AppColors.ink : AppColors.inkMuted,
            ),
            decoration: _decoration(
              widget.hint,
              enabled: widget.enabled,
              hasError: error != null || _flagged,
            ),
          ),
        ),
        if (error != null || widget.helper != null) ...[
          const SizedBox(height: 4),
          Text(
            error ?? widget.helper!,
            style: TextStyle(
              fontSize: 10,
              color: error != null ? AppColors.negative : AppColors.inkSubtle,
            ),
          ),
        ],
      ],
    );
  }
}

/// Dropdown with the same chrome as [AppTextField].
class AppSelectField extends StatelessWidget {
  const AppSelectField({
    super.key,
    required this.label,
    required this.options,
    required this.value,
    required this.onChanged,
    this.required = false,
    this.correction,
  });

  final String label;
  final List<String> options;
  final String? value;

  /// Null disables the dropdown, e.g. a section approved by the admin.
  final ValueChanged<String?>? onChanged;

  final bool required;

  /// Feedback from the admin review; turns the field red.
  final String? correction;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _FieldLabel(
          label: label,
          required: required,
          flagged: correction != null,
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: value,
          isExpanded: true,
          hint: const Text(
            'Select',
            style: TextStyle(fontSize: 14, color: AppColors.inkSubtle),
          ),
          items: options
              .map(
                (option) => DropdownMenuItem(
                  value: option,
                  child: Text(option, style: const TextStyle(fontSize: 14)),
                ),
              )
              .toList(),
          onChanged: onChanged,
          decoration: _decoration(
            'Select',
            enabled: true,
            hasError: correction != null,
          ),
        ),
        if (correction != null && correction!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            correction!,
            style: const TextStyle(fontSize: 10, color: AppColors.negative),
          ),
        ],
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({
    required this.label,
    required this.required,
    this.flagged = false,
  });

  final String label;
  final bool required;

  /// Marked for correction by the admin review.
  final bool flagged;

  @override
  Widget build(BuildContext context) {
    return Text(
      required ? '$label*' : label,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: flagged ? AppColors.negative : AppColors.ink,
      ),
    );
  }
}

InputDecoration _decoration(
  String hint, {
  required bool enabled,
  required bool hasError,
}) {
  OutlineInputBorder border(Color color) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(8),
    borderSide: BorderSide(color: color),
  );

  final idle = hasError ? AppColors.negative : AppColors.line;

  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(fontSize: 14, color: AppColors.inkSubtle),
    filled: true,
    fillColor: enabled ? AppColors.surface : AppColors.canvas,
    isDense: true,
    counterText: '',
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    enabledBorder: border(idle),
    disabledBorder: border(AppColors.line),
    focusedBorder: border(hasError ? AppColors.negative : AppColors.brand),
  );
}

/// Uppercases as the user types — PAN and IFSC are stored in caps.
class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
