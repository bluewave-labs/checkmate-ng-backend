import mongoose from "mongoose";
import {
  ICheck,
  Check,
  Monitor,
  ISystemInfo,
  Role,
  ITeam,
  Team,
  TeamMembership,
  ITokenizedUser,
  ITeamMembership,
} from "@/db/models/index.js";
import { MonitorType } from "@/db/models/monitors/Monitor.js";
import { StatusResponse } from "../infrastructure/NetworkService.js";

const SERVICE_NAME = "TeamService";
export interface ITeamService {
  create: (
    user: ITokenizedUser,
    teamData: ITeam,
    roleId: string
  ) => Promise<ITokenizedUser>;
  getAll: (userId: string) => Promise<Partial<ITeam[]>>;
}

class TeamService implements ITeamService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  create = async (user: ITokenizedUser, teamData: ITeam, roleId: string) => {
    try {
      const teamLiteral: Partial<ITeam> = {
        ...teamData,
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

      const teamMemberships = await TeamMembership.find({ userId: user.sub });
      const teamMembershipIds = teamMemberships.map((tm) =>
        tm.teamId.toString()
      );
      const teams = await Team.find({ _id: { $in: teamMembershipIds } }).select(
        "_id name"
      );

      return {
        sub: user.sub,
        email: user.email,
        orgId: user.orgId,
        teamIds: teamMembershipIds,
        teams,
      };
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
}

export default TeamService;
