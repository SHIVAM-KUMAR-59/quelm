import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";

export const createDashboardRouter = (prisma: PrismaClient) => {
  const router = Router();

  const repository = new DashboardRepository(prisma);
  const service = new DashboardService(repository);
  const controller = new DashboardController(service);

  router.get("/stats", controller.getStats);
  router.get("/recent-runs", controller.getRecentRuns);

  return router;
};
