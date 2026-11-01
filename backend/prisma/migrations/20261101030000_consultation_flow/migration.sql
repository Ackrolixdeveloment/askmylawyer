ALTER TYPE "ConsultationStatus" ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE "ExtensionStatus" ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TABLE "consultation_settings" ADD COLUMN "preparation_minutes" INTEGER NOT NULL DEFAULT 3, ADD COLUMN "extension_payment_seconds" INTEGER NOT NULL DEFAULT 180;
ALTER TABLE "consultation_requests" ADD COLUMN "preparation_minutes" INTEGER NOT NULL DEFAULT 3, ADD COLUMN "extension_minutes" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "extension_amount" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "max_extensions" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "gst" INTEGER NOT NULL DEFAULT 0;
UPDATE "consultation_requests" r SET "extension_minutes" = p."extension_minutes", "extension_amount" = p."extension_amount", "max_extensions" = p."max_extensions" FROM "service_plans" p WHERE r."plan_code" = p."code";
ALTER TABLE "consultation_sessions" ADD COLUMN "ready_at" TIMESTAMPTZ(6);
ALTER TABLE "consultation_extensions" ADD COLUMN "order_id" VARCHAR(60), ADD COLUMN "environment" "GatewayEnvironment", ADD COLUMN "key_id" VARCHAR(120), ADD COLUMN "reference" VARCHAR(120), ADD COLUMN "refund_status" "RefundStatus", ADD COLUMN "gateway_refund_id" VARCHAR(80);
CREATE UNIQUE INDEX "consultation_extensions_order_id_key" ON "consultation_extensions"("order_id");
CREATE INDEX "consultation_requests_scheduled_for_idx" ON "consultation_requests"("status", "scheduled_for");
