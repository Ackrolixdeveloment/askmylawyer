CREATE TABLE "support_tickets" (
 "id" UUID PRIMARY KEY, "number" SERIAL NOT NULL UNIQUE,
 "reporter_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "reporter_role" VARCHAR(20) NOT NULL,
 "request_id" UUID REFERENCES "consultation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "category_id" UUID REFERENCES "ticket_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "category_name" VARCHAR(120) NOT NULL,
 "department_id" UUID REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "assigned_to_id" UUID REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "subject" VARCHAR(150) NOT NULL, "description" VARCHAR(5000) NOT NULL,
 "status" VARCHAR(20) NOT NULL DEFAULT 'new', "priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
 "resolution" VARCHAR(5000), "resolved_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE INDEX "support_tickets_reporter_id_created_at_idx" ON "support_tickets"("reporter_id","created_at");
CREATE INDEX "support_tickets_status_created_at_idx" ON "support_tickets"("status","created_at");
CREATE INDEX "support_tickets_assigned_to_id_status_idx" ON "support_tickets"("assigned_to_id","status");
CREATE TABLE "support_messages" (
 "id" UUID PRIMARY KEY, "ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "author_id" UUID NOT NULL,"author_kind" VARCHAR(10) NOT NULL,"author_name" VARCHAR(150) NOT NULL,"body" VARCHAR(5000) NOT NULL,
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "support_messages_ticket_id_created_at_idx" ON "support_messages"("ticket_id","created_at");
CREATE TABLE "support_attachments" (
 "id" UUID PRIMARY KEY, "ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "key" VARCHAR(255) NOT NULL UNIQUE,"name" VARCHAR(255) NOT NULL,"mime_type" VARCHAR(100) NOT NULL,"size_bytes" INTEGER NOT NULL,
 "uploaded_by_id" UUID NOT NULL,"created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "support_attachments_ticket_id_idx" ON "support_attachments"("ticket_id");
CREATE TABLE "support_events" (
 "id" UUID PRIMARY KEY,"ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "actor_id" UUID NOT NULL,"actor_name" VARCHAR(150) NOT NULL,"kind" VARCHAR(40) NOT NULL,"detail" JSONB NOT NULL,
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "support_events_ticket_id_created_at_idx" ON "support_events"("ticket_id","created_at");
