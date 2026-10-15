import 'dart:convert';
import 'dart:io' show Platform;
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import 'auth_repository.dart';

/// OAuth client ids for the AskMyLawyer Firebase project.
///
/// These are not secrets — the same values ship inside
/// `google-services.json` and `GoogleService-Info.plist` — so they are
/// defaulted here rather than demanded at every build. A different project
/// can still be pointed at without touching the code:
///
/// ```
/// flutter run \
///   --dart-define=GOOGLE_IOS_CLIENT_ID=....apps.googleusercontent.com \
///   --dart-define=GOOGLE_SERVER_CLIENT_ID=....apps.googleusercontent.com
/// ```
class SocialConfig {
  const SocialConfig._();

  /// iOS needs its own client id; Android reads it from the SHA-1 registered
  /// in the Google Cloud console and needs none here.
  static const iosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
    defaultValue: '11580874309-ness9jel8earoc8p19u8fvrmjaq6f19f'
        '.apps.googleusercontent.com',
  );

  /// The **web** client id of the same project. Google only puts an ID token
  /// in the response when it knows which backend the token is for, so
  /// without this the sign-in succeeds on the device and gives us nothing
  /// the server can verify.
  static const serverClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: '11580874309-vmf9qop7ikd59cqhb3fd89ittcleprt7'
        '.apps.googleusercontent.com',
  );

  static bool get googleReady => serverClientId.isNotEmpty;
}

/// Raised when sign-in could not be completed. [cancelled] separates "the
/// customer backed out", which deserves no error message, from a real
/// failure, which does.
class SocialSignInException implements Exception {
  const SocialSignInException(this.message, {this.cancelled = false});

  final String message;
  final bool cancelled;

  @override
  String toString() => message;
}

/// Signing in with Google or Apple.
///
/// Each provider is only asked to prove who the lawyer is; the account
/// itself is created by our backend, which verifies the returned token
/// against the provider's public keys before trusting a word of it.
class SocialSignIn {
  const SocialSignIn();

  static bool get appleAvailable => !kIsWeb && Platform.isIOS;

  /// Signs in and returns the account, so the caller can route on the
  /// onboarding status the same way every other sign-in does.
  Future<({bool isNewUser, LawyerAccount lawyer})> google() async {
    if (!SocialConfig.googleReady) {
      throw const SocialSignInException(
        'Google sign-in is not configured for this build.',
      );
    }

    final signIn = GoogleSignIn.instance;
    await _initialiseGoogleOnce(signIn);

    final GoogleSignInAccount account;
    try {
      account = await signIn.authenticate();
    } on GoogleSignInException catch (error) {
      throw SocialSignInException(
        'Google sign-in did not complete. Please try again.',
        cancelled: error.code == GoogleSignInExceptionCode.canceled,
      );
    }

    final idToken = account.authentication.idToken;
    if (idToken == null) {
      // Almost always a missing or mismatched serverClientId.
      throw const SocialSignInException(
        'Google did not return a sign-in token. Please try another way.',
      );
    }

    return AuthRepository.instance.signInWithGoogle(idToken);
  }

  /// Sign in with Apple. iOS only; the button is hidden elsewhere.
  Future<({bool isNewUser, LawyerAccount lawyer})> apple() async {
    // A nonce ties this request to this response: Apple puts its hash in
    // the token, and our backend checks the two match, so a token captured
    // in transit cannot be replayed.
    final rawNonce = _nonce();
    final hashedNonce = sha256.convert(utf8.encode(rawNonce)).toString();

    final AuthorizationCredentialAppleID credential;
    try {
      credential = await SignInWithApple.getAppleIDCredential(
        scopes: const [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: hashedNonce,
      );
    } on SignInWithAppleAuthorizationException catch (error) {
      throw SocialSignInException(
        'Apple sign-in did not complete. Please try again.',
        cancelled: error.code == AuthorizationErrorCode.canceled,
      );
    }

    final identityToken = credential.identityToken;
    if (identityToken == null) {
      throw const SocialSignInException(
        'Apple did not return a sign-in token. Please try another way.',
      );
    }

    return AuthRepository.instance.signInWithApple(
      identityToken: identityToken,
      rawNonce: rawNonce,
      // Apple sends the name on the first sign-in only, so it goes up now
      // or it is gone.
      fullName: _nameOf(credential),
    );
  }

  Future<void> _initialiseGoogleOnce(GoogleSignIn signIn) async {
    if (_googleReady != null) return _googleReady;

    _googleReady = signIn.initialize(
      clientId: SocialConfig.iosClientId.isEmpty ? null : SocialConfig.iosClientId,
      serverClientId: SocialConfig.serverClientId,
    );
    return _googleReady;
  }
}

/// `initialize` must be called exactly once per run, and the buttons can be
/// tapped more than once.
Future<void>? _googleReady;

String? _nameOf(AuthorizationCredentialAppleID credential) {
  final parts = [credential.givenName, credential.familyName]
      .whereType<String>()
      .map((part) => part.trim())
      .where((part) => part.isNotEmpty);
  return parts.isEmpty ? null : parts.join(' ');
}

/// A random string for Apple's nonce.
String _nonce([int length = 32]) {
  const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._';
  final random = Random.secure();
  return List.generate(length, (_) => chars[random.nextInt(chars.length)]).join();
}
