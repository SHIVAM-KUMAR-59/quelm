import { PrismaClient, AgentStatus, RunStatus } from "@prisma/client";

export class DashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getStats(userId: string) {
    const [totalWorkflows, totalRuns, completedRuns, agentsOnline] = await Promise.all([
      this.prisma.workflowDefinition.count({ where: { userId } }),
      this.prisma.workflowRun.count({ where: { userId } }),
      this.prisma.workflowRun.count({
        where: { userId, status: RunStatus.COMPLETED },
      }),
      this.prisma.agent.count({
        where: { status: AgentStatus.ONLINE },
      }),
    ]);

    return {
      totalWorkflows,
      totalRuns,
      completedRuns,
      agentsOnline,
    };
  }

  async getRecentRuns(userId: string) {
    return await this.prisma.workflowRun.findMany({
      where: { userId },
      take: 5,
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        workflow: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }
}
