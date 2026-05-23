import { Router } from "express";
import { Orchestrator } from "../orchestrator";
import { PrismaClient } from "@prisma/client";
import { createWorkflowRouter } from "./workflow/workflow.routes";
import { createWorkflowRunRouter } from "./run/route.routes";
import { createAgentRouter } from "./agent/agent.routes";

export const createApiRoutes = (orchestrator: Orchestrator, prisma: PrismaClient) => {
  const router = Router();

  const workflowRouter = createWorkflowRouter(orchestrator, prisma);
  const workflowRunRouter = createWorkflowRunRouter(prisma);
  const agentRouter = createAgentRouter(prisma);

  router.use("/api/workflow", workflowRouter);
  router.use("/api/runs", workflowRunRouter);
  router.use("/api/agents", agentRouter);

  return router;
};
