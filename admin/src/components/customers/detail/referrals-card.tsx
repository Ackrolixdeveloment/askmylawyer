import { Gift } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatInr } from "@/lib/format";
import type { ReferralSummary } from "@/types/customer";

export function ReferralsCard({ referral }: { referral: ReferralSummary | null }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Referrals</h2>

      {referral ? (
        <>
          <dl className="mt-3 space-y-3">
            <Row label="Referral code">
              <Badge tone="info" className="font-medium">
                {referral.code}
              </Badge>
            </Row>
            <Row label="Referral made">
              <span className="text-sm text-ink">
                {referral.invited} people invited
              </span>
            </Row>
            <Row label="Successful">
              <Badge tone="success">{referral.converted} converted</Badge>
            </Row>
            <Row label="Pending">
              <span className="text-sm text-ink">{referral.pendingNote}</span>
            </Row>
            <Row label="Rewards earned">
              <span className="text-sm text-ink">
                {formatInr(referral.rewardsEarned)} ({referral.rewardBreakdown})
              </span>
            </Row>
            <Row label="Verified">
              <span className="text-sm text-ink">{referral.verifiedNote}</span>
            </Row>
          </dl>

          <p className="mt-4 border-t border-line pt-3 text-sm font-semibold text-positive">
            {formatInr(referral.rewardsEarned)} credited to wallet
          </p>
        </>
      ) : (
        <EmptyState
          icon={Gift}
          title="No transaction yet"
          description="Once this customer books their first consultation, it will appear here with the lawyer, category, type, date, status, and amount."
        />
      )}
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}