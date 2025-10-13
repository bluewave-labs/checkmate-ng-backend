import { IUser, User } from "@/db/models/index.js";

const SERVICE_NAME = "UserServiceV2";
export interface IUserService {
  get(email: string): Promise<IUser>;
  getAllUsers(): Promise<IUser[]>;
}

class UserService implements IUserService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  async get(email: string): Promise<IUser> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find();
  }
}

export default UserService;
