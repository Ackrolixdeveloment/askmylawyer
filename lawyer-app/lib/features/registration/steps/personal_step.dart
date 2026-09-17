import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/validators.dart';
import '../../../core/widgets/form_fields.dart';
import '../../account/identity_screen.dart';
import '../registration_repository.dart';

/// Step 1 — the lawyer's name, above the verified contact details their
/// account signs in with.
class PersonalStep extends StatefulWidget {
  const PersonalStep({
    super.key,
    required this.onChanged,
    required this.onIdentityChanged,
    this.initial,
    this.mobile,
  });

  /// Reports the step's data when complete, or null while something is
  /// missing — the shared footer enables Continue from it.
  final ValueChanged<PersonalInput?> onChanged;

  /// Called after a number or address is verified, so the form reloads.
  final VoidCallback onIdentityChanged;

  /// What was saved before, to prefill the form.
  final RegistrationSnapshot? initial;

  /// Ten digit number carried over from the OTP screen.
  final String? mobile;

  @override
  State<PersonalStep> createState() => _PersonalStepState();
}

class _PersonalStepState extends State<PersonalStep> {
  late final _name = TextEditingController(text: widget.initial?.fullName);

  String? get _phone {
    final saved = widget.initial?.mobile;
    if (saved != null && saved.isNotEmpty) return saved;
    return widget.mobile == null ? null : '+91${widget.mobile}';
  }

  bool get _emailReady => widget.initial?.emailVerified ?? false;

  @override
  void initState() {
    super.initState();
    _name.addListener(_report);
    _report();
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  /// Pushes the data up after the frame, so the parent can rebuild safely.
  void _report() {
    if (mounted) setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onChanged(
        _isValid ? PersonalInput(fullName: _name.text.trim()) : null,
      );
    });
  }

  // Both contact details have to be verified before the step is complete —
  // they are how the review outcome reaches the lawyer.
  bool get _isValid =>
      Validators.name(_name.text) == null && _phone != null && _emailReady;

  Future<void> _edit(IdentityKind kind) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => IdentityScreen(
          kind: kind,
          current: kind == IdentityKind.mobile ? _phone : widget.initial?.email,
        ),
      ),
    );

    if (changed == true) widget.onIdentityChanged();
  }

  @override
  Widget build(BuildContext context) {
    final initial = widget.initial;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _IdentityCard(
          children: [
            _IdentityRow(
              icon: Icons.phone_outlined,
              label: 'Mobile Number',
              value: _phone == null
                  ? null
                  : '+91 ${_phone!.replaceFirst('+91', '')}',
              verified: _phone != null,
              onEdit: () => _edit(IdentityKind.mobile),
            ),
            const Divider(height: 22, color: AppColors.line),
            _IdentityRow(
              icon: Icons.mail_outline,
              label: 'Email Address',
              value: initial?.email,
              verified: _emailReady,
              // A Google / Apple address belongs to that account.
              lockedNote: initial?.emailLocked ?? false
                  ? 'From your Google / Apple account'
                  : null,
              onEdit: () => _edit(IdentityKind.email),
            ),
          ],
        ),
        const SizedBox(height: 20),

        AppTextField(
          label: 'Full Name',
          hint: 'Enter your full name',
          controller: _name,
          textCapitalization: TextCapitalization.words,
          validator: Validators.name,
        ),
      ],
    );
  }
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 10, 14),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(children: children),
    );
  }
}

/// One contact detail: what it is, whether it is confirmed, and how to change
/// it. Unverified or missing details show an action instead of a tick.
class _IdentityRow extends StatelessWidget {
  const _IdentityRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.verified,
    required this.onEdit,
    this.lockedNote,
  });

  final IconData icon;
  final String label;
  final String? value;
  final bool verified;
  final VoidCallback onEdit;

  /// Set when the value comes from Google / Apple and cannot be changed.
  final String? lockedNote;

  @override
  Widget build(BuildContext context) {
    final missing = value == null || value!.isEmpty;

    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.inkMuted),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppColors.inkMuted),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Flexible(
                    child: Text(
                      missing ? 'Not added yet' : value!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: missing ? AppColors.inkSubtle : AppColors.ink,
                      ),
                    ),
                  ),
                  if (verified) ...[
                    const SizedBox(width: 6),
                    const Icon(
                      Icons.verified,
                      size: 14,
                      color: AppColors.positive,
                    ),
                  ],
                ],
              ),
              if (lockedNote != null) ...[
                const SizedBox(height: 2),
                Text(
                  lockedNote!,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (lockedNote != null)
          const Padding(
            padding: EdgeInsets.all(8),
            child: Icon(
              Icons.lock_outline,
              size: 16,
              color: AppColors.inkSubtle,
            ),
          )
        else if (missing || !verified)
          TextButton(
            onPressed: onEdit,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              foregroundColor: AppColors.brand,
            ),
            child: Text(missing ? 'Add' : 'Verify'),
          )
        else
          IconButton(
            onPressed: onEdit,
            icon: const Icon(Icons.edit_outlined, size: 18),
            color: AppColors.inkMuted,
            tooltip: 'Change $label',
          ),
      ],
    );
  }
}
