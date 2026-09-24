-- CreateEnum
CREATE TYPE "CommissionMode" AS ENUM ('percent', 'flat');

-- CreateTable
CREATE TABLE "service_plans" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "type" VARCHAR(60) NOT NULL,
    "amount" INTEGER NOT NULL,
    "commission_mode" "CommissionMode" NOT NULL DEFAULT 'percent',
    "commission_value" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "extension_minutes" INTEGER NOT NULL,
    "extension_amount" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "gst_percent" INTEGER NOT NULL DEFAULT 18,
    "tds_percent" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_plans_code_key" ON "service_plans"("code");

