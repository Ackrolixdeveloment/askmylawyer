import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Lets the lawyer set a new password, with the rules checked as they type.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void initState() {
    super.initState();
    for (final controller in [_current, _next, _confirm]) {
      controller.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  bool get _longEnough => _next.text.length >= 8;
  bool get _hasUpper => _next.text.contains(RegExp(r'[A-Z]'));
  bool get _hasNumber => _next.text.contains(RegExp(r'\d'));

  /// Every rule met, the current password given, and both new entries equal.
  bool get _canSubmit =>
      _current.text.isNotEmpty &&
      _longEnough &&
      _hasUpper &&
      _hasNumber &&
      _next.text == _confirm.text;

  void _submit() {
    // TODO: change the password through the backend.
    Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        // Content scrolls; the button stays pinned to the bottom.
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: InkWell(
                            onTap: () => Navigator.of(context).maybePop(),
                            borderRadius: BorderRadius.circular(6),
                            child: const Padding(
                              padding: EdgeInsets.all(4),
                              child: Icon(
                                Icons.arrow_back,
                                size: 20,
                                color: AppColors.ink,
                              ),
                            ),
                          ),
                        ),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Change Password',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Keep your account safe. Choose a strong , '
                                'unique password.',
                                style: TextStyle(
                                  fontSize: 13,
                                  height: 1.4,
                                  color: AppColors.inkSubtle,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    const _FieldLabel('Current Password'),
                    _PasswordField(
                      controller: _current,
                      hint: 'Enter current password',
                    ),
                    const SizedBox(height: 16),

                    const _FieldLabel('New Password'),
                    _PasswordField(
                      controller: _next,
                      hint: 'Enter new password',
                    ),
                    const SizedBox(height: 12),

                    _Requirements(
                      longEnough: _longEnough,
                      hasUpper: _hasUpper,
                      hasNumber: _hasNumber,
                    ),
                    const SizedBox(height: 16),

                    const _FieldLabel('Confirm New Password'),
                    _PasswordField(
                      controller: _confirm,
                      hint: 'Re-enter new password',
                    ),

                    // Only worth flagging once there is something to compare.
                    if (_confirm.text.isNotEmpty &&
                        _next.text != _confirm.text) ...[
                      const SizedBox(height: 6),
                      const Text(
                        'Both passwords must match.',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.negative,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _canSubmit ? _submit : null,
                      child: const Text('Update Password'),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'You will not be signed out of other devices.',
                    style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
        ),
      ),
    );
  }
}

/// Masked field with a lock in front and a reveal toggle at the end.
class _PasswordField extends StatefulWidget {
  const _PasswordField({required this.controller, required this.hint});

  final TextEditingController controller;
  final String hint;

  @override
  State<_PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<_PasswordField> {
  bool _visible = false;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      obscureText: !_visible,
      style: const TextStyle(fontSize: 14, color: AppColors.ink),
      decoration: InputDecoration(
        hintText: widget.hint,
        hintStyle: const TextStyle(fontSize: 14, color: AppColors.inkSubtle),
        prefixIcon: const Icon(
          Icons.lock_outline,
          size: 18,
          color: AppColors.inkSubtle,
        ),
        suffixIcon: IconButton(
          onPressed: () => setState(() => _visible = !_visible),
          icon: Icon(
            _visible
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            size: 18,
            color: AppColors.inkSubtle,
          ),
          tooltip: _visible ? 'Hide password' : 'Show password',
        ),
        filled: true,
        fillColor: AppColors.surface,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(vertical: 14),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.brand),
        ),
      ),
    );
  }
}

/// The three rules, ticked off as the new password satisfies them.
class _Requirements extends StatelessWidget {
  const _Requirements({
    required this.longEnough,
    required this.hasUpper,
    required this.hasNumber,
  });

  final bool longEnough;
  final bool hasUpper;
  final bool hasNumber;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Requirements',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 8),
          _Rule(met: longEnough, label: 'Minimum 8 characters'),
          _Rule(met: hasUpper, label: 'One uppercase letter'),
          _Rule(met: hasNumber, label: 'One number'),
        ],
      ),
    );
  }
}

class _Rule extends StatelessWidget {
  const _Rule({required this.met, required this.label});

  final bool met;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(
            met ? Icons.check : Icons.close,
            size: 14,
            color: met ? AppColors.positive : AppColors.inkSubtle,
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: met ? AppColors.ink : AppColors.inkSubtle,
            ),
          ),
        ],
      ),
    );
  }
}
