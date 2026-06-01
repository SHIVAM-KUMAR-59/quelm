import { AgentType, Prisma, PrismaClient, RunStatus, TaskStatus } from "@prisma/client";

import { QueueEvents } from "bullmq";

import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";

import { Edge, JsonInput, Node, WorkflowDefinition } from "../utils/types";

import { JobQueue } from "../queues";
import { runEmitter } from "../events/run.emitter";

const agentTypes: AgentType[] = [
  AgentType.EXTRACTION_AGENT,
  AgentType.HTTP_AGENT,
  AgentType.LLM_AGENT,
  AgentType.NOTIFICATION_AGENT,
  AgentType.STORAGE_AGENT,
  AgentType.TRANSFORM_AGENT,
];

export class Orchestrator {
  private queueEventsInstances: QueueEvents[] = [];
  private staleRunCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly STALE_RUN_TIMEOUT_MS = 10 * 60 * 1000;
  private readonly STALE_RUN_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(public readonly prisma: PrismaClient) {}

  public start = async () => {
    await this.cleanupStaleRuns();
    this.startStaleRunCleanup();

    for (const agentType of agentTypes) {
      const queueEventInstance = new QueueEvents(agentType, {
        connection: redis,
      });

      queueEventInstance.on("completed", ({ jobId }) => {
        logger.success(`Event completed ${jobId}`);

        this.onTaskCompleted(jobId, agentType);
      });

      queueEventInstance.on("failed", ({ jobId, failedReason }) => {
        logger.error(`Event failed ${jobId}, reason: ${failedReason}`);

        this.onTaskFailed(jobId, failedReason, agentType);
      });

      this.queueEventsInstances.push(queueEventInstance);

      logger.info(`Orchestrator listening on queue: ${agentType}`);
    }
  };

  public stop = async () => {
    this.stopStaleRunCleanup();

    logger.info("Closing all events");

    await Promise.all(
      Array.from(this.queueEventsInstances.values()).map((queueEventInstance) =>
        queueEventInstance.close(),
      ),
    );

    logger.success("All events closed");
  };

  private startStaleRunCleanup = () => {
    this.staleRunCleanupInterval = setInterval(
      this.cleanupStaleRuns,
      this.STALE_RUN_CLEANUP_INTERVAL_MS,
    );
    logger.info("Stale run cleanup started");
  };

  private stopStaleRunCleanup = () => {
    if (this.staleRunCleanupInterval) {
      clearInterval(this.staleRunCleanupInterval);
      this.staleRunCleanupInterval = null;
      logger.info("Stale run cleanup stopped");
    }
  };

  private cleanupStaleRuns = async () => {
    try {
      const cutoff = new Date(Date.now() - this.STALE_RUN_TIMEOUT_MS);

      const staleRuns = await this.prisma.workflowRun.findMany({
        where: {
          status: RunStatus.RUNNING,
          startedAt: { lt: cutoff },
          tasks: {
            none: {
              status: { in: [TaskStatus.RUNNING, TaskStatus.COMPLETED] },
            },
          },
        },
      });

      if (staleRuns.length === 0) {
        return;
      }

      logger.warn(`Found ${staleRuns.length} stale run(s) — failing`);

      for (const run of staleRuns) {
        await this.prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: RunStatus.FAILED,
            error: "Run timed out — no task progressed for more than 10 minutes",
            completedAt: new Date(),
          },
        });

        await this.prisma.task.updateMany({
          where: { runId: run.id, status: TaskStatus.PENDING },
          data: { status: TaskStatus.CANCELLED },
        });

        runEmitter.emit(`run:${run.id}`, {
          type: "RUN_FAILED",
          runId: run.id,
          status: RunStatus.FAILED,
          error: "Run timed out — no task progressed for more than 10 minutes",
        });

        logger.warn(`Stale run failed: ${run.id}`);
      }
    } catch (error) {
      logger.error(`Error during stale run cleanup: ${error}`);
    }
  };

  private buildDependencyMap = (nodes: Node[], edges: Edge[]): Map<string, string[]> => {
    const dependencyMap = new Map<string, string[]>();

    for (const node of nodes) {
      const deps = edges
        .filter((edge) => edge.target === node.id)
        .map((edge) => edge.source);

      dependencyMap.set(node.id, deps);
    }

    return dependencyMap;
  };

  private dispatchUnblockedTasks = async (
    runId: string,
    triggeringTaskOutput: unknown,
  ) => {
    const allTasks = await this.prisma.task.findMany({
      where: { runId },
    });

    // Tasks considered resolved:
    // - completed
    // - failed but non-critical
    const resolvedTaskIds = new Set(
      allTasks
        .filter(
          (task) =>
            task.status === TaskStatus.COMPLETED ||
            (task.status === TaskStatus.FAILED && !task.critical),
        )
        .map((task) => task.id),
    );

    const unblockedTasks = allTasks.filter((task) => {
      if (task.status !== TaskStatus.PENDING) {
        return false;
      }

      const deps = task.dependsOn as string[];

      return deps.every((depId) => resolvedTaskIds.has(depId));
    });

    if (!unblockedTasks.length) {
      return;
    }

    const workflowRun = await this.prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        workflow: true,
      },
    });

    if (!workflowRun) {
      return;
    }

    const definition = workflowRun.workflow.definition as WorkflowDefinition;

    for (const task of unblockedTasks) {
      const node = definition.nodes.find((n) => n.id === task.nodeId);

      if (!node) {
        continue;
      }

      const taskInput = triggeringTaskOutput ?? {};

      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          input: taskInput as Prisma.InputJsonValue,
        },
      });

      await JobQueue.addTaskToQueue(task.type, task.name, {
        taskId: task.id,
        input: taskInput,
        config: node.config,
      });

      runEmitter.emit(`run:${runId}`, {
        taskId: task.id,
        status: TaskStatus.RUNNING,
      });

      logger.info(`Dispatched unblocked task: ${task.name} [${task.type}]`);
    }
  };

  public triggerRun = async (workflowId: string, input: JsonInput) => {
    logger.debug(`Run triggered for workflow: ${workflowId}`);

    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: {
        id: workflowId,
      },
    });

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const definition = workflow.definition as WorkflowDefinition;

    const { nodes, edges } = definition;

    const workflowRun = await this.prisma.workflowRun.create({
      data: {
        workflowId,
        input: input as Prisma.InputJsonValue,
        status: RunStatus.RUNNING,
      },
    });

    const dependencyMap = this.buildDependencyMap(nodes, edges);

    const nodeToTaskId = new Map<string, string>();

    for (const node of nodes) {
      const task = await this.prisma.task.create({
        data: {
          runId: workflowRun.id,
          name: node.name,
          type: node.type,
          critical: node.critical,
          status: TaskStatus.PENDING,
          input: {},
          dependsOn: [],
          nodeId: node.id,
        },
      });

      nodeToTaskId.set(node.id, task.id);
    }

    for (const node of nodes) {
      const taskId = nodeToTaskId.get(node.id)!;

      const nodeDeps = dependencyMap.get(node.id) ?? [];

      const taskDeps = nodeDeps
        .map((nodeId) => nodeToTaskId.get(nodeId))
        .filter((id): id is string => !!id);

      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          dependsOn: taskDeps,
        },
      });
    }

    const firstTasks = nodes.filter(
      (node) => (dependencyMap.get(node.id) ?? []).length === 0,
    );

    for (const node of firstTasks) {
      const taskId = nodeToTaskId.get(node.id)!;

      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          input: input as Prisma.InputJsonValue,
        },
      });

      await JobQueue.addTaskToQueue(node.type, node.name, {
        taskId,
        input,
        config: node.config,
      });

      logger.info(`Dispatched first task: ${node.name} [${node.type}]`);
    }

    logger.success(`Workflow run started: ${workflowRun.id}`);

    return {
      runId: workflowRun.id,
      status: RunStatus.RUNNING,
      workflowId,
    };
  };

  private onTaskCompleted = async (
    jobId: string,
    agentType: AgentType,
  ): Promise<void> => {
    logger.debug(`'completed' event called for job: ${jobId}`);

    const queue = JobQueue.getQueueByAgentType(agentType);

    const job = await queue.getJob(jobId);

    if (!job) {
      logger.error(`Job not found: ${jobId}`);

      return;
    }

    const { taskId } = job.data;

    const completedTask = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!completedTask) {
      logger.error(`Task not found: ${taskId}`);

      return;
    }

    runEmitter.emit(`run:${completedTask.runId}`, {
      taskId: completedTask.id,
      status: TaskStatus.COMPLETED,
      output: completedTask.output,
    });

    await this.dispatchUnblockedTasks(completedTask.runId, completedTask.output);

    const updatedTasks = await this.prisma.task.findMany({
      where: {
        runId: completedTask.runId,
      },
    });

    const allCompleted = updatedTasks.every(
      (task) =>
        task.status === TaskStatus.COMPLETED ||
        task.status === TaskStatus.FAILED ||
        task.status === TaskStatus.CANCELLED,
    );

    if (allCompleted) {
      await this.prisma.workflowRun.update({
        where: {
          id: completedTask.runId,
        },
        data: {
          status: RunStatus.COMPLETED,
          output: completedTask.output as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      runEmitter.emit(`run:${completedTask.runId}`, {
        type: "RUN_COMPLETED",
        runId: completedTask.runId,
        status: RunStatus.COMPLETED,
      });

      logger.success(`Workflow run completed: ${completedTask.runId}`);
    }
  };

  private onTaskFailed = async (
    jobId: string,
    reason: string,
    agentType: AgentType,
  ): Promise<void> => {
    logger.debug(`'failed' event called for job: ${jobId} with reason: ${reason}`);

    const queue = JobQueue.getQueueByAgentType(agentType);

    const job = await queue.getJob(jobId);

    if (!job) {
      logger.error(`Job not found: ${jobId}`);

      return;
    }

    const { taskId } = job.data;

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      logger.error(`Task not found: ${taskId}`);

      return;
    }

    // CRITICAL TASK FAILURE
    if (task.critical) {
      logger.error(`Critical task failed: ${task.name} — failing entire run`);

      await this.prisma.workflowRun.update({
        where: {
          id: task.runId,
        },
        data: {
          status: RunStatus.FAILED,
          error: reason,
          completedAt: new Date(),
        },
      });

      await this.prisma.task.updateMany({
        where: {
          runId: task.runId,
          status: TaskStatus.PENDING,
        },
        data: {
          status: TaskStatus.CANCELLED,
        },
      });

      runEmitter.emit(`run:${task.runId}`, {
        type: "RUN_FAILED",
        runId: task.runId,
        status: RunStatus.FAILED,
        error: reason,
      });

      logger.error(`Workflow run failed: ${task.runId}`);

      return;
    }

    // NON-CRITICAL FAILURE
    logger.debug(`Non-critical task failed, continuing workflow: ${task.name}`);

    runEmitter.emit(`run:${task.runId}`, {
      taskId: task.id,
      status: TaskStatus.FAILED,
      error: reason,
    });

    // Continue downstream execution
    await this.dispatchUnblockedTasks(task.runId, {
      error: reason,
    });

    const updatedTasks = await this.prisma.task.findMany({
      where: { runId: task.runId },
    });

    const isComplete = updatedTasks.every(
      (t) =>
        t.status === TaskStatus.COMPLETED ||
        t.status === TaskStatus.FAILED ||
        t.status === TaskStatus.CANCELLED,
    );

    if (isComplete) {
      await this.prisma.workflowRun.update({
        where: {
          id: task.runId,
        },
        data: {
          status: RunStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      runEmitter.emit(`run:${task.runId}`, {
        type: "RUN_COMPLETED",
        runId: task.runId,
        status: RunStatus.COMPLETED,
      });

      logger.success(
        `Workflow run completed (with non-critical failures): ${task.runId}`,
      );
    }
  };
}
