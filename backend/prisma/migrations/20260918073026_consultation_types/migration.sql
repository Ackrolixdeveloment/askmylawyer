-- AlterTable
ALTER TABLE "lawyer_profiles" ADD COLUMN     "consultation_types" TEXT[] DEFAULT ARRAY[]::TEXT[];

