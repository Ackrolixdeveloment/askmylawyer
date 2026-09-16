import '../../core/network/api_client.dart';

const _base = '/api/v1/lawyer/account';

/// Adding or changing the mobile number and email the lawyer signs in with.
/// Both are confirmed by OTP before they replace what is on the account.
class AccountRepository {
  AccountRepository._();

  static final instance = AccountRepository._();

  final _api = ApiClient.instance;

  /// Returns how many seconds to wait before a resend.
  Future<int> sendMobileOtp(String mobile) async {
    final data = await _api.post(
      '$_base/mobile/otp/send',
      body: {'mobile': mobile},
      auth: true,
    );
    return data['resendAfterSeconds'] as int;
  }

  Future<void> verifyMobile(String mobile, String otp) => _api.post(
    '$_base/mobile/verify',
    body: {'mobile': mobile, 'otp': otp},
    auth: true,
  );

  Future<int> sendEmailOtp(String email) async {
    final data = await _api.post(
      '$_base/email/otp/send',
      body: {'email': email},
      auth: true,
    );
    return data['resendAfterSeconds'] as int;
  }

  Future<void> verifyEmail(String email, String otp) => _api.post(
    '$_base/email/verify',
    body: {'email': email, 'otp': otp},
    auth: true,
  );
}
