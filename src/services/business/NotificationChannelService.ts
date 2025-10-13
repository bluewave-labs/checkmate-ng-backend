import mongoose from "mongoose";

import {
  ITokenizedUser,
  INotificationChannel,
  NotificationChannel,
  Monitor,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "NotificationChannelServiceV2";

export interface INotificationChannelService {
  create: (
    tokenizedUser: ITokenizedUser,

    notificationChannel: INotificationChannel
  ) => Promise<INotificationChannel>;
  getAll: () => Promise<INotificationChannel[]>;
  get: (id: string) => Promise<INotificationChannel>;
  toggleActive: (
    tokenizedUser: ITokenizedUser,
    id: string
  ) => Promise<INotificationChannel>;
  update: (
    tokenizedUser: ITokenizedUser,
    id: string,
    updateData: Partial<INotificationChannel>
  ) => Promise<INotificationChannel>;
  delete: (id: string) => Promise<boolean>;
}

class NotificationChannelService implements INotificationChannelService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  create = async (
    tokenizedUser: ITokenizedUser,
    notificationChannelData: INotificationChannel
  ) => {
    const data: INotificationChannel = {
      ...notificationChannelData,
      orgId: new mongoose.Types.ObjectId(tokenizedUser.orgId),
      teamId: new mongoose.Types.ObjectId(tokenizedUser.teamId),
    };

    const notificationChannel = await NotificationChannel.create(data);
    return notificationChannel;
  };

  get = async (id: string) => {
    const channel = await NotificationChannel.findById(id);
    if (!channel) {
      throw new ApiError("Notification channel not found", 404);
    }
    return channel;
  };

  getAll = async () => {
    return NotificationChannel.find();
  };

  toggleActive = async (tokenizedUser: ITokenizedUser, id: string) => {
    const updatedChannel = await NotificationChannel.findOneAndUpdate(
      { _id: id },
      [
        {
          $set: {
            isActive: { $not: "$isActive" },
            updatedBy: tokenizedUser.sub,
            updatedAt: new Date(),
          },
        },
      ],
      { new: true }
    );
    if (!updatedChannel) {
      throw new ApiError("Notification channel not found", 404);
    }
    return updatedChannel;
  };

  update = async (
    tokenizedUser: ITokenizedUser,
    id: string,
    updateData: Partial<INotificationChannel>
  ) => {
    const allowedFields: (keyof INotificationChannel)[] = [
      "name",
      "config",
      "isActive",
    ];
    const safeUpdate: Partial<INotificationChannel> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (safeUpdate as any)[field] = updateData[field];
      }
    }

    const updatedChannel = await NotificationChannel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...safeUpdate,
          updatedAt: new Date(),
          updatedBy: tokenizedUser.sub,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedChannel) {
      throw new ApiError("Failed to update notification channel", 500);
    }

    return updatedChannel;
  };

  delete = async (id: string) => {
    const result = await NotificationChannel.deleteOne({ _id: id });
    if (!result.deletedCount) {
      throw new ApiError("Notification channel not found", 404);
    }

    await Monitor.updateMany(
      { notificationChannels: id },
      { $pull: { notificationChannels: id } }
    );
    return result.deletedCount === 1;
  };
}

export default NotificationChannelService;
