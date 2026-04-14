import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
    },
    env.refreshTokenSecret,
    {
      expiresIn: env.refreshTokenExpiresIn,
    }
  );
};