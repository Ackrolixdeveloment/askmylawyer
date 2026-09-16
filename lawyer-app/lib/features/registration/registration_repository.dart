import 'dart:convert';

import '../../core/network/api_client.dart';
import '../../core/widgets/upload_field.dart';

const _base = '/api/v1/lawyer/registration';

/// A file already on the server.
class RegistrationDocument {
  const RegistrationDocument({required this.name, required this.sizeBytes});

  factory RegistrationDocument.fromJson(Map<String, dynamic> json) =>
      RegistrationDocument(
        name: json['name'] as String,
        sizeBytes: json['sizeBytes'] as int,
      );

  final String name;
  final int sizeBytes;

  /// Shown in an [UploadField]; no local path, so it isn't uploaded again.
  PickedDocument toPicked() => PickedDocument(name: name, bytes: sizeBytes);
}

/// Everything saved so far, used to resume and prefill the flow.
class RegistrationSnapshot {
  const RegistrationSnapshot({
    required this.onboardingStatus,
    required this.canEdit,
    required this.completedSteps,
    this.correctionNotes = const {},
    this.rejectionReason,
    this.fullName,
    this.email,
    this.emailVerified = false,
    this.emailLocked = false,
    this.mobile,
    this.panNumber,
    this.residentialAddress,
    this.aadhaarFile,
    this.panFile,
    this.qualification,
    this.barCouncilState,
    this.enrollmentNumber,
    this.certificate,
    this.accountHolderName,
    this.ifscCode,
    this.bankName,
    this.swiftCode,
    this.bankProof,
    this.about,
    this.experience,
    this.languages = const [],
    this.caseCategories = const [],
    this.specialisations = const [],
    this.photo,
    this.signature,
  });

  factory RegistrationSnapshot.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> section(String key) =>
        (json[key] as Map<String, dynamic>?) ?? const {};
    RegistrationDocument? doc(Map<String, dynamic> map, String key) {
      final value = map[key];
      return value is Map<String, dynamic>
          ? RegistrationDocument.fromJson(value)
          : null;
    }

    List<String> strings(Map<String, dynamic> map, String key) =>
        ((map[key] as List?) ?? const []).cast<String>();

    final personal = section('personal');
    final kyc = section('kyc');
    final professional = section('professional');
    final bank = section('bank');
    final profile = section('profile');

    final notes =
        (json['correctionNotes'] as Map<String, dynamic>?) ?? const {};

    return RegistrationSnapshot(
      onboardingStatus: json['onboardingStatus'] as String,
      canEdit: json['canEdit'] as bool,
      completedSteps: strings(json, 'completedSteps').toSet(),
      correctionNotes: notes.map((key, value) => MapEntry(key, '$value')),
      rejectionReason: json['rejectionReason'] as String?,
      fullName: personal['fullName'] as String?,
      email: personal['email'] as String?,
      emailVerified: personal['emailVerified'] as bool? ?? false,
      emailLocked: personal['emailLocked'] as bool? ?? false,
      mobile: personal['mobile'] as String?,
      panNumber: kyc['panNumber'] as String?,
      residentialAddress: kyc['residentialAddress'] as String?,
      aadhaarFile: doc(kyc, 'aadhaarFile'),
      panFile: doc(kyc, 'panFile'),
      qualification: professional['qualification'] as String?,
      barCouncilState: professional['barCouncilState'] as String?,
      enrollmentNumber: professional['enrollmentNumber'] as String?,
      certificate: doc(professional, 'certificate'),
      accountHolderName: bank['accountHolderName'] as String?,
      ifscCode: bank['ifscCode'] as String?,
      bankName: bank['bankName'] as String?,
      swiftCode: bank['swiftCode'] as String?,
      bankProof: doc(bank, 'proof'),
      about: profile['about'] as String?,
      experience: profile['experience'] as String?,
      languages: strings(profile, 'languages'),
      caseCategories: strings(profile, 'caseCategories'),
      specialisations: strings(profile, 'specialisations'),
      photo: doc(profile, 'photo'),
      signature: doc(profile, 'signature'),
    );
  }

  final String onboardingStatus;
  final bool canEdit;

  /// `personal`, `kyc`, `professional`, `bank`, `profile`.
  final Set<String> completedSteps;

  /// What an admin asked the lawyer to fix, keyed by review section.
  final Map<String, String> correctionNotes;

  /// Why the application was turned down.
  final String? rejectionReason;

  final String? fullName;
  final String? email;

  /// Confirmed by an OTP, or by Google / Apple at sign-in.
  final bool emailVerified;

  /// The address comes from Google / Apple, so it cannot be swapped.
  final bool emailLocked;

  /// E.164, e.g. +919876543210.
  final String? mobile;

  final String? panNumber;
  final String? residentialAddress;
  final RegistrationDocument? aadhaarFile;
  final RegistrationDocument? panFile;

  final String? qualification;
  final String? barCouncilState;
  final String? enrollmentNumber;
  final RegistrationDocument? certificate;

  final String? accountHolderName;
  final String? ifscCode;
  final String? bankName;
  final String? swiftCode;
  final RegistrationDocument? bankProof;

  final String? about;
  final String? experience;
  final List<String> languages;
  final List<String> caseCategories;
  final List<String> specialisations;
  final RegistrationDocument? photo;
  final RegistrationDocument? signature;
}

class PersonalInput {
  const PersonalInput({required this.fullName});

  final String fullName;
}

class KycInput {
  const KycInput({
    required this.aadhaarNumber,
    required this.panNumber,
    required this.residentialAddress,
    required this.aadhaarFile,
    required this.panFile,
  });

  final String aadhaarNumber;
  final String panNumber;
  final String residentialAddress;
  final PickedDocument aadhaarFile;
  final PickedDocument panFile;
}

class ProfessionalInput {
  const ProfessionalInput({
    required this.qualification,
    required this.barCouncilState,
    required this.enrollmentNumber,
    required this.certificate,
  });

  final String qualification;
  final String barCouncilState;
  final String enrollmentNumber;
  final PickedDocument certificate;
}

class BankInput {
  const BankInput({
    required this.accountHolderName,
    required this.accountNumber,
    required this.confirmAccountNumber,
    required this.ifscCode,
    required this.bankName,
    required this.swiftCode,
    required this.proof,
  });

  final String accountHolderName;
  final String accountNumber;
  final String confirmAccountNumber;
  final String ifscCode;
  final String bankName;
  final String swiftCode;
  final PickedDocument proof;
}

class ProfileInput {
  const ProfileInput({
    required this.about,
    required this.experience,
    required this.languages,
    required this.caseCategories,
    required this.specialisations,
    this.photo,
    this.signature,
  });

  final String about;
  final String experience;
  final Set<String> languages;
  final Set<String> caseCategories;
  final Set<String> specialisations;
  final PickedDocument? photo;
  final PickedDocument? signature;
}

class RegistrationRepository {
  RegistrationRepository._();

  static final instance = RegistrationRepository._();

  final _api = ApiClient.instance;

  Future<RegistrationSnapshot> load() async =>
      RegistrationSnapshot.fromJson(await _api.get(_base));

  Future<RegistrationSnapshot> savePersonal(PersonalInput input) async {
    final data = await _api.put(
      '$_base/personal',
      body: {'fullName': input.fullName},
    );
    return RegistrationSnapshot.fromJson(data);
  }

  Future<RegistrationSnapshot> saveKyc(KycInput input) => _multipart(
    '$_base/kyc',
    fields: {
      'aadhaarNumber': input.aadhaarNumber,
      'panNumber': input.panNumber,
      'residentialAddress': input.residentialAddress,
    },
    files: {'aadhaarFile': input.aadhaarFile, 'panFile': input.panFile},
  );

  Future<RegistrationSnapshot> saveProfessional(ProfessionalInput input) =>
      _multipart(
        '$_base/professional',
        fields: {
          'qualification': input.qualification,
          'barCouncilState': input.barCouncilState,
          'enrollmentNumber': input.enrollmentNumber,
        },
        files: {'certificate': input.certificate},
      );

  Future<RegistrationSnapshot> saveBank(BankInput input) => _multipart(
    '$_base/bank',
    fields: {
      'accountHolderName': input.accountHolderName,
      'accountNumber': input.accountNumber,
      'confirmAccountNumber': input.confirmAccountNumber,
      'ifscCode': input.ifscCode,
      'bankName': input.bankName,
      'swiftCode': input.swiftCode,
    },
    files: {'proof': input.proof},
  );

  Future<RegistrationSnapshot> saveProfile(ProfileInput input) => _multipart(
    '$_base/profile',
    fields: {
      'about': input.about,
      'experience': input.experience,
      'languages': jsonEncode(input.languages.toList()),
      'caseCategories': jsonEncode(input.caseCategories.toList()),
      'specialisations': jsonEncode(input.specialisations.toList()),
    },
    files: {'photo': input.photo, 'signature': input.signature},
  );

  /// Sends the application for review.
  Future<RegistrationSnapshot> submit() async => RegistrationSnapshot.fromJson(
    await _api.post('$_base/submit', auth: true),
  );

  /// Only newly picked files (with a local path) are uploaded; files already
  /// on the server are kept as they are.
  Future<RegistrationSnapshot> _multipart(
    String path, {
    required Map<String, String> fields,
    required Map<String, PickedDocument?> files,
  }) async {
    final uploads = <String, String>{
      for (final entry in files.entries)
        if (entry.value?.path != null)
          entry.key: _localPath(entry.value!.path!),
    };
    final data = await _api.multipart(
      'PUT',
      path,
      fields: fields,
      files: uploads,
    );
    return RegistrationSnapshot.fromJson(data);
  }

  /// The file picker hands back `file://` URIs; the image picker plain paths.
  static String _localPath(String path) =>
      path.startsWith('file:') ? Uri.parse(path).toFilePath() : path;
}
