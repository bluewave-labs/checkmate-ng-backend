import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRecoveryToken extends Document {
  _id: Types.ObjectId;
  email: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recoveryTokenSchema = new Schema<IRecoveryToken>(
  {
    email: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// TTL index: Auto-delete documents 10 minutes after creation
recoveryTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export const RecoveryToken = mongoose.model<IRecoveryToken>(
  "RecoveryToken",
  recoveryTokenSchema
);
