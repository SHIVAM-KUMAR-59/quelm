import Redis from "ioredis";
import { logger } from "./logger.config";
import config from "./index";
import { JobQueue } from "../queues";

const retryStrategy = (times: number): number => {
  const delay = Math.min(times * 200, 5000);

  logger.debug(`Redis reconnect attempt #${times}. Retrying in ${delay}ms`);

  return delay;
};

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,

  maxRetriesPerRequest: null,

  retryStrategy,

  reconnectOnError(error) {
    logger.error(`Redis reconnect error: ${error.message}`);

    return true;
  },
});

redis.on("connect", () => {
  logger.info("Redis connection established");
});

redis.on("ready", () => {
  logger.success("Redis client ready");
});

redis.on("error", (error) => {
  logger.error(error);
});

redis.on("close", () => {
  logger.info("Redis connection closed");
});

redis.on("reconnecting", () => {
  logger.debug("Redis reconnecting...");
});

redis.on("end", () => {
  logger.info("Redis connection ended");
});

process.on("SIGINT", async () => {
  logger.info("Closing Redis connection...");

  await redis.quit();

  logger.success("Redis connection closed successfully");
  await JobQueue.closeAllQueues();
  await redis.quit();

  process.exit(0);
});

export const CACHE = {
  WORKFLOW: {
    SINGLE: {
      KEY: (userId: string, id: string) => `user:${userId}:workflow:${id}`,
      TTL: 60 * 5,
    },
    ALL: {
      KEY: (userId: string) => `user:${userId}:workflows:all`,
      TTL: 60 * 5,
    },
  },
  DASHBOARD: {
    STATS: {
      KEY: (userId: string) => `user:${userId}:dashboard:stats`,
      TTL: 60,
    },
    RECENT_RUNS: {
      KEY: (userId: string) => `user:${userId}:dashboard:recent_runs`,
      TTL: 60,
    },
  },
  AGENTS: {
    ALL: {
      KEY: () => `agents:all`,
      TTL: 60 * 10,
    },
  },
} as const;
