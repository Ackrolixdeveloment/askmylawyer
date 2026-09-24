-- CreateEnum
CREATE TYPE "GatewayEnvironment" AS ENUM ('sandbox', 'production');

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "gateway" "GatewayEnvironment" NOT NULL DEFAULT 'sandbox';

-- CreateTable
CREATE TABLE "payment_gateways" (
    "environment" "GatewayEnvironment" NOT NULL,
    "app_id" VARCHAR(120),
    "secret_key_enc" TEXT,
    "secret_key_last4" VARCHAR(4),
    "webhook_secret_enc" TEXT,
    "webhook_last4" VARCHAR(4),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("environment")
);

