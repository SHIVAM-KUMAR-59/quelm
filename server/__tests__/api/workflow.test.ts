import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, generateTestToken } from "../helpers/app";

function createMockOrchestrator() {
  return {
    triggerRun: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    prisma: {},
  };
}

function createMockPrisma() {
  return {
    workflowDefinition: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workflowRun: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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

describe("Workflow API", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let orchestrator: ReturnType<typeof createMockOrchestrator>;
  let app: ReturnType<typeof createTestApp>;
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma() as any;
    orchestrator = createMockOrchestrator() as any;
    app = createTestApp(orchestrator, prisma);
    token = generateTestToken();
  });

  describe("GET /api/workflow", () => {
    it("returns all workflows for the authenticated user", async () => {
      const workflows = [
        { id: "wf-1", name: "Test Workflow", description: null, definition: {} },
      ];
      prisma.workflowDefinition.findMany.mockResolvedValue(workflows);

      const res = await request(app)
        .get("/api/workflow")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(workflows);
    });

    it("returns 401 without auth header", async () => {
      const res = await request(app).get("/api/workflow").expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/workflow/:id", () => {
    it("returns a single workflow", async () => {
      const workflow = {
        id: "wf-1",
        name: "Test",
        userId: "test-user-id",
        definition: {},
      };
      prisma.workflowDefinition.findUnique.mockResolvedValue(workflow);

      const res = await request(app)
        .get("/api/workflow/wf-1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.id).toBe("wf-1");
    });

    it("returns 404 when workflow does not exist", async () => {
      prisma.workflowDefinition.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/workflow/nonexistent")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/workflow", () => {
    it("creates a new workflow", async () => {
      const newWorkflow = {
        id: "wf-new",
        name: "New Workflow",
        definition: { nodes: [], edges: [] },
        userId: "test-user-id",
      };
      prisma.workflowDefinition.create.mockResolvedValue(newWorkflow);

      const res = await request(app)
        .post("/api/workflow")
        .set("Authorization", `Bearer ${token}`)
        .send({
          data: { name: "New Workflow", definition: { nodes: [], edges: [] } },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Workflow");
    });
  });

  describe("DELETE /api/workflow/:id", () => {
    it("deletes a workflow", async () => {
      const workflow = {
        id: "wf-1",
        name: "Test",
        userId: "test-user-id",
        definition: {},
      };
      prisma.workflowDefinition.findUnique.mockResolvedValue(workflow);
      prisma.workflowDefinition.delete.mockResolvedValue(workflow);

      const res = await request(app)
        .delete("/api/workflow/wf-1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe("POST /api/workflow/:id/run", () => {
    it("triggers a workflow run", async () => {
      orchestrator.triggerRun.mockResolvedValue({
        runId: "run-1",
        status: "RUNNING",
        workflowId: "wf-1",
      });

      prisma.workflowDefinition.findUnique.mockResolvedValue({
        id: "wf-1",
        name: "Test",
        userId: "test-user-id",
        definition: {
          nodes: [
            { id: "n1", type: "LLM_AGENT", name: "Step 1", critical: true, config: {} },
          ],
          edges: [],
        },
      });

      const res = await request(app)
        .post("/api/workflow/wf-1/run")
        .set("Authorization", `Bearer ${token}`)
        .send({ data: { input: { prompt: "hello" } } })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("RUNNING");
    });
  });
});
