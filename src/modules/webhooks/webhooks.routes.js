import { Router } from "express";
import { getWebhookEventsHandler, createWebhookEndpointHandler, } from "./webhooks.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../shared/constants/roles.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/events",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN),
  getWebhookEventsHandler
);

router.post(
  "/endpoints",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN),
  createWebhookEndpointHandler
);

export default router;