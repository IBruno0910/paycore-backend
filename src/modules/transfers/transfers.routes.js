import { Router } from "express";
import {
  createTransferHandler,
  getCompanyTransfersHandler,
  getTransferByIdHandler,
} from "./transfers.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../shared/constants/roles.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.OPERATOR),
  createTransferHandler
);

router.get(
  "/",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST, ROLES.OPERATOR),
  getCompanyTransfersHandler
);

router.get(
  "/:transferId",
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.COMPANY_ADMIN,
    ROLES.ANALYST,
    ROLES.OPERATOR
  ),
  getTransferByIdHandler
);

export default router;