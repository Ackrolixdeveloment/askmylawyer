ALTER TABLE "roles" ADD COLUMN "permissions" JSONB;

-- Retain each user's previous access; do not union grants across role members.
-- Different matrices sharing one role become separate role variants.
DO $$
DECLARE r RECORD; g RECORD; first_group BOOLEAN; target_id UUID;
BEGIN
  FOR r IN SELECT * FROM "roles" WHERE "is_system" = false ORDER BY "id" LOOP
    first_group := true;
    FOR g IN
      SELECT COALESCE("permissions", '{}'::jsonb) AS matrix,
             array_agg("id") AS member_ids, min("created_at") AS earliest
      FROM "admin_users" WHERE "role_id" = r.id AND "deleted_at" IS NULL
      GROUP BY COALESCE("permissions", '{}'::jsonb)
      ORDER BY earliest, COALESCE("permissions", '{}'::jsonb)::text
    LOOP
      IF first_group THEN
        target_id := r.id;
        UPDATE "roles" SET "permissions" = g.matrix WHERE "id" = target_id;
        first_group := false;
      ELSE
        target_id := gen_random_uuid();
        INSERT INTO "roles" ("id", "name", "description", "department_id", "status", "is_system", "permissions", "created_at", "updated_at")
        VALUES (target_id, left(r.name, 48) || ' · migrated ' || target_id::text,
                'Access-preserving variant of ' || r.name, r.department_id, r.status, false, g.matrix, NOW(), NOW());
        UPDATE "admin_users" SET "role_id" = target_id WHERE "id" = ANY(g.member_ids);
      END IF;
    END LOOP;
  END LOOP;
END $$;
UPDATE "roles" SET "permissions" = COALESCE("permissions", '{}'::jsonb);
-- Move the retired category permission into Support without granting extra access.
UPDATE "roles" SET "permissions" = ("permissions" - 'users.categories') ||
  jsonb_build_object('support.categories', COALESCE("permissions"->'users.categories', '"none"'::jsonb));
