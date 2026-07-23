-- CreateEnum
CREATE TYPE "PrescriptionItemType" AS ENUM ('DRUG', 'LAB_TEST');

-- AlterTable
ALTER TABLE "prescription_items" ADD COLUMN     "type" "PrescriptionItemType" NOT NULL DEFAULT 'DRUG',
ALTER COLUMN "dosage" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;
