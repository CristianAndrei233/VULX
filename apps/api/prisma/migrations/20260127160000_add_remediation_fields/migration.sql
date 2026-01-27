-- AlterTable: Add remediation guidance fields to Finding
ALTER TABLE "Finding" ADD COLUMN "remediation" TEXT;
ALTER TABLE "Finding" ADD COLUMN "owaspCategory" TEXT;
ALTER TABLE "Finding" ADD COLUMN "cweId" TEXT;
ALTER TABLE "Finding" ADD COLUMN "evidence" TEXT;

-- Update description column to TEXT type for longer descriptions
ALTER TABLE "Finding" ALTER COLUMN "description" TYPE TEXT;
