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

export const getTransfersTimeline = async (companyId) => {
  const transfers = await prisma.transfer.findMany({
    where: {
      companyId,
    },
    select: {
      createdAt: true,
      amount: true,
      status: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const groupedByDay = {};

  for (const transfer of transfers) {
    const day = transfer.createdAt.toISOString().split("T")[0];

    if (!groupedByDay[day]) {
      groupedByDay[day] = {
        date: day,
        totalTransfers: 0,
        completedTransfers: 0,
        failedTransfers: 0,
        pendingTransfers: 0,
        totalVolume: 0,
      };
    }

    groupedByDay[day].totalTransfers += 1;

    if (transfer.status === "COMPLETED") {
      groupedByDay[day].completedTransfers += 1;
      groupedByDay[day].totalVolume += transfer.amount;
    } else if (transfer.status === "FAILED") {
      groupedByDay[day].failedTransfers += 1;
    } else if (transfer.status === "PENDING") {
      groupedByDay[day].pendingTransfers += 1;
    }
  }

  return Object.values(groupedByDay);
};

export const getRecentFailedTransfers = async (companyId) => {
  const failedTransfers = await prisma.transfer.findMany({
    where: {
      companyId,
      status: "FAILED",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      sourceAccountId: true,
      destinationAccountId: true,
      amount: true,
      currency: true,
      description: true,
      failureReason: true,
      createdAt: true,
      processedAt: true,
    },
  });

  return failedTransfers;
};

export const getRecentFailedWebhooks = async (companyId) => {
  const relatedTransfers = await prisma.transfer.findMany({
    where: { companyId },
    select: { id: true },
  });

  const transferIds = relatedTransfers.map((transfer) => transfer.id);

  if (transferIds.length === 0) {
    return [];
  }

  const failedWebhookEvents = await prisma.webhookEvent.findMany({
    where: {
      entityType: "TRANSFER",
      entityId: {
        in: transferIds,
      },
      status: "FAILED",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      eventType: true,
      entityId: true,
      status: true,
      payload: true,
      deliveredAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return failedWebhookEvents;
};

export const getOperationalAlerts = async (companyId) => {
  const alerts = [];

  const transfersAnalytics = await getTransfersAnalytics(companyId);
  const webhooksAnalytics = await getWebhooksAnalytics(companyId);
  const timeline = await getTransfersTimeline(companyId);

  if (transfersAnalytics.failedRate > 15) {
    alerts.push({
      type: "HIGH_TRANSFER_FAILURE_RATE",
      severity: "HIGH",
      message: "Transfer failure rate is above the expected threshold",
      details: {
        failedRate: transfersAnalytics.failedRate,
        threshold: 15,
      },
    });
  }

  const pendingTransfersCount = await prisma.transfer.count({
    where: {
      companyId,
      status: "PENDING",
    },
  });

  if (pendingTransfersCount > 0) {
    alerts.push({
      type: "PENDING_TRANSFERS_DETECTED",
      severity: "MEDIUM",
      message: "There are pending transfers that require attention",
      details: {
        pendingTransfersCount,
      },
    });
  }

  if (webhooksAnalytics.failedWebhookEvents > 0) {
    alerts.push({
      type: "FAILED_WEBHOOKS_DETECTED",
      severity: "HIGH",
      message: "Some webhook deliveries have failed",
      details: {
        failedWebhookEvents: webhooksAnalytics.failedWebhookEvents,
      },
    });
  }

  if (timeline.length >= 2) {
    const today = timeline[timeline.length - 1];
    const previousDays = timeline.slice(0, -1);

    const historicalAverage =
      previousDays.reduce((sum, day) => sum + day.totalVolume, 0) /
      previousDays.length;

    if (
      historicalAverage > 0 &&
      today.totalVolume > historicalAverage * 1.5
    ) {
      alerts.push({
        type: "UNUSUAL_TRANSFER_VOLUME",
        severity: "MEDIUM",
        message: "Today's transfer volume is significantly above the historical average",
        details: {
          todayVolume: today.totalVolume,
          historicalAverage: Number(historicalAverage.toFixed(2)),
          thresholdMultiplier: 1.5,
        },
      });
    }
  }

  return alerts;
};