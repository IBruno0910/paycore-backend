import { prisma } from "../../config/db.js";

export const getTransfersAnalytics = async (companyId) => {
  const totalTransfers = await prisma.transfer.count({
    where: { companyId },
  });

  const completedTransfers = await prisma.transfer.count({
    where: {
      companyId,
      status: "COMPLETED",
    },
  });

  const failedTransfers = await prisma.transfer.count({
    where: {
      companyId,
      status: "FAILED",
    },
  });

  const volumeResult = await prisma.transfer.aggregate({
    where: {
      companyId,
      status: "COMPLETED",
    },
    _sum: {
      amount: true,
    },
  });

  const totalTransferredVolume = volumeResult._sum.amount || 0;

  const successRate =
    totalTransfers > 0 ? (completedTransfers / totalTransfers) * 100 : 0;

  const failedRate =
    totalTransfers > 0 ? (failedTransfers / totalTransfers) * 100 : 0;

  return {
    totalTransfers,
    completedTransfers,
    failedTransfers,
    totalTransferredVolume,
    successRate: Number(successRate.toFixed(2)),
    failedRate: Number(failedRate.toFixed(2)),
  };
};

export const getWebhooksAnalytics = async (companyId) => {
  const relatedTransfers = await prisma.transfer.findMany({
    where: { companyId },
    select: { id: true },
  });

  const transferIds = relatedTransfers.map((transfer) => transfer.id);

  const totalWebhookEvents = await prisma.webhookEvent.count({
    where: {
      entityType: "TRANSFER",
      entityId: {
        in: transferIds,
      },
    },
  });

  const deliveredWebhookEvents = await prisma.webhookEvent.count({
    where: {
      entityType: "TRANSFER",
      entityId: {
        in: transferIds,
      },
      status: "DELIVERED",
    },
  });

  const failedWebhookEvents = await prisma.webhookEvent.count({
    where: {
      entityType: "TRANSFER",
      entityId: {
        in: transferIds,
      },
      status: "FAILED",
    },
  });

  const deliveryRate =
    totalWebhookEvents > 0
      ? (deliveredWebhookEvents / totalWebhookEvents) * 100
      : 0;

  return {
    totalWebhookEvents,
    deliveredWebhookEvents,
    failedWebhookEvents,
    deliveryRate: Number(deliveryRate.toFixed(2)),
  };
};

export const getGeneralAnalyticsSummary = async (companyId) => {
  const transfersAnalytics = await getTransfersAnalytics(companyId);
  const webhooksAnalytics = await getWebhooksAnalytics(companyId);

  return {
    transfers: transfersAnalytics,
    webhooks: webhooksAnalytics,
  };
};

export const getTopAccountsByVolume = async (companyId) => {
  const accounts = await prisma.account.findMany({
    where: { companyId },
    select: {
      id: true,
      alias: true,
      currency: true,
      transactions: {
        where: {
          type: {
            in: ["DEBIT", "CREDIT"],
          },
        },
        select: {
          amount: true,
          type: true,
        },
      },
    },
  });

  const rankedAccounts = accounts.map((account) => {
    const totalVolume = account.transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const totalDebits = account.transactions
      .filter((transaction) => transaction.type === "DEBIT")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalCredits = account.transactions
      .filter((transaction) => transaction.type === "CREDIT")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      id: account.id,
      alias: account.alias,
      currency: account.currency,
      totalVolume,
      totalDebits,
      totalCredits,
      transactionCount: account.transactions.length,
    };
  });

  rankedAccounts.sort((a, b) => b.totalVolume - a.totalVolume);

  return rankedAccounts.slice(0, 5);
};