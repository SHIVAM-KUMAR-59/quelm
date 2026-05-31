import { WorkflowService } from "./workflow.service";
import {
  BodyController,
  BodyParamsController,
  Controller,
  ParamsController,
} from "../../utils/types";
import { Prisma } from "@prisma/client";

type params = {
  id: string;
};

type body = {
  data: { name: string; description?: string; definition: Prisma.InputJsonValue };
};

type triggerBody = {
  data: { input: Record<string, unknown> };
};

export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  getAllWorkflows: Controller = async (req, res, next) => {
    try {
      const workflows = await this.workflowService.getAllWorkflows(req.userId!);
      res.status(200).json({
        message: "Workflows fetched successfully",
        success: true,
        data: workflows,
      });
    } catch (err) {
      next(err);
    }
  };

  getWorkflowById: ParamsController<params> = async (req, res, next) => {
    try {
      const id = req.params.id;
      const workflow = await this.workflowService.getWorkflowById(id, req.userId!);
      res.status(200).json({
        message: "Workflow fetched successfully",
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  };

  createWorkflow: BodyController<body> = async (req, res, next) => {
    try {
      const { data } = req.body;
      const workflow = await this.workflowService.createWorkflow(data, req.userId!);
      res.status(201).json({
        message: "Workflow created successfully",
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  };

  triggerRun: BodyParamsController<triggerBody, params> = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { data } = req.body;
      const workflow = await this.workflowService.triggerRun(id, data.input, req.userId!);
      res.status(200).json({
        message: "Workflow triggered successfully",
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  };
}
