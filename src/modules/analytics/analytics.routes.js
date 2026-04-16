import { Router } from "express";
import {
  getTransfersAnalyticsHandler,
  getWebhooksAnalyticsHandler,
  getGeneralAnalyticsSummaryHandler,
  getTopAccountsByVolumeHandler,
  getTransfersTimelineHandler,
  getRecentFailedTransfersHandler,
  getRecentFailedWebhooksHandler,
} from "./analytics.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../shared/constants/roles.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/transfers",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  getTransfersAnalyticsHandler
);

router.get(
  "/webhooks",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  getWebhooksAnalyticsHandler
);

router.get(
  "/summary",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  getGeneralAnalyticsSummaryHandler
);

router.get(
  "/top-accounts",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  getTopAccountsByVolumeHandler
);

router.get(
  "/transfers/timeline",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  getTransfersTimelineHandler
);

router.get(
  "/transfers/recent-failures",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  getRecentFailedTransfersHandler
);

router.get(
  "/webhooks/recent-failures",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  getRecentFailedWebhooksHandler
);

export default router;