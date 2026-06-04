import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentService } from "../../api/agent/agent.service";
import { NotFoundError, ValidationError } from "../../utils/errors";

function createMockAgentRepository() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
  };
}

describe("AgentService", () => {
  let repo: ReturnType<typeof createMockAgentRepository>;
  let service: AgentService;

  beforeEach(() => {
    repo = createMockAgentRepository();
    service = new AgentService(repo as any);
  });

  describe("getAllAgents", () => {
    it("returns all agents", async () => {
      const agents = [{ id: "agent-1", name: "LLM_AGENT_1", type: "LLM_AGENT" }];
      repo.findAll.mockResolvedValue(agents);

      const result = await service.getAllAgents();

      expect(repo.findAll).toHaveBeenCalled();
      expect(result).toEqual(agents);
    });
  });

  describe("getAgentById", () => {
    it("returns the agent when it exists", async () => {
      const agent = { id: "agent-1", name: "LLM_AGENT_1" };
      repo.findById.mockResolvedValue(agent);

      const result = await service.getAgentById("agent-1");

      expect(repo.findById).toHaveBeenCalledWith("agent-1");
      expect(result).toEqual(agent);
    });

    it("throws ValidationError when id is empty", async () => {
      await expect(service.getAgentById("")).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when agent does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getAgentById("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });
});
