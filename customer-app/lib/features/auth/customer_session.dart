import 'package:flutter/foundation.dart';

import '../../core/network/api_client.dart';
import '../../core/network/token_storage.dart';

/// The signed-in customer.
class Customer {
  const Customer({
    required this.id,
    required this.mobile,
    this.fullName,
    this.email,
  });

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
    id: json['id'] as String,
    mobile: json['mobile'] as String? ?? '',
    fullName: json['fullName'] as String?,
    email: json['email'] as String?,
  );

  final String id;

  /// In E.164, the way the backend stores it: "+919876543210".
  final String mobile;
  final String? fullName;
  final String? email;

  String get displayName =>
      (fullName == null || fullName!.trim().isEmpty) ? 'there' : fullName!;
}

/// Who is signed in, for the widgets that need to know.
///
/// Held in one place so the OTP screen, the profile and the consultation flow
/// all read the same customer without passing it down every constructor.
class CustomerSession extends ChangeNotifier {
  CustomerSession._();

  static final instance = CustomerSession._();

  final _api = ApiClient.instance;
  final _tokens = TokenStorage.instance;

  Customer? _customer;
  Customer? get customer => _customer;
  bool get isSignedIn => _customer != null;

  /// Why the session ended, shown once on the sign-in screen.
  String? endedMessage;

  // ---- Sign-in ----

  Future<void> sendOtp(String mobile) async {
    await _api.post('/api/v1/customer/auth/otp/send', body: {'mobile': mobile});
  }

  /// Returns true when this number has just been registered, so the app can
  /// ask for a name rather than dropping them straight on the home screen.
  Future<bool> verifyOtp(String mobile, String otp) async {
    final data = await _api.post(
      '/api/v1/customer/auth/otp/verify',
      body: {'mobile': mobile, 'otp': otp},
    );

    await _tokens.save(
      access: data['accessToken'] as String,
      refresh: data['refreshToken'] as String,
    );
    _set(Customer.fromJson(data['customer'] as Map<String, dynamic>));

    return data['isNewUser'] as bool? ?? false;
  }

  /// Picks up a session left by an earlier run, if it is still good.
  ///
  /// Never throws: this runs while the splash is up, and no failure here is
  /// worth more than starting at the sign-in screen.
  Future<bool> restore() async {
    try {
      if (await _tokens.accessToken == null) return false;

      final data = await _api.get('/api/v1/customer/auth/me');
      _set(Customer.fromJson(data['customer'] as Map<String, dynamic>));
      return true;
    } on ApiException {
      await _tokens.clear();
      return false;
    } catch (_) {
      // Secure storage can be unavailable — a test binding, or a device
      // whose keystore is locked.
      return false;
    }
  }

  Future<void> updateProfile({String? fullName, String? email}) async {
    final data = await _api.put(
      '/api/v1/customer/auth/profile',
      body: {'fullName': ?fullName, 'email': ?email},
    );
    _set(Customer.fromJson(data));
  }

  Future<void> signOut() async {
    final refresh = await _tokens.refreshToken;
    if (refresh != null) {
      try {
        await _api.post(
          '/api/v1/customer/auth/logout',
          body: {'refreshToken': refresh},
        );
      } on ApiException {
        // The token expires on its own; there is nothing to tell the user.
      }
    }

    await _tokens.clear();
    _set(null);
  }

  /// The backend has ended the session — suspended, or signed in elsewhere.
  void endedBy(String message) {
    endedMessage = message;
    _set(null);
  }

  void _set(Customer? customer) {
    _customer = customer;
    notifyListeners();
  }
}
