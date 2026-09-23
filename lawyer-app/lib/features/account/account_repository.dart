import '../../core/network/api_client.dart';

const _base = '/api/v1/lawyer/account';

/// Changing the mobile number the lawyer signs in with. The new number is
/// confirmed by OTP before it replaces the old one.
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
}
