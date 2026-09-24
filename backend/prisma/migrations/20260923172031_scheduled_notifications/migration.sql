-- CreateEnum
CREATE TYPE "ScheduledStatus" AS ENUM ('scheduled', 'sent', 'cancelled', 'failed');

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "audience" "NotificationAudience" NOT NULL,
    "target_user_id" UUID,
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL,
    "status" "ScheduledStatus" NOT NULL DEFAULT 'scheduled',
    "sent_at" TIMESTAMPTZ(6),
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "error" VARCHAR(500),
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_notifications_status_scheduled_for_idx" ON "scheduled_notifications"("status", "scheduled_for");

-- AddForeignKey
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

