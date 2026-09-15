import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../auth/get_started_screen.dart';

class OnboardingPage {
  const OnboardingPage({
    required this.asset,
    required this.title,
    required this.body,
  });

  final String asset;
  final String title;
  final String body;
}

/// Three-screen walkthrough shown before the lawyer registers.
const _pages = <OnboardingPage>[
  OnboardingPage(
    asset: 'assets/images/splash.png',
    title: 'Welcome to Ask My Lawyer',
    body:
        'Connect with people seeking legal guidance and grow your practice '
        'through meaningful consultations.',
  ),
  OnboardingPage(
    asset: 'assets/images/splash.png',
    title: 'Consult From Anywhere',
    body:
        'Respond through chat, voice, or video consultations and provide legal '
        'assistance on your schedule.',
  ),
  OnboardingPage(
    asset: 'assets/images/splash.png',
    title: 'Become a Verified Lawyer',
    body:
        'Join our trusted network of legal professionals and connect with '
        'clients seeking legal guidance.',
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _isLast => _index == _pages.length - 1;

  void _next() {
    _controller.nextPage(
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
    );
  }

  /// Skipping and finishing both land on the same sign-up screen.
  void _goToGetStarted() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const GetStartedScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Artwork sits in the upper half, copy in the sheet below.
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (index) => setState(() => _index = index),
                itemBuilder: (context, index) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  child: Center(
                    child: Image.asset(
                      _pages[index].asset,
                      width: 220,
                      filterQuality: FilterQuality.high,
                    ),
                  ),
                ),
              ),
            ),
            _OnboardingSheet(
              page: _pages[_index],
              index: _index,
              count: _pages.length,
              isLast: _isLast,
              onSkip: _goToGetStarted,
              onNext: _next,
              onRegister: _goToGetStarted,
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingSheet extends StatelessWidget {
  const _OnboardingSheet({
    required this.page,
    required this.index,
    required this.count,
    required this.isLast,
    required this.onSkip,
    required this.onNext,
    required this.onRegister,
  });

  final OnboardingPage page;
  final int index;
  final int count;
  final bool isLast;
  final VoidCallback onSkip;
  final VoidCallback onNext;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(count, (dot) {
              final active = dot == index;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                height: 6,
                width: active ? 18 : 6,
                decoration: BoxDecoration(
                  color: active ? AppColors.ink : AppColors.inkSubtle,
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
          const SizedBox(height: 24),
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            page.body,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              height: 1.5,
              color: AppColors.inkMuted,
            ),
          ),
          const SizedBox(height: 28),

          // The last screen commits to registering; the first can be skipped.
          if (isLast)
            FilledButton(
              onPressed: onRegister,
              child: const Text('Register as Lawyer'),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(onPressed: onSkip, child: const Text('Skip')),
                FilledButton(onPressed: onNext, child: const Text('Next')),
              ],
            ),
        ],
      ),
    );
  }
}
