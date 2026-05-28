import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

export const createAuthRouter = (prisma: PrismaClient) => {
  const router = Router();

  const repository = new AuthRepository(prisma);
  const service = new AuthService(repository);
  const controller = new AuthController(service);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/google/callback", controller.googleCallback);
  router.post("/controller/github", controller.githubCallback);
  router.post("/logout", controller.logout);
  router.post("/token/refresh", controller.refresh);
  router.get("/me", controller.me);

  return router;
};
