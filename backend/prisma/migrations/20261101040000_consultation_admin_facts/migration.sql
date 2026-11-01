ALTER TABLE "consultation_requests" ADD COLUMN "payment_bypassed" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "cancelled_by" VARCHAR(20), ADD COLUMN "cancellation_reason" VARCHAR(255);
ALTER TABLE "consultation_sessions" ADD COLUMN "used_modes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "media_usage_known" BOOLEAN NOT NULL DEFAULT false;
