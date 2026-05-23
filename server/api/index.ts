import { Router } from "express";
import { Orchestrator } from "../orchestrator";
import { PrismaClient } from "@prisma/client";
import { createWorkflowRouter } from "./workflow/workflow.routes";

export const createApiRoutes = (orchestrator: Orchestrator, prisma: PrismaClient) => {
  const router = Router();

  const workflowRouter = createWorkflowRouter(orchestrator, prisma);

  router.use("/api/workflow", workflowRouter);

  return router;
};
