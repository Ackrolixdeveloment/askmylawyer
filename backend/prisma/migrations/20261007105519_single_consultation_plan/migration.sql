-- AlterTable
ALTER TABLE "consultation_settings" DROP COLUMN "max_extensions";

-- AlterTable
ALTER TABLE "service_plans" ADD COLUMN     "max_extensions" INTEGER NOT NULL DEFAULT 1;


-- The one consultation on sale, seeded from the old video plan: every call
-- can now carry video, so that is the honest starting point.
INSERT INTO "service_plans" (
  "id", "code", "type", "amount", "commission_mode", "commission_value",
  "duration_minutes", "extension_minutes", "extension_amount",
  "max_extensions", "enabled", "sort_order", "created_at", "updated_at"
)
SELECT
  gen_random_uuid(), 'consultation', 'Consultation', "amount",
  "commission_mode", "commission_value", "duration_minutes",
  "extension_minutes", "extension_amount", 1, true, 0, now(), now()
FROM "service_plans"
WHERE "code" = 'video'
ON CONFLICT ("code") DO NOTHING;

-- The old three stay for past bookings to resolve against, but are off sale.
UPDATE "service_plans" SET "enabled" = false, "sort_order" = 10
WHERE "code" IN ('audio', 'video', 'chat');
