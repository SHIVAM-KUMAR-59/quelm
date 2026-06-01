import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { logger } from "../config/logger.config";
import { ApiError } from "../utils/errors";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError("Authentication required", 401, "UNAUTHORIZED");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    logger.success(`User authenticated: ${decoded.userId}`);
    next();
  } catch {
    throw new ApiError("Invalid or expired token", 401, "UNAUTHORIZED");
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    logger.success(`User authenticated (optional): ${decoded.userId}`);
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};
