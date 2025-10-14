import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvite extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  orgRole?: Types.ObjectId;
  teamId: Types.ObjectId;
  teamRole: Types.ObjectId;
  email: string;
  tokenHash: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    orgRole: { type: Schema.Types.ObjectId, ref: "Role" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    teamRole: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    tokenHash: { type: String, required: true, unique: true },
    expiry: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      expires: 0,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Invite = mongoose.model<IInvite>("Invite", InviteSchema);
