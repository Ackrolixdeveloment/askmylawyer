ALTER TABLE "payment_gateways" ADD COLUMN "provider" VARCHAR(20) NOT NULL DEFAULT 'cashfree';
ALTER TABLE "consultation_payments" ADD COLUMN "provider" VARCHAR(20) NOT NULL DEFAULT 'cashfree', ADD COLUMN "gateway_refund_id" VARCHAR(80);
CREATE TABLE "consultation_recordings" (
  "request_id" UUID PRIMARY KEY REFERENCES "consultation_requests"("id") ON DELETE CASCADE,
  "status" VARCHAR(20) NOT NULL, "resource_id" TEXT, "sid" TEXT, "files" JSONB, "problem" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL
);
