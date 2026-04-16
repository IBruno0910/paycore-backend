import { prisma } from "../../config/db.js";
import {
  TRANSFER_STATUS,
  TRANSACTION_TYPE,
  WEBHOOK_EVENT_STATUS,
} from "../../shared/constants/domain.js";

export const getTransfersAnalytics = async (companyId) => {
  const totalTransfers = await prisma.transfer.count({
    where: { companyId },
  });

  const completedTransfers = await prisma.transfer.count({
    where: {
      companyId,
      status: TRANSFER_STATUS.COMPLETED
    },
  });

  const failedTransfers = await prisma.transfer.count({
    where: {
      companyId,
      status: TRANSFER_STATUS.FAILED
    },
  });

  const volumeResult = await prisma.transfer.aggregate({
    where: {
      companyId,
      status: TRANSFER_STATUS.COMPLETED
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
      status: WEBHOOK_EVENT_STATUS.DELIVERED
    },
  });

  const failedWebhookEvents = await prisma.webhookEvent.count({
    where: {
      entityType: "TRANSFER",
      entityId: {
        in: transferIds,
      },
      status: TRANSFER_STATUS.FAILED
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
      .filter((transaction) => transaction.type === TRANSACTION_TYPE.DEBIT)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalCredits = account.transactions
      .filter((transaction) => transaction.type === TRANSACTION_TYPE.CREDIT)
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

    if (transfer.status === TRANSFER_STATUS.COMPLETED) {
      groupedByDay[day].completedTransfers += 1;
      groupedByDay[day].totalVolume += transfer.amount;
    } else if (transfer.status === TRANSFER_STATUS.FAILED) {
      groupedByDay[day].failedTransfers += 1;
    } else if (transfer.status === TRANSFER_STATUS.PENDING) {
      groupedByDay[day].pendingTransfers += 1;
    }
  }

  return Object.values(groupedByDay);
};

export const getRecentFailedTransfers = async (companyId) => {
  const failedTransfers = await prisma.transfer.findMany({
    where: {
      companyId,
      status: TRANSFER_STATUS.FAILED
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
      status: WEBHOOK_EVENT_STATUS.FAILED
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

export const getSmartAlerts = async (companyId) => {
  const alerts = [];

  const transfers = await prisma.transfer.findMany({
    where: { companyId },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      sourceAccountId: true,
      destinationAccountId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const completedTransfers = transfers.filter(
    (transfer) => transfer.status === TRANSFER_STATUS.COMPLETED
  );

  const failedTransfers = transfers.filter(
    (transfer) => transfer.status === TRANSFER_STATUS.FAILED
  );

  if (completedTransfers.length > 0) {
    const averageCompletedAmount =
      completedTransfers.reduce((sum, transfer) => sum + transfer.amount, 0) /
      completedTransfers.length;

    const unusuallyLargeTransfers = completedTransfers.filter(
      (transfer) => transfer.amount > averageCompletedAmount * 2
    );

    if (unusuallyLargeTransfers.length > 0) {
      alerts.push({
        type: "UNUSUAL_LARGE_TRANSFERS",
        severity: "MEDIUM",
        message: "Some completed transfers are significantly above the average amount",
        details: {
          averageCompletedAmount: Number(averageCompletedAmount.toFixed(2)),
          unusuallyLargeTransfersCount: unusuallyLargeTransfers.length,
          thresholdMultiplier: 2,
        },
      });
    }
  }

  const recentFailedTransfers = failedTransfers.filter((transfer) => {
    const diffInMs = new Date() - new Date(transfer.createdAt);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours <= 24;
  });

  if (recentFailedTransfers.length >= 3) {
    alerts.push({
      type: "RECENT_FAILED_TRANSFERS_SPIKE",
      severity: "HIGH",
      message: "There is a recent spike in failed transfers during the last 24 hours",
      details: {
        recentFailedTransfersCount: recentFailedTransfers.length,
        timeWindowHours: 24,
      },
    });
  }

  const topAccounts = await getTopAccountsByVolume(companyId);

  if (topAccounts.length > 0) {
    const totalVolume = topAccounts.reduce(
      (sum, account) => sum + account.totalVolume,
      0
    );

    const leadingAccount = topAccounts[0];

    if (totalVolume > 0) {
      const concentrationRate = (leadingAccount.totalVolume / totalVolume) * 100;

      if (concentrationRate > 70) {
        alerts.push({
          type: "HIGH_ACCOUNT_VOLUME_CONCENTRATION",
          severity: "MEDIUM",
          message: "A single account concentrates most of the transfer volume",
          details: {
            accountAlias: leadingAccount.alias,
            concentrationRate: Number(concentrationRate.toFixed(2)),
            threshold: 70,
          },
        });
      }
    }
  }

  return alerts;
};

export const getAnalyticsInsights = async (companyId) => {
  const insights = [];

  const summary = await getGeneralAnalyticsSummary(companyId);
  const topAccounts = await getTopAccountsByVolume(companyId);
  const timeline = await getTransfersTimeline(companyId);
  const smartAlerts = await getSmartAlerts(companyId);

  if (summary.transfers.failedRate > 15) {
    insights.push({
      type: "RISK",
      message: `Transfer failure rate is currently ${summary.transfers.failedRate}% and should be reviewed.`,
    });
  } else {
    insights.push({
      type: "HEALTH",
      message: `Transfer failure rate is under control at ${summary.transfers.failedRate}%.`,
    });
  }

  if (topAccounts.length > 0) {
    insights.push({
      type: "VOLUME",
      message: `Most transfer volume is currently concentrated in account ${topAccounts[0].alias}.`,
    });
  }

  if (timeline.length >= 2) {
    const today = timeline[timeline.length - 1];
    const previousDays = timeline.slice(0, -1);

    const historicalAverage =
      previousDays.reduce((sum, day) => sum + day.totalVolume, 0) /
      previousDays.length;

    if (historicalAverage > 0 && today.totalVolume > historicalAverage * 1.5) {
      insights.push({
        type: "TREND",
        message: `Today's completed transfer volume is significantly above the recent historical average.`,
      });
    }
  }

  if (summary.webhooks.deliveryRate === 100) {
    insights.push({
      type: "WEBHOOKS",
      message: "Webhook delivery health is currently stable.",
    });
  } else {
    insights.push({
      type: "WEBHOOKS",
      message: `Webhook delivery rate is ${summary.webhooks.deliveryRate}% and may require attention.`,
    });
  }

  if (smartAlerts.length === 0) {
    insights.push({
      type: "STATUS",
      message: "No additional smart alerts were detected at this time.",
    });
  }

  return {
    insights,
    smartAlerts,
  };
};