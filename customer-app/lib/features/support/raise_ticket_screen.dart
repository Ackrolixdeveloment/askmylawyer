import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import 'support_data.dart';

/// Form for raising a new support ticket. Pops the finished ticket so the
/// list can add it.
class RaiseTicketScreen extends StatefulWidget {
  const RaiseTicketScreen({super.key, required this.nextId});

  /// Supplied by the list so ids stay unique without a backend.
  final String nextId;

  @override
  State<RaiseTicketScreen> createState() => _RaiseTicketScreenState();
}

class _RaiseTicketScreenState extends State<RaiseTicketScreen> {
  final _description = TextEditingController();

  TicketCategory? _category;
  ConsultationOption? _consultation;

  /// The consultation picker is a disclosure rather than a dropdown, so the
  /// list expands in place as in the mockup.
  bool _pickerOpen = true;

  @override
  void initState() {
    super.initState();
    _description.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _category != null && _description.text.trim().isNotEmpty;

  void _submit() {
    final description = _description.text.trim();

    // TODO: post the ticket to the backend and use the id it returns.
    final ticket = SupportTicket(
      id: widget.nextId,
      title: _consultation == null
          ? _category!.label
          : 'Consultation with ${_consultation!.lawyer}',
      category: _category!,
      status: TicketStatus.open,
      createdOn: 'Just now',
      lastUpdated: 'Just now',
      lastUpdatedLabel: 'just now',
      description: description,
      conversation: [
        TicketMessage(
          body: description,
          timestamp: 'Just now',
          fromSupport: false,
        ),
      ],
    );

    Navigator.of(context).pop(ticket);
  }

  @override
  Widget build(BuildContext context) {
    // Read before removePadding below, which would otherwise zero the inset
    // this height depends on.
    final navHeight = shellNavHeight(context);

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          color: AppColors.ink,
        ),
        title: const Text(
          'Raise a Ticket',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
      ),
      // Submit lives in the bar slot so the shell's floating nav cannot
      // cover it; the body scrolls above it. The Scaffold would add the
      // device inset again on top of shellNavHeight, which already counts
      // it, so that padding is removed here.
      bottomNavigationBar: MediaQuery.removePadding(
        context: context,
        removeBottom: true,
        child: Padding(
          padding: EdgeInsets.fromLTRB(14, 8, 14, 12 + navHeight),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _canSubmit ? _submit : null,
              child: const Text('Submit Ticket'),
            ),
          ),
        ),
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.opaque,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 16),
                children: [
                  const Padding(
                    padding: EdgeInsets.only(left: 2),
                    child: Text(
                      'We’re here to help you. Please describe your issue.',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const _CardLabel('Select a Category'),
                        const SizedBox(height: 10),
                        _CategoryDropdown(
                          value: _category,
                          onChanged: (value) =>
                              setState(() => _category = value),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const _CardLabel('Select Consultation'),
                        const SizedBox(height: 10),
                        _ConsultationPicker(
                          selected: _consultation,
                          open: _pickerOpen,
                          onToggle: () =>
                              setState(() => _pickerOpen = !_pickerOpen),
                          onSelect: (option) => setState(
                            // Tapping the chosen row again clears it, since
                            // the consultation is optional.
                            () => _consultation =
                                _consultation == option ? null : option,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const _CardLabel('Description'),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _description,
                          maxLines: 5,
                          minLines: 4,
                          textCapitalization: TextCapitalization.sentences,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.ink,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Describe your issue in detail..',
                            hintStyle: const TextStyle(
                              fontSize: 13,
                              color: AppColors.inkSubtle,
                            ),
                            filled: true,
                            fillColor: AppColors.surface,
                            contentPadding: const EdgeInsets.all(12),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: const BorderSide(
                                color: AppColors.line,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: const BorderSide(
                                color: AppColors.brand,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  const _Card(child: _UploadBox()),
                  const SizedBox(height: 12),

                  const _Card(child: _WhatHappensNext()),
                ],
              ),
            ),

          ],
        ),
      ),
    );
  }
}

class _CategoryDropdown extends StatelessWidget {
  const _CategoryDropdown({required this.value, required this.onChanged});

  final TicketCategory? value;
  final ValueChanged<TicketCategory?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<TicketCategory>(
          value: value,
          isExpanded: true,
          borderRadius: BorderRadius.circular(10),
          hint: const Text(
            'Select',
            style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
          ),
          icon: const Icon(
            Icons.keyboard_arrow_down,
            size: 20,
            color: AppColors.inkMuted,
          ),
          // Built from the theme's style so the selected item keeps Inter
          // rather than falling back to the platform serif.
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppColors.ink,
          ),
          items: TicketCategory.values
              .map(
                (category) => DropdownMenuItem(
                  value: category,
                  child: Text(category.label),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

/// Collapsible list of the customer's consultations.
class _ConsultationPicker extends StatelessWidget {
  const _ConsultationPicker({
    required this.selected,
    required this.open,
    required this.onToggle,
    required this.onSelect,
  });

  final ConsultationOption? selected;
  final bool open;
  final VoidCallback onToggle;
  final ValueChanged<ConsultationOption> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: onToggle,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    selected == null
                        ? 'Select or Type to add'
                        : '${selected!.lawyer} · ${selected!.slot}',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      color: selected == null
                          ? AppColors.inkSubtle
                          : AppColors.ink,
                    ),
                  ),
                ),
                Icon(
                  open ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  size: 20,
                  color: AppColors.inkMuted,
                ),
              ],
            ),
          ),
        ),

        if (open) ...[
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                for (final option in consultationOptions) ...[
                  _ConsultationRow(
                    option: option,
                    active: option == selected,
                    onTap: () => onSelect(option),
                  ),
                  if (option != consultationOptions.last)
                    const Divider(height: 1, color: AppColors.line),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _ConsultationRow extends StatelessWidget {
  const _ConsultationRow({
    required this.option,
    required this.active,
    required this.onTap,
  });

  final ConsultationOption option;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        color: active ? AppColors.canvas : Colors.transparent,
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
              child: Text(
                option.initials,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.lawyer,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    option.slot,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              option.fee,
              style: const TextStyle(
                fontSize: 13,
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

class _UploadBox extends StatelessWidget {
  const _UploadBox();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _CardLabel('Upload documents (Optional)'),
        const SizedBox(height: 12),
        // TODO: attach a real file; file_picker is not a dependency yet.
        DottedBorderBox(
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(
                    Icons.file_upload_outlined,
                    size: 16,
                    color: AppColors.brand,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Upload file',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.brand,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'JPG, PNG, PDF up to 3MB',
                style: TextStyle(fontSize: 11, color: AppColors.inkSubtle),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Dashed rectangle used by the upload area.
class DottedBorderBox extends StatelessWidget {
  const DottedBorderBox({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: const _DashedRectPainter(),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 12),
        child: child,
      ),
    );
  }
}

class _DashedRectPainter extends CustomPainter {
  const _DashedRectPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.inkSubtle
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    const radius = Radius.circular(10);
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      radius,
    );

    // Walk the rounded outline, painting every other 5px span.
    final path = Path()..addRRect(rect);
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        canvas.drawPath(
          metric.extractPath(distance, distance + 5),
          paint,
        );
        distance += 10;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedRectPainter oldDelegate) => false;
}

class _WhatHappensNext extends StatelessWidget {
  const _WhatHappensNext();

  static const _points = [
    'Your tickets will be created and you will receive a ticket ID.',
    'Our support team will respond within 24 hours.',
    'You will receive updates on your ticket via email and in-app '
        'notifications.',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _CardLabel('What happens next?'),
        const SizedBox(height: 10),
        for (final point in _points)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 5),
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: AppColors.ink,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    point,
                    style: const TextStyle(
                      fontSize: 12,
                      height: 1.5,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: child,
    );
  }
}

class _CardLabel extends StatelessWidget {
  const _CardLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}
