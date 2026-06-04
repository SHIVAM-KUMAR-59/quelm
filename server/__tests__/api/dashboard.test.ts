import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, generateTestToken } from "../helpers/app";

function createMockPrisma() {
  return {
    workflowDefinition: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workflowRun: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    agent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

function createMockOrchestrator() {
  return { triggerRun: vi.fn(), start: vi.fn(), stop: vi.fn(), prisma: {} };
}

describe("Dashboard API", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let app: ReturnType<typeof createTestApp>;
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma() as any;
    app = createTestApp(createMockOrchestrator(), prisma);
    token = generateTestToken();
  });

  describe("GET /api/dashboard/stats", () => {
    it("returns dashboard stats", async () => {
      prisma.workflowDefinition.count.mockResolvedValue(5);
      prisma.workflowRun.count.mockResolvedValueOnce(20).mockResolvedValueOnce(15);
      prisma.agent.count.mockResolvedValue(3);

      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalWorkflows).toBe(5);
      expect(res.body.data.totalRuns).toBe(20);
      expect(res.body.data.successRate).toBe(75);
      expect(res.body.data.agentsOnline).toBe(3);
    });
  });

  describe("GET /api/dashboard/recent-runs", () => {
    it("returns recent runs", async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 10000);

      prisma.workflowRun.findMany.mockResolvedValue([
        {
          id: "run-1",
          status: "COMPLETED",
          startedAt: past,
          completedAt: now,
          workflow: { name: "Test" },
          _count: { tasks: 4 },
        },
      ]);

      const res = await request(app)
        .get("/api/dashboard/recent-runs")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].workflowName).toBe("Test");
      expect(res.body.data[0].taskCount).toBe(4);
    });
  });
});
