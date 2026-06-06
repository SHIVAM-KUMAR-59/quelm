import { NotFoundError, ValidationError } from "../../utils/errors";
import { AgentRepository } from "./agent.repository";
import { cacheService } from "../../cache";
import { CACHE } from "../../config/redis.config";

export class AgentService {
  constructor(private readonly agentRepository: AgentRepository) {}

  async getAllAgents() {
    const cacheKey = CACHE.AGENTS.ALL.KEY();

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const agents = await this.agentRepository.findAll();

    await cacheService.set(cacheKey, agents, CACHE.AGENTS.ALL.TTL);

    return agents;
  }

  async getAgentById(id: string) {
    if (!id) throw new ValidationError("Agent ID is required");

    const agent = await this.agentRepository.findById(id);

    if (agent === null) throw new NotFoundError("Agent", id);

    return agent;
  }
}
