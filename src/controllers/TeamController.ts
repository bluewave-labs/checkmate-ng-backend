import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import TeamService from "@/services/business/TeamService.js";
import { encode } from "@/utils/JWTUtils.js";
import { invalidateCachesForUser } from "@/middleware/AddUserContext.js";

export interface ITeamController {
  create: (req: Request, res: Response, next: NextFunction) => void;
  getAll: (req: Request, res: Response, next: NextFunction) => void;
  get: (req: Request, res: Response, next: NextFunction) => void;
  update: (req: Request, res: Response, next: NextFunction) => void;
  delete: (req: Request, res: Response, next: NextFunction) => void;
}

class TeamController implements ITeamController {
  private teamService: TeamService;
  constructor(teamService: TeamService) {
    this.teamService = teamService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orgId = tokenizedUser.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const userId = tokenizedUser.sub;
      if (!userId) {
        throw new ApiError("No user ID", 400);
      }

      const roleId = req.body.roleId;
      if (!roleId) {
        throw new ApiError("No role ID", 400);
      }

      invalidateCachesForUser(userId);

      await this.teamService.create(tokenizedUser, req.body, roleId);

      return res.status(201).json({
        message: "Team created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    const tokenizedUser = req.user;
    if (!tokenizedUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = tokenizedUser.sub;
    if (!userId) {
      throw new ApiError("No user ID", 400);
    }

    const teams = await this.teamService.getAll(userId);
    return res
      .status(200)
      .json({ message: "Teams retrieved successfully", data: teams });

    try {
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error) {
      next(error);
    }
  };
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error) {
      next(error);
    }
  };
}

export default TeamController;
