import mongoose, { Schema, Document, Types } from "mongoose";
export interface ITeamMembership extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  teamId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamMembershipSchema = new Schema<ITeamMembership>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
  },
  { timestamps: true }
);

export const TeamMembership = mongoose.model<ITeamMembership>(
  "TeamMembership",
  teamMembershipSchema
);
