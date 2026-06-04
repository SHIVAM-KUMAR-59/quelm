import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowService } from "../../api/workflow/workflow.service";
import { NotFoundError, ValidationError } from "../../utils/errors";

function createMockWorkflowRepository() {
  return {
    findAllByUser: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockOrchestrator() {
  return {
    triggerRun: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    prisma: {},
  };
}

describe("WorkflowService", () => {
  let repo: ReturnType<typeof createMockWorkflowRepository>;
  let orchestrator: ReturnType<typeof createMockOrchestrator>;
  let service: WorkflowService;

  beforeEach(() => {
    repo = createMockWorkflowRepository();
    orchestrator = createMockOrchestrator();
    service = new WorkflowService(repo as any, orchestrator as any);
  });

  describe("getAllWorkflows", () => {
    it("returns all workflows for the user", async () => {
      const workflows = [{ id: "1", name: "Test Workflow" }];
      repo.findAllByUser.mockResolvedValue(workflows);

      const result = await service.getAllWorkflows("user-1");

      expect(repo.findAllByUser).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(workflows);
    });
  });

  describe("getWorkflowById", () => {
    it("returns the workflow when it belongs to the user", async () => {
      const workflow = { id: "wf-1", name: "Test", userId: "user-1" };
      repo.findById.mockResolvedValue(workflow);

      const result = await service.getWorkflowById("wf-1", "user-1");

      expect(repo.findById).toHaveBeenCalledWith("wf-1");
      expect(result).toEqual(workflow);
    });

    it("throws ValidationError when id is empty", async () => {
      await expect(service.getWorkflowById("", "user-1")).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws NotFoundError when workflow does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getWorkflowById("nonexistent", "user-1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when workflow belongs to another user", async () => {
      const workflow = { id: "wf-1", name: "Test", userId: "user-2" };
      repo.findById.mockResolvedValue(workflow);

      await expect(service.getWorkflowById("wf-1", "user-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("createWorkflow", () => {
    it("creates a workflow with valid data", async () => {
      const data = { name: "New Workflow", definition: { nodes: [], edges: [] } };
      const created = { id: "wf-1", ...data, userId: "user-1" };
      repo.create.mockResolvedValue(created);

      const result = await service.createWorkflow(data, "user-1");

      expect(repo.create).toHaveBeenCalledWith(data, "user-1");
      expect(result).toEqual(created);
    });

    it("throws ValidationError when name is empty", async () => {
      const data = { name: "", definition: {} };

      await expect(service.createWorkflow(data, "user-1")).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws ValidationError when definition is missing", async () => {
      const data = { name: "Test", definition: undefined as any };

      await expect(service.createWorkflow(data, "user-1")).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("triggerRun", () => {
    it("delegates to orchestrator and returns the run", async () => {
      const runResult = { runId: "run-1", status: "RUNNING", workflowId: "wf-1" };
      orchestrator.triggerRun.mockResolvedValue(runResult);

      const result = await service.triggerRun("wf-1", { prompt: "hello" }, "user-1");

      expect(orchestrator.triggerRun).toHaveBeenCalledWith(
        "wf-1",
        { prompt: "hello" },
        "user-1",
      );
      expect(result).toEqual(runResult);
    });
  });

  describe("deleteWorkflow", () => {
    it("deletes a workflow when it belongs to the user", async () => {
      const workflow = { id: "wf-1", name: "Test", userId: "user-1" };
      repo.findById.mockResolvedValue(workflow);
      repo.delete.mockResolvedValue(workflow);

      const result = await service.deleteWorkflow("wf-1", "user-1");

      expect(repo.delete).toHaveBeenCalledWith("wf-1");
      expect(result).toEqual(workflow);
    });

    it("throws ValidationError when id is empty", async () => {
      await expect(service.deleteWorkflow("", "user-1")).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when workflow does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.deleteWorkflow("nonexistent", "user-1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when workflow belongs to another user", async () => {
      const workflow = { id: "wf-1", name: "Test", userId: "user-2" };
      repo.findById.mockResolvedValue(workflow);

      await expect(service.deleteWorkflow("wf-1", "user-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
