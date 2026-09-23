import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'profile_data.dart';

/// Bottom sheet for editing one profile section. Free-text sections get a
/// textarea; the rest get a list of choices.
class ProfileEditSheet extends StatefulWidget {
  const ProfileEditSheet({
    super.key,
    required this.section,
    required this.data,
  });

  final ProfileSection section;
  final ProfileData data;

  /// Returns true when changes were saved.
  static Future<bool> show(
    BuildContext context, {
    required ProfileSection section,
    required ProfileData data,
  }) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      // The text field needs room above the keyboard.
      isScrollControlled: true,
      builder: (_) => ProfileEditSheet(section: section, data: data),
    );
    return saved ?? false;
  }

  @override
  State<ProfileEditSheet> createState() => _ProfileEditSheetState();
}

class _ProfileEditSheetState extends State<ProfileEditSheet> {
  late final TextEditingController _text = TextEditingController(
    text: widget.data.textFor(widget.section),
  );

  /// A working copy, so closing without saving leaves the profile untouched.
  late final Set<String> _selection = {
    ...widget.data.selectionFor(widget.section),
  };

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  /// Anything already saved stays visible, even if it predates the current
  /// list of choices.
  List<String> get _options => [
    ...widget.section.options,
    ..._selection.where((value) => !widget.section.options.contains(value)),
  ];

  void _save() {
    if (widget.section.isFreeText) {
      widget.data.setText(widget.section, _text.text.trim());
    } else {
      widget.data.setSelection(widget.section, _selection);
    }
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final section = widget.section;

    return Padding(
      // Lifts the sheet clear of the keyboard.
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Edit ${section.label}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: () => Navigator.of(context).pop(false),
                      borderRadius: BorderRadius.circular(20),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(
                          Icons.close,
                          size: 18,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                if (section.isFreeText)
                  TextField(
                    controller: _text,
                    maxLines: 6,
                    minLines: 4,
                    autofocus: true,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: AppColors.ink,
                    ),
                    decoration: InputDecoration(
                      hintText: section.hint,
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
                  )
                else ...[
                  // Tap to toggle; chosen values read back as dark pills.
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final option in _options)
                        _OptionChip(
                          label: option,
                          selected: _selection.contains(option),
                          onTap: () => setState(() {
                            // One band only for experience; the rest toggle.
                            if (widget.section.isSingleChoice) {
                              _selection
                                ..clear()
                                ..add(option);
                              return;
                            }
                            if (!_selection.remove(option)) {
                              _selection.add(option);
                            }
                          }),
                        ),
                    ],
                  ),
                ],
                const SizedBox(height: 18),

                SizedBox(
                  height: 48,
                  child: FilledButton(
                    onPressed: _save,
                    child: const Text('Save Changes'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OptionChip extends StatelessWidget {
  const _OptionChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : AppColors.canvas,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: selected ? Colors.white : AppColors.inkMuted,
          ),
        ),
      ),
    );
  }
}
