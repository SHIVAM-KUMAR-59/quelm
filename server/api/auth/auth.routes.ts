import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import passport from "passport";
import config from "../../config";
import { authMiddleware } from "../../middleware/auth.middleware";

export const createAuthRouter = (prisma: PrismaClient) => {
  const router = Router();

  const repository = new AuthRepository(prisma);
  const service = new AuthService(repository);
  const controller = new AuthController(service);

  router.post("/register", controller.register);
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["email", "profile"], session: false }),
  );
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${config.CLIENT_URL}/login`,
    }),
    controller.googleCallback,
  );
  router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"], session: false }),
  );
  router.get(
    "/github/callback",
    passport.authenticate("github", {
      session: false,
      failureRedirect: `${config.CLIENT_URL}/login`,
    }),
    controller.githubCallback,
  );
  router.post(
    "/login",
    passport.authenticate("local", { session: false }),
    controller.login,
  );
  router.post("/logout", controller.logout);
  router.post("/token/refresh", controller.refresh);

  router.get("/me", authMiddleware, controller.me);

  return router;
};
