import { prisma } from "../config/prisma.config";
import { logger } from "../config/logger.config";

import { LLMAgent } from "./llm.agent";
import { HttpAgent } from "./http.agent";

const llmAgent = new LLMAgent("LLM_AGENT_1", 1, prisma);
const httpAgent = new HttpAgent("HTTP_AGENT_1", 1, prisma);

const agents = [llmAgent, httpAgent];

const startAgents = async (): Promise<void> => {
  logger.info("Starting agents...");

  for (const agent of agents) {
    await agent.start();

    logger.success(`${agent.agentType} started successfully`);
  }

  logger.success("All agents started");
};

const stopAgents = async (): Promise<void> => {
  logger.info("Stopping agents...");

  await Promise.all(agents.map((agent) => agent.stop()));

  logger.success("All agents stopped");
};

export const AgentRegistry = {
  startAgents,
  stopAgents,
};
