import { Prisma, PrismaClient, WorkflowDefinition } from "@prisma/client";

export class WorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<WorkflowDefinition[]> {
    return await this.prisma.workflowDefinition.findMany();
  }

  async findById(id: string): Promise<WorkflowDefinition | null> {
    return await this.prisma.workflowDefinition.findUnique({
      where: {
        id,
      },
    });
  }

  async create(data: Prisma.WorkflowDefinitionCreateInput): Promise<WorkflowDefinition> {
    return await this.prisma.workflowDefinition.create({
      data: data,
    });
  }

  async update(
    id: string,
    data: Prisma.WorkflowDefinitionUpdateInput,
  ): Promise<WorkflowDefinition> {
    return await this.prisma.workflowDefinition.update({
      where: {
        id,
      },
      data: data,
    });
  }

  async delete(id: string): Promise<WorkflowDefinition> {
    return await this.prisma.workflowDefinition.delete({
      where: {
        id,
      },
    });
  }
}
