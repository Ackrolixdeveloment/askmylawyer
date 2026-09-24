-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('pending_payment', 'searching', 'assigned', 'active', 'completed', 'cancelled', 'no_lawyer', 'refunded');

-- CreateEnum
CREATE TYPE "OfferOutcome" AS ENUM ('ringing', 'accepted', 'declined', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "lawyer_presence" (
    "user_id" UUID NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "active_sessions" INTEGER NOT NULL DEFAULT 0,
    "busy_until" TIMESTAMPTZ(6),
    "last_heartbeat_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lawyer_presence_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "consultation_requests" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "plan_code" VARCHAR(30) NOT NULL,
    "plan_name" VARCHAR(60) NOT NULL,
    "amount" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "category" VARCHAR(120),
    "description" VARCHAR(1000),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'searching',
    "lawyer_id" UUID,
    "search_ends_at" TIMESTAMPTZ(6),
    "assigned_at" TIMESTAMPTZ(6),
    "scheduled_for" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consultation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_offers" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "lawyer_id" UUID NOT NULL,
    "outcome" "OfferOutcome" NOT NULL DEFAULT 'ringing',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "answered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_sessions" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "channel" VARCHAR(64) NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "ended_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lawyer_presence_is_online_last_heartbeat_at_idx" ON "lawyer_presence"("is_online", "last_heartbeat_at");

-- CreateIndex
CREATE INDEX "consultation_requests_status_search_ends_at_idx" ON "consultation_requests"("status", "search_ends_at");

-- CreateIndex
CREATE INDEX "consultation_requests_customer_id_created_at_idx" ON "consultation_requests"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "consultation_offers_outcome_expires_at_idx" ON "consultation_offers"("outcome", "expires_at");

-- CreateIndex
CREATE INDEX "consultation_offers_lawyer_id_outcome_idx" ON "consultation_offers"("lawyer_id", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_offers_request_id_lawyer_id_key" ON "consultation_offers"("request_id", "lawyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_sessions_request_id_key" ON "consultation_sessions"("request_id");

-- AddForeignKey
ALTER TABLE "lawyer_presence" ADD CONSTRAINT "lawyer_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_offers" ADD CONSTRAINT "consultation_offers_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_offers" ADD CONSTRAINT "consultation_offers_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

