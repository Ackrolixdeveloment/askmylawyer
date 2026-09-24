import 'package:flutter/material.dart';

import 'core/app_navigator.dart';
import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/customer_session.dart';
import 'features/auth/get_started_screen.dart';
import 'features/home/home_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/onboarding/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  _endSessionOnServerSayingSo();
  runApp(const CustomerApp());
}

/// If the backend says the session is over — suspended, or signed in on
/// another phone — drop back to the sign-in screen from wherever they are.
void _endSessionOnServerSayingSo() {
  ApiClient.instance.onSessionEnded = (message) {
    CustomerSession.instance.endedBy(message);

    appNavigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const GetStartedScreen()),
      (route) => false,
    );
  };
}

class CustomerApp extends StatelessWidget {
  const CustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ask My Lawyer',
      navigatorKey: appNavigatorKey,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      // A large system font setting would otherwise scale every screen past
      // its layout; allow some growth, but cap it.
      builder: (context, child) {
        final media = MediaQuery.of(context);
        return MediaQuery(
          data: media.copyWith(
            // Honour the reader's own setting, but cap it: past ~1.4 the
            // denser cards start clipping. Never scale below 1.
            textScaler: media.textScaler.clamp(
              minScaleFactor: 1,
              maxScaleFactor: 1.4,
            ),
          ),
          child: child!,
        );
      },
      home: const _Entry(),
    );
  }
}

/// Splash, then onboarding, then sign-in — unless a session from an earlier
/// run is still good, which skips straight to the home shell.
enum _Stage { splash, onboarding, auth, home }

class _Entry extends StatefulWidget {
  const _Entry();

  @override
  State<_Entry> createState() => _EntryState();
}

class _EntryState extends State<_Entry> {
  _Stage _stage = _Stage.splash;

  /// How long the splash will hold for the stored session before giving up
  /// and asking them to sign in again.
  static const _restoreTimeout = Duration(seconds: 3);

  /// Answered while the splash is up, so signing back in costs no extra wait.
  Future<bool>? _restoring;

  @override
  void initState() {
    super.initState();
    _restoring = CustomerSession.instance.restore().timeout(
      _restoreTimeout,
      onTimeout: () => false,
    );
  }

  Future<void> _afterSplash() async {
    final signedIn = await (_restoring ?? Future.value(false));
    if (!mounted) return;

    // Onboarding is for new arrivals; someone already signed in has seen it.
    setState(() => _stage = signedIn ? _Stage.home : _Stage.onboarding);
  }

  @override
  Widget build(BuildContext context) {
    return switch (_stage) {
      _Stage.splash => SplashScreen(onDone: _afterSplash),
      _Stage.onboarding => OnboardingScreen(
        onDone: () => setState(() => _stage = _Stage.auth),
      ),
      _Stage.auth => const GetStartedScreen(),
      _Stage.home => const HomeScreen(),
    };
  }
}
