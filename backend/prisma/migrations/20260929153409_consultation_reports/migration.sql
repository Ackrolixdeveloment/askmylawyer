-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('generating', 'awaiting_review', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('held', 'available', 'paid_out');

-- AlterTable
ALTER TABLE "consultation_settings" ADD COLUMN     "hold_earnings_until_report" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_report_extensions" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "report_extension_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "report_review_minutes" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "consultation_reports" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'generating',
    "case_summary" TEXT NOT NULL DEFAULT '',
    "legal_guidance" TEXT NOT NULL DEFAULT '',
    "next_steps" TEXT NOT NULL DEFAULT '',
    "transcript" TEXT,
    "problem" VARCHAR(255),
    "drafted_at" TIMESTAMPTZ(6),
    "review_ends_at" TIMESTAMPTZ(6),
    "review_extensions" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMPTZ(6),
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consultation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_attachments" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lawyer_earnings" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "lawyer_id" UUID NOT NULL,
    "gross" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL,
    "net" INTEGER NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'held',
    "held_reason" VARCHAR(255),
    "released_at" TIMESTAMPTZ(6),
    "paid_out_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lawyer_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultation_reports_request_id_key" ON "consultation_reports"("request_id");

-- CreateIndex
CREATE INDEX "consultation_reports_status_review_ends_at_idx" ON "consultation_reports"("status", "review_ends_at");

-- CreateIndex
CREATE INDEX "report_attachments_report_id_idx" ON "report_attachments"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_earnings_request_id_key" ON "lawyer_earnings"("request_id");

-- CreateIndex
CREATE INDEX "lawyer_earnings_lawyer_id_status_idx" ON "lawyer_earnings"("lawyer_id", "status");

-- AddForeignKey
ALTER TABLE "consultation_reports" ADD CONSTRAINT "consultation_reports_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "consultation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_earnings" ADD CONSTRAINT "lawyer_earnings_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_earnings" ADD CONSTRAINT "lawyer_earnings_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

