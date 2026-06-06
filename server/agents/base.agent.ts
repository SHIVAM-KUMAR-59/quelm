import { AgentStatus, AgentType, Prisma, PrismaClient, TaskStatus } from "@prisma/client";
import { logger } from "../config/logger.config";
import { Job, Worker } from "bullmq";
import { CACHE, redis } from "../config/redis.config";
import { cacheService } from "../cache";

export abstract class BaseAgent {
  // BullMQ worker instance, set in start()
  private worker: Worker | null = null;

  // Heartbeat interval, set in start()
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    public readonly name: string,
    public readonly agentType: AgentType,
    public readonly concurrency: number = 1,
    public readonly prisma: PrismaClient,
  ) {}

  // Abstract method to be implemented by child classes
  abstract execute(input: unknown, config: unknown): Promise<unknown>;

  async start(): Promise<void> {
    logger.info(`Starting agent: ${this.name} [${this.agentType}]`);

    // Register or update agent in the database
    await this.prisma.agent.upsert({
      where: {
        name_type: {
          name: this.name,
          type: this.agentType,
        },
      },

      create: {
        name: this.name,
        type: this.agentType,
        status: AgentStatus.ONLINE,
        lastSeenAt: new Date(),
      },

      update: {
        status: AgentStatus.ONLINE,
        lastSeenAt: new Date(),
      },
    });

    // Invalidate agent cache — status changed to ONLINE
    await cacheService.invalidate(CACHE.AGENTS.ALL.KEY());

    logger.success(`Agent registered: ${this.name} [${this.agentType}]`);

    // Create BullMQ worker for this agent type
    this.worker = new Worker(
      this.agentType,
      async (job: Job) => {
        const jobName = job.name;
        const jobData = job.data;

        logger.debug(`Job ${jobName} started [taskId: ${jobData.taskId}]`);

        // Mark task as RUNNING and increment attempts
        await this.prisma.task.update({
          where: {
            id: jobData.taskId,
          },

          data: {
            status: TaskStatus.RUNNING,
            startedAt: new Date(),

            attempts: {
              increment: 1,
            },
          },
        });

        // Mark agent as BUSY
        await this.prisma.agent.update({
          where: {
            name_type: {
              name: this.name,
              type: this.agentType,
            },
          },

          data: {
            status: AgentStatus.BUSY,
            lastSeenAt: new Date(),
          },
        });

        // Invalidate agent cache — status changed to BUSY
        await cacheService.invalidate(CACHE.AGENTS.ALL.KEY());

        try {
          // Execute agent-specific logic
          const result = await this.execute(jobData.input, jobData.config);

          // Mark task as COMPLETED with output
          await this.prisma.task.update({
            where: {
              id: jobData.taskId,
            },

            data: {
              status: TaskStatus.COMPLETED,
              output: result as Prisma.InputJsonValue,
              completedAt: new Date(),
            },
          });

          // Mark agent as ONLINE and increment tasksHandled
          await this.prisma.agent.update({
            where: {
              name_type: {
                name: this.name,
                type: this.agentType,
              },
            },

            data: {
              status: AgentStatus.ONLINE,
              lastSeenAt: new Date(),
              tasksHandled: {
                increment: 1,
              },
            },
          });

          // Invalidate agent cache — status changed back to ONLINE
          await cacheService.invalidate(CACHE.AGENTS.ALL.KEY());

          logger.success(`Job ${jobName} completed [taskId: ${jobData.taskId}]`);

          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";

          // Mark task as FAILED with error message
          await this.prisma.task.update({
            where: {
              id: jobData.taskId,
            },

            data: {
              status: TaskStatus.FAILED,
              error: errorMessage,
              completedAt: new Date(),
            },
          });

          // Mark agent as ONLINE and increment tasksFailed
          await this.prisma.agent.update({
            where: {
              name_type: {
                name: this.name,
                type: this.agentType,
              },
            },

            data: {
              status: AgentStatus.ONLINE,
              lastSeenAt: new Date(),
              tasksFailed: {
                increment: 1,
              },
            },
          });

          // Invalidate agent cache — status changed back to ONLINE
          await cacheService.invalidate(CACHE.AGENTS.ALL.KEY());

          logger.error(
            `Job ${jobName} failed [taskId: ${jobData.taskId}]: ${errorMessage}`,
          );

          // Rethrow so BullMQ can trigger retry logic
          throw error;
        }
      },

      {
        connection: redis,
        concurrency: this.concurrency,
      },
    );

    // Worker event listeners
    this.worker.on("completed", (job: Job) => {
      logger.success(`Worker finished job successfully [job_id: ${job.id}]`);
    });

    this.worker.on("failed", (job: Job | undefined, error: Error) => {
      logger.error(`Worker failed [job_id: ${job?.id}]: ${error.message}`);
    });

    this.worker.on("error", (error: Error) => {
      logger.error(`Worker error [${this.agentType}]: ${error.message}`);
    });

    // Start heartbeat to keep agent alive in the database
    this.startHeartbeat();

    logger.success(`Agent started: ${this.name} [${this.agentType}]`);
  }

  async stop(): Promise<void> {
    logger.info(`Stopping agent: ${this.name} [${this.agentType}]`);

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close BullMQ worker
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }

    // Mark agent as OFFLINE in the database
    await this.prisma.agent.update({
      where: {
        name_type: {
          name: this.name,
          type: this.agentType,
        },
      },

      data: {
        status: AgentStatus.OFFLINE,
        lastSeenAt: new Date(),
      },
    });

    // Invalidate agent cache — status changed to OFFLINE
    await cacheService.invalidate(CACHE.AGENTS.ALL.KEY());

    logger.success(`Agent stopped: ${this.name} [${this.agentType}]`);
  }

  // Heartbeat — updates lastSeenAt every 30 seconds
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.prisma.agent.update({
          where: {
            name_type: {
              name: this.name,
              type: this.agentType,
            },
          },

          data: {
            lastSeenAt: new Date(),
          },
        });

        logger.debug(`Heartbeat sent: ${this.name} [${this.agentType}]`);
      } catch {
        logger.error(`Heartbeat failed: ${this.name} [${this.agentType}]`);
      }
    }, 30000);
  }
}
