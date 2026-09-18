import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../profile/profile_repository.dart';
import 'change_bank_screen.dart';

/// Shows the account payouts are sent to, with a way to replace it.
class ManageBankScreen extends StatefulWidget {
  const ManageBankScreen({super.key});

  @override
  State<ManageBankScreen> createState() => _ManageBankScreenState();
}

class _ManageBankScreenState extends State<ManageBankScreen> {
  BankAccount? bank;
  BankAccount? pending;
  String? _feedback;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final profile = await ProfileRepository.instance.load();
      if (!mounted) return;
      setState(() {
        bank = profile.bank;
        pending = profile.pendingBank;
        _feedback = profile.bankChangeFeedback;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  /// Opens the form, then picks up whatever was saved.
  Future<void> _change() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(builder: (_) => ChangeBankScreen(current: bank)),
    );
    if (changed == true) await _load();
  }

  String get bankName => _error ?? bank?.bankName ?? 'No account added';
  String get maskedNumber => bank?.accountNumberMasked ?? '-';
  String get holder => bank?.holderName ?? '-';
  bool get verified => bank != null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: InkWell(
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
            ),
            const SizedBox(height: 20),

            const Text(
              'Manage Bank Account',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'This is where your consultation payouts are sent.',
              style: TextStyle(fontSize: 13, color: AppColors.inkSubtle),
            ),
            const SizedBox(height: 20),

            // The admin turned the last change down.
            if (_feedback != null && pending == null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  border: Border.all(color: const Color(0xFFFECACA)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 16,
                      color: AppColors.negative,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your last bank change was not approved: $_feedback',
                        style: const TextStyle(
                          fontSize: 12,
                          height: 1.45,
                          color: AppColors.negative,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            const Text(
              'Bank Account',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 8),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.account_balance,
                    size: 20,
                    color: AppColors.negative,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: bankName,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ink,
                                ),
                              ),
                              const TextSpan(text: '  '),
                              TextSpan(
                                text: maskedNumber,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ink,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          holder,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.inkSubtle,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (verified) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.positive.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.check,
                            size: 12,
                            color: AppColors.positive,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Verified',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.positive,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                  ],
                  const Icon(
                    Icons.chevron_right,
                    size: 18,
                    color: AppColors.inkSubtle,
                  ),
                ],
              ),
            ),
            if (pending != null) ...[
              const SizedBox(height: 12),
              _PendingAccount(account: pending!),
            ],
            const SizedBox(height: 12),

            if (pending != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  border: Border.all(color: AppColors.line),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Your new account is with our team for review. Payouts keep '
                  'going to the verified account until it is approved.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.45,
                    color: AppColors.inkMuted,
                  ),
                ),
              )
            else
              InkWell(
                onTap: _change,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.edit_outlined, size: 16, color: AppColors.ink),
                      SizedBox(width: 8),
                      Text(
                        'Change Bank Account',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// The account waiting on an admin, shown under the verified one.
class _PendingAccount extends StatelessWidget {
  const _PendingAccount({required this.account});

  final BankAccount account;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: const Color(0xFFFED7AA)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.account_balance,
            size: 20,
            color: AppColors.inkMuted,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${account.bankName}  ${account.accountNumberMasked}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  account.holderName,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Pending approval',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Color(0xFFC2410C),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
