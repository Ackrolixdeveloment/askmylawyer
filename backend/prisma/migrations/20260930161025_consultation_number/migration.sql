-- AlterTable
ALTER TABLE "consultation_requests" ADD COLUMN     "number" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "consultation_requests_number_key" ON "consultation_requests"("number");


-- The counter behind "AML-000123".
CREATE SEQUENCE IF NOT EXISTS consultation_number_seq START 1;

-- Existing consultations keep their order of booking.
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS seq
  FROM consultation_requests
)
UPDATE consultation_requests
SET number = numbered.seq
FROM numbered
WHERE consultation_requests.id = numbered.id;

-- Carry on from the last one handed out.
SELECT setval(
  'consultation_number_seq',
  COALESCE((SELECT MAX(number) FROM consultation_requests), 0) + 1,
  false
);
