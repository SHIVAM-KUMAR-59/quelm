import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";

export const createAuthRouter = (prisma: PrismaClient) => {
  const router = Router();

  const repository = new AuthRepository(prisma);
  const service = new AuthService(repository);
  const controller = new AuthController(service);

  // Email / Password
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);

  // Profile (protected)
  router.get("/me", authenticate, controller.me);

  // Google OAuth
  router.get("/google", controller.googleRedirect);
  router.get("/google/callback", controller.googleCallback);

  // GitHub OAuth
  router.get("/github", controller.githubRedirect);
  router.get("/github/callback", controller.githubCallback);

  return router;
};
