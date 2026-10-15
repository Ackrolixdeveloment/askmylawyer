-- AlterTable
ALTER TABLE "consultation_sessions" ADD COLUMN     "expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "last_left_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "consultation_sessions_expires_at_idx" ON "consultation_sessions"("expires_at");

