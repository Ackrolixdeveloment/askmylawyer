import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/validators.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/multi_select_field.dart';
import 'location_lookup.dart';
import 'location_permission_dialog.dart';
import 'profile_data.dart';
import 'verify_contact_sheet.dart';

/// What the caller should do once a sheet closes.
enum ProfileEditResult {
  /// Dismissed; nothing to do.
  cancelled,

  /// Saved into the local copy — write it to the backend.
  save,

  /// Already written by a flow of its own, such as a verified change of
  /// email. Saving the local copy again would send the old value back.
  reload,
}

/// Opens one of the four profile editors as a bottom sheet.
///
/// The sheet edits a copy and only writes back on Save, so dismissing it
/// leaves the profile untouched.
Future<ProfileEditResult> showProfileEditSheet({
  required BuildContext context,
  required ProfileSection section,
  required ProfileData data,
}) async {
  final result = await showModalBottomSheet<ProfileEditResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    // The Profile tab has its own navigator that sits under the bottom nav,
    // so without this the nav bar and consult button paint over the sheet —
    // covering Save.
    useRootNavigator: true,
    builder: (_) => _EditSheet(section: section, data: data),
  );
  return result ?? ProfileEditResult.cancelled;
}

/// The four editable groups, in the order they appear on the profile.
enum ProfileSection { personal, age, location, contact }

extension ProfileSectionLabels on ProfileSection {
  String get rowTitle => switch (this) {
    ProfileSection.personal => 'Personal Details',
    ProfileSection.age => 'Age',
    ProfileSection.location => 'Location & Address',
    ProfileSection.contact => 'Contact & Language',
  };

  String get sheetTitle => switch (this) {
    ProfileSection.personal => 'Personal Details',
    ProfileSection.age => 'Edit Age & Background',
    ProfileSection.location => 'Edit Location & Address',
    ProfileSection.contact => 'Edit Contact & Language',
  };

  /// Which of the backend's completeness keys belong to this section. The
  /// dot is green when none of them is outstanding.
  List<String> get keys => switch (this) {
    ProfileSection.personal => const ['fullName', 'gender'],
    ProfileSection.age => const ['ageBand'],
    ProfileSection.location => const ['location', 'address'],
    ProfileSection.contact => const ['languages', 'mobile', 'email'],
  };

  bool isComplete(ProfileData data) => data.hasEverything(keys);
}

class _EditSheet extends StatefulWidget {
  const _EditSheet({required this.section, required this.data});

  final ProfileSection section;
  final ProfileData data;

  @override
  State<_EditSheet> createState() => _EditSheetState();
}

class _EditSheetState extends State<_EditSheet> {
  late final TextEditingController _name;
  late final TextEditingController _address;
  late final TextEditingController _email;
  late final TextEditingController _mobile;

  late String _prefix;
  late String? _gender;
  late String? _ageBand;
  late String? _maritalStatus;
  late String? _occupation;
  late String? _stateCity;
  late String _pincode;

  /// True while the device is being asked.
  bool _locating = false;
  late Set<String> _languages;

  @override
  void initState() {
    super.initState();
    final data = widget.data;
    _name = TextEditingController(text: data.fullName);
    _address = TextEditingController(text: data.address);
    _email = TextEditingController(text: data.email);
    _mobile = TextEditingController(text: data.mobile);
    _prefix = data.prefix;
    _gender = data.gender;
    _ageBand = data.ageBand;
    _maritalStatus = data.maritalStatus;
    _occupation = data.occupation;
    _stateCity = data.stateCity;
    _pincode = data.pincode;
    // Copied, so cancelling the sheet cannot mutate the saved set.
    _languages = {...data.languages};
  }

  @override
  void dispose() {
    _name.dispose();
    _address.dispose();
    _email.dispose();
    super.dispose();
  }

  /// Email is optional everywhere else, so it only blocks Save when filled in
  /// badly rather than when left empty.
  bool get _emailValid =>
      _email.text.trim().isEmpty || Validators.email(_email.text) == null;

  /// The same for the number: whoever signed in by email has none yet.
  bool get _mobileValid =>
      _mobile.text.trim().isEmpty || Validators.mobile(_mobile.text) == null;

  bool get _canSave => switch (widget.section) {
    ProfileSection.personal =>
      Validators.name(_name.text) == null && _gender != null,
    ProfileSection.age => _ageBand != null,
    ProfileSection.location =>
      (_stateCity != null || ProfileData(pincode: _pincode).pincodeValid) &&
          _address.text.trim().isNotEmpty,
    ProfileSection.contact =>
      (widget.data.hasEmail || _emailValid) &&
          (widget.data.hasMobile || _mobileValid) &&
          _languages.isNotEmpty,
  };

  /// Opens the verified change flow. It writes to the backend itself, so
  /// the sheet closes and the profile reloads rather than saving again.
  Future<void> _changeContact({required bool isEmail}) async {
    final changed = await showVerifyContactSheet(
      context: context,
      isEmail: isEmail,
      current: isEmail ? widget.data.email : '+91 ${widget.data.mobile}',
    );
    if (changed && mounted) Navigator.of(context).pop(ProfileEditResult.reload);
  }

  Future<void> _useCurrentLocation() async {
    // Our own prompt first, explaining why, so the system one is not the
    // first time they hear the question.
    final allowed = await showLocationPermissionDialog(context);
    if (!mounted || !allowed) return;

    setState(() => _locating = true);
    final result = await const LocationLookup().resolve();
    if (!mounted) return;
    setState(() => _locating = false);

    final place = result.place;
    if (place == null) {
      showLocationProblem(context, result.problem!);
      return;
    }

    setState(() {
      _stateCity = place.stateCity;
      if (place.pincode != null) _pincode = place.pincode!;
    });
  }

  void _save() {
    final data = widget.data;
    switch (widget.section) {
      case ProfileSection.personal:
        data
          ..prefix = _prefix
          ..fullName = _name.text.trim()
          ..gender = _gender;
      case ProfileSection.age:
        data
          ..ageBand = _ageBand
          ..maritalStatus = _maritalStatus
          ..occupation = _occupation;
      case ProfileSection.location:
        data
          ..stateCity = _stateCity
          ..pincode = _pincode
          ..address = _address.text.trim();
      case ProfileSection.contact:
        data.languages = _languages;
        // A contact already on the account is changed through its own
        // verified flow, so Save must not quietly overwrite it.
        if (!data.hasEmail) data.email = _email.text.trim();
        if (!data.hasMobile) data.mobile = _mobile.text.trim();
    }

    // The profile screen writes this to the backend; it owns the session.
    Navigator.of(context).pop(ProfileEditResult.save);
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    // Leaves the sheet clear of the keyboard when a field is focused.
    final inset = media.viewInsets.bottom;
    // Keeps Save above the gesture-nav home indicator, but only when the
    // keyboard is down — the inset above already clears it otherwise.
    final safeBottom = inset > 0 ? 0.0 : media.padding.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: inset),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: media.size.height * 0.85,
        ),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _SheetHeader(
              title: widget.section.sheetTitle,
              onClose: () =>
                  Navigator.of(context).pop(ProfileEditResult.cancelled),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: _fields(),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + safeBottom),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _canSave ? _save : null,
                  child: const Text('Save'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _fields() => switch (widget.section) {
    ProfileSection.personal => [
      const _SheetLabel('Prefix'),
      const SizedBox(height: 8),
      _ChoiceRow(
        options: ProfileOptions.prefixes,
        selected: _prefix,
        onChanged: (value) => setState(() => _prefix = value),
      ),
      const SizedBox(height: 18),
      AppTextField(
        label: 'Full Name',
        hint: 'Enter your full name',
        controller: _name,
        required: true,
        textCapitalization: TextCapitalization.words,
        validator: Validators.name,
      ),
      const SizedBox(height: 18),
      const _SheetLabel('Gender'),
      const SizedBox(height: 8),
      _ChoiceRow(
        options: ProfileOptions.genders,
        selected: _gender,
        onChanged: (value) => setState(() => _gender = value),
      ),
    ],

    ProfileSection.age => [
      const _SheetLabel('Age'),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: ProfileOptions.ageBands
            .map(
              (band) => _Pill(
                label: band,
                active: band == _ageBand,
                onTap: () => setState(() => _ageBand = band),
              ),
            )
            .toList(),
      ),
      const SizedBox(height: 18),
      AppSelectField(
        label: 'Marital status',
        options: ProfileOptions.maritalStatuses,
        value: _maritalStatus,
        onChanged: (value) => setState(() => _maritalStatus = value),
      ),
      const SizedBox(height: 18),
      AppSelectField(
        label: 'Profession / Occupation',
        options: ProfileOptions.occupations,
        value: _occupation,
        onChanged: (value) => setState(() => _occupation = value),
      ),
    ],

    ProfileSection.location => [
      const _SheetLabel('State/ City'),
      const SizedBox(height: 8),
      _UseLocationButton(
        value: _stateCity,
        busy: _locating,
        onTap: _useCurrentLocation,
      ),
      const SizedBox(height: 16),
      const _OrDivider(),
      const SizedBox(height: 14),
      const Text(
        '6 - Digit Pincode',
        style: TextStyle(fontSize: 12, color: AppColors.inkSubtle),
      ),
      const SizedBox(height: 8),
      _PincodeField(
        value: _pincode,
        onChanged: (code) => setState(() => _pincode = code),
      ),
      const SizedBox(height: 18),
      AppTextField(
        label: 'Address',
        hint: 'Flat / Street / Area',
        controller: _address,
        required: true,
        textCapitalization: TextCapitalization.sentences,
      ),
    ],

    ProfileSection.contact => [
      // Whichever contact the account already holds is changed through a
      // code sent to the new one, not by typing over it here.
      if (widget.data.hasMobile)
        _LockedContact(
          label: 'Mobile Number',
          value: '+91 ${widget.data.mobile}',
          onChange: () => _changeContact(isEmail: false),
        )
      else
        AppTextField(
          label: 'Mobile Number',
          hint: 'Enter your 10-digit number',
          controller: _mobile,
          optionalNote: '(Optional)',
          keyboardType: TextInputType.phone,
          // Optional, so only flag it once something is typed.
          validator: (value) =>
              value.trim().isEmpty ? null : Validators.mobile(value),
        ),
      const SizedBox(height: 18),
      if (widget.data.hasEmail)
        _LockedContact(
          label: 'Email Address',
          value: widget.data.email,
          onChange: () => _changeContact(isEmail: true),
        )
      else
        AppTextField(
          label: 'Email Address',
          hint: 'Enter your email Address',
          controller: _email,
          optionalNote: '(Optional)',
          keyboardType: TextInputType.emailAddress,
          // Optional, so only flag it once something is typed.
          validator: (value) =>
              value.trim().isEmpty ? null : Validators.email(value),
        ),
      const SizedBox(height: 18),
      const _SheetLabel('Preferred Language'),
      const SizedBox(height: 8),
      MultiSelectField(
        title: 'Preferred Language',
        placeholder: 'Select or type to add',
        options: ProfileOptions.languages,
        selected: _languages,
        onChanged: (value) => setState(() => _languages = value),
      ),
    ],
  };
}

class _SheetHeader extends StatelessWidget {
  const _SheetHeader({required this.title, required this.onClose});

  final String title;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 12, 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
          ),
          IconButton(
            onPressed: onClose,
            icon: const Icon(Icons.close, size: 20),
            color: AppColors.inkMuted,
          ),
        ],
      ),
    );
  }
}

class _SheetLabel extends StatelessWidget {
  const _SheetLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}

/// Equal-width dark/light choices, used for prefix and gender.
class _ChoiceRow extends StatelessWidget {
  const _ChoiceRow({
    required this.options,
    required this.selected,
    required this.onChanged,
  });

  final List<String> options;
  final String? selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final option in options) ...[
          Expanded(
            child: _Pill(
              label: option,
              active: option == selected,
              // Fills its Expanded slot so the row divides evenly.
              expand: true,
              onTap: () => onChanged(option),
            ),
          ),
          if (option != options.last) const SizedBox(width: 8),
        ],
      ],
    );
  }
}

/// Rounded selectable chip — dark when active, outlined when not.
class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.active,
    required this.onTap,
    this.expand = false,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        alignment: expand ? Alignment.center : null,
        padding: EdgeInsets.symmetric(
          horizontal: expand ? 8 : 16,
          vertical: expand ? 11 : 7,
        ),
        decoration: BoxDecoration(
          color: active ? AppColors.ink : AppColors.surface,
          border: Border.all(color: active ? AppColors.ink : AppColors.line),
          borderRadius: BorderRadius.circular(expand ? 8 : 20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: active ? Colors.white : AppColors.inkMuted,
          ),
        ),
      ),
    );
  }
}

class _UseLocationButton extends StatelessWidget {
  const _UseLocationButton({
    required this.value,
    required this.busy,
    required this.onTap,
  });

  final String? value;

  /// True while the device is being asked; the row shows a spinner.
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: busy ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            if (busy)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            else
              const Icon(Icons.my_location, size: 16, color: Colors.white),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                busy
                    ? 'Finding your location…'
                    : value ?? 'Use my current location',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: Colors.white70),
          ],
        ),
      ),
    );
  }
}

class _PincodeField extends StatefulWidget {
  const _PincodeField({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  State<_PincodeField> createState() => _PincodeFieldState();
}

class _PincodeFieldState extends State<_PincodeField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(_PincodeField old) {
    super.didUpdateWidget(old);
    // The device can fill this in while the sheet is open; typing must not
    // be disturbed, so only a genuinely different value is written back.
    if (widget.value != _controller.text) _controller.text = widget.value;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      keyboardType: TextInputType.number,
      maxLength: 6,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      style: const TextStyle(fontSize: 14, color: AppColors.ink),
      onChanged: widget.onChanged,
      decoration: InputDecoration(
        hintText: 'Enter your pincode',
        hintStyle: const TextStyle(fontSize: 14, color: AppColors.inkSubtle),
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
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

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


/// A contact that is already on the account: shown, not typed over.
class _LockedContact extends StatelessWidget {
  const _LockedContact({
    required this.label,
    required this.value,
    required this.onChange,
  });

  final String label;
  final String value;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: _SheetLabel(label)),
            TextButton(
              onPressed: onChange,
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(0, 28),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Change', style: TextStyle(fontSize: 13)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
          decoration: BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            value,
            style: const TextStyle(fontSize: 14, color: AppColors.inkSubtle),
          ),
        ),
      ],
    );
  }
}
