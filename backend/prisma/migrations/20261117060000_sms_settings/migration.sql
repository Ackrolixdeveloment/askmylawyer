-- No seeded credentials: existing environment settings remain active until saved.
CREATE TABLE "sms_settings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "account_label" VARCHAR(100) NOT NULL,
  "auth_key_enc" TEXT,
  "auth_key_last4" VARCHAR(4),
  "sender_id" VARCHAR(6) NOT NULL,
  "country_code" VARCHAR(3) NOT NULL,
  "dlt_template_id" VARCHAR(100) NOT NULL,
  "message" VARCHAR(2000) NOT NULL,
  "updated_by_id" UUID NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "sms_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sms_settings_singleton" CHECK ("id" = 1)
);
