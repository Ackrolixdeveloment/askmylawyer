import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Tap-to-open multi select. Choices are made in a sheet and shown back as
/// chips, so a long list never crowds the form.
class MultiSelectField extends StatelessWidget {
  const MultiSelectField({
    super.key,
    required this.title,
    required this.options,
    required this.selected,
    required this.onChanged,
    this.placeholder = 'Select all that apply',
  });

  final String title;
  final List<String> options;
  final Set<String> selected;
  final ValueChanged<Set<String>> onChanged;
  final String placeholder;

  Future<void> _open(BuildContext context) async {
    final working = Set<String>.from(selected);

    final result = await showModalBottomSheet<Set<String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(sheetContext).pop(working),
                      child: const Text('Done'),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: options.map((option) {
                    final checked = working.contains(option);
                    return CheckboxListTile(
                      value: checked,
                      title: Text(option, style: const TextStyle(fontSize: 14)),
                      dense: true,
                      controlAffinity: ListTileControlAffinity.leading,
                      onChanged: (_) => setSheetState(() {
                        if (checked) {
                          working.remove(option);
                        } else {
                          working.add(option);
                        }
                      }),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );

    if (result != null) onChanged(result);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: () => _open(context),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    selected.isEmpty
                        ? placeholder
                        : '${selected.length} selected',
                    style: TextStyle(
                      fontSize: 14,
                      color: selected.isEmpty
                          ? AppColors.inkSubtle
                          : AppColors.ink,
                    ),
                  ),
                ),
                const Icon(
                  Icons.keyboard_arrow_down,
                  size: 20,
                  color: AppColors.inkMuted,
                ),
              ],
            ),
          ),
        ),
        if (selected.isNotEmpty) ...[
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: selected
                .map(
                  (item) => SelectionChip(
                    label: item,
                    onRemove: () => onChanged({...selected}..remove(item)),
                  ),
                )
                .toList(),
          ),
        ],
      ],
    );
  }
}

/// Dark pill used for a chosen language, category or specialisation.
class SelectionChip extends StatelessWidget {
  const SelectionChip({super.key, required this.label, this.onRemove});

  final String label;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 12, right: 8, top: 6, bottom: 6),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
          if (onRemove != null) ...[
            const SizedBox(width: 4),
            InkWell(
              onTap: onRemove,
              borderRadius: BorderRadius.circular(20),
              child: const Icon(Icons.close, size: 14, color: Colors.white70),
            ),
          ],
        ],
      ),
    );
  }
}
