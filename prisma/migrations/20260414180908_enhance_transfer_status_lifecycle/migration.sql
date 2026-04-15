-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING';
