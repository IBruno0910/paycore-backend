import {
  getTransfersAnalytics,
  getWebhooksAnalytics,
  getGeneralAnalyticsSummary,
  getTopAccountsByVolume,
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