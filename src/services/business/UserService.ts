import { IUser, IUserProfile, User } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import { hashPassword } from "@/utils/JWTUtils.js";

const SERVICE_NAME = "UserService";
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
      throw new ApiError("User not found", 404);
    }
    return user;
  }

  async update(userId: string, data: Partial<IUserProfile>): Promise<IUser> {
    let passwordHash = null;
    if (data.password) passwordHash = await hashPassword(data.password);
    {
    }

    const updateData = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(passwordHash && { passwordHash }),
    };

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      throw new ApiError("User not found", 404);
    }
    return updatedUser;
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find();
  }
}

export default UserService;
