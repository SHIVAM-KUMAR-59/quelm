import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardService } from "../../api/dashboard/dashboard.service";

function createMockDashboardRepository() {
  return {
    getStats: vi.fn(),
    getRecentRuns: vi.fn(),
  };
}

vi.mock("../cache/cache.service", () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null), // always cache miss in tests
    set: vi.fn().mockResolvedValue(undefined),
    invalidate: vi.fn().mockResolvedValue(undefined),
    invalidatePattern: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("DashboardService", () => {
  let repo: ReturnType<typeof createMockDashboardRepository>;
  let service: DashboardService;

  beforeEach(() => {
    repo = createMockDashboardRepository();
    service = new DashboardService(repo as any);
  });

  describe("getStats", () => {
    it("returns stats with calculated success rate", async () => {
      repo.getStats.mockResolvedValue({
        totalWorkflows: 10,
        totalRuns: 50,
        completedRuns: 35,
        agentsOnline: 3,
      });

      const result = (await service.getStats("user-1")) as any;

      expect(result.totalWorkflows).toBe(10);
      expect(result.totalRuns).toBe(50);
      expect(result.successRate).toBe(70);
      expect(result.agentsOnline).toBe(3);
    });

    it("returns 0 success rate when there are no runs", async () => {
      repo.getStats.mockResolvedValue({
        totalWorkflows: 0,
        totalRuns: 0,
        completedRuns: 0,
        agentsOnline: 0,
      });

      const result = (await service.getStats("user-1")) as any;

      expect(result.successRate).toBe(0);
    });

    it("rounds success rate to one decimal place", async () => {
      repo.getStats.mockResolvedValue({
        totalWorkflows: 1,
        totalRuns: 3,
        completedRuns: 1,
        agentsOnline: 1,
      });

      const result = (await service.getStats("user-1")) as any;

      expect(result.successRate).toBe(33.3);
    });
  });

  describe("getRecentRuns", () => {
    it("returns recent runs with task count and duration", async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 5000);

      repo.getRecentRuns.mockResolvedValue([
        {
          id: "run-1",
          workflow: { name: "Test Workflow" },
          status: "COMPLETED",
          startedAt: past,
          completedAt: now,
          _count: { tasks: 5 },
        },
      ]);

      const result = (await service.getRecentRuns("user-1")) as any;

      expect(result).toHaveLength(1);
      expect(result[0].workflowName).toBe("Test Workflow");
      expect(result[0].status).toBe("COMPLETED");
      expect(result[0].taskCount).toBe(5);
      expect(result[0].duration).toBe(5);
    });

    it("returns null duration when run is not completed", async () => {
      repo.getRecentRuns.mockResolvedValue([
        {
          id: "run-2",
          workflow: { name: "Running Workflow" },
          status: "RUNNING",
          startedAt: new Date(),
          completedAt: null,
          _count: { tasks: 3 },
        },
      ]);

      const result = (await service.getRecentRuns("user-1")) as any;

      expect(result[0].duration).toBeNull();
    });
  });
});
