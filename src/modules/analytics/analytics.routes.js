import { Router } from "express";
import {
  getTransfersAnalyticsHandler,
  getWebhooksAnalyticsHandler,
  getGeneralAnalyticsSummaryHandler,
  getTopAccountsByVolumeHandler,
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

export default router;