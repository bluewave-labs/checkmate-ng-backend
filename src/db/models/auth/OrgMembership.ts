import mongoose, { Schema, Document, Types } from "mongoose";
export interface IOrgMembership extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const orgMembershipSchema = new Schema<IOrgMembership>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
  },
  { timestamps: true }
);

export const OrgMembership = mongoose.model<IOrgMembership>(
  "OrgMembership",
  orgMembershipSchema
);
