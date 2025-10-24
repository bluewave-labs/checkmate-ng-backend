import { Request, Response, NextFunction } from "express";
import NotificationService from "@/services/business/NotificationChannelService.js";
import ApiError from "@/utils/ApiError.js";
class NotificationChannelController {
  private notificationService: NotificationService;
  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const channel = await this.notificationService.create(
        tokenizedUser,
        req.body
      );
      res.status(201).json({ message: "OK", data: channel });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const notificationChannels = await this.notificationService.getAll(
        teamId
      );
      res.status(200).json({
        message: "OK",
        data: notificationChannels,
      });
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction) => {
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
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const notificationChannel = await this.notificationService.toggleActive(
        teamId,
        tokenizedUser,
        id
      );
      res.status(200).json({ message: "OK", data: notificationChannel });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
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
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const updatedChannel = await this.notificationService.update(
        teamId,
        tokenizedUser,
        id,
        req.body
      );
      res.status(200).json({ message: "OK", data: updatedChannel });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
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
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const notificationChannel = await this.notificationService.get(
        teamId,
        id
      );
      res.status(200).json({ message: "OK", data: notificationChannel });
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
        return res.status(400).json({ message: "ID parameter is required" });
      }
      await this.notificationService.delete(teamId, id);
      res.status(200).json({ message: "OK" });
    } catch (error) {
      next(error);
    }
  };
}

export default NotificationChannelController;
