import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class OnboardingPage {
  const OnboardingPage({
    required this.asset,
    required this.title,
    required this.body,
  });

  final String asset;
  final String title;
  final String body;

  /// The welcome page shows the wordmark, which needs to sit at logo scale
  /// rather than filling the panel like the clay illustrations do.
  bool get isWordmark => asset.endsWith('logo.png');
}

/// Four-screen walkthrough shown before the customer signs in.
const _pages = <OnboardingPage>[
  OnboardingPage(
    asset: 'assets/images/logo.png',
    title: 'Welcome to Ask My Lawyer',
    body:
        'Connect with people seeking legal guidance and grow your practice '
        'through meaningful consultations.',
  ),
  OnboardingPage(
    asset: 'assets/images/illustration-canvas.png',
    title: 'Verified Lawyers',
    body:
        'Get expert advice from experienced and verified lawyers you can '
        'trust.',
  ),
  OnboardingPage(
    asset: 'assets/images/clay-3d-scene.png',
    title: 'Flexible Consultations',
    body:
        'Choose instant calls or book a consultation time that suits your '
        'schedule.',
  ),
  OnboardingPage(
    asset: 'assets/images/three-d-scene.png',
    title: 'Detailed Reports',
    body:
        'Receive a detailed consultation report with clear legal guidance '
        'and next steps.',
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onDone});

  /// Fired by both Skip and the final button — onboarding is done either way.
  final VoidCallback onDone;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // The sheet paints its own background to the bottom edge, so only the
      // top inset is consumed here.
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Artwork takes a fixed share of the height rather than every
            // pixel the sheet leaves over — on a tall phone an `Expanded`
            // here strands the image in the middle of a huge empty box.
            Expanded(
              flex: 3,
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (index) => setState(() => _index = index),
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 48),
                    child: Center(
                      child: Image.asset(
                        page.asset,
                        width: page.isWordmark ? 220 : null,
                        filterQuality: FilterQuality.high,
                        // A missing illustration should degrade to a muted
                        // glyph rather than paint a red error box over the
                        // first screen a customer ever sees.
                        errorBuilder: (context, error, stackTrace) => Icon(
                          Icons.gavel_rounded,
                          size: 96,
                          color: AppColors.brand.withValues(alpha: 0.35),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            _OnboardingSheet(
              page: _pages[_index],
              index: _index,
              count: _pages.length,
              isLast: _isLast,
              onSkip: widget.onDone,
              onNext: _next,
              onFinish: widget.onDone,
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
    required this.onFinish,
  });

  final OnboardingPage page;
  final int index;
  final int count;
  final bool isLast;
  final VoidCallback onSkip;
  final VoidCallback onNext;
  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    // Clear the home indicator on gesture-nav iPhones, which SafeArea no
    // longer covers now that the sheet runs to the bottom edge.
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + bottomInset),
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

          // The last screen commits; the earlier ones can be skipped.
          if (isLast)
            FilledButton(onPressed: onFinish, child: const Text('Get Started'))
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
