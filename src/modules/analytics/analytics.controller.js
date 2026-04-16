import {
  getTransfersAnalytics,
  getWebhooksAnalytics,
  getGeneralAnalyticsSummary,
  getTopAccountsByVolume,
  getTransfersTimeline,
  getRecentFailedTransfers,
  getRecentFailedWebhooks,
  getOperationalAlerts,
} from "./analytics.service.js";

export const getTransfersAnalyticsHandler = async (req, res, next) => {
  try {
    const analytics = await getTransfersAnalytics(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getWebhooksAnalyticsHandler = async (req, res, next) => {
  try {
    const analytics = await getWebhooksAnalytics(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getGeneralAnalyticsSummaryHandler = async (req, res, next) => {
  try {
    const summary = await getGeneralAnalyticsSummary(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getTopAccountsByVolumeHandler = async (req, res, next) => {
  try {
    const topAccounts = await getTopAccountsByVolume(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: topAccounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransfersTimelineHandler = async (req, res, next) => {
  try {
    const timeline = await getTransfersTimeline(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentFailedTransfersHandler = async (req, res, next) => {
  try {
    const failedTransfers = await getRecentFailedTransfers(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: failedTransfers,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentFailedWebhooksHandler = async (req, res, next) => {
  try {
    const failedWebhooks = await getRecentFailedWebhooks(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: failedWebhooks,
    });
  } catch (error) {
    next(error);
  }
};

export const getOperationalAlertsHandler = async (req, res, next) => {
  try {
    const alerts = await getOperationalAlerts(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};