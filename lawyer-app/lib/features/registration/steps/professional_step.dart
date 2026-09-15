import 'package:flutter/material.dart';

import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/upload_field.dart';

/// Step 3 — qualification and Bar Council enrolment.
class ProfessionalStep extends StatefulWidget {
  const ProfessionalStep({super.key, required this.onValidChanged});

  /// Reports whether the step is complete, so the shared footer can enable
  /// its Continue button.
  final ValueChanged<bool> onValidChanged;

  @override
  State<ProfessionalStep> createState() => _ProfessionalStepState();
}

class _ProfessionalStepState extends State<ProfessionalStep> {
  static const _qualifications = ['LL.B.', 'LL.M.', 'B.A. LL.B.', 'Other'];
  static const _states = [
    'Delhi Bar Council',
    'Bar Council of Maharashtra & Goa',
    'Bar Council of Uttar Pradesh',
    'Bar Council of Karnataka',
  ];

  final _enrollment = TextEditingController();
  String? _qualification;
  String? _state;
  PickedDocument? _certificate;

  @override
  void initState() {
    super.initState();
    _enrollment.addListener(_report);
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
    _enrollment.dispose();
    super.dispose();
  }

  bool get _isValid =>
      _qualification != null &&
      _state != null &&
      Validators.enrollment(_enrollment.text) == null &&
      _certificate != null;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSelectField(
          label: 'Qualification',
          options: _qualifications,
          value: _qualification,
          onChanged: (value) {
            setState(() => _qualification = value);
            _report();
          },
        ),
        const SizedBox(height: 16),
        AppSelectField(
          label: 'Bar Council state',
          options: _states,
          value: _state,
          onChanged: (value) {
            setState(() => _state = value);
            _report();
          },
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Enrollment no',
          hint: 'Enter your Enrollment no',
          controller: _enrollment,
          validator: Validators.enrollment,
        ),
        const SizedBox(height: 16),
        UploadField(
          label: 'Bar Counsil Certificate',
          placeholder: 'Upload',
          helper: 'PDF   Max 5 MB',
          maxSizeMb: 5,
          allowedExtensions: const ['pdf'],
          onChanged: (file) {
            setState(() => _certificate = file);
            _report();
          },
        ),
      ],
    );
  }
}
