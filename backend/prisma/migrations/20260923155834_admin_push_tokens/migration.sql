-- CreateTable
CREATE TABLE "admin_push_tokens" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "user_agent" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,

    CONSTRAINT "admin_push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_push_tokens_token_key" ON "admin_push_tokens"("token");

-- CreateIndex
CREATE INDEX "admin_push_tokens_admin_user_id_idx" ON "admin_push_tokens"("admin_user_id");

-- AddForeignKey
ALTER TABLE "admin_push_tokens" ADD CONSTRAINT "admin_push_tokens_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_push_tokens" ADD CONSTRAINT "admin_push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

