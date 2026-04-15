import { prisma } from "../../config/db.js";
import { AppError } from "../../shared/errors/AppError.js";
import { createWebhookEvent } from "../webhooks/webhooks.service.js";
import { dispatchWebhookEvent } from "../webhooks/webhooks.dispatcher.js";

export const createTransfer = async ({
  sourceAccountId,
  destinationAccountId,
  amount,
  description,
  companyId,
  createdByUserId,
  idempotencyKey,
}) => {
  if (idempotencyKey) {
    const existingTransfer = await prisma.transfer.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransfer) {
      return existingTransfer;
    }
  }
  if (sourceAccountId === destinationAccountId) {
    throw new AppError("Source and destination accounts must be different", 400);
  }

  const sourceAccount = await prisma.account.findFirst({
    where: {
      id: sourceAccountId,
      companyId,
    },
  });

  if (!sourceAccount) {
    throw new AppError("Source account not found", 404);
  }

  const destinationAccount = await prisma.account.findFirst({
    where: {
      id: destinationAccountId,
      companyId,
    },
  });

  if (!destinationAccount) {
    throw new AppError("Destination account not found", 404);
  }

  const transfer = await prisma.transfer.create({
    data: {
      companyId,
      sourceAccountId,
      destinationAccountId,
      amount,
      currency: sourceAccount.currency,
      status: "PENDING",
      description,
      createdByUserId,
      idempotencyKey, // 👈 esto
    },
  });

const createdEvent = await createWebhookEvent({
  eventType: "transfer.created",
  entityType: "TRANSFER",
  entityId: transfer.id,
  payload: {
    transferId: transfer.id,
    companyId,
    sourceAccountId,
    destinationAccountId,
    amount,
    currency: sourceAccount.currency,
    status: "PENDING",
  },
});

await dispatchWebhookEvent(createdEvent);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const freshSourceAccount = await tx.account.findFirst({
        where: {
          id: sourceAccountId,
          companyId,
        },
      });

      const freshDestinationAccount = await tx.account.findFirst({
        where: {
          id: destinationAccountId,
          companyId,
        },
      });

      if (!freshSourceAccount) {
        throw new AppError("Source account not found during processing", 404);
      }

      if (!freshDestinationAccount) {
        throw new AppError("Destination account not found during processing", 404);
      }

      if (
        freshSourceAccount.status !== "ACTIVE" ||
        freshDestinationAccount.status !== "ACTIVE"
      ) {
        throw new AppError("Both accounts must be active", 400);
      }

      if (freshSourceAccount.currency !== freshDestinationAccount.currency) {
        throw new AppError("Accounts must have the same currency", 400);
      }

      if (freshSourceAccount.availableBalance < amount) {
        throw new AppError("Insufficient balance", 400);
      }

      const sourceBalanceBefore = freshSourceAccount.availableBalance;
      const destinationBalanceBefore = freshDestinationAccount.availableBalance;

      const updatedSourceAccount = await tx.account.update({
        where: { id: freshSourceAccount.id },
        data: {
          availableBalance: sourceBalanceBefore - amount,
        },
      });

      const updatedDestinationAccount = await tx.account.update({
        where: { id: freshDestinationAccount.id },
        data: {
          availableBalance: destinationBalanceBefore + amount,
        },
      });

      await tx.transaction.create({
        data: {
          accountId: freshSourceAccount.id,
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
          accountId: freshDestinationAccount.id,
          type: "CREDIT",
          amount,
          balanceBefore: destinationBalanceBefore,
          balanceAfter: updatedDestinationAccount.availableBalance,
          description: description || "Internal transfer credit",
          referenceId: transfer.id,
        },
      });

      const completedTransfer = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
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
            currency: freshSourceAccount.currency,
            status: "COMPLETED",
          },
        },
      });

      return completedTransfer;
    });

const completedEvent = await createWebhookEvent({
  eventType: "transfer.completed",
  entityType: "TRANSFER",
  entityId: result.id,
  payload: {
    transferId: result.id,
    companyId,
    sourceAccountId,
    destinationAccountId,
    amount,
    status: result.status,
    processedAt: result.processedAt,
  },
});

await dispatchWebhookEvent(completedEvent);

    return result;
  } catch (error) {
    const failedTransfer = await prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        status: "FAILED",
        failureReason: error.message || "Transfer processing failed",
        processedAt: new Date(),
      },
    });

    const failedEvent = await createWebhookEvent({
      eventType: "transfer.failed",
      entityType: "TRANSFER",
      entityId: failedTransfer.id,
      payload: {
        transferId: failedTransfer.id,
        companyId,
        sourceAccountId,
        destinationAccountId,
        amount,
        status: failedTransfer.status,
        failureReason: failedTransfer.failureReason,
        processedAt: failedTransfer.processedAt,
      },
    });

    await dispatchWebhookEvent(failedEvent);

    await prisma.auditLog.create({
      data: {
        userId: createdByUserId,
        action: "TRANSFER_FAILED",
        entityType: "TRANSFER",
        entityId: transfer.id,
        metadata: {
          sourceAccountId,
          destinationAccountId,
          amount,
          reason: error.message || "Transfer processing failed",
        },
      },
    });

    throw error;
  }
};

export const getCompanyTransfers = async (companyId) => {
  return await prisma.transfer.findMany({
    where: { companyId },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getTransferById = async ({ transferId, companyId }) => {
  const transfer = await prisma.transfer.findFirst({
    where: {
      id: transferId,
      companyId,
    },
  });

  if (!transfer) {
    throw new AppError("Transfer not found", 404);
  }

  return transfer;
};