import { NotFoundError, ValidationError } from "../../utils/errors";
import { AgentRepository } from "./agent.repository";

export class AgentService {
  constructor(private readonly agentRepository: AgentRepository) {}

  async getAllAgents() {
    return await this.agentRepository.findAll();
  }

  async getAgentById(id: string) {
    if (!id) {
      throw new ValidationError("Agent ID is required");
    }

    const agent = await this.agentRepository.findById(id);
    if (agent === null) {
      throw new NotFoundError("Agent", id);
    }

    return agent;
  }
}
