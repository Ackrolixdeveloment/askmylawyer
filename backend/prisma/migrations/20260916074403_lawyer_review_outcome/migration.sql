-- AlterTable
ALTER TABLE "lawyer_profiles" ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "correction_notes" JSONB,
ADD COLUMN     "correction_requested_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejected_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejection_reason" VARCHAR(1000),
ADD COLUMN     "reviewed_at" TIMESTAMPTZ(6),
ADD COLUMN     "reviewed_by_id" UUID;

-- AddForeignKey
ALTER TABLE "lawyer_profiles" ADD CONSTRAINT "lawyer_profiles_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

