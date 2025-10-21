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
    orgId: string,
    userId: string,
    teamData: ITeam,
    roleId: string
  ) => Promise<boolean>;
  getAll: (userId: string, orgId: string) => Promise<Partial<ITeam[]>>;
  getEditable: (userId: string, orgId: string) => Promise<Partial<ITeam[]>>;
  get: (teamId: string, orgId: string) => Promise<ITeam>;
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

  create = async (
    orgId: string,
    userId: string,
    teamData: ITeam,
    roleId: string
  ) => {
    const created: Record<string, any> = {
      team: null,
      memberships: null,
    };

    try {
      const teamLiteral: Partial<ITeam> = {
        name: teamData.name,
        description: teamData.description,
        orgId: new mongoose.Types.ObjectId(orgId),
      };

      // Check for roles
      const roles = await Role.find({ organizationId: orgId });

      if (!roles.some((r) => r._id.toString() === roleId)) {
        throw new Error("Role does not exist");
      }

      const team = await Team.create(teamLiteral);
      created.teamId = team._id;
      const membership = await TeamMembership.create({
        teamId: team._id,
        userId: new mongoose.Types.ObjectId(userId),
        roleId: new mongoose.Types.ObjectId(roleId),
      });
      created.teamMembershipId = membership._id;

      return true;
    } catch (error) {
      await Team.deleteOne({ _id: created.teamId });
      await TeamMembership.deleteOne({ _id: created.teamMembershipId });
      throw error;
    }
  };

  getAll = async (userId: string, orgId: string) => {
    const teamMemberships = await TeamMembership.find({ userId });
    const teamIds = teamMemberships.map((tm) => tm.teamId.toString());
    const teams = await Team.find({ _id: { $in: teamIds }, orgId }).select(
      "_id name description"
    );
    return teams;
  };

  getEditable = async (userId: string, orgId: string) => {
    const [orgMembership, teamMemberships] = await Promise.all([
      OrgMembership.findOne({ userId, orgId })
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
      orgId,
    }).select("_id name description");
    return teams;
  };

  get = async (teamId: string, orgId: string) => {
    const team = await Team.findOne({ _id: teamId, orgId });
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

    await TeamMembership.deleteMany({ teamId });

    const monitors = await Monitor.find({ teamId });
    await Promise.all(
      monitors.map((monitor) => this.jobQueue.deleteJob(monitor))
    );

    await Monitor.deleteMany({ teamId });
    await Team.deleteOne({ _id: teamId });
    return true;
  };
}

export default TeamService;
