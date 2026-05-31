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
  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);

  return router;
};
