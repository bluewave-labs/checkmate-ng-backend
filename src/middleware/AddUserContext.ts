import { Request, Response, NextFunction } from "express";

import { OrgMembership, TeamMembership, IRole } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

interface IRolesObj {
  orgRole?: IRole;
  teamRole: IRole;
}
interface IRolesCacheData {
  data: IRolesObj;
  expiresAt: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const rolesCache = new Map<string, IRolesCacheData>();

export const addUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError("User not authenticated", 401);
    }

    const { sub, orgId, teamIds } = req.user;

    const currentTeamId = req.headers["x-team-id"] as string;

    if (!sub || !orgId || !teamIds || teamIds.length === 0 || !currentTeamId) {
      throw new ApiError("Invalid user context", 400);
    }

    if (!teamIds.includes(currentTeamId)) {
      throw new ApiError("User does not belong to the specified team", 403);
    }

    const cacheKey = `${sub}:${orgId}:${currentTeamId}`;
    const cached = rolesCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      req.user.roles = cached.data;
      req.user.currentTeamId = currentTeamId;
      return next();
    } else if (cached && cached.expiresAt <= Date.now()) {
      rolesCache.delete(cacheKey);
    }

    const [orgRole, teamRole] = await Promise.all([
      OrgMembership.findOne({ userId: sub, orgId })
        .populate<{ roleId: IRole }>("roleId")
        .select("roleId")
        .lean(),

      TeamMembership.findOne({ userId: sub, teamId: currentTeamId })
        .populate<{ roleId: IRole }>("roleId")
        .select("roleId")
        .lean(),
    ]);

    if (!teamRole || !teamRole.roleId) {
      throw new ApiError("User has no role in the team", 403);
    }

    rolesCache.set(cacheKey, {
      data: {
        orgRole: orgRole?.roleId,
        teamRole: teamRole.roleId,
      },
      expiresAt: Date.now() + CACHE_TTL,
    });

    req.user.currentTeamId = currentTeamId;
    req.user.roles = {
      orgRole: orgRole?.roleId,
      teamRole: teamRole.roleId,
    };

    next();
  } catch (error) {
    next(error);
  }
};
