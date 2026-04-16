-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'ANALYST', 'OPERATOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'FROZEN');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

-- AlterTable: Account.status
ALTER TABLE "Account"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "AccountStatus"
USING ("status"::"AccountStatus"),
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable: Transaction.type
ALTER TABLE "Transaction"
ALTER COLUMN "type" TYPE "TransactionType"
USING ("type"::"TransactionType");

-- AlterTable: Transfer.status
ALTER TABLE "Transfer"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "TransferStatus"
USING ("status"::"TransferStatus"),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable: User.role
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole"
USING ("role"::"UserRole");

-- AlterTable: User.status
ALTER TABLE "User"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "UserStatus"
USING ("status"::"UserStatus"),
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable: WebhookEvent.status
ALTER TABLE "WebhookEvent"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "WebhookEventStatus"
USING ("status"::"WebhookEventStatus"),
ALTER COLUMN "status" SET DEFAULT 'PENDING';