/*
  Warnings:

  - A unique constraint covering the columns `[companyId,alias]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Account_companyId_alias_key" ON "Account"("companyId", "alias");
