import jwt from "jsonwebtoken";
import config from "../config";
import { NextFunction, Request, Response } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized", errorCode: "UNAUTHORIZED" });

  try {
    const payload = jwt.verify(token, config.JWT.ACCESS_TOKEN_SECRET);
    req.user = payload;
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token", errorCode: "UNAUTHORIZED" });
  }
};
