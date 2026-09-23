import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// A file the lawyer attached during registration.
class PickedDocument {
  const PickedDocument({required this.name, required this.bytes, this.path});

  final String name;
  final int bytes;
  final String? path;

  String get sizeLabel {
    final mb = bytes / (1024 * 1024);
    if (mb >= 1) return '${mb.toStringAsFixed(1)} MB';
    return '${(bytes / 1024).round()} KB';
  }
}

/// Upload row that actually opens the picker, enforces the size cap and shows
/// the chosen file with a way to remove it.
class UploadField extends StatefulWidget {
  const UploadField({
    super.key,
    required this.placeholder,
    required this.helper,
    required this.maxSizeMb,
    this.label,
    this.required = false,
    this.allowedExtensions = const ['png', 'jpg', 'jpeg'],
    this.onChanged,
    this.initialFile,
    this.correction,
    this.onPreview,
    this.readOnly = false,
  });

  /// Shows the attached file but does not allow changing it.
  final bool readOnly;

  /// Opens the attached file. The eye only appears when this is set.
  final ValueChanged<PickedDocument>? onPreview;

  /// Feedback from the admin review. Any value turns the row red; a non-empty
  /// one replaces the helper text underneath.
  final String? correction;

  /// A file uploaded earlier, shown until the lawyer picks a new one.
  final PickedDocument? initialFile;

  final String placeholder;
  final String helper;
  final double maxSizeMb;
  final String? label;
  final bool required;
  final List<String> allowedExtensions;
  final ValueChanged<PickedDocument?>? onChanged;

  @override
  State<UploadField> createState() => _UploadFieldState();
}

class _UploadFieldState extends State<UploadField> {
  late PickedDocument? _file = widget.initialFile;
  String? _error;

  Future<void> _pick() async {
    final picked = await FilePicker.pickFile(
      type: FileType.custom,
      allowedExtensions: widget.allowedExtensions,
    );
    if (picked == null) return;

    final size = await picked.length();
    final maxBytes = (widget.maxSizeMb * 1024 * 1024).round();

    if (size > maxBytes) {
      setState(() {
        _error = 'File is larger than ${widget.maxSizeMb} MB';
        _file = null;
      });
      widget.onChanged?.call(null);
      return;
    }

    final document = PickedDocument(
      name: picked.name,
      bytes: size,
      path: picked.uri.toString(),
    );

    setState(() {
      _file = document;
      _error = null;
    });
    widget.onChanged?.call(document);
  }

  void _clear() {
    setState(() {
      _file = null;
      _error = null;
    });
    widget.onChanged?.call(null);
  }

  bool get _flagged => widget.correction != null;

  @override
  Widget build(BuildContext context) {
    final file = _file;
    final note =
        _error ??
        (widget.correction?.isNotEmpty ?? false ? widget.correction : null);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.required ? '${widget.label}*' : widget.label!,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: _flagged ? AppColors.negative : AppColors.ink,
            ),
          ),
          const SizedBox(height: 6),
        ],

        InkWell(
          onTap: widget.readOnly ? null : _pick,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
            decoration: BoxDecoration(
              color: file == null ? AppColors.surface : AppColors.canvas,
              border: Border.all(
                color: _error != null || _flagged
                    ? AppColors.negative
                    : AppColors.line,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  file == null
                      ? Icons.cloud_upload_outlined
                      : Icons.insert_drive_file_outlined,
                  size: 16,
                  color: file == null
                      ? AppColors.inkSubtle
                      : AppColors.positive,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    file?.name ?? widget.placeholder,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: file == null ? AppColors.inkSubtle : AppColors.ink,
                    ),
                  ),
                ),
                if (file != null) ...[
                  if (widget.onPreview != null)
                    InkWell(
                      onTap: () => widget.onPreview!(file),
                      borderRadius: BorderRadius.circular(20),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(
                          Icons.visibility_outlined,
                          size: 17,
                          color: AppColors.brand,
                        ),
                      ),
                    ),
                  const SizedBox(width: 4),
                  Text(
                    file.sizeLabel,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.inkMuted,
                    ),
                  ),
                  const SizedBox(width: 4),
                  if (!widget.readOnly)
                    InkWell(
                      onTap: _clear,
                      borderRadius: BorderRadius.circular(20),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(
                          Icons.close,
                          size: 15,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ),

        const SizedBox(height: 4),
        Text(
          note ?? widget.helper,
          style: TextStyle(
            fontSize: 10,
            color: note != null ? AppColors.negative : AppColors.inkSubtle,
          ),
        ),
      ],
    );
  }
}
