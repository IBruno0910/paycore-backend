import { prisma } from "../../config/db.js";
import { AppError } from "../../shared/errors/AppError.js";

export const createTransfer = async ({
  sourceAccountId,
  destinationAccountId,
  amount,
  description,
  companyId,
  createdByUserId,
}) => {
  if (sourceAccountId === destinationAccountId) {
    throw new AppError("Source and destination accounts must be different", 400);
  }

  return await prisma.$transaction(async (tx) => {
    const sourceAccount = await tx.account.findFirst({
      where: {
        id: sourceAccountId,
        companyId,
      },
    });

    if (!sourceAccount) {
      throw new AppError("Source account not found", 404);
    }

    const destinationAccount = await tx.account.findFirst({
      where: {
        id: destinationAccountId,
        companyId,
      },
    });

    if (!destinationAccount) {
      throw new AppError("Destination account not found", 404);
    }

    if (sourceAccount.status !== "ACTIVE" || destinationAccount.status !== "ACTIVE") {
      throw new AppError("Both accounts must be active", 400);
    }

    if (sourceAccount.currency !== destinationAccount.currency) {
      throw new AppError("Accounts must have the same currency", 400);
    }

    if (sourceAccount.availableBalance < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    const sourceBalanceBefore = sourceAccount.availableBalance;
    const destinationBalanceBefore = destinationAccount.availableBalance;

    const updatedSourceAccount = await tx.account.update({
      where: { id: sourceAccount.id },
      data: {
        availableBalance: sourceBalanceBefore - amount,
      },
    });

    const updatedDestinationAccount = await tx.account.update({
      where: { id: destinationAccount.id },
      data: {
        availableBalance: destinationBalanceBefore + amount,
      },
    });

    const transfer = await tx.transfer.create({
      data: {
        companyId,
        sourceAccountId,
        destinationAccountId,
        amount,
        currency: sourceAccount.currency,
        status: "COMPLETED",
        description,
        createdByUserId,
      },
    });

    await tx.transaction.create({
      data: {
        accountId: sourceAccount.id,
        type: "DEBIT",
        amount,
        balanceBefore: sourceBalanceBefore,
        balanceAfter: updatedSourceAccount.availableBalance,
        description: description || "Internal transfer debit",
        referenceId: transfer.id,
      },
    });

    await tx.transaction.create({
      data: {
        accountId: destinationAccount.id,
        type: "CREDIT",
        amount,
        balanceBefore: destinationBalanceBefore,
        balanceAfter: updatedDestinationAccount.availableBalance,
        description: description || "Internal transfer credit",
        referenceId: transfer.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: createdByUserId,
        action: "CREATE_TRANSFER",
        entityType: "TRANSFER",
        entityId: transfer.id,
        metadata: {
          sourceAccountId,
          destinationAccountId,
          amount,
          currency: sourceAccount.currency,
        },
      },
    });

    return transfer;
  });
};

export const getCompanyTransfers = async (companyId) => {
  return await prisma.transfer.findMany({
    where: { companyId },
    orderBy: {
      createdAt: "desc",
    },
  });
};