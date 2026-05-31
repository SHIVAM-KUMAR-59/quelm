import { Controller, ParamsController } from "../../utils/types";
import { WorkflowRunService } from "./run.service";

type params = {
  id: string;
};

type workflowIdParams = {
  workflowId: string;
};

export class WorkflowRunController {
  constructor(private readonly workflowRunService: WorkflowRunService) {}

  getAllRuns: Controller = async (req, res, next) => {
    try {
      const runs = await this.workflowRunService.getAllRuns(req.userId!);
      res.status(200).json({
        message: "Workflow runs fetched successfully",
        success: true,
        data: runs,
      });
    } catch (err) {
      next(err);
    }
  };

  getRunById: ParamsController<params> = async (req, res, next) => {
    try {
      const id = req.params.id;
      const run = await this.workflowRunService.getRunById(id, req.userId!);
      res.status(200).json({
        message: "Workflow run fetched successfully",
        success: true,
        data: run,
      });
    } catch (err) {
      next(err);
    }
  };

  getRunByWorkflowId: ParamsController<workflowIdParams> = async (req, res, next) => {
    try {
      const id = req.params.workflowId;
      const run = await this.workflowRunService.getRunsByWorkflowId(id, req.userId!);
      res.status(200).json({
        message: "Workflow run fetched successfully",
        success: true,
        data: run,
      });
    } catch (err) {
      next(err);
    }
  };
}
