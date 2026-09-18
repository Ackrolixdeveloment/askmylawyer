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
    this.optionalNote,
    this.helper,
    this.validator,
    this.maxLength,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
  });

  final String label;
  final String hint;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool enabled;
  final bool required;

  /// Grey note shown at the end of the label row, e.g. "(Optional)".
  final String? optionalNote;

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

  String? get _error {
    if (!_touched || widget.validator == null) return null;
    return widget.validator!(widget.controller?.text ?? '');
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
          optionalNote: widget.optionalNote,
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
              hasError: error != null,
            ),
          ),
        ),
        if (error != null || widget.helper != null) ...[
          const SizedBox(height: 4),
          Text(
            error ?? widget.helper!,
            style: TextStyle(
              fontSize: 12,
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
  });

  final String label;
  final List<String> options;
  final String? value;
  final ValueChanged<String?> onChanged;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _FieldLabel(label: label, required: required),
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
          decoration: _decoration('Select', enabled: true, hasError: false),
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({
    required this.label,
    required this.required,
    this.optionalNote,
  });

  final String label;
  final bool required;
  final String? optionalNote;

  @override
  Widget build(BuildContext context) {
    final text = Text(
      required ? '$label*' : label,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.ink,
      ),
    );

    final note = optionalNote;
    if (note == null) return text;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        text,
        Text(
          note,
          style: const TextStyle(fontSize: 12, color: AppColors.inkSubtle),
        ),
      ],
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
