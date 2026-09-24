-- CreateTable
CREATE TABLE "admin_alerts" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "body" VARCHAR(400) NOT NULL,
    "module" VARCHAR(40) NOT NULL,
    "link" VARCHAR(300),
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,

    CONSTRAINT "admin_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_alerts_admin_user_id_created_at_idx" ON "admin_alerts"("admin_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "admin_alerts" ADD CONSTRAINT "admin_alerts_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_alerts" ADD CONSTRAINT "admin_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

