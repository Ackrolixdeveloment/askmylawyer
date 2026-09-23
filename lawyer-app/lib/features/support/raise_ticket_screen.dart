import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/upload_field.dart';
import 'support_data.dart';

/// Lets the lawyer raise a support ticket against a past consultation.
class RaiseTicketScreen extends StatefulWidget {
  const RaiseTicketScreen({super.key, this.category});

  /// Pre-selected when the screen is opened from a Quick Help card.
  final String? category;

  @override
  State<RaiseTicketScreen> createState() => _RaiseTicketScreenState();
}

class _RaiseTicketScreenState extends State<RaiseTicketScreen> {
  final _description = TextEditingController();
  final _consultationSearch = TextEditingController();

  late String? _category = widget.category;
  TicketConsultation? _consultation;

  /// The consultation list collapses once one is chosen.
  bool _pickerOpen = true;

  @override
  void initState() {
    super.initState();
    _description.addListener(() => setState(() {}));
    _consultationSearch.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _description.dispose();
    _consultationSearch.dispose();
    super.dispose();
  }

  List<TicketConsultation> get _visibleConsultations {
    final query = _consultationSearch.text.trim().toLowerCase();
    if (query.isEmpty) return ticketConsultations;

    return ticketConsultations
        .where((item) => item.client.toLowerCase().contains(query))
        .toList();
  }

  bool get _canSubmit =>
      _category != null &&
      _consultation != null &&
      _description.text.trim().isNotEmpty;

  void _submit() {
    // Both are looked up before popping: afterwards this route is gone and
    // its context can no longer resolve them.
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    // TODO: create the ticket through the backend.
    navigator.pop();
    messenger.showSnackBar(const SnackBar(content: Text('Ticket raised')));
  }

  @override
  Widget build(BuildContext context) {
    final consultations = _visibleConsultations;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
                children: [
                  Row(
                    children: [
                      InkWell(
                        onTap: () => Navigator.of(context).maybePop(),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.line),
                          ),
                          child: const Icon(
                            Icons.arrow_back,
                            size: 18,
                            color: AppColors.ink,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Raise a Ticket',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              "We're here to help you. Please describe your "
                              'issue.',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.inkSubtle,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Label('Select a Category'),
                        const SizedBox(height: 8),
                        _CategoryField(
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
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Label('Select Consultation'),
                        const SizedBox(height: 8),

                        InkWell(
                          onTap: () =>
                              setState(() => _pickerOpen = !_pickerOpen),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.line),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _consultation?.client ??
                                        'Select or Type to add',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: _consultation == null
                                          ? AppColors.inkSubtle
                                          : AppColors.ink,
                                    ),
                                  ),
                                ),
                                Icon(
                                  _pickerOpen
                                      ? Icons.expand_less
                                      : Icons.expand_more,
                                  size: 18,
                                  color: AppColors.inkSubtle,
                                ),
                              ],
                            ),
                          ),
                        ),

                        if (_pickerOpen) ...[
                          const SizedBox(height: 10),
                          for (final item in consultations)
                            _ConsultationRow(
                              item: item,
                              selected: _consultation == item,
                              onTap: () => setState(() {
                                _consultation = item;
                                _pickerOpen = false;
                              }),
                            ),
                          if (consultations.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 16),
                              child: Text(
                                'No consultations match.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.inkSubtle,
                                ),
                              ),
                            ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Label('Description'),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _description,
                          maxLines: 4,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.ink,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Describe your issue in detail...',
                            hintStyle: const TextStyle(
                              fontSize: 13,
                              color: AppColors.inkSubtle,
                            ),
                            isDense: true,
                            contentPadding: const EdgeInsets.all(12),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(
                                color: AppColors.line,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
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

                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Label('Upload documents (Optional)'),
                        const SizedBox(height: 8),
                        UploadField(
                          placeholder: 'Upload file',
                          helper: 'JPG, PNG, PDF up to 5MB',
                          maxSizeMb: 5,
                          allowedExtensions: const [
                            'jpg',
                            'jpeg',
                            'png',
                            'pdf',
                          ],
                          // Attachments are optional, so the field keeps its
                          // own state until the ticket is submitted.
                          onChanged: (_) {},
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  const _WhatHappensNext(),
                  const SizedBox(height: 12),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _canSubmit ? _submit : null,
                  child: const Text('Submit Ticket'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.ink,
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }
}

class _CategoryField extends StatelessWidget {
  const _CategoryField({required this.value, required this.onChanged});

  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      hint: const Text(
        'Select',
        style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
      ),
      items: quickHelpTopics
          .map(
            (topic) => DropdownMenuItem(
              value: topic,
              child: Text(topic, style: const TextStyle(fontSize: 13)),
            ),
          )
          .toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 12,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.brand),
        ),
      ),
    );
  }
}

class _ConsultationRow extends StatelessWidget {
  const _ConsultationRow({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final TicketConsultation item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: selected ? AppColors.brandSoft : AppColors.canvas,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
              child: Text(
                item.initials,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
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
                    item.client,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.when,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.inkSubtle,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '₹${item.fee}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WhatHappensNext extends StatelessWidget {
  const _WhatHappensNext();

  static const _points = [
    'Your ticket will be created and you will receive a ticket ID',
    'Our support team will respond within 24 hours',
    'Track ticket updates in your ticket via email and in-app notifications',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What happens next?',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 10),
          for (final point in _points)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 3),
                    child: Icon(
                      Icons.check_circle,
                      size: 12,
                      color: AppColors.positive,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      point,
                      style: const TextStyle(
                        fontSize: 10,
                        height: 1.5,
                        color: AppColors.inkSubtle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
