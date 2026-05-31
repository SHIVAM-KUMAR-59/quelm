import { DashboardRepository } from "./dashboard.repository";

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStats(userId: string) {
    const { totalWorkflows, totalRuns, completedRuns, agentsOnline } =
      await this.dashboardRepository.getStats(userId);

    const successRate =
      totalRuns === 0 ? 0 : Math.round((completedRuns / totalRuns) * 100 * 10) / 10;

    return {
      totalWorkflows,
      totalRuns,
      successRate,
      agentsOnline,
    };
  }

  async getRecentRuns(userId: string) {
    const runs = await this.dashboardRepository.getRecentRuns(userId);

    return runs.map((run) => ({
      id: run.id,
      workflowName: run.workflow.name,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      taskCount: run._count.tasks,
      duration: run.completedAt
        ? Math.round((run.completedAt.getTime() - run.startedAt.getTime()) / 1000)
        : null,
    }));
  }
}
