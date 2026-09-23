-- CreateEnum
CREATE TYPE "EditRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "lawyer_edit_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "section" VARCHAR(60) NOT NULL,
    "status" "EditRequestStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "proof_key" TEXT,
    "proof_name" VARCHAR(255),
    "proof_mime" VARCHAR(100),
    "proof_size" INTEGER,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),
    "decided_by_id" UUID,
    "feedback" VARCHAR(1000),

    CONSTRAINT "lawyer_edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lawyer_edit_requests_status_requested_at_idx" ON "lawyer_edit_requests"("status", "requested_at");

-- CreateIndex
CREATE INDEX "lawyer_edit_requests_user_id_idx" ON "lawyer_edit_requests"("user_id");

-- AddForeignKey
ALTER TABLE "lawyer_edit_requests" ADD CONSTRAINT "lawyer_edit_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_edit_requests" ADD CONSTRAINT "lawyer_edit_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

