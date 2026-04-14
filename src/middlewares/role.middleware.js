import { AppError } from "../shared/errors/AppError.js";

export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        throw new AppError("User role not found", 403);
      }

      if (!allowedRoles.includes(userRole)) {
        throw new AppError("Forbidden: insufficient permissions", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};