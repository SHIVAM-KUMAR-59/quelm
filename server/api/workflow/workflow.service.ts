import { Prisma } from "@prisma/client";
import { Orchestrator } from "../../orchestrator";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { WorkflowRepository } from "./workflow.repository";

export class WorkflowService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly orchestrator: Orchestrator,
  ) {}

  async getAllWorkflows(userId: string) {
    const workflows = await this.workflowRepository.findAllByUser(userId);
    return workflows;
  }

  async getWorkflowById(id: string, userId: string) {
    if (!id) {
      throw new ValidationError("Workflow ID is required");
    }

    const workflow = await this.workflowRepository.findById(id);
    if (workflow === null) {
      throw new NotFoundError("Workflow", id);
    }

    if (workflow.userId && workflow.userId !== userId) {
      throw new NotFoundError("Workflow", id);
    }

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

    return workflow;
  }

  async triggerRun(workflowId: string, input: Record<string, unknown>, userId: string) {
    const run = await this.orchestrator.triggerRun(workflowId, input, userId);
    return run;
  }

  async deleteWorkflow(id: string, userId: string) {
    if (!id) {
      throw new ValidationError("Workflow ID is required");
    }

    const workflow = await this.workflowRepository.findById(id);
    if (workflow === null) {
      throw new NotFoundError("Workflow", id);
    }

    if (workflow.userId && workflow.userId !== userId) {
      throw new NotFoundError("Workflow", id);
    }

    return await this.workflowRepository.delete(id);
  }
}
