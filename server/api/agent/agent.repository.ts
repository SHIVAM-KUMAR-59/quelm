import { Agent, PrismaClient } from "@prisma/client";

export class AgentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Agent[]> {
    return await this.prisma.agent.findMany();
  }

  async findById(id: string): Promise<Agent | null> {
    return await this.prisma.agent.findUnique({
      where: {
        id,
      },
    });
  }
}
