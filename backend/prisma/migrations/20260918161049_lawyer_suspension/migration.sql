-- AlterTable
ALTER TABLE "users" ADD COLUMN     "suspended_at" TIMESTAMPTZ(6),
ADD COLUMN     "suspension_reason" VARCHAR(500);

