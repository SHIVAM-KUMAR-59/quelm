import { PrismaClient, AgentStatus, RunStatus } from "@prisma/client";

export class DashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getStats() {
    const [totalWorkflows, totalRuns, completedRuns, agentsOnline] = await Promise.all([
      this.prisma.workflowDefinition.count(),
      this.prisma.workflowRun.count(),
      this.prisma.workflowRun.count({
        where: { status: RunStatus.COMPLETED },
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

  async getRecentRuns() {
    return await this.prisma.workflowRun.findMany({
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
