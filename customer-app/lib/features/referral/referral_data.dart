// Placeholder referral data. Swap for the API once it exists — the screens
// already handle an empty invite list.

class ReferralInvite {
  const ReferralInvite({
    required this.name,
    required this.signedUpOn,
    required this.amount,
  });

  final String name;
  final String signedUpOn;

  /// Credited once their first consultation completes.
  final int amount;

  String get initials => name
      .split(' ')
      .where((part) => part.isNotEmpty)
      .map((part) => part[0])
      .take(2)
      .join()
      .toUpperCase();
}

class ReferralData {
  const ReferralData({
    required this.rewardPerReferral,
    required this.inviteCode,
    required this.invites,
  });

  final int rewardPerReferral;

  /// Shared with friends, e.g. ASK100XYZ.
  final String inviteCode;

  final List<ReferralInvite> invites;

  int get earned => invites.fold(0, (total, invite) => total + invite.amount);
}

const _invite = ReferralInvite(
  name: 'Rahul Sharma',
  signedUpOn: '20 May 2026',
  amount: 500,
);

/// An account that has already referred successfully.
const activeReferral = ReferralData(
  rewardPerReferral: 500,
  inviteCode: 'ASK100XYZ',
  invites: [_invite, _invite, _invite, _invite],
);

/// A brand new account: the invite pitch, nothing tracked yet.
const freshReferral = ReferralData(
  rewardPerReferral: 500,
  inviteCode: 'ASK100XYZ',
  invites: [],
);
