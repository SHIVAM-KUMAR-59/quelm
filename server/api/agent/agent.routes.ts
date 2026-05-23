import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { AgentRepository } from "./agent.repository";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

export const createAgentRouter = (prisma: PrismaClient) => {
  const router = Router();

  // wire dependencies
  const repository = new AgentRepository(prisma);
  const service = new AgentService(repository);
  const controller = new AgentController(service);

  // mount routes
  router.get("/", controller.getAllAgents);
  router.get("/:id", controller.getAgentById);

  return router;
};
