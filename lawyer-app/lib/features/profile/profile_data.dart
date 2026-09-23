import '../../core/options.dart';

/// The editable sections shown on the profile screen.
enum ProfileSection {
  aboutMe,
  experience,
  languages,
  specialization,
  caseCategories,
  consultationType,
}

extension ProfileSectionInfo on ProfileSection {
  String get label => switch (this) {
    ProfileSection.aboutMe => 'About Me',
    ProfileSection.experience => 'Experience',
    ProfileSection.languages => 'Languages',
    ProfileSection.specialization => 'Specialization',
    ProfileSection.caseCategories => 'Case Categories',
    ProfileSection.consultationType => 'Consultation Type',
  };

  /// Free text sections use a textarea; the rest pick from a fixed list.
  bool get isFreeText => this == ProfileSection.aboutMe;

  /// Experience is a single band, so picking one replaces the last.
  bool get isSingleChoice => this == ProfileSection.experience;

  String get hint => switch (this) {
    ProfileSection.aboutMe => 'Tell clients about your practice',
    _ => '',
  };

  /// Choices offered for the multi-select sections.
  List<String> get options => switch (this) {
    ProfileSection.experience => LawyerOptions.experienceBands,
    ProfileSection.languages => LawyerOptions.languages,
    ProfileSection.specialization => LawyerOptions.specialisations,
    ProfileSection.caseCategories => LawyerOptions.caseCategories,
    ProfileSection.consultationType => LawyerOptions.consultationTypes,
    _ => const [],
  };
}

/// Everything the profile screen shows and lets the lawyer edit.
class ProfileData {
  ProfileData({
    this.aboutMe =
        'Experienced in handling criminal and family law matters, including '
        'bail applications, divorce proceedings, custody disputes, and legal '
        'consultations. Focused on providing timely advice and effective '
        'representation.',
    Set<String>? experience,
    Set<String>? languages,
    Set<String>? specialization,
    Set<String>? caseCategories,
    Set<String>? consultationType,
  }) : experience = experience ?? {},
       languages = languages ?? {'English', 'Hindi'},
       specialization = specialization ?? {'Criminal Law', 'Family Law'},
       caseCategories = caseCategories ?? {},
       consultationType = consultationType ?? {'Video Consultation'};

  String aboutMe;
  Set<String> experience;
  Set<String> languages;
  Set<String> specialization;
  Set<String> caseCategories;
  Set<String> consultationType;

  String textFor(ProfileSection section) => switch (section) {
    ProfileSection.aboutMe => aboutMe,
    _ => '',
  };

  Set<String> selectionFor(ProfileSection section) => switch (section) {
    ProfileSection.experience => experience,
    ProfileSection.languages => languages,
    ProfileSection.specialization => specialization,
    ProfileSection.caseCategories => caseCategories,
    ProfileSection.consultationType => consultationType,
    _ => const {},
  };

  void setText(ProfileSection section, String value) {
    switch (section) {
      case ProfileSection.aboutMe:
        aboutMe = value;
      default:
        break;
    }
  }

  void setSelection(ProfileSection section, Set<String> value) {
    switch (section) {
      case ProfileSection.experience:
        experience = value;
      case ProfileSection.languages:
        languages = value;
      case ProfileSection.specialization:
        specialization = value;
      case ProfileSection.caseCategories:
        caseCategories = value;
      case ProfileSection.consultationType:
        consultationType = value;
      default:
        break;
    }
  }

  /// One-line preview shown under the section's name.
  String summaryFor(ProfileSection section) {
    if (section.isFreeText) return textFor(section);
    return selectionFor(section).join(', ');
  }
}
