import { PrismaClient, WorkflowRun } from "@prisma/client";

export class WorkflowRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<WorkflowRun[]> {
    return await this.prisma.workflowRun.findMany({
      include: {
        tasks: true,
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
      },
    });
  }

  async findByWorkflowId(workflowId: string): Promise<WorkflowRun[]> {
    return await this.prisma.workflowRun.findMany({
      where: {
        workflowId,
      },
      include: {
        tasks: true,
      },
    });
  }
}
