import { Router } from "express";
import { Orchestrator } from "../orchestrator";
import { PrismaClient } from "@prisma/client";
import { createAuthRouter } from "./auth/auth.routes";
import { createWorkflowRouter } from "./workflow/workflow.routes";
import { createWorkflowRunRouter } from "./run/route.routes";
import { createAgentRouter } from "./agent/agent.routes";
import { createDashboardRouter } from "./dashboard/dashboard.routes";
import { handleWorkflowRunServerSentEvents } from "./run/run.sse";
import { authenticate } from "../middleware/auth.middleware";

export const createApiRoutes = (orchestrator: Orchestrator, prisma: PrismaClient) => {
  const router = Router();

  const authRouter = createAuthRouter(prisma);
  const workflowRouter = createWorkflowRouter(orchestrator, prisma);
  const workflowRunRouter = createWorkflowRunRouter(prisma);
  const agentRouter = createAgentRouter(prisma);
  const dashboardRouter = createDashboardRouter(prisma);

  router.use("/api/auth", authRouter);
  router.use("/api/workflow", authenticate, workflowRouter);
  router.use("/api/runs", authenticate, workflowRunRouter);
  router.get("/api/runs/:runId/stream", handleWorkflowRunServerSentEvents);
  router.use("/api/agents", authenticate, agentRouter);
  router.use("/api/dashboard", authenticate, dashboardRouter);

  return router;
};
