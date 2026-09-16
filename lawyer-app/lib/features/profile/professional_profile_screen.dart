import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/multi_select_field.dart';
import '../../core/widgets/upload_field.dart';
import '../registration/registration_repository.dart';
import 'application_submitted_screen.dart';

/// Final onboarding screen: the profile customers actually see.
class ProfessionalProfileScreen extends StatefulWidget {
  const ProfessionalProfileScreen({super.key, this.displayName, this.initial});

  /// Pulled from the verified KYC record, so it is read-only here.
  final String? displayName;

  /// What was saved before, to prefill the form.
  final RegistrationSnapshot? initial;

  @override
  State<ProfessionalProfileScreen> createState() =>
      _ProfessionalProfileScreenState();
}

class _ProfessionalProfileScreenState extends State<ProfessionalProfileScreen> {
  static const _experienceBands = [
    '0-2 years',
    '3-5 years',
    '6-10 years',
    '10+ years',
  ];
  static const _languages = [
    'Hindi',
    'English',
    'Punjabi',
    'Marathi',
    'Bengali',
    'Tamil',
    'Telugu',
    'Gujarati',
    'Kannada',
    'Malayalam',
  ];
  static const _caseCategories = [
    'Bail',
    'FIR',
    'Divorce',
    'Custody',
    'Maintenance',
    'Property dispute',
    'Consumer complaint',
    'Cheque bounce',
  ];
  static const _specialisations = [
    'Criminal',
    'Family',
    'Corporate',
    'Tax',
    'Property',
    'Cyber',
    'Consumer',
    'Intellectual Property',
  ];

  late final _about = TextEditingController(text: widget.initial?.about);
  final _languageSearch = TextEditingController();

  /// A photo uploaded earlier has no local path; only new picks are uploaded.
  late PickedDocument? _photo = widget.initial?.photo?.toPicked();

  /// Kept alongside [_photo] so the chosen image can be shown back.
  File? _photoFile;

  late PickedDocument? _signature = widget.initial?.signature?.toPicked();

  bool _submitting = false;

  /// Offers the camera or the gallery, then stores whichever was chosen.
  Future<void> _pickPhoto() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 18, 20, 6),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Profile Photo',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ),
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_camera_outlined,
                color: AppColors.ink,
              ),
              title: const Text(
                'Take a photo',
                style: TextStyle(fontSize: 14),
              ),
              onTap: () =>
                  Navigator.of(sheetContext).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_library_outlined,
                color: AppColors.ink,
              ),
              title: const Text(
                'Choose from gallery',
                style: TextStyle(fontSize: 14),
              ),
              onTap: () =>
                  Navigator.of(sheetContext).pop(ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );

    if (source == null) return;

    final picked = await ImagePicker().pickImage(
      source: source,
      // Keeps the upload small; the original is never needed here.
      maxWidth: 1200,
      imageQuality: 85,
    );
    if (picked == null) return;

    final file = File(picked.path);
    final size = await file.length();

    setState(() {
      _photoFile = file;
      _photo = PickedDocument(
        name: picked.name,
        bytes: size,
        path: picked.path,
      );
    });
  }
  late String? _experience =
      _experienceBands.contains(widget.initial?.experience)
      ? widget.initial?.experience
      : null;
  late Set<String> _selectedLanguages =
      widget.initial?.languages.isNotEmpty ?? false
      ? widget.initial!.languages.toSet()
      : {'Hindi', 'English'};
  late Set<String> _categories = {...?widget.initial?.caseCategories};
  late Set<String> _specialisation = {...?widget.initial?.specialisations};

  @override
  void initState() {
    super.initState();
    _about.addListener(() => setState(() {}));
    _languageSearch.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _about.dispose();
    _languageSearch.dispose();
    super.dispose();
  }

  /// Completion is the share of profile fields that carry a value, so the ring
  /// moves as the lawyer fills the form in.
  double get _completion {
    final filled = [
      true, // display name arrives pre-filled from KYC
      _photo != null,
      _signature != null,
      _about.text.trim().isNotEmpty,
      _experience != null,
      _selectedLanguages.isNotEmpty,
      _categories.isNotEmpty,
      _specialisation.isNotEmpty,
    ].where((done) => done).length;

    return filled / 8;
  }

  bool get _canContinue =>
      _about.text.trim().isNotEmpty &&
      _experience != null &&
      _selectedLanguages.isNotEmpty &&
      _categories.isNotEmpty &&
      _specialisation.isNotEmpty;

  /// Languages not yet picked, narrowed by whatever is typed in the search.
  List<String> get _languageSuggestions {
    final query = _languageSearch.text.trim().toLowerCase();
    if (query.isEmpty) return const [];

    return _languages
        .where(
          (language) =>
              !_selectedLanguages.contains(language) &&
              language.toLowerCase().contains(query),
        )
        .toList();
  }

  /// Saves the profile, then sends the whole application for review.
  Future<void> _submit() async {
    setState(() => _submitting = true);
    final repository = RegistrationRepository.instance;

    try {
      await repository.saveProfile(
        ProfileInput(
          about: _about.text.trim(),
          experience: _experience!,
          languages: _selectedLanguages,
          caseCategories: _categories,
          specialisations: _specialisation,
          photo: _photo,
          signature: _signature,
        ),
      );
      await repository.submit();
      if (!mounted) return;

      // Registration is finished — nothing behind this screen to go back to.
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(
          builder: (_) => const ApplicationSubmittedScreen(),
        ),
        (_) => false,
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 20, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.surface,
                      foregroundColor: AppColors.ink,
                      side: const BorderSide(color: AppColors.line),
                    ),
                  ),
                  const Spacer(),
                  _CompletionRing(value: _completion),
                ],
              ),
            ),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: [
                  const Text(
                    'Complete Your\nProfessional Profile',
                    style: TextStyle(
                      fontSize: 21,
                      height: 1.25,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Help clients understand your expertise and professional '
                    'background',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: AppColors.inkMuted,
                    ),
                  ),
                  const SizedBox(height: 16),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Display Name',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '(auto fetch)',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.inkSubtle,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          widget.displayName ?? 'Adv. Aashish Kumar',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.inkMuted,
                          ),
                        ),
                      ],
                    ),
                  ),

                  _Card(
                    onTap: _pickPhoto,
                    child: Row(
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                            color: AppColors.canvas,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          // Shows the chosen photo once there is one.
                          child: _photoFile == null
                              ? const Icon(
                                  Icons.photo_camera_outlined,
                                  size: 20,
                                  color: AppColors.inkMuted,
                                )
                              : Image.file(_photoFile!, fit: BoxFit.cover),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Profile Photo',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ink,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _photo?.name ?? 'Upload live Photo',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  decoration: TextDecoration.underline,
                                  color: AppColors.ink,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Upload Signature',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 10),
                        UploadField(
                          placeholder: 'Upload',
                          helper: 'Choose a file · Maximum 5 MB file size',
                          maxSizeMb: 5,
                          initialFile: _signature,
                          onChanged: (file) =>
                              setState(() => _signature = file),
                        ),
                      ],
                    ),
                  ),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Expanded(
                              child: Text(
                                'About You',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ink,
                                ),
                              ),
                            ),
                            Text(
                              '${_about.text.length}/500',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.inkSubtle,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _about,
                          maxLines: 5,
                          maxLength: 500,
                          style: const TextStyle(
                            fontSize: 13,
                            height: 1.5,
                            color: AppColors.ink,
                          ),
                          decoration: const InputDecoration(
                            counterText: '',
                            border: InputBorder.none,
                            isDense: true,
                            hintStyle: TextStyle(
                              fontSize: 13,
                              height: 1.5,
                              color: AppColors.inkSubtle,
                            ),
                            hintText:
                                'Experienced in handling criminal and family '
                                'law matters, including bail applications, '
                                'divorce proceedings, custody disputes, and '
                                'legal consultations.',
                          ),
                        ),
                      ],
                    ),
                  ),

                  _Card(
                    child: _Labelled(
                      label: 'Total Experience',
                      child: DropdownButtonFormField<String>(
                        initialValue: _experience,
                        isExpanded: true,
                        hint: const Text(
                          'Select',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.inkSubtle,
                          ),
                        ),
                        items: _experienceBands
                            .map(
                              (band) => DropdownMenuItem(
                                value: band,
                                child: Text(
                                  band,
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) =>
                            setState(() => _experience = value),
                        decoration: _boxDecoration(),
                      ),
                    ),
                  ),

                  _Card(
                    child: _Labelled(
                      label: 'Language Spoken',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (_selectedLanguages.isNotEmpty) ...[
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _selectedLanguages
                                  .map(
                                    (language) => SelectionChip(
                                      label: language,
                                      onRemove: () => setState(
                                        () => _selectedLanguages = {
                                          ..._selectedLanguages,
                                        }..remove(language),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                            const SizedBox(height: 12),
                          ],
                          TextField(
                            controller: _languageSearch,
                            style: const TextStyle(fontSize: 14),
                            decoration: _boxDecoration().copyWith(
                              hintText: 'Search',
                              hintStyle: const TextStyle(
                                fontSize: 14,
                                color: AppColors.inkSubtle,
                              ),
                              suffixIcon: const Icon(
                                Icons.search,
                                size: 18,
                                color: AppColors.inkSubtle,
                              ),
                            ),
                          ),
                          // Suggestions only appear while the field has text.
                          ..._languageSuggestions.map(
                            (language) => ListTile(
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                language,
                                style: const TextStyle(fontSize: 13),
                              ),
                              onTap: () => setState(() {
                                _selectedLanguages = {
                                  ..._selectedLanguages,
                                  language,
                                };
                                _languageSearch.clear();
                              }),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  _Card(
                    child: _Labelled(
                      label: 'Case Categories',
                      child: MultiSelectField(
                        title: 'Case Categories',
                        options: _caseCategories,
                        selected: _categories,
                        onChanged: (value) =>
                            setState(() => _categories = value),
                      ),
                    ),
                  ),

                  _Card(
                    child: _Labelled(
                      label: 'Specialization',
                      child: MultiSelectField(
                        title: 'Specialization',
                        options: _specialisations,
                        selected: _specialisation,
                        onChanged: (value) =>
                            setState(() => _specialisation = value),
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: _canContinue && !_submitting ? _submit : null,
                    child: _submitting
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Continue'),
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

InputDecoration _boxDecoration() {
  OutlineInputBorder border(Color color) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(8),
    borderSide: BorderSide(color: color),
  );

  return InputDecoration(
    filled: true,
    fillColor: AppColors.surface,
    isDense: true,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    enabledBorder: border(AppColors.line),
    focusedBorder: border(AppColors.brand),
  );
}

class _Card extends StatelessWidget {
  const _Card({required this.child, this.onTap});

  final Widget child;

  /// Set on cards that are themselves a control, such as the photo picker.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );

    if (onTap == null) return card;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: card,
    );
  }
}

class _Labelled extends StatelessWidget {
  const _Labelled({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 10),
        child,
      ],
    );
  }
}

/// Small ring showing how much of the profile is filled in.
class _CompletionRing extends StatelessWidget {
  const _CompletionRing({required this.value});

  final double value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 40,
      height: 40,
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: value),
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOut,
            builder: (context, animated, _) => SizedBox.expand(
              child: CircularProgressIndicator(
                value: animated,
                strokeWidth: 2.5,
                strokeCap: StrokeCap.round,
                backgroundColor: AppColors.line,
                valueColor: const AlwaysStoppedAnimation(AppColors.ink),
              ),
            ),
          ),
          Text(
            '${(value * 100).round()}%',
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppColors.inkMuted,
            ),
          ),
        ],
      ),
    );
  }
}
