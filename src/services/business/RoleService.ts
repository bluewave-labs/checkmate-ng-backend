import { Role, IRole } from "@/db/models/index.js";
import type { IJobQueue } from "../infrastructure/JobQueue.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "RoleService";
export interface IRoleService {
  getAll: (orgId: string, type: string) => Promise<Partial<IRole[]>>;
  get: (roleId: string) => Promise<IRole>;
}

class RoleService implements IRoleService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  getAll = async (orgId: string, type: string) => {
    const roles = await Role.find({ organizationId: orgId, scope: type });
    return roles;
  };

  get = async (roleId: string) => {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new ApiError("Role not found", 404);
    }
    return role;
  };
}

export default RoleService;
