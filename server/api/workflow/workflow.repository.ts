import { Prisma, PrismaClient, WorkflowDefinition } from "@prisma/client";

export class WorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllByUser(userId: string): Promise<WorkflowDefinition[]> {
    return await this.prisma.workflowDefinition.findMany({
      where: { userId },
    });
  }

  async findById(id: string): Promise<WorkflowDefinition | null> {
    return await this.prisma.workflowDefinition.findUnique({
      where: {
        id,
      },
    });
  }

  async create(
    data: { name: string; description?: string; definition: Prisma.InputJsonValue },
    userId: string,
  ): Promise<WorkflowDefinition> {
    return await this.prisma.workflowDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        definition: data.definition,
        userId,
      },
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
