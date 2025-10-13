import { Request, Response, NextFunction } from "express";

import {
  OrgMembership,
  TeamMembership,
  Role,
  IRole,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

export const addUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError("User not authenticated", 401);
    }

    const { sub, orgId, teamId } = req.user;
    if (!sub || !orgId || !teamId) {
      throw new ApiError("Invalid user context");
    }

    const [orgMembership, teamMembership] = await Promise.all([
      OrgMembership.findOne({ userId: sub, orgId }),
      TeamMembership.findOne({ userId: sub, teamId }),
    ]);

    if (!orgMembership || !teamMembership) {
      throw new ApiError("Membership not found");
    }

    const orgRoleId = orgMembership?.roleId || null;
    const teamRoleId = teamMembership?.roleId || null;

    const orgRole = await Role.findById(orgRoleId);
    const teamRole = await Role.findById(teamRoleId);

    if (!orgRole || !teamRole) {
      throw new ApiError("Role not found");
    }

    req.user.roles = {
      orgRole: orgRole,
      teamRole: teamRole,
    };
  } catch (error) {
    next(error);
  }
};
