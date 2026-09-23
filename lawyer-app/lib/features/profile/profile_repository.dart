import '../../core/network/api_client.dart';

/// Where the lawyer's earnings are paid.
class BankAccount {
  const BankAccount({
    required this.holderName,
    required this.bankName,
    required this.accountNumberMasked,
    required this.ifscCode,
    this.swiftCode,
    this.proofFileName,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) => BankAccount(
    holderName: json['holderName'] as String,
    bankName: json['bankName'] as String,
    accountNumberMasked: json['accountNumberMasked'] as String,
    ifscCode: json['ifscCode'] as String,
    swiftCode: json['swiftCode'] as String?,
    proofFileName: json['proofFileName'] as String?,
  );

  final String holderName;
  final String bankName;

  /// "**** 5678" — the full number never leaves the server.
  final String accountNumberMasked;

  final String ifscCode;
  final String? swiftCode;

  /// Set when a cancelled cheque is on file.
  final String? proofFileName;
}

/// The lawyer's own account, as shown on the settings and profile screens.
class LawyerProfile {
  const LawyerProfile({
    required this.lawyerId,
    required this.fullName,
    required this.mobile,
    required this.email,
    required this.isVerified,
    required this.onboardingStatus,
    required this.headline,
    required this.specialisations,
    required this.caseCategories,
    required this.languages,
    required this.consultationTypes,
    this.experience,
    this.about,
    this.photoUrl,
    this.barCouncilNumber,
    this.barCouncilState,
    this.bank,
    this.pendingBank,
    this.bankChangeFeedback,
  });

  factory LawyerProfile.fromJson(Map<String, dynamic> json) {
    final bar = (json['barCouncil'] as Map<String, dynamic>?) ?? const {};
    final bank = json['bank'];
    final pendingBank = json['pendingBank'];

    List<String> strings(String key) =>
        ((json[key] as List?) ?? const []).cast<String>();

    return LawyerProfile(
      lawyerId: json['lawyerId'] as String? ?? '',
      fullName: json['fullName'] as String?,
      mobile: json['mobile'] as String?,
      email: json['email'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      onboardingStatus: json['onboardingStatus'] as String,
      headline: json['headline'] as String? ?? '',
      specialisations: strings('specialisations'),
      caseCategories: strings('caseCategories'),
      languages: strings('languages'),
      consultationTypes: strings('consultationTypes'),
      experience: json['experience'] as String?,
      about: json['about'] as String?,
      photoUrl: json['photoUrl'] as String?,
      barCouncilNumber: bar['number'] as String?,
      barCouncilState: bar['state'] as String?,
      bank: bank is Map<String, dynamic> ? BankAccount.fromJson(bank) : null,
      pendingBank: pendingBank is Map<String, dynamic>
          ? BankAccount.fromJson(pendingBank)
          : null,
      bankChangeFeedback: json['bankChangeFeedback'] as String?,
    );
  }

  final String? fullName;

  /// E.164, e.g. +919079245541.
  final String? mobile;

  final String? email;

  /// Live to customers — the application has been approved.
  final bool isVerified;

  /// The reference to quote to support, e.g. "LAW-B321FFE0".
  final String lawyerId;

  final String onboardingStatus;

  /// The line under the name, built from the lawyer's specialisations.
  final String headline;

  final List<String> specialisations;
  final List<String> caseCategories;
  final List<String> languages;
  final List<String> consultationTypes;
  final String? experience;
  final String? about;
  final String? photoUrl;
  final String? barCouncilNumber;
  final String? barCouncilState;
  final BankAccount? bank;

  /// Submitted and waiting on an admin; payouts still use [bank].
  final BankAccount? pendingBank;

  /// Why the last change was turned down.
  final String? bankChangeFeedback;

  /// "AB" for Anubhav Bassi, used when there is no photo.
  String get initials {
    final parts = (fullName ?? '').trim().split(RegExp(r'\s+'));
    final letters = parts
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();
    return letters.isEmpty ? 'AL' : letters;
  }

  /// "+91 90792 45541" reads better than the stored form.
  String get mobileDisplay {
    final digits = (mobile ?? '').replaceFirst('+91', '');
    if (digits.length != 10) return mobile ?? '-';
    return '+91 ${digits.substring(0, 5)} ${digits.substring(5)}';
  }
}

class ProfileRepository {
  ProfileRepository._();

  static final instance = ProfileRepository._();

  final _api = ApiClient.instance;

  Future<LawyerProfile> load() async =>
      LawyerProfile.fromJson(await _api.get('/api/v1/lawyer/profile'));

  /// Saves one section; anything left out is untouched.
  Future<LawyerProfile> update({
    String? about,
    String? experience,
    Set<String>? languages,
    Set<String>? specialisations,
    Set<String>? caseCategories,
    Set<String>? consultationTypes,
  }) async {
    final data = await _api.put(
      '/api/v1/lawyer/profile',
      method: 'PATCH',
      body: {
        'about': ?about,
        'experience': ?experience,
        if (languages != null) 'languages': languages.toList(),
        if (specialisations != null)
          'specialisations': specialisations.toList(),
        if (caseCategories != null) 'caseCategories': caseCategories.toList(),
        if (consultationTypes != null)
          'consultationTypes': consultationTypes.toList(),
      },
    );
    return LawyerProfile.fromJson(data);
  }

  /// Replaces the account payouts are sent to. A new cancelled cheque is
  /// optional: without one the proof already on file stays.
  Future<LawyerProfile> updateBank({
    required String accountHolderName,
    required String accountNumber,
    required String confirmAccountNumber,
    required String ifscCode,
    required String bankName,
    String? swiftCode,
    String? proofPath,
  }) async {
    final data = await _api.multipart(
      'PUT',
      '/api/v1/lawyer/profile/bank',
      fields: {
        'accountHolderName': accountHolderName,
        'accountNumber': accountNumber,
        'confirmAccountNumber': confirmAccountNumber,
        'ifscCode': ifscCode,
        'bankName': bankName,
        'swiftCode': swiftCode ?? '',
      },
      files: {if (proofPath != null) 'proof': _localPath(proofPath)},
    );
    return LawyerProfile.fromJson(data);
  }

  /// The file picker hands back `file://` URIs; the image picker plain paths.
  static String _localPath(String path) =>
      path.startsWith('file:') ? Uri.parse(path).toFilePath() : path;

  /// Replaces the photo customers see.
  Future<LawyerProfile> uploadPhoto(String path) async {
    final data = await _api.multipart(
      'POST',
      '/api/v1/lawyer/profile/photo',
      fields: const {},
      files: {'photo': path},
    );
    return LawyerProfile.fromJson(data);
  }
}
