import { Router } from "express";
import { login, register } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../shared/constants/roles.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "You have access to the admin-only route",
      user: req.user,
    });
  }
);

router.get(
  "/analyst-panel",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.ANALYST),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "You have access to the analyst panel",
      user: req.user,
    });
  }
);

router.get(
  "/super-admin-only",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "You have access to the super admin route",
      user: req.user,
    });
  }
);

export default router;