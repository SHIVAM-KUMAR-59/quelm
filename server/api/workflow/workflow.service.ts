import { Prisma } from "@prisma/client";
import { Orchestrator } from "../../orchestrator";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { WorkflowRepository } from "./workflow.repository";
import { cacheService } from "../../cache";
import { CACHE } from "../../config/redis.config";

export class WorkflowService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly orchestrator: Orchestrator,
  ) {}

  async getAllWorkflows(userId: string) {
    const cacheKey = CACHE.WORKFLOW.ALL.KEY(userId);

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const workflows = await this.workflowRepository.findAllByUser(userId);

    await cacheService.set(cacheKey, workflows, CACHE.WORKFLOW.ALL.TTL);

    return workflows;
  }

  async getWorkflowById(id: string, userId: string) {
    if (!id) throw new ValidationError("Workflow ID is required");

    const cacheKey = CACHE.WORKFLOW.SINGLE.KEY(userId, id);

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const workflow = await this.workflowRepository.findById(id);

    if (workflow === null) throw new NotFoundError("Workflow", id);

    if (workflow.userId && workflow.userId !== userId) {
      throw new NotFoundError("Workflow", id);
    }

    await cacheService.set(cacheKey, workflow, CACHE.WORKFLOW.SINGLE.TTL);

    return workflow;
  }

  async createWorkflow(
    data: {
      name: string;
      description?: string;
      definition: Prisma.InputJsonValue;
    },
    userId: string,
  ) {
    const { name, definition } = data;

    if (!name || name.trim() === "") {
      throw new ValidationError(`${name} is not a valid name`);
    }

    if (!definition) {
      throw new ValidationError(`${definition} is not a valid definition`);
    }

    const workflow = await this.workflowRepository.create(data, userId);

    // Invalidate all workflows list — new workflow added
    await cacheService.invalidate(CACHE.WORKFLOW.ALL.KEY(userId));

    // Invalidate dashboard stats — workflow count changed
    await cacheService.invalidate(CACHE.DASHBOARD.STATS.KEY(userId));

    return workflow;
  }

  async triggerRun(workflowId: string, input: Record<string, unknown>, userId: string) {
    const run = await this.orchestrator.triggerRun(workflowId, input, userId);

    // Invalidate dashboard — run count and recent runs changed
    await cacheService.invalidate(CACHE.DASHBOARD.STATS.KEY(userId));
    await cacheService.invalidate(CACHE.DASHBOARD.RECENT_RUNS.KEY(userId));

    return run;
  }

  async deleteWorkflow(id: string, userId: string) {
    if (!id) throw new ValidationError("Workflow ID is required");

    const workflow = await this.workflowRepository.findById(id);

    if (workflow === null) throw new NotFoundError("Workflow", id);

    if (workflow.userId && workflow.userId !== userId) {
      throw new NotFoundError("Workflow", id);
    }

    const deleted = await this.workflowRepository.delete(id);

    // Invalidate single workflow and list
    await cacheService.invalidate(CACHE.WORKFLOW.SINGLE.KEY(userId, id));
    await cacheService.invalidate(CACHE.WORKFLOW.ALL.KEY(userId));

    // Invalidate dashboard — workflow count changed
    await cacheService.invalidate(CACHE.DASHBOARD.STATS.KEY(userId));

    return deleted;
  }
}
