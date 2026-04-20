import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../shared/errors/AppError.js";
import { logger } from "../shared/logger/logger.js";

export const authMiddleware = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = decoded;

    next();
  } catch (error) {
    logger.warn(
      {
        error: error.message,
        path: req.originalUrl,
        method: req.method,
      },
      "Authentication failed"
    );

    next(new AppError(error.message || "Invalid or expired token", 401));
  }
};