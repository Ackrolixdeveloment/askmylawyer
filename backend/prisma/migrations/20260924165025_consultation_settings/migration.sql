-- CreateEnum
CREATE TYPE "DispatchMode" AS ENUM ('broadcast', 'sequential');

-- CreateTable
CREATE TABLE "consultation_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "demo_mode" BOOLEAN NOT NULL DEFAULT false,
    "dispatch_mode" "DispatchMode" NOT NULL DEFAULT 'sequential',
    "ignore_lawyer_filters" BOOLEAN NOT NULL DEFAULT false,
    "ring_window_seconds" INTEGER NOT NULL DEFAULT 25,
    "search_limit_seconds" INTEGER NOT NULL DEFAULT 300,
    "radius_steps_km" INTEGER[] DEFAULT ARRAY[3, 10, 25]::INTEGER[],
    "escalate_after_attempts" INTEGER NOT NULL DEFAULT 0,
    "wrap_up_cooldown_minutes" INTEGER NOT NULL DEFAULT 2,
    "scheduled_buffer_minutes" INTEGER NOT NULL DEFAULT 15,
    "location_freshness_minutes" INTEGER NOT NULL DEFAULT 2,
    "heartbeat_seconds" INTEGER NOT NULL DEFAULT 45,
    "max_concurrent_chat" INTEGER NOT NULL DEFAULT 3,
    "max_concurrent_voice" INTEGER NOT NULL DEFAULT 1,
    "max_concurrent_video" INTEGER NOT NULL DEFAULT 1,
    "skip_payment" BOOLEAN NOT NULL DEFAULT false,
    "auto_refund_hours" INTEGER NOT NULL DEFAULT 24,
    "show_notified_count" BOOLEAN NOT NULL DEFAULT true,
    "allow_cancel_during_search" BOOLEAN NOT NULL DEFAULT true,
    "token_grace_minutes" INTEGER NOT NULL DEFAULT 10,
    "call_grace_seconds" INTEGER NOT NULL DEFAULT 60,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consultation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_audit" (
    "id" UUID NOT NULL,
    "area" VARCHAR(40) NOT NULL,
    "changes" JSONB NOT NULL,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "settings_audit_area_created_at_idx" ON "settings_audit"("area", "created_at");

-- AddForeignKey
ALTER TABLE "consultation_settings" ADD CONSTRAINT "consultation_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_audit" ADD CONSTRAINT "settings_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

