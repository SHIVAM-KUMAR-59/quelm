import { AgentType, Prisma, PrismaClient, RunStatus, TaskStatus } from "@prisma/client";
import { QueueEvents } from "bullmq";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";
import { Edge, JsonInput, Node, WorkflowDefinition } from "../utils/types";
import { JobQueue } from "../queues";

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

  constructor(public readonly prisma: PrismaClient) {}

  public start = async () => {
    for (const agentType of agentTypes) {
      const queueEventInstance = new QueueEvents(agentType, { connection: redis });

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
    logger.info("Closing all events");

    await Promise.all(
      Array.from(this.queueEventsInstances.values()).map((queueEventInstance) =>
        queueEventInstance.close(),
      ),
    );

    logger.success("All events closed");
  };

  private buildDependencyMap = (nodes: Node[], edges: Edge[]): Map<string, string[]> => {
    // nodeId -> array of nodeIds it depends on
    const dependencyMap = new Map<string, string[]>();

    for (const node of nodes) {
      const deps = edges
        .filter((edge) => edge.target === node.id)
        .map((edge) => edge.source);

      dependencyMap.set(node.id, deps);
    }

    return dependencyMap;
  };

  public triggerRun = async (workflowId: string, input: JsonInput) => {
    logger.debug(`Run triggered for workflow: ${workflowId}`);

    // Fetch the workflow definition from the database
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: {
        id: workflowId,
      },
    });

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Parse the nodes and edges from the definition JSON
    const definition = workflow.definition as WorkflowDefinition;
    const { nodes, edges } = definition;

    // Create a WorkflowRun row
    const workflowRun = await this.prisma.workflowRun.create({
      data: {
        workflowId,
        input: input as Prisma.InputJsonValue,
        status: RunStatus.RUNNING,
      },
    });

    // Build dependency map — nodeId -> array of nodeIds it depends on
    const dependencyMap = this.buildDependencyMap(nodes, edges);

    // nodeId -> taskId — needed to translate node dependencies to task dependencies
    const nodeToTaskId = new Map<string, string>();

    // Create all task rows first with empty dependsOn — we'll update them after
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
        },
      });

      // Map node ID to the real database task ID
      nodeToTaskId.set(node.id, task.id);
    }

    // Now update each task's dependsOn with real task IDs
    for (const node of nodes) {
      const taskId = nodeToTaskId.get(node.id)!;
      const nodeDeps = dependencyMap.get(node.id) ?? [];

      // Translate node IDs to task IDs
      const taskDeps = nodeDeps
        .map((nodeId) => nodeToTaskId.get(nodeId))
        .filter((id): id is string => !!id);

      await this.prisma.task.update({
        where: { id: taskId },
        data: { dependsOn: taskDeps },
      });
    }

    // Find tasks with no dependencies — dispatch these immediately
    const firstTasks = nodes.filter(
      (node) => (dependencyMap.get(node.id) ?? []).length === 0,
    );

    // Dispatch first tasks with the run input as their input
    for (const node of firstTasks) {
      const taskId = nodeToTaskId.get(node.id)!;

      // Set input from workflow run input
      await this.prisma.task.update({
        where: { id: taskId },
        data: { input: input as Prisma.InputJsonValue },
      });

      // Push to the correct agent queue
      await JobQueue.addTaskToQueue(node.type, node.name, {
        taskId,
        input,
        config: node.config,
      });

      logger.info(`Dispatched first task: ${node.name} [${node.type}]`);
    }

    logger.success(`Workflow run started: ${workflowRun.id}`);

    // Return immediately — execution continues asynchronously
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

    // Get job from BullMQ to extract taskId
    const queue = JobQueue.getQueueByAgentType(agentType);
    const job = await queue.getJob(jobId);

    if (!job) {
      logger.error(`Job not found: ${jobId}`);
      return;
    }

    const { taskId } = job.data;

    // Fetch the completed task
    const completedTask = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!completedTask) {
      logger.error(`Task not found: ${taskId}`);
      return;
    }

    // Fetch all tasks for this run
    const allTasks = await this.prisma.task.findMany({
      where: { runId: completedTask.runId },
    });

    // Find unblocked tasks
    // A task is unblocked when all IDs in its dependsOn are COMPLETED
    const completedTaskIds = new Set(
      allTasks
        .filter((task) => task.status === TaskStatus.COMPLETED)
        .map((task) => task.id),
    );

    const unblockedTasks = allTasks.filter((task) => {
      // Skip tasks that are already running, completed, or failed
      if (task.status !== TaskStatus.PENDING) return false;

      const deps = task.dependsOn as string[];

      // All dependencies must be completed
      return deps.every((depId) => completedTaskIds.has(depId));
    });

    // Dispatch unblocked tasks
    for (const task of unblockedTasks) {
      // Fetch the workflow definition to get node config
      const workflowRun = await this.prisma.workflowRun.findUnique({
        where: { id: completedTask.runId },
        include: { workflow: true },
      });

      if (!workflowRun) continue;

      const definition = workflowRun.workflow.definition as WorkflowDefinition;
      const node = definition.nodes.find((n) => n.name === task.name);

      if (!node) continue;

      // Set input from completed task output
      const taskInput = completedTask.output ?? {};

      await this.prisma.task.update({
        where: { id: task.id },
        data: { input: taskInput as Prisma.InputJsonValue },
      });

      // Dispatch to queue
      await JobQueue.addTaskToQueue(task.type, task.name, {
        taskId: task.id,
        input: taskInput,
        config: node.config,
      });

      logger.info(`Dispatched unblocked task: ${task.name} [${task.type}]`);
    }

    // Check if all tasks are completed
    const allCompleted = allTasks.every(
      (task) => task.status === TaskStatus.COMPLETED || task.id === completedTask.id,
    );

    if (allCompleted) {
      // The output of the run is the output of the last completed task
      await this.prisma.workflowRun.update({
        where: { id: completedTask.runId },
        data: {
          status: RunStatus.COMPLETED,
          output: completedTask.output as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
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

    // Get job from BullMQ to extract taskId
    const queue = JobQueue.getQueueByAgentType(agentType);
    const job = await queue.getJob(jobId);

    if (!job) {
      logger.error(`Job not found: ${jobId}`);
      return;
    }

    const { taskId } = job.data;

    // Fetch the failed task
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      logger.error(`Task not found: ${taskId}`);
      return;
    }

    if (task.critical) {
      logger.error(`Critical task failed: ${task.name} — failing entire run`);

      // Fail the entire workflow run
      await this.prisma.workflowRun.update({
        where: { id: task.runId },
        data: {
          status: RunStatus.FAILED,
          error: reason,
          completedAt: new Date(),
        },
      });

      // Cancel all pending tasks in this run
      await this.prisma.task.updateMany({
        where: {
          runId: task.runId,
          status: TaskStatus.PENDING,
        },
        data: {
          status: TaskStatus.CANCELLED,
        },
      });

      logger.error(`Workflow run failed: ${task.runId}`);
    } else {
      logger.warn(`Non-critical task failed, skipping: ${task.name}`);

      // Fetch all tasks to check if run is complete
      const allTasks = await this.prisma.task.findMany({
        where: { runId: task.runId },
      });

      // Run is complete if no tasks are pending or running
      const isComplete = allTasks.every(
        (t) =>
          t.status === TaskStatus.COMPLETED ||
          t.status === TaskStatus.FAILED ||
          t.status === TaskStatus.CANCELLED ||
          t.id === task.id,
      );

      if (isComplete) {
        await this.prisma.workflowRun.update({
          where: { id: task.runId },
          data: {
            status: RunStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        logger.success(`Workflow run completed (with skipped tasks): ${task.runId}`);
      }
    }
  };
}
