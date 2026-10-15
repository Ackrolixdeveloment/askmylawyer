import 'package:flutter/widgets.dart';

import '../auth/customer_session.dart';

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
    this.mobile = '',
    this.photoUrl,
    this.hasEmail = false,
    this.hasMobile = false,
    Set<String>? languages,
    Set<String>? missingKeys,
  }) : languages = languages ?? <String>{},
       missingKeys = missingKeys ?? <String>{};

  /// Built from what the backend holds.
  factory ProfileData.from(CustomerProfile profile) => ProfileData(
    prefix: profile.prefix ?? 'Ms.',
    fullName: profile.fullName,
    gender: profile.gender,
    ageBand: profile.ageBand,
    maritalStatus: profile.maritalStatus,
    occupation: profile.occupation,
    stateCity: profile.stateCity,
    pincode: profile.pincode ?? '',
    address: profile.address ?? '',
    email: profile.email ?? '',
    // Held as "+919812345678"; the form works in plain digits.
    mobile: (profile.mobile).replaceFirst(RegExp(r'^\+91'), ''),
    languages: profile.languages,
    photoUrl: profile.photoUrl,
    // What the account already holds, which is what decides whether a
    // change needs a code.
    hasEmail: (profile.email ?? '').isNotEmpty,
    hasMobile: profile.mobile.isNotEmpty,
    missingKeys: profile.missingKeys,
  );

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

  /// Ten digits, without the country code. Empty for anyone who signed in
  /// by email and has not added one yet.
  String mobile;
  Set<String> languages;

  /// Where to fetch the photo, or null when there is none.
  final String? photoUrl;

  /// Whether the backend already has each contact. Adding the missing one
  /// is free; replacing one of these takes a code sent to the new address.
  final bool hasEmail;
  final bool hasMobile;

  /// What the backend says is still missing, by key. The dots read this
  /// rather than recomputing the rule, so the two cannot disagree.
  final Set<String> missingKeys;

  bool hasEverything(List<String> keys) =>
      keys.every((key) => !missingKeys.contains(key));

  /// The picker holds "Gurugram, Haryana" as one string; the backend keeps
  /// the two apart.
  String? get city => _splitLocation(0);
  String? get state => _splitLocation(1);

  String? _splitLocation(int index) {
    final parts = (stateCity ?? '').split(',').map((p) => p.trim()).toList();
    if (index >= parts.length || parts[index].isEmpty) return null;
    return parts[index];
  }

  /// Indian pincodes are six digits and never start with a zero.
  bool get pincodeValid => RegExp(r'^[1-9]\d{5}$').hasMatch(pincode);

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
