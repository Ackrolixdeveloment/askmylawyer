import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'case_details_screen.dart';
import 'choose_time_screen.dart';
import 'consultation_header.dart';

/// How the client wants to reach a lawyer.
enum ConsultMode { now, scheduled }

/// Step one of booking: pick an instant consult or schedule one for later.
class ConsultationScreen extends StatefulWidget {
  const ConsultationScreen({super.key, this.lawyersOnline = 8});

  /// Shown beside the avatars on the instant option.
  final int lawyersOnline;

  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  ConsultMode _mode = ConsultMode.now;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Column(
        children: [
          ConsultationHeader(
            title: 'Consultation',
            subtitle: "Choose how you'd like to connect",
            step: 1,
            // Scheduling inserts a slot picker, so that path runs one step
            // longer than an instant consult.
            ofSteps: switch (_mode) {
              ConsultMode.now => 2,
              ConsultMode.scheduled => 3,
            },
            onBack: () => Navigator.of(context).maybePop(),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 18, 14, 24),
              children: [
                const Text(
                  'How would you like to consult ?',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 3),
                const Text(
                  'Select an option that works best for you.',
                  style: TextStyle(fontSize: 14, color: AppColors.inkSubtle),
                ),
                const SizedBox(height: 14),

                _OptionCard(
                  title: 'Consult Now',
                  subtitle: 'Instant Connections with an available expert.',
                  selected: _mode == ConsultMode.now,
                  onTap: () => setState(() => _mode = ConsultMode.now),
                  footer: _OnlineLawyers(count: widget.lawyersOnline),
                ),
                const SizedBox(height: 12),
                _OptionCard(
                  title: 'Schedule a Call',
                  subtitle: 'Book a convenient time for your consultation.',
                  selected: _mode == ConsultMode.scheduled,
                  onTap: () => setState(() => _mode = ConsultMode.scheduled),
                ),
                const SizedBox(height: 18),

                // Continue takes the larger share: it is the primary action.
                Row(
                  children: [
                    Expanded(
                      flex: 5,
                      child: _BackButton(
                        onTap: () => Navigator.of(context).maybePop(),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      flex: 6,
                      child: _ContinueButton(
                        // Scheduling picks a slot first; an instant consult
                        // goes straight to the case details.
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => switch (_mode) {
                              ConsultMode.now => CaseDetailsScreen(mode: _mode),
                              ConsultMode.scheduled => const ChooseTimeScreen(),
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// One selectable consult option, with a radio dot on the left.
class _OptionCard extends StatelessWidget {
  const _OptionCard({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
    this.footer,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  /// Extra row beneath the copy — the online-lawyer strip on the instant card.
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.fromLTRB(13, 13, 13, 13),
        // No outline in either state — the fill alone carries the
        // selection, as in the design.
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFE6EAF1) : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: _RadioDot(selected: selected),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                  if (footer != null) ...[const SizedBox(height: 10), footer!],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Filled ring when chosen, hollow outline when not.
class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 16,
      height: 16,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? AppColors.ink : AppColors.inkSubtle,
          width: 1.5,
        ),
      ),
      // Ring plus a centred dot when chosen, rather than a thick ring.
      child: selected
          ? Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
            )
          : null,
    );
  }
}

/// Stacked initials of the lawyers currently available, plus a live count.
class _OnlineLawyers extends StatelessWidget {
  const _OnlineLawyers({required this.count});

  final int count;

  /// Stand-ins until the API supplies real avatars.
  static const _initials = ['P', 'S', 'Q', 'A'];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final initial in _initials) ...[
          // Fixed circles, so the initials never outgrow them.
          MediaQuery.withNoTextScaling(
            child: Container(
              width: 22,
              height: 22,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
              child: Text(
                initial,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 3),
        ],
        const SizedBox(width: 5),
        // Flexible so a large text scale ellipsises instead of overflowing.
        Flexible(
          child: Text(
            '• $count lawyers online',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.positive,
            ),
          ),
        ),
      ],
    );
  }
}

class _BackButton extends StatelessWidget {
  const _BackButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.line),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.chevron_left, size: 18, color: AppColors.ink),
            SizedBox(width: 2),
            Text(
              'Back',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContinueButton extends StatelessWidget {
  const _ContinueButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Continue',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 2),
            Icon(Icons.chevron_right, size: 18, color: Colors.white),
          ],
        ),
      ),
    );
  }
}
