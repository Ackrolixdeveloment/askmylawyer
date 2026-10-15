-- CreateEnum
CREATE TYPE "ExtensionStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- AlterTable
ALTER TABLE "consultation_settings" ADD COLUMN     "extension_grace_seconds" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "extension_prompt_seconds" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN     "max_extensions" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "consultation_extensions" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "minutes" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ExtensionStatus" NOT NULL DEFAULT 'pending',
    "prompt_ends_at" TIMESTAMPTZ(6) NOT NULL,
    "answered_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultation_extensions_request_id_status_idx" ON "consultation_extensions"("request_id", "status");

-- CreateIndex
CREATE INDEX "consultation_extensions_status_prompt_ends_at_idx" ON "consultation_extensions"("status", "prompt_ends_at");

-- AddForeignKey
ALTER TABLE "consultation_extensions" ADD CONSTRAINT "consultation_extensions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

