import { NotFoundError, ValidationError } from "../../utils/errors";
import { WorkflowRunRepository } from "./run.repository";

export class WorkflowRunService {
  constructor(private readonly workflowRunRepository: WorkflowRunRepository) {}

  async getAllRuns(userId: string) {
    return await this.workflowRunRepository.findAllByUser(userId);
  }

  async getRunById(id: string, userId: string) {
    if (!id) {
      throw new ValidationError("Workflow run ID is required");
    }

    const workflowRun = await this.workflowRunRepository.findById(id);
    if (workflowRun === null) {
      throw new NotFoundError("Workflow run", id);
    }

    if (workflowRun.userId && workflowRun.userId !== userId) {
      throw new NotFoundError("Workflow run", id);
    }

    return workflowRun;
  }

  async getRunsByWorkflowId(id: string, userId: string) {
    if (!id) {
      throw new ValidationError("Workflow ID is required");
    }
    return this.workflowRunRepository.findByWorkflowId(id, userId);
  }
}
