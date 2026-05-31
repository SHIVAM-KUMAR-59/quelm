import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { WorkflowRunController } from "./run.controller";
import { WorkflowRunService } from "./run.service";
import { WorkflowRunRepository } from "./run.repository";

export const createWorkflowRunRouter = (prisma: PrismaClient) => {
  const router = Router();

  // wire dependencies
  const repository = new WorkflowRunRepository(prisma);
  const service = new WorkflowRunService(repository);
  const controller = new WorkflowRunController(service);

  // mount routes
  router.get("/", controller.getAllRuns);
  router.get("/:id", controller.getRunById);
  router.get("/workflow/:workflowId", controller.getRunByWorkflowId);

  return router;
};
