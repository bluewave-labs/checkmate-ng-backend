import mongoose from "mongoose";
import {
  ICheck,
  Check,
  Monitor,
  ISystemInfo,
  Role,
  IRole,
  ITeam,
  Team,
  TeamMembership,
  ITokenizedUser,
  ITeamMembership,
  OrgMembership,
  IUserContext,
} from "@/db/models/index.js";
import type { IJobQueue } from "../infrastructure/JobQueue.js";
import ApiError from "@/utils/ApiError.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";

const SERVICE_NAME = "TeamService";
export interface ITeamService {
  create: (
    user: ITokenizedUser,
    teamData: ITeam,
    roleId: string
  ) => Promise<boolean>;
  getAll: (userId: string) => Promise<Partial<ITeam[]>>;
  getEditable: (userId: string) => Promise<Partial<ITeam[]>>;
  get: (teamId: string) => Promise<ITeam>;
  update: (
    user: IUserContext,
    teamId: string,
    teamData: Partial<ITeam>
  ) => Promise<ITeam>;
  delete: (orgId: string, teamId: string) => Promise<boolean>;
}

class TeamService implements ITeamService {
  public SERVICE_NAME: string;
  private jobQueue: IJobQueue;

  constructor(jobQueue: IJobQueue) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.jobQueue = jobQueue;
  }

  create = async (user: ITokenizedUser, teamData: ITeam, roleId: string) => {
    try {
      const teamLiteral: Partial<ITeam> = {
        name: teamData.name,
        description: teamData.description,
        orgId: new mongoose.Types.ObjectId(user.orgId),
      };

      // Check for roles
      const roles = await Role.find({ organizationId: user.orgId });

      if (!roles.some((r) => r._id.toString() === roleId)) {
        throw new Error("Role does not exist");
      }

      const team = await Team.create(teamLiteral);
      await TeamMembership.create({
        teamId: team._id,
        userId: new mongoose.Types.ObjectId(user.sub),
        roleId: new mongoose.Types.ObjectId(roleId),
      });

      return true;
    } catch (error) {
      throw error;
    }
  };

  getAll = async (userId: string) => {
    const teamMemberships = await TeamMembership.find({ userId });
    const teamIds = teamMemberships.map((tm) => tm.teamId.toString());
    const teams = await Team.find({ _id: { $in: teamIds } }).select(
      "_id name description"
    );
    return teams;
  };

  getEditable = async (userId: string) => {
    const [orgMembership, teamMemberships] = await Promise.all([
      OrgMembership.findOne({ userId })
        .populate<{ roleId: IRole }>("roleId")
        .lean(),
      TeamMembership.find({ userId })
        .populate<{ roleId: IRole }>("roleId")
        .lean(),
    ]);

    const orgPermissions = orgMembership?.roleId?.permissions || [];

    const filteredTeamMembership = teamMemberships
      .filter((tm) => {
        if (
          orgPermissions.includes(PERMISSIONS.teams.all) ||
          orgPermissions.includes(PERMISSIONS.teams.write)
        ) {
          return true;
        }

        const teamPermissions = tm.roleId?.permissions || [];
        const hasEditPermission =
          teamPermissions.includes(PERMISSIONS.teams.all) ||
          teamPermissions.includes(PERMISSIONS.teams.write);
        return hasEditPermission;
      })
      .map((tm) => tm.teamId);
    const teams = await Team.find({
      _id: { $in: filteredTeamMembership },
    }).select("_id name description");
    return teams;
  };

  get = async (teamId: string) => {
    const team = await Team.findOne({ _id: teamId });
    if (!team) {
      throw new ApiError("Team not found");
    }
    return team;
  };

  update = async (
    user: IUserContext,
    teamId: string,
    teamData: Partial<ITeam>
  ) => {
    const updatedTeam = await Team.findOneAndUpdate(
      { _id: teamId, orgId: user.orgId },
      {
        $set: {
          ...teamData,
          updatedAt: new Date(),
          updatedBy: user.sub,
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedTeam) {
      throw new ApiError("Team not found");
    }

    return updatedTeam;
  };

  delete = async (orgId: string, teamId: string) => {
    const team = await Team.findOne({ _id: teamId, orgId }).lean();
    if (!team) {
      throw new ApiError("Team not found");
    }

    if (team.isSystem) {
      throw new ApiError("Cannot delete your default team");
    }

    // Delete team memberships
    await TeamMembership.deleteOne({ teamId });

    // Delete team
    await Team.deleteOne({ _id: teamId });

    const monitors = await Monitor.find({ teamId });
    monitors.forEach(async (monitor) => {
      await this.jobQueue.deleteJob(monitor);
    });
    await Monitor.deleteMany({ teamId });
    return true;
  };
}

export default TeamService;
