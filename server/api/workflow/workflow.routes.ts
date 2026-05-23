import { PrismaClient } from "@prisma/client";
import { Orchestrator } from "../../orchestrator";
import { Router } from "express";
import { WorkflowRepository } from "./workflow.repository";
import { WorkflowService } from "./workflow.service";
import { WorkflowController } from "./workflow.controller";

export const createWorkflowRouter = (
  orchestrator: Orchestrator,
  prisma: PrismaClient,
) => {
  const router = Router();

  // wire dependencies
  const repository = new WorkflowRepository(prisma);
  const service = new WorkflowService(repository, orchestrator);
  const controller = new WorkflowController(service);

  // mount routes
  router.get("/", controller.getAllWorkflows);
  router.get("/:id", controller.getWorkflowById);
  router.post("/", controller.createWorkflow);
  router.post("/:id/run", controller.triggerRun);

  return router;
};
