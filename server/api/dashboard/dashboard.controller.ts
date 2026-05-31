import { Controller } from "../../utils/types";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getStats: Controller = async (req, res, next) => {
    try {
      const stats = await this.dashboardService.getStats(req.userId!);
      res.status(200).json({
        success: true,
        message: "Dashboard stats fetched successfully",
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  };

  getRecentRuns: Controller = async (req, res, next) => {
    try {
      const runs = await this.dashboardService.getRecentRuns(req.userId!);
      res.status(200).json({
        success: true,
        message: "Recent runs fetched successfully",
        data: runs,
      });
    } catch (err) {
      next(err);
    }
  };
}
