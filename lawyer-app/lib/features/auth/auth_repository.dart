import '../../core/network/api_client.dart';
import '../../core/network/token_storage.dart';

/// The signed-in lawyer's account, as returned by the backend.
class LawyerAccount {
  const LawyerAccount({
    required this.id,
    required this.mobile,
    required this.email,
    required this.fullName,
    required this.status,
    required this.onboardingStatus,
    this.rejectionReason,
  });

  factory LawyerAccount.fromJson(Map<String, dynamic> json) => LawyerAccount(
    id: json['id'] as String,
    mobile: json['mobile'] as String?,
    email: json['email'] as String?,
    fullName: json['fullName'] as String?,
    status: json['status'] as String,
    onboardingStatus: json['onboardingStatus'] as String,
    rejectionReason: json['rejectionReason'] as String?,
  );

  final String id;

  /// E.164, e.g. +919876543210. Null for email / Google / Apple sign-ups.
  final String? mobile;

  final String? email;
  final String? fullName;

  /// `active` or `suspended`.
  final String status;

  /// `draft`, `submitted`, `in_review`, `correction_requested`,
  /// `resubmitted`, `approved` or `rejected`.
  final String onboardingStatus;

  /// Why an admin turned the application down.
  final String? rejectionReason;
}

class AuthRepository {
  AuthRepository._();

  static final instance = AuthRepository._();

  final _api = ApiClient.instance;
  final _tokens = TokenStorage.instance;

  /// Sends the OTP. Returns how many seconds to wait before a resend.
  Future<int> sendOtp(String mobile) async {
    final data = await _api.post(
      '/api/v1/lawyer/auth/otp/send',
      body: {'mobile': mobile},
    );
    return data['resendAfterSeconds'] as int;
  }

  /// Verifies the OTP, stores the session and returns the account.
  Future<({bool isNewUser, LawyerAccount lawyer})> verifyOtp(
    String mobile,
    String otp,
  ) async {
    final data = await _api.post(
      '/api/v1/lawyer/auth/otp/verify',
      body: {'mobile': mobile, 'otp': otp},
    );
    return _startSession(data);
  }

  /// Emails a 6-digit code. Returns how many seconds to wait before a resend.
  Future<int> sendEmailOtp(String email) async {
    final data = await _api.post(
      '/api/v1/lawyer/auth/email/otp/send',
      body: {'email': email},
    );
    return data['resendAfterSeconds'] as int;
  }

  /// Verifies the emailed code, stores the session and returns the account.
  Future<({bool isNewUser, LawyerAccount lawyer})> verifyEmailOtp(
    String email,
    String otp,
  ) async {
    final data = await _api.post(
      '/api/v1/lawyer/auth/email/otp/verify',
      body: {'email': email, 'otp': otp},
    );
    return _startSession(data);
  }

  Future<({bool isNewUser, LawyerAccount lawyer})> _startSession(
    Map<String, dynamic> data,
  ) async {
    await _tokens.save(
      access: data['accessToken'] as String,
      refresh: data['refreshToken'] as String,
    );
    return (
      isNewUser: data['isNewUser'] as bool,
      lawyer: LawyerAccount.fromJson(data['lawyer'] as Map<String, dynamic>),
    );
  }

  Future<LawyerAccount> me() async {
    final data = await _api.get('/api/v1/lawyer/auth/me');
    return LawyerAccount.fromJson(data['lawyer'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    final refreshToken = await _tokens.refreshToken;
    if (refreshToken != null) {
      try {
        await _api.post(
          '/api/v1/lawyer/auth/logout',
          body: {'refreshToken': refreshToken},
        );
      } on ApiException {
        // Offline or already expired — clearing the local session is enough.
      }
    }
    await _tokens.clear();
  }
}
