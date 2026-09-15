// Placeholder profile content. Swap for the API once it exists.

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

  String get hint => switch (this) {
    ProfileSection.aboutMe => 'Tell clients about your practice',
    _ => '',
  };

  /// Choices offered for the multi-select sections.
  List<String> get options => switch (this) {
    ProfileSection.experience => const [
      '0-2 years',
      '3-5 years',
      '6-10 years',
      '10+ years',
      'District Court',
      'High Court',
      'Supreme Court',
      'Tribunals',
    ],
    ProfileSection.languages => const [
      'English',
      'Hindi',
      'Punjabi',
      'Marathi',
      'Gujarati',
      'Bengali',
      'Tamil',
      'Telugu',
      'Kannada',
      'Malayalam',
    ],
    ProfileSection.specialization => const [
      'Criminal Law',
      'Family Law',
      'Civil Law',
      'Corporate Law',
      'Property Law',
      'Tax Law',
      'Labour Law',
      'Constitutional Law',
    ],
    ProfileSection.caseCategories => const [
      'Divorce & Custody',
      'Bail Applications',
      'Property Dispute',
      'Cheque Bounce',
      'Consumer Complaint',
      'Contract Dispute',
      'Employment Dispute',
    ],
    ProfileSection.consultationType => const [
      'Audio Consultation',
      'Video Consultation',
      'Chat Consultation',
    ],
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
