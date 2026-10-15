-- AlterTable
ALTER TABLE "consultation_payments" ADD COLUMN     "refund_amount" INTEGER,
ADD COLUMN     "refund_reason" VARCHAR(255);

-- AlterTable
ALTER TABLE "consultation_sessions" ADD COLUMN     "customer_in_call" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customer_last_seen_at" TIMESTAMPTZ(6),
ADD COLUMN     "lawyer_in_call" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lawyer_last_seen_at" TIMESTAMPTZ(6),
ADD COLUMN     "talked_seconds" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "consultation_settings" ADD COLUMN     "absence_grace_seconds" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "allow_end_when_abandoned" BOOLEAN NOT NULL DEFAULT true;

