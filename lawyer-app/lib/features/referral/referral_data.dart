// Placeholder referral data. Swap for the API once it exists — the screen
// shows the invite state until there are earnings.

class ReferralEarning {
  const ReferralEarning({
    required this.lawyer,
    required this.referralId,
    required this.status,
    required this.when,
    required this.amount,
  });

  final String lawyer;
  final String referralId;
  final String status;
  final String when;
  final int amount;
}

class ReferralData {
  const ReferralData({
    required this.rewardPerReferral,
    required this.inviteLink,
    required this.totalReferrals,
    required this.activeLawyers,
    required this.earnings,
  });

  final int rewardPerReferral;
  final String inviteLink;
  final int totalReferrals;
  final int activeLawyers;
  final List<ReferralEarning> earnings;

  /// Nothing referred yet, so the screen pitches the scheme instead.
  bool get isFresh => earnings.isEmpty;

  int get earned =>
      earnings.fold(0, (total, earning) => total + earning.amount);
}

/// A brand new account: the invite pitch, no earnings yet.
const freshReferral = ReferralData(
  rewardPerReferral: 500,
  inviteLink: 'askmylawyer.app/invite./gaus',
  totalReferrals: 0,
  activeLawyers: 0,
  earnings: [],
);

const _earning = ReferralEarning(
  lawyer: 'Adv. Priyanshu Sharma',
  referralId: 'REF-223591',
  status: 'Successfully completed first consultation',
  when: '03/03/2026, 12:44pm',
  amount: 500,
);

/// An account that has already referred successfully.
const activeReferral = ReferralData(
  rewardPerReferral: 500,
  inviteLink: 'askmylawyer.app/invite./gaus',
  totalReferrals: 12,
  activeLawyers: 8,
  earnings: [_earning, _earning, _earning],
);
