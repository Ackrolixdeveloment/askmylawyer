-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "permissions" JSONB;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "department_id" UUID,
ADD COLUMN     "description" VARCHAR(300),
ADD COLUMN     "status" "AdminStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(300),
    "status" "AdminStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "department_id" UUID NOT NULL,
    "status" "AdminStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "ticket_categories_department_id_idx" ON "ticket_categories"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_categories_name_department_id_key" ON "ticket_categories"("name", "department_id");

-- CreateIndex
CREATE INDEX "roles_department_id_idx" ON "roles"("department_id");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

