CREATE TABLE "admin_password_resets" (
 "id" UUID NOT NULL,
 "admin_id" UUID NOT NULL,
 "code_hash" TEXT NOT NULL,
 "token_hash" TEXT,
 "attempts" INTEGER NOT NULL DEFAULT 0,
 "expires_at" TIMESTAMPTZ(6) NOT NULL,
 "verified_at" TIMESTAMPTZ(6),
 "consumed_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "admin_password_resets_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "admin_password_resets_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "admin_password_resets_admin_id_created_at_idx" ON "admin_password_resets"("admin_id","created_at");
