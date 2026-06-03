import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.config";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, path } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    logger.info(`${method} ${path} ${statusCode} ${duration}ms`);
  });

  next();
};
