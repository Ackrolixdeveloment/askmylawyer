-- CreateEnum
CREATE TYPE "KycMethod" AS ENUM ('manual', 'digilocker');

-- CreateEnum
CREATE TYPE "LawyerDocumentType" AS ENUM ('aadhaar', 'pan', 'bar_certificate', 'bank_proof', 'profile_photo', 'signature');

-- AlterTable
ALTER TABLE "lawyer_profiles" ADD COLUMN     "aadhaar_last4" VARCHAR(4),
ADD COLUMN     "aadhaar_number_enc" TEXT,
ADD COLUMN     "about" VARCHAR(500),
ADD COLUMN     "bank_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "bar_council_state" VARCHAR(100),
ADD COLUMN     "case_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "enrollment_number" VARCHAR(50),
ADD COLUMN     "experience_band" VARCHAR(30),
ADD COLUMN     "kyc_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "kyc_method" "KycMethod",
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pan_number" VARCHAR(10),
ADD COLUMN     "personal_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "professional_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "profile_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "qualification" VARCHAR(100),
ADD COLUMN     "residential_address" VARCHAR(500),
ADD COLUMN     "specialisations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "submitted_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "lawyer_bank_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "holder_name" VARCHAR(150) NOT NULL,
    "account_number_enc" TEXT NOT NULL,
    "account_last4" VARCHAR(4) NOT NULL,
    "ifsc_code" VARCHAR(11) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "swift_code" VARCHAR(11),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lawyer_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lawyer_documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "LawyerDocumentType" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lawyer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_bank_accounts_user_id_key" ON "lawyer_bank_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_documents_storage_key_key" ON "lawyer_documents"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_documents_user_id_type_key" ON "lawyer_documents"("user_id", "type");

-- CreateIndex
CREATE INDEX "lawyer_profiles_onboarding_status_idx" ON "lawyer_profiles"("onboarding_status");

-- CreateIndex
CREATE INDEX "lawyer_profiles_enrollment_number_idx" ON "lawyer_profiles"("enrollment_number");

-- AddForeignKey
ALTER TABLE "lawyer_bank_accounts" ADD CONSTRAINT "lawyer_bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_documents" ADD CONSTRAINT "lawyer_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

