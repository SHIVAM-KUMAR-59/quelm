import { PrismaClient, WorkflowRun } from "@prisma/client";

export class WorkflowRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllByUser(userId: string): Promise<WorkflowRun[]> {
    return await this.prisma.workflowRun.findMany({
      where: { userId },
      include: {
        tasks: true,
        workflow: true,
      },
    });
  }

  async findById(id: string): Promise<WorkflowRun | null> {
    return await this.prisma.workflowRun.findUnique({
      where: {
        id,
      },
      include: {
        tasks: true,
        workflow: true,
      },
    });
  }

  async findByWorkflowId(workflowId: string, userId: string): Promise<WorkflowRun[]> {
    return await this.prisma.workflowRun.findMany({
      where: {
        workflowId,
        userId,
      },
      include: {
        tasks: true,
        workflow: true,
      },
    });
  }
}
