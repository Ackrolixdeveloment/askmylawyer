CREATE TYPE "RefundStatus" AS ENUM ('requested', 'processing', 'completed', 'failed', 'needs_review');
ALTER TABLE "consultation_payments"
  ADD COLUMN "refund_status" "RefundStatus",
  ADD COLUMN "refund_requested_at" TIMESTAMPTZ(6);

-- Old code marked refunds complete without gateway evidence. Keep the original
-- records intact for reconciliation, but never present them as confirmed.
UPDATE "consultation_payments"
SET "refund_status" = 'needs_review'
WHERE "status" = 'refunded' OR COALESCE("refund_amount", 0) > 0;
