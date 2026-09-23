import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/upload_field.dart';
import '../document_preview.dart';
import '../registration_repository.dart';

/// Step 2 — DigiLocker first, with a manual fallback when it fails.
class KycStep extends StatefulWidget {
  const KycStep({super.key, required this.onChanged, this.initial});

  /// Reports the step's data when complete, or null while something is
  /// missing. Stays null on the DigiLocker intro, which has nothing to
  /// submit yet.
  final ValueChanged<KycInput?> onChanged;

  /// What was saved before, to prefill the form.
  final RegistrationSnapshot? initial;

  @override
  State<KycStep> createState() => _KycStepState();
}

class _KycStepState extends State<KycStep> {
  /// Details were entered by hand before, so reopen the manual form.
  late bool _manual = widget.initial?.panNumber != null;

  // The Aadhaar number is stored encrypted and never sent back. Leaving the
  // field blank keeps whatever is on file.
  final _aadhaar = TextEditingController();

  String? get _savedAadhaar => widget.initial?.aadhaarNumberMasked;
  late final _pan = TextEditingController(text: widget.initial?.panNumber);
  late final _address = TextEditingController(
    text: widget.initial?.residentialAddress,
  );

  late PickedDocument? _aadhaarFile = widget.initial?.aadhaarFile?.toPicked();
  late PickedDocument? _panFile = widget.initial?.panFile?.toPicked();

  @override
  void initState() {
    super.initState();
    for (final controller in [_aadhaar, _pan, _address]) {
      controller.addListener(_report);
    }
    _report();
  }

  /// Pushes the data up after the frame, so the parent can rebuild safely.
  void _report() {
    if (mounted) setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onChanged(
        _manual && _isValid
            ? KycInput(
                aadhaarNumber: _aadhaar.text.trim().isEmpty
                    ? null
                    : _aadhaar.text.replaceAll(' ', ''),
                panNumber: _pan.text.trim().toUpperCase(),
                residentialAddress: _address.text.trim(),
                aadhaarFile: _aadhaarFile!,
                panFile: _panFile!,
              )
            : null,
      );
    });
  }

  @override
  void dispose() {
    _aadhaar.dispose();
    _pan.dispose();
    _address.dispose();
    super.dispose();
  }

  /// A blank Aadhaar is fine once one is stored.
  bool get _aadhaarReady => _aadhaar.text.trim().isEmpty
      ? _savedAadhaar != null
      : Validators.aadhaar(_aadhaar.text) == null;

  // Both the numbers and their scans are required before moving on.
  bool get _isValid =>
      _aadhaarReady &&
      Validators.pan(_pan.text) == null &&
      _aadhaarFile != null &&
      _panFile != null;

  /// Approved documents are read-only while the rest is corrected.
  bool get _aadhaarEditable =>
      widget.initial?.canEditSection('Aadhar Card') ?? true;
  bool get _panEditable => widget.initial?.canEditSection('PAN Card') ?? true;

  @override
  Widget build(BuildContext context) {
    return _manual ? _manualForm() : _digiLockerIntro();
  }

  Widget _digiLockerIntro() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 32),
        const Icon(Icons.badge_outlined, size: 72, color: AppColors.inkSubtle),
        const SizedBox(height: 24),
        const Text(
          'Verify Your Identity',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Verify your Aadhaar and PAN details securely through DigiLocker.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            height: 1.5,
            color: AppColors.inkMuted,
          ),
        ),
        const SizedBox(height: 28),

        FilledButton.icon(
          // TODO: open the DigiLocker consent flow.
          onPressed: () {},
          icon: const Icon(Icons.description_outlined, size: 18),
          label: const Text('Verify with DigiLocker'),
        ),
        const SizedBox(height: 16),

        const Row(
          children: [
            Expanded(child: Divider(color: AppColors.line)),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'or',
                style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
              ),
            ),
            Expanded(child: Divider(color: AppColors.line)),
          ],
        ),
        const SizedBox(height: 16),

        SizedBox(
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () {
              setState(() => _manual = true);
              _report();
            },
            icon: const Icon(Icons.edit_outlined, size: 18),
            label: const Text('Enter Details Manually'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.ink,
              side: const BorderSide(color: AppColors.line),
              // Font and size come from the theme's outlined-button style.
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),

        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline, size: 13, color: AppColors.inkSubtle),
            SizedBox(width: 6),
            Flexible(
              child: Text(
                'Your information is secure and used only for verification.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _manualForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppTextField(
          label: 'Aadhar Card',
          hint: 'Enter Aadhar Number*',
          controller: _aadhaar,
          keyboardType: TextInputType.number,
          required: true,
          maxLength: 12,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          enabled: _aadhaarEditable,
          helper: _savedAadhaar == null
              ? null
              : _aadhaarEditable
              ? 'Saved: $_savedAadhaar · leave blank to keep it'
              : 'Saved: $_savedAadhaar · approved by our team',
          validator: _savedAadhaar != null && _aadhaar.text.trim().isEmpty
              ? null
              : Validators.aadhaar,
        ),
        const SizedBox(height: 10),
        UploadField(
          placeholder: 'Upload Aadhar Card*',
          helper: 'Max Size 2 MB (PNG or JPEG)',
          maxSizeMb: 2,
          initialFile: _aadhaarFile,
          readOnly: !_aadhaarEditable,
          onPreview: (file) => openDocumentPreview(
            context,
            title: 'Aadhaar Card',
            file: file,
            documentType: 'aadhaar',
          ),
          onChanged: (file) {
            setState(() => _aadhaarFile = file);
            _report();
          },
        ),
        const SizedBox(height: 18),

        AppTextField(
          label: 'PAN Card',
          hint: 'Enter PAN Card Number',
          controller: _pan,
          required: true,
          maxLength: 10,
          textCapitalization: TextCapitalization.characters,
          inputFormatters: [UpperCaseTextFormatter()],
          enabled: _panEditable,
          helper: _panEditable ? null : 'Approved by our team',
          validator: Validators.pan,
        ),
        const SizedBox(height: 10),
        UploadField(
          placeholder: 'Upload Pan Card*',
          helper: 'Max Size 2 MB (PNG or JPEG)',
          maxSizeMb: 2,
          initialFile: _panFile,
          readOnly: !_panEditable,
          onPreview: (file) => openDocumentPreview(
            context,
            title: 'PAN Card',
            file: file,
            documentType: 'pan',
          ),
          onChanged: (file) {
            setState(() => _panFile = file);
            _report();
          },
        ),
        const SizedBox(height: 18),

        // DigiLocker fills this in; typed entries need it by hand.
        Row(
          children: [
            const Text(
              'Residential Address',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '( Automatically fetch)',
              style: TextStyle(
                fontSize: 10,
                color: AppColors.brand.withValues(alpha: 0.8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _address,
          maxLines: 2,
          enabled: _aadhaarEditable || _panEditable,
          style: const TextStyle(fontSize: 14, color: AppColors.ink),
          decoration: InputDecoration(
            hintText: 'Enter your Residential Address',
            hintStyle: const TextStyle(
              fontSize: 14,
              color: AppColors.inkSubtle,
            ),
            filled: true,
            fillColor: AppColors.surface,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 14,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.line),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.brand),
            ),
          ),
        ),
      ],
    );
  }
}
