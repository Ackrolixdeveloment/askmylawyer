import 'package:flutter/widgets.dart';

/// The customer's saved profile, held in memory and edited section by section.
///
/// Each section of [ProfileScreen] reads the fields it owns and reports itself
/// complete or not, which drives the green / amber dot beside the row.
class ProfileData {
  ProfileData({
    this.prefix = 'Ms.',
    this.fullName = '',
    this.gender,
    this.ageBand,
    this.maritalStatus,
    this.occupation,
    this.stateCity,
    this.pincode = '',
    this.address = '',
    this.email = '',
    Set<String>? languages,
  }) : languages = languages ?? <String>{};

  String prefix;
  String fullName;
  String? gender;

  String? ageBand;
  String? maritalStatus;
  String? occupation;

  String? stateCity;
  String pincode;
  String address;

  String email;
  Set<String> languages;

  /// Indian pincodes are six digits and never start with a zero.
  bool get pincodeValid => RegExp(r'^[1-9]\d{5}$').hasMatch(pincode);

  /// Name and gender are what the rest of the app actually needs, so marital
  /// status and occupation stay optional here just as they are on signup.
  bool get personalComplete => fullName.trim().isNotEmpty && gender != null;

  bool get ageComplete => ageBand != null;

  /// Either the device or a typed pincode answers this, plus a street address.
  bool get locationComplete =>
      (stateCity != null || pincodeValid) && address.trim().isNotEmpty;

  /// Email is optional across the app, so only a language marks this done.
  bool get contactComplete => languages.isNotEmpty;

  /// Initials for the avatar, e.g. "Priya Krishnan" becomes "PK".
  String get initials {
    final parts = fullName.trim().split(RegExp(r'\s+'))
      ..removeWhere((part) => part.isEmpty);
    if (parts.isEmpty) return '';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }

  /// Shown under the name; the city is the most useful thing we have.
  String get locationLabel => stateCity ?? (pincodeValid ? pincode : '');
}

/// Option lists shared by the profile sheets and the signup form.
class ProfileOptions {
  const ProfileOptions._();

  static const prefixes = ['Mr.', 'Ms.', 'Mrs.', 'Dr'];

  static const genders = ['Male', 'Female', 'Other'];

  static const ageBands = [
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

  static const maritalStatuses = [
    'Single',
    'Married',
    'Separated',
    'Divorced',
    'Widowed',
    'Prefer not to say',
  ];

  static const occupations = [
    'Salaried',
    'Business',
    'Self-employed',
    'Student',
    'Retired',
    'Homemaker',
    'Other',
  ];

  static const languages = [
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
}
