import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../core/network/api_client.dart';
import '../../core/network/token_storage.dart';
import '../../core/push/device_repository.dart';

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

/// What the customer has told us about themselves.
///
/// None of it is needed to book a consultation; it is gathered at sign-up
/// and topped up later, so every field can be missing.
class CustomerProfile {
  const CustomerProfile({
    required this.fullName,
    required this.mobile,
    required this.languages,
    this.email,
    this.prefix,
    this.gender,
    this.ageBand,
    this.maritalStatus,
    this.occupation,
    this.state,
    this.city,
    this.pincode,
    this.address,
    this.referredByCode,
    this.photoUrl,
    this.complete = false,
    this.missing = const [],
    this.missingKeys = const {},
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) =>
      CustomerProfile(
        fullName: json['fullName'] as String? ?? '',
        mobile: json['mobile'] as String? ?? '',
        languages: ((json['languages'] as List<dynamic>?) ?? const [])
            .map((value) => value as String)
            .toSet(),
        email: json['email'] as String?,
        prefix: json['prefix'] as String?,
        gender: json['gender'] as String?,
        ageBand: json['ageBand'] as String?,
        maritalStatus: json['maritalStatus'] as String?,
        occupation: json['occupation'] as String?,
        state: json['state'] as String?,
        city: json['city'] as String?,
        pincode: json['pincode'] as String?,
        address: json['address'] as String?,
        referredByCode: json['referredByCode'] as String?,
        photoUrl: json['photoUrl'] as String?,
        complete: json['complete'] as bool? ?? false,
        missing: ((json['missing'] as List<dynamic>?) ?? const [])
            .map((value) => value as String)
            .toList(),
        missingKeys: ((json['missingKeys'] as List<dynamic>?) ?? const [])
            .map((value) => value as String)
            .toSet(),
      );

  final String fullName;
  final String mobile;
  final Set<String> languages;
  final String? email;
  final String? prefix;
  final String? gender;
  final String? ageBand;
  final String? maritalStatus;
  final String? occupation;
  final String? state;
  final String? city;
  final String? pincode;
  final String? address;
  final String? referredByCode;

  /// Where to fetch the photo, or null when there is none. Needs the bearer
  /// token like any other call, so it cannot go straight into Image.network.
  final String? photoUrl;

  /// Whether the report can be handed over, and what is missing if not.
  ///
  /// Worked out by the backend against the same rule that holds the report
  /// back, so the dots on the profile screen cannot drift away from it.
  final bool complete;

  /// In words, for the customer: "your full name", "a mobile number".
  final List<String> missing;

  /// The same, as keys: "fullName", "gender", "ageBand", "location",
  /// "address", "languages", "mobile", "email".
  final Set<String> missingKeys;

  /// "Gurugram, Haryana", or whichever half we have.
  String? get stateCity {
    final parts = [city, state].whereType<String>().where((p) => p.isNotEmpty);
    return parts.isEmpty ? null : parts.join(', ');
  }
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

  // ---- Signing in with Google / Apple ----

  /// Exchanges a Google ID token for a session. True when the account was
  /// just created, so the caller can offer the profile form.
  Future<bool> signInWithGoogle(String idToken) =>
      _socialSignIn('/api/v1/customer/auth/google', {'idToken': idToken});

  /// The same for Apple. [fullName] is sent because Apple hands it over on
  /// the very first sign-in and never again — if it is not saved now, it
  /// is lost.
  Future<bool> signInWithApple({
    required String identityToken,
    String? rawNonce,
    String? fullName,
  }) => _socialSignIn('/api/v1/customer/auth/apple', {
    'identityToken': identityToken,
    'rawNonce': ?rawNonce,
    'fullName': ?fullName,
  });

  Future<bool> _socialSignIn(String path, Map<String, Object?> body) async {
    final data = await _api.post(path, body: body);

    await _tokens.save(
      access: data['accessToken'] as String,
      refresh: data['refreshToken'] as String,
    );
    _set(Customer.fromJson(data['customer'] as Map<String, dynamic>));

    return data['isNewUser'] as bool? ?? false;
  }

  // ---- Signing in by email ----

  Future<void> sendEmailOtp(String email) async {
    await _api.post('/api/v1/customer/auth/email/send', body: {'email': email});
  }

  /// True when this email has just been registered, so the app can offer
  /// the profile form rather than dropping them straight on the home screen.
  Future<bool> verifyEmailOtp(String email, String otp) async {
    final data = await _api.post(
      '/api/v1/customer/auth/email/verify',
      body: {'email': email, 'otp': otp},
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

  /// Saves whatever is passed and leaves the rest alone.
  /// The sign-up form and the profile screen each fill in a different part
  /// of this, so only what is given is written — one never wipes the
  /// other's answers.
  Future<CustomerProfile> updateProfile({
    String? fullName,
    String? email,
    String? prefix,
    String? gender,
    String? ageBand,
    String? maritalStatus,
    String? occupation,
    String? state,
    String? city,
    String? pincode,
    String? address,
    List<String>? languages,
    String? referredByCode,
    String? mobile,
  }) async {
    final data = await _api.put(
      '/api/v1/customer/auth/profile',
      body: {
        'fullName': ?fullName,
        'email': ?email,
        'prefix': ?prefix,
        'gender': ?gender,
        'ageBand': ?ageBand,
        'maritalStatus': ?maritalStatus,
        'occupation': ?occupation,
        'state': ?state,
        'city': ?city,
        'pincode': ?pincode,
        'address': ?address,
        'languages': ?languages,
        'referredByCode': ?referredByCode,
        'mobile': ?mobile,
      },
    );

    _set(Customer.fromJson(data));
    return CustomerProfile.fromJson(data);
  }

  /// Replaces the profile photo with the image at [path].
  Future<CustomerProfile> uploadPhoto(String path) async {
    final data = await _api.multipart(
      'POST',
      '/api/v1/customer/auth/profile/photo',
      fields: const {},
      files: {'photo': path},
    );
    _set(Customer.fromJson(data));
    return CustomerProfile.fromJson(data);
  }

  /// The photo itself. Private, so it is fetched with the token rather than
  /// handed to [Image.network].
  Future<Uint8List> photoBytes(String url) => _api.bytes(url);

  /// Sends a code to the email address or mobile number they want to move
  /// to. Exactly one of the two.
  Future<void> sendContactOtp({String? email, String? mobile}) async {
    await _api.post(
      '/api/v1/customer/auth/profile/contact/send',
      body: {'email': ?email, 'mobile': ?mobile},
    );
  }

  /// Confirms that code and moves the contact across.
  Future<CustomerProfile> verifyContactOtp({
    required String otp,
    String? email,
    String? mobile,
  }) async {
    final data = await _api.post(
      '/api/v1/customer/auth/profile/contact/verify',
      body: {'otp': otp, 'email': ?email, 'mobile': ?mobile},
    );
    _set(Customer.fromJson(data));
    return CustomerProfile.fromJson(data);
  }

  /// Everything the profile screen shows.
  Future<CustomerProfile> profile() async {
    final data = await _api.get('/api/v1/customer/auth/profile');
    _set(Customer.fromJson(data));
    return CustomerProfile.fromJson(data);
  }

  Future<void> signOut() async {
    // Before the session goes: this phone should stop receiving the
    // account's notifications.
    await DeviceRepository.instance.unregister();

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
    final signedInNow = _customer == null && customer != null;
    _customer = customer;
    notifyListeners();

    // A push token that arrived before sign-in had no session to be saved
    // against, so every way in registers it again.
    if (signedInNow) unawaited(DeviceRepository.instance.register());
  }
}
