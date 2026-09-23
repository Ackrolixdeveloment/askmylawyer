-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lawyer_number" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "users_lawyer_number_key" ON "users"("lawyer_number");


-- The counter behind "LAW0001". Lawyers only, so customer sign-ups leave no gaps.
CREATE SEQUENCE IF NOT EXISTS lawyer_number_seq START 1;

-- Existing lawyers keep their order of joining.
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS seq
  FROM users
  WHERE role = 'lawyer'
)
UPDATE users
SET lawyer_number = numbered.seq
FROM numbered
WHERE users.id = numbered.id;

-- Carry on from the last one handed out.
SELECT setval(
  'lawyer_number_seq',
  COALESCE((SELECT MAX(lawyer_number) FROM users), 0) + 1,
  false
);
