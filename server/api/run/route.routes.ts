import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { WorkflowRunController } from "./run.controller";
import { WorkflowRunService } from "./run.service";
import { WorkflowRunRepository } from "./run.repository";
import { handleWorkflowRunServerSentEvents } from "./run.sse";

export const createWorkflowRunRouter = (prisma: PrismaClient) => {
  const router = Router();

  // wire dependencies
  const repository = new WorkflowRunRepository(prisma);
  const service = new WorkflowRunService(repository);
  const controller = new WorkflowRunController(service);

  // mount routes
  router.get("/", controller.getAllRuns);
  router.get("/:runId/stream", handleWorkflowRunServerSentEvents);
  router.get("/:id", controller.getRunById);
  router.get("/workflow/:workflowId", controller.getRunByWorkflowId);

  return router;
};
