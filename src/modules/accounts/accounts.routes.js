import { Router } from "express";
import {
  createAccountHandler,
  getAccountByIdHandler,
  getCompanyAccountsHandler,
} from "./accounts.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../shared/constants/roles.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN),
  createAccountHandler
);

router.get(
  "/",
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.COMPANY_ADMIN,
    ROLES.ANALYST,
    ROLES.OPERATOR
  ),
  getCompanyAccountsHandler
);

router.get(
  "/:accountId",
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.COMPANY_ADMIN,
    ROLES.ANALYST,
    ROLES.OPERATOR
  ),
  getAccountByIdHandler
);

export default router;