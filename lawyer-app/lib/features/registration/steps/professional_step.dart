import 'package:flutter/material.dart';

import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/upload_field.dart';
import '../document_preview.dart';
import '../registration_repository.dart';

/// Step 3 — qualification and Bar Council enrolment.
class ProfessionalStep extends StatefulWidget {
  const ProfessionalStep({super.key, required this.onChanged, this.initial});

  /// Reports the step's data when complete, or null while something is
  /// missing — the shared footer enables Continue from it.
  final ValueChanged<ProfessionalInput?> onChanged;

  /// What was saved before, to prefill the form.
  final RegistrationSnapshot? initial;

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

  late final _enrollment = TextEditingController(
    text: widget.initial?.enrollmentNumber,
  );

  // Saved values only prefill when they are still one of the options.
  late String? _qualification =
      _qualifications.contains(widget.initial?.qualification)
      ? widget.initial?.qualification
      : null;
  late String? _state = _states.contains(widget.initial?.barCouncilState)
      ? widget.initial?.barCouncilState
      : null;
  late PickedDocument? _certificate = widget.initial?.certificate?.toPicked();

  @override
  void initState() {
    super.initState();
    _enrollment.addListener(_report);
    _report();
  }

  /// Pushes the data up after the frame, so the parent can rebuild safely.
  void _report() {
    if (mounted) setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onChanged(
        _isValid
            ? ProfessionalInput(
                qualification: _qualification!,
                barCouncilState: _state!,
                enrollmentNumber: _enrollment.text.trim(),
                certificate: _certificate!,
              )
            : null,
      );
    });
  }

  @override
  void dispose() {
    _enrollment.dispose();
    super.dispose();
  }

  /// Read-only once the admin has approved this section.
  bool get _editable => widget.initial?.canEditSection('Certificate') ?? true;

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
          onChanged: _editable
              ? (value) {
                  setState(() => _qualification = value);
                  _report();
                }
              : null,
        ),
        const SizedBox(height: 16),
        AppSelectField(
          label: 'Bar Council state',
          options: _states,
          value: _state,
          onChanged: _editable
              ? (value) {
                  setState(() => _state = value);
                  _report();
                }
              : null,
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Enrollment no',
          hint: 'Enter your Enrollment no',
          controller: _enrollment,
          enabled: _editable,
          validator: Validators.enrollment,
        ),
        const SizedBox(height: 16),
        UploadField(
          label: 'Bar Counsil Certificate',
          placeholder: 'Upload',
          helper: 'PDF   Max 5 MB',
          maxSizeMb: 5,
          allowedExtensions: const ['pdf'],
          initialFile: _certificate,
          readOnly: !_editable,
          onPreview: (file) => openDocumentPreview(
            context,
            title: 'Bar Council Certificate',
            file: file,
            documentType: 'bar_certificate',
          ),
          onChanged: (file) {
            setState(() => _certificate = file);
            _report();
          },
        ),
      ],
    );
  }
}
