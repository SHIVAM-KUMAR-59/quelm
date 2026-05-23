import { Controller, ParamsController } from "../../utils/types";
import { AgentService } from "./agent.service";

type params = {
  id: string;
};

export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  getAllAgents: Controller = async (req, res, next) => {
    try {
      const agents = await this.agentService.getAllAgents();
      res.status(200).json({
        message: "Agents fetched successfully",
        success: true,
        data: agents,
      });
    } catch (err) {
      next(err);
    }
  };

  getAgentById: ParamsController<params> = async (req, res, next) => {
    try {
      const id = req.params.id;
      const agent = await this.agentService.getAgentById(id);
      res.status(200).json({
        message: "Agent fetched successfully",
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  };
}
