import { logger } from "../shared/logger/logger.js";

export const errorMiddleware = (err, req, res, next) => {
  logger.error(
    {
      message: err.message,
      statusCode: err.statusCode || 500,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    },
    "Request failed"
  );

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};