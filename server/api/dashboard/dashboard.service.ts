import { cacheService } from "../../cache";
import { CACHE } from "../../config/redis.config";
import { DashboardRepository } from "./dashboard.repository";

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStats(userId: string) {
    const cacheKey = CACHE.DASHBOARD.STATS.KEY(userId);

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { totalWorkflows, totalRuns, completedRuns, agentsOnline } =
      await this.dashboardRepository.getStats(userId);

    const successRate =
      totalRuns === 0 ? 0 : Math.round((completedRuns / totalRuns) * 100 * 10) / 10;

    const result = {
      totalWorkflows,
      totalRuns,
      successRate,
      agentsOnline,
    };

    await cacheService.set(cacheKey, result, CACHE.DASHBOARD.STATS.TTL);

    return result;
  }

  async getRecentRuns(userId: string) {
    const cacheKey = CACHE.DASHBOARD.RECENT_RUNS.KEY(userId);

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const runs = await this.dashboardRepository.getRecentRuns(userId);

    const result = runs.map((run) => ({
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

    await cacheService.set(cacheKey, result, CACHE.DASHBOARD.RECENT_RUNS.TTL);

    return result;
  }
}
