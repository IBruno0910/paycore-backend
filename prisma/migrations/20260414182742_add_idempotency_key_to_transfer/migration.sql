/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_idempotencyKey_key" ON "Transfer"("idempotencyKey");
