import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../shared/errors/AppError.js";

export const authMiddleware = (req, res, next) => {
  try {
    console.log("AUTH HEADER:", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    next(new AppError(error.message || "Invalid or expired token", 401));
  }
};