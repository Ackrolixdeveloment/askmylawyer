-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('created', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "consultation_payments" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "order_id" VARCHAR(60) NOT NULL,
    "amount" INTEGER NOT NULL,
    "gst" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'created',
    "environment" "GatewayEnvironment" NOT NULL,
    "session_id" VARCHAR(255),
    "reference" VARCHAR(120),
    "method" VARCHAR(40),
    "failure_reason" VARCHAR(255),
    "paid_at" TIMESTAMPTZ(6),
    "refunded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consultation_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultation_payments_request_id_key" ON "consultation_payments"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_payments_order_id_key" ON "consultation_payments"("order_id");

-- CreateIndex
CREATE INDEX "consultation_payments_status_created_at_idx" ON "consultation_payments"("status", "created_at");

-- AddForeignKey
ALTER TABLE "consultation_payments" ADD CONSTRAINT "consultation_payments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

