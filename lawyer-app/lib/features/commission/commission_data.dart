// Placeholder earnings data. Swap for the API once it exists — the screen
// already handles an empty list.

enum PayoutState { paidOut, pending }

class Earning {
  const Earning({
    required this.client,
    required this.practice,
    required this.medium,
    required this.date,
    required this.time,
    required this.durationMinutes,
    required this.amount,
    required this.state,
    this.caseTag = 'Child Custody',
    this.customerPaid = 799,
    this.platformFeePercent = 20,
    this.bankAccount = 'XXX 4556678',
    this.reference = 'TNX-45678234',
    this.payoutDate = '12 Jun 2026 . 2:30 pm',
  });

  final String client;
  final String practice;
  final String medium;
  final String date;
  final String time;
  final int durationMinutes;
  final double amount;
  final PayoutState state;

  final String caseTag;

  /// What the customer was charged, before the platform's cut.
  final double customerPaid;
  final int platformFeePercent;

  final String bankAccount;
  final String reference;
  final String payoutDate;

  /// The platform's share of what the customer paid.
  double get platformFee => customerPaid * platformFeePercent / 100;

  String get initials => client
      .split(' ')
      .map((part) => part.isEmpty ? '' : part[0])
      .take(2)
      .join()
      .toUpperCase();
}

class CommissionData {
  const CommissionData({
    required this.creditBalance,
    required this.underProcess,
    required this.underProcessCount,
    required this.thisMonth,
    required this.thisMonthSessions,
    required this.recent,
  });

  /// Ready to withdraw.
  final double creditBalance;

  /// Settled but not yet credited.
  final double underProcess;
  final int underProcessCount;

  final double thisMonth;
  final int thisMonthSessions;

  final List<Earning> recent;
}

const commissionSample = CommissionData(
  creditBalance: 12450,
  underProcess: 1998,
  underProcessCount: 2,
  thisMonth: 23450,
  thisMonthSessions: 109,
  recent: [
    Earning(
      client: 'Sarah M.',
      practice: 'Family Law',
      medium: 'Video Call',
      date: '12 Jun',
      time: '2:30 PM',
      durationMinutes: 13,
      amount: 799,
      state: PayoutState.paidOut,
    ),
    Earning(
      client: 'Sarah M.',
      practice: 'Family Law',
      medium: 'Video Call',
      date: '12 Jun',
      time: '2:30 PM',
      durationMinutes: 13,
      amount: 799,
      state: PayoutState.pending,
    ),
    Earning(
      client: 'Sarah M.',
      practice: 'Family Law',
      medium: 'Video Call',
      date: '12 Jun',
      time: '2:30 PM',
      durationMinutes: 13,
      amount: 799,
      state: PayoutState.paidOut,
    ),
    Earning(
      client: 'Sarah M.',
      practice: 'Family Law',
      medium: 'Video Call',
      date: '12 Jun',
      time: '2:30 PM',
      durationMinutes: 13,
      amount: 799,
      state: PayoutState.pending,
    ),
  ],
);
