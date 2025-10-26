import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import MonitorService from "@/services/business/MonitorService.js";
import { MonitorType } from "@/db/models/monitors/Monitor.js";
import CheckService from "@/services/business/CheckService.js";
class MonitorController {
  private monitorService: MonitorService;
  private checkService: CheckService;
  constructor(monitorService: MonitorService, checkService: CheckService) {
    this.monitorService = monitorService;
    this.checkService = checkService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!userContext.currentTeamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitor = await this.monitorService.create(
        userContext.orgId,
        userContext.sub,
        userContext.currentTeamId,
        req.body
      );

      res.status(201).json({
        message: "Monitor created successfully",
        data: monitor,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      let monitors;
      if (req.query.embedChecks === "true") {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 10);
        const type: MonitorType[] = req.query.type as MonitorType[];

        monitors = await this.monitorService.getAllEmbedChecks(
          teamId,
          page,
          limit,
          type
        );
      } else {
        monitors = await this.monitorService.getAll(teamId);
      }

      res.status(200).json({
        message: "Monitors retrieved successfully",
        data: monitors,
      });
    } catch (error) {
      next(error);
    }
  };

  getChecks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const monitor = await this.monitorService.get(teamId, monitorId);
      if (!monitor) {
        throw new ApiError("Monitor not found", 404);
      }

      const page = Number(req.validatedQuery.page);
      const rowsPerPage = Number(req.validatedQuery.rowsPerPage);

      const { count, checks } = await this.checkService.getMonitorChecks(
        monitorId,
        page,
        rowsPerPage
      );
      res.status(200).json({
        message: "Checks retrieved successfully",
        data: { count, checks },
      });
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const monitor = await this.monitorService.toggleActive(
        userContext.sub,
        teamId,
        monitorId
      );
      res.status(200).json({
        message: "Monitor paused/unpaused successfully",
        data: monitor,
      });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      let monitor;

      const status = req.query.status;
      if (status && typeof status !== "string") {
        throw new ApiError("Status query parameter must be a string", 400);
      }

      if (req.query.embedChecks === "true") {
        const range = req.query.range;
        if (!range || typeof range !== "string")
          throw new ApiError("Range query parameter is required", 400);

        monitor = await this.monitorService.getEmbedChecks(
          teamId,
          monitorId,
          range,
          status
        );
      } else {
        monitor = await this.monitorService.get(teamId, monitorId);
      }

      res.status(200).json({
        message: "Monitor retrieved successfully",
        data: monitor,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const monitor = await this.monitorService.update(
        userContext.sub,
        teamId,
        monitorId,
        req.body
      );
      res.status(200).json({
        message: "Monitor updated successfully",
        data: monitor,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        throw new ApiError("Monitor ID is required", 400);
      }
      await this.monitorService.delete(teamId, id);

      res.status(200).json({
        message: "Monitor deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default MonitorController;
