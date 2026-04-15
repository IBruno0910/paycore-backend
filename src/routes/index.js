import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import accountsRoutes from "../modules/accounts/accounts.routes.js";
import transfersRoutes from "../modules/transfers/transfers.routes.js";
import webhooksRoutes from "../modules/webhooks/webhooks.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PayCore API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/accounts", accountsRoutes);
router.use("/transfers", transfersRoutes);
router.use("/webhooks", webhooksRoutes);

export default router;