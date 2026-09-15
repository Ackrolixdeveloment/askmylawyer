import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/upload_field.dart';

/// Step 2 — DigiLocker first, with a manual fallback when it fails.
class KycStep extends StatefulWidget {
  const KycStep({super.key, required this.onValidChanged});

  /// Reports whether the step is complete, so the shared footer can enable
  /// its Continue button. Stays false on the DigiLocker intro, which has
  /// nothing to submit yet.
  final ValueChanged<bool> onValidChanged;

  @override
  State<KycStep> createState() => _KycStepState();
}

class _KycStepState extends State<KycStep> {
  bool _manual = false;

  final _aadhaar = TextEditingController();
  final _pan = TextEditingController();
  final _address = TextEditingController();

  PickedDocument? _aadhaarFile;
  PickedDocument? _panFile;

  @override
  void initState() {
    super.initState();
    for (final controller in [_aadhaar, _pan, _address]) {
      controller.addListener(_report);
    }
  }

  /// Pushes validity up after the frame, so the parent can rebuild safely.
  void _report() {
    setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) widget.onValidChanged(_isValid);
    });
  }

  @override
  void dispose() {
    _aadhaar.dispose();
    _pan.dispose();
    _address.dispose();
    super.dispose();
  }

  // Both the numbers and their scans are required before moving on.
  bool get _isValid =>
      Validators.aadhaar(_aadhaar.text) == null &&
      Validators.pan(_pan.text) == null &&
      _aadhaarFile != null &&
      _panFile != null;

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
          validator: Validators.aadhaar,
        ),
        const SizedBox(height: 10),
        UploadField(
          placeholder: 'Upload Aadhar Card*',
          helper: 'Max Size 2 MB (PNG or JPEG)',
          maxSizeMb: 2,
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
          validator: Validators.pan,
        ),
        const SizedBox(height: 10),
        UploadField(
          placeholder: 'Upload Pan Card*',
          helper: 'Max Size 2 MB (PNG or JPEG)',
          maxSizeMb: 2,
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
