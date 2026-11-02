ALTER TABLE "support_tickets" ADD COLUMN "client_key" VARCHAR(32);
CREATE UNIQUE INDEX "support_tickets_reporter_id_client_key_key" ON "support_tickets"("reporter_id","client_key");
