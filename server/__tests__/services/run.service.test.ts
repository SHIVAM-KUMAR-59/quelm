import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowRunService } from "../../api/run/run.service";
import { NotFoundError, ValidationError } from "../../utils/errors";

function createMockRunRepository() {
  return {
    findAllByUser: vi.fn(),
    findById: vi.fn(),
    findByWorkflowId: vi.fn(),
  };
}

describe("WorkflowRunService", () => {
  let repo: ReturnType<typeof createMockRunRepository>;
  let service: WorkflowRunService;

  beforeEach(() => {
    repo = createMockRunRepository();
    service = new WorkflowRunService(repo as any);
  });

  describe("getAllRuns", () => {
    it("returns all runs for the user", async () => {
      const runs = [{ id: "run-1", workflowId: "wf-1" }];
      repo.findAllByUser.mockResolvedValue(runs);

      const result = await service.getAllRuns("user-1");

      expect(repo.findAllByUser).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(runs);
    });
  });

  describe("getRunById", () => {
    it("returns the run when it belongs to the user", async () => {
      const run = { id: "run-1", userId: "user-1" };
      repo.findById.mockResolvedValue(run);

      const result = await service.getRunById("run-1", "user-1");

      expect(repo.findById).toHaveBeenCalledWith("run-1");
      expect(result).toEqual(run);
    });

    it("throws ValidationError when id is empty", async () => {
      await expect(service.getRunById("", "user-1")).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws NotFoundError when run does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getRunById("nonexistent", "user-1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when run belongs to another user", async () => {
      repo.findById.mockResolvedValue({ id: "run-1", userId: "user-2" });

      await expect(service.getRunById("run-1", "user-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getRunsByWorkflowId", () => {
    it("returns runs for the given workflow", async () => {
      const runs = [{ id: "run-1", workflowId: "wf-1", userId: "user-1" }];
      repo.findByWorkflowId.mockResolvedValue(runs);

      const result = await service.getRunsByWorkflowId("wf-1", "user-1");

      expect(repo.findByWorkflowId).toHaveBeenCalledWith("wf-1", "user-1");
      expect(result).toEqual(runs);
    });

    it("throws ValidationError when workflow id is empty", async () => {
      await expect(service.getRunsByWorkflowId("", "user-1")).rejects.toThrow(
        ValidationError,
      );
    });
  });
});
