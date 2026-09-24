import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/validators.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/multi_select_field.dart';
import '../auth/customer_session.dart';
import '../home/home_screen.dart';
import 'location_permission_dialog.dart';

/// Profile the customer fills in after verifying their number or email.
///
/// Only name, email, gender and state/city are required; everything else is
/// optional and marked as such, so the form can be finished quickly.
class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  static const _titles = ['Mr', 'Ms', 'Mrs', 'Adv.', 'Dr'];

  static const _genders = ['Male', 'Female', 'Other'];

  static const _languages = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Bengali',
    'Marathi',
    'Gujarati',
    'Kannada',
    'Malayalam',
    'Punjabi',
  ];

  static const _occupations = [
    'Salaried',
    'Business',
    'Self-employed',
    'Student',
    'Retired',
    'Homemaker',
    'Other',
  ];

  static const _maritalStatuses = [
    'Single',
    'Married',
    'Separated',
    'Divorced',
    'Widowed',
    'Prefer not to say',
  ];

  /// Age bands, shown two rows of five like the mockup.
  static const _ageBands = [
    '18-24',
    '25-29',
    '30-34',
    '35-39',
    '40-44',
    '45-49',
    '50-54',
    '55-59',
    '60+',
  ];

  final _name = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _referralCode = TextEditingController();

  /// Typed into the segmented boxes rather than a controller-backed field.
  String _pincode = '';

  String _title = 'Mr';
  String? _gender;
  String? _occupation;
  String? _maritalStatus;
  bool _is18Plus = false;

  /// Tapped the cross on "I'm 18+", kept apart from the untouched state so
  /// only a real tap highlights it.
  bool _declined18 = false;

  String? _ageBand;
  Set<String> _preferredLanguages = {};

  /// Filled once the customer allows location, or picks a state manually.
  String? _stateCity;

  @override
  void initState() {
    super.initState();
    for (final controller in [_name, _email, _address, _referralCode]) {
      controller.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _address.dispose();
    _referralCode.dispose();
    super.dispose();
  }

  /// Indian pincodes are six digits and never start with a zero.
  bool get _pincodeValid => RegExp(r'^[1-9]\d{5}$').hasMatch(_pincode);

  /// Location is answered either by the device or by a typed pincode.
  bool get _locationKnown => _stateCity != null || _pincodeValid;

  /// A referral code is optional, but a half-typed one should not be sent.
  bool get _referralValid {
    final code = _referralCode.text.trim();
    return code.isEmpty || code.length >= 4;
  }

  /// Email is optional, so it only blocks Continue when it is filled in badly.
  bool get _canContinue =>
      Validators.name(_name.text) == null &&
      (_email.text.trim().isEmpty || Validators.email(_email.text) == null) &&
      _gender != null &&
      _locationKnown &&
      _referralValid;

  Future<void> _useCurrentLocation() async {
    final allowed = await showLocationPermissionDialog(context);
    if (!mounted || !allowed) return;

    // TODO: resolve the real position once a location plugin is added, and
    // fill State / City and Pincode from it.
    setState(() => _stateCity = 'Detecting…');
  }

  Future<void> _submit() async {
    // Only the name and email have a home on the backend so far; the rest of
    // this form is kept for when the customer profile grows to hold it.
    final email = _email.text.trim();

    try {
      await CustomerSession.instance.updateProfile(
        fullName: _name.text.trim(),
        email: email.isEmpty ? null : email,
      );
    } on ApiException {
      // Not worth blocking the first run over: the profile screen can save
      // it again later.
    }

    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Grey page behind the white field cards, so each one reads as a card.
      backgroundColor: AppColors.canvas,
      // Tapping anywhere off a field drops focus, which closes the keyboard.
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        // Without this the detector only fires on painted pixels, so taps on
        // the gaps between cards would do nothing.
        behavior: HitTestBehavior.opaque,
        child: SafeArea(
          child: Column(
            children: [
              _Header(onBack: () => Navigator.of(context).maybePop()),

              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _FieldCard(
                        child: _FullNameField(
                          titles: _titles,
                          title: _title,
                          controller: _name,
                          onTitleChanged: (value) =>
                              setState(() => _title = value),
                        ),
                      ),
                      const SizedBox(height: 12),

                      const _FieldCard(child: _ProfilePhotoRow()),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: AppTextField(
                          label: 'Email Address',
                          hint: 'Enter your email Address',
                          controller: _email,
                          optionalNote: '(Optional)',
                          keyboardType: TextInputType.emailAddress,
                          // Optional, so only flag it once something is typed.
                          validator: (value) => value.trim().isEmpty
                              ? null
                              : Validators.email(value),
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: AppSelectField(
                          label: 'Gender',
                          required: true,
                          options: _genders,
                          value: _gender,
                          onChanged: (value) => setState(() => _gender = value),
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: _StateCityField(
                          value: _stateCity,
                          satisfied: _locationKnown,
                          onUseLocation: _useCurrentLocation,
                          onPincodeChanged: (code) =>
                              setState(() => _pincode = code),
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: _AgeBandField(
                          bands: _ageBands,
                          confirmed: _is18Plus,
                          declined: _declined18,
                          selected: _ageBand,
                          onConfirmedChanged: (value) => setState(() {
                            _is18Plus = value;
                            _declined18 = !value;
                            // Confirming lands on a sensible default; declining
                            // clears whatever was picked.
                            _ageBand = value ? _ageBand ?? '35-39' : null;
                          }),
                          onChanged: (band) => setState(() => _ageBand = band),
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: AppTextField(
                          label: 'Address',
                          hint: 'Address',
                          controller: _address,
                          textCapitalization: TextCapitalization.sentences,
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const _OptionalLabel('Preferred Language'),
                            const SizedBox(height: 6),
                            MultiSelectField(
                              title: 'Preferred Language',
                              placeholder: 'Select or type to add',
                              options: _languages,
                              selected: _preferredLanguages,
                              onChanged: (value) =>
                                  setState(() => _preferredLanguages = value),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: AppSelectField(
                          label: 'Profession / Occupation',
                          options: _occupations,
                          value: _occupation,
                          onChanged: (value) =>
                              setState(() => _occupation = value),
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: AppSelectField(
                          label: 'Marital status',
                          options: _maritalStatuses,
                          value: _maritalStatus,
                          onChanged: (value) =>
                              setState(() => _maritalStatus = value),
                        ),
                      ),
                      const SizedBox(height: 12),

                      _FieldCard(
                        child: AppTextField(
                          label: 'Referral Code',
                          hint: 'Enter referral code',
                          controller: _referralCode,
                          optionalNote: '(Optional)',
                          helper: 'Have a code from a friend? Enter it to '
                              'claim your reward.',
                          textCapitalization: TextCapitalization.characters,
                          // Codes are issued as letters and digits, so keep
                          // stray punctuation out rather than failing later.
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(
                              RegExp(r'[A-Za-z0-9]'),
                            ),
                          ],
                          maxLength: 12,
                          // Optional, so only complain once something is typed.
                          validator: (value) {
                            final code = value.trim();
                            if (code.isEmpty) return null;
                            return code.length < 4
                                ? 'Enter a valid referral code'
                                : null;
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _canContinue ? _submit : null,
                    child: const Text('Continue'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back, size: 20),
            color: AppColors.ink,
          ),
          const Padding(
            padding: EdgeInsets.only(left: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Complete Your Profile',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Help clients understand your expertise and '
                  'professional background.',
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.45,
                    color: AppColors.inkMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Shared height for the title box and the name field beside it.
const _fieldHeight = 48.0;

/// Full name, preceded by the title the customer goes by.
class _FullNameField extends StatelessWidget {
  const _FullNameField({
    required this.titles,
    required this.title,
    required this.controller,
    required this.onTitleChanged,
  });

  final List<String> titles;
  final String title;
  final TextEditingController controller;
  final ValueChanged<String> onTitleChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Full Name',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 10),
        // Both sides share one fixed height so the title box lines up with
        // the name field exactly, rather than each being sized by content.
        SizedBox(
          height: _fieldHeight,
          child: Row(
            children: [
              Container(
                // Match the field beside it: without an explicit height the
                // box shrink-wraps the dropdown's own compact height and
                // floats short in the middle of the row.
                height: _fieldHeight,
                alignment: Alignment.center,
                padding: const EdgeInsets.only(left: 12, right: 6),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border.all(color: AppColors.line),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: title,
                    // `isDense` forces the compact height that caused the
                    // mismatch, so the box sizes itself here instead.
                    isDense: false,
                    borderRadius: BorderRadius.circular(10),
                    icon: const Icon(
                      Icons.keyboard_arrow_down,
                      size: 18,
                      color: AppColors.inkMuted,
                    ),
                    // Build from the theme's text style, not a bare TextStyle:
                    // DropdownButton paints the selected item with exactly what
                    // it is given, so a bare style loses Inter and falls back to
                    // the platform serif.
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.ink,
                    ),
                    items: titles
                        .map(
                          (item) =>
                              DropdownMenuItem(value: item, child: Text(item)),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null) onTitleChanged(value);
                    },
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: controller,
                  textCapitalization: TextCapitalization.words,
                  style: const TextStyle(fontSize: 14, color: AppColors.ink),
                  // Fill the fixed height of the row instead of sizing to the
                  // text, so the border matches the title box beside it.
                  expands: true,
                  maxLines: null,
                  minLines: null,
                  textAlignVertical: TextAlignVertical.center,
                  decoration: InputDecoration(
                    hintText: 'Adv.Aashish Kumar',
                    hintStyle: const TextStyle(
                      fontSize: 14,
                      color: AppColors.inkSubtle,
                    ),
                    filled: true,
                    fillColor: AppColors.surface,
                    // `isDense` would force the compact height that made this
                    // shorter than the title box; the row sets the height now.
                    isDense: false,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
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
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// White card each field sits in, lifted off the grey page.
class _FieldCard extends StatelessWidget {
  const _FieldCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: child,
    );
  }
}

/// Label with the grey "Optional" note on the right, matching the mockup.
class _OptionalLabel extends StatelessWidget {
  const _OptionalLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.ink,
          ),
        ),
        const Text(
          'Optional',
          style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
        ),
      ],
    );
  }
}

class _ProfilePhotoRow extends StatelessWidget {
  const _ProfilePhotoRow();

  @override
  Widget build(BuildContext context) {
    // The surrounding card supplies the chrome, so this row is bare.
    return Row(
      children: [
        // Dashed ring, drawn as a circle of short strokes.
        CustomPaint(
          painter: const _DashedCirclePainter(),
          child: Container(
            width: 84,
            height: 84,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.canvas,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.photo_camera_outlined,
              size: 28,
              color: AppColors.ink,
            ),
          ),
        ),
        const SizedBox(width: 18),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Profile Photo',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
              SizedBox(height: 4),
              // TODO: open the camera; image_picker is already a dependency.
              Text(
                'Upload live Photo',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.ink,
                  decoration: TextDecoration.underline,
                ),
              ),
            ],
          ),
        ),
        const Text(
          'Optional',
          style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
        ),
      ],
    );
  }
}

/// Dashed outline for the avatar placeholder.
class _DashedCirclePainter extends CustomPainter {
  const _DashedCirclePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.inkSubtle
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;

    final radius = size.width / 2;
    final center = Offset(radius, size.height / 2);

    // 44 dashes with a matching gap between each reads as a dotted ring.
    const segments = 44;
    const sweep = (2 * 3.1415926535) / segments;
    for (var i = 0; i < segments; i += 2) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        i * sweep,
        sweep,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_DashedCirclePainter oldDelegate) => false;
}

/// Location is set one of two ways: the dark call to action that asks the OS,
/// or a pincode typed into the segmented boxes underneath.
class _StateCityField extends StatelessWidget {
  const _StateCityField({
    required this.value,
    required this.satisfied,
    required this.onUseLocation,
    required this.onPincodeChanged,
  });

  final String? value;

  /// True once either the device or a valid pincode has answered this, so the
  /// red Required note can drop away.
  final bool satisfied;

  final VoidCallback onUseLocation;
  final ValueChanged<String> onPincodeChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'State/ City',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
            if (!satisfied)
              const Text(
                'Required',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.negative,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),

        InkWell(
          onTap: onUseLocation,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.ink,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.my_location, size: 16, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    value ?? 'Use my current location',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  size: 18,
                  color: Colors.white70,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        const _OrEnterPincodeDivider(),
        const SizedBox(height: 14),

        const Text(
          '6 - Digit Pincode',
          style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
        ),
        const SizedBox(height: 8),
        TextField(
          keyboardType: TextInputType.number,
          maxLength: 6,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 14, color: AppColors.ink),
          onChanged: onPincodeChanged,
          decoration: InputDecoration(
            hintText: 'Enter your pincode',
            hintStyle: const TextStyle(
              fontSize: 14,
              color: AppColors.inkSubtle,
            ),
            filled: true,
            fillColor: AppColors.surface,
            isDense: true,
            counterText: '',
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

/// Hairline rule with the centred "OR ENTER PINCODE" caption.
class _OrEnterPincodeDivider extends StatelessWidget {
  const _OrEnterPincodeDivider();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: Divider(color: AppColors.line)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'OR ENTER PINCODE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8,
              color: AppColors.inkSubtle,
            ),
          ),
        ),
        Expanded(child: Divider(color: AppColors.line)),
      ],
    );
  }
}

/// "I'm 18+" confirmation followed by the age bands, which only appear once
/// the customer confirms.
class _AgeBandField extends StatelessWidget {
  const _AgeBandField({
    required this.bands,
    required this.confirmed,
    required this.declined,
    required this.selected,
    required this.onConfirmedChanged,
    required this.onChanged,
  });

  final List<String> bands;

  /// Ticked "I'm 18+". The age bands only appear once this is on.
  final bool confirmed;

  /// Tapped the cross — highlighted, and the bands stay hidden.
  final bool declined;

  final String? selected;
  final ValueChanged<bool> onConfirmedChanged;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                "I'm 18+",
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
            ),
            _ToggleButton(
              icon: Icons.check,
              active: confirmed,
              onPressed: () => onConfirmedChanged(true),
            ),
            const SizedBox(width: 8),
            _ToggleButton(
              icon: Icons.close,
              active: declined,
              onPressed: () => onConfirmedChanged(false),
            ),
          ],
        ),

        // Age bands belong to the 18+ answer, so they only appear on a tick.
        if (confirmed) ...[
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: bands.map((band) {
              final active = band == selected;
              return InkWell(
                onTap: () => onChanged(band),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: active ? AppColors.ink : AppColors.surface,
                    border: Border.all(
                      color: active ? AppColors.ink : AppColors.line,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    band,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: active ? Colors.white : AppColors.inkMuted,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}

class _ToggleButton extends StatelessWidget {
  const _ToggleButton({
    required this.icon,
    required this.active,
    required this.onPressed,
  });

  final IconData icon;
  final bool active;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 44,
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.ink : AppColors.canvas,
          border: Border.all(color: active ? AppColors.ink : AppColors.line),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 16,
          color: active ? Colors.white : AppColors.inkMuted,
        ),
      ),
    );
  }
}
