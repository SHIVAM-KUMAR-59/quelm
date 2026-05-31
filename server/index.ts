import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { prisma } from "./config/prisma.config";
import { logger } from "./config/logger.config";
import { JobQueue } from "./queues";
import { AgentRegistry } from "./agents/registry";
import { Orchestrator } from "./orchestrator";
import { createApiRoutes } from "./api";
import { errorHandlerMiddleware } from "./middleware/error.middleware";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Initialize orchestrator
const orchestrator = new Orchestrator(prisma);

const start = async (): Promise<void> => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.success("Database connected successfully");

    // Start agents
    await AgentRegistry.startAgents();

    // Start orchestrator
    await orchestrator.start();
    logger.success("Orchestrator started successfully");

    // Wire in the routes and middleware
    app.use(createApiRoutes(orchestrator, prisma));
    app.use(errorHandlerMiddleware);

    // Start Express server
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(`Failed to start server: ${errorMessage}`);

    process.exit(1);
  }
};

const shutdown = async (): Promise<void> => {
  logger.info("Shutting down server...");

  try {
    // Stop in reverse order of startup
    await orchestrator.stop();
    logger.success("Orchestrator stopped");

    await AgentRegistry.stopAgents();

    await JobQueue.closeAllQueues();
    logger.success("All queues closed");

    await prisma.$disconnect();
    logger.success("Database disconnected");

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(`Error during shutdown: ${errorMessage}`);

    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
